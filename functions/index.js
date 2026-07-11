// Budget's whole backend: one function that reads a bank-statement CSV and
// returns clean, categorized transactions for the owner to review.
//
// Why a backend at all? The Anthropic API key must never reach the browser —
// anyone could read it there and spend on it. The key lives in Secret Manager
// (`firebase functions:secrets:set ANTHROPIC_API_KEY`), and only this
// function ever sees it.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import Anthropic from '@anthropic-ai/sdk'

initializeApp()

const anthropicKey = defineSecret('ANTHROPIC_API_KEY')

// Guardrails for a one-person app: a normal monthly statement is well under
// 100 KB; anything bigger is probably the wrong file.
const MAX_CSV_BYTES = 300_000

// What Claude must return, row for row. `additionalProperties: false` +
// `required` everywhere means the reply always parses — no free-form text.
const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Transaction date as YYYY-MM-DD.',
          },
          description: {
            type: 'string',
            description:
              'Cleaned-up merchant/purpose, e.g. "Hy-Vee" from "HY-VEE #1043 TRENTON MO POS".',
          },
          amountCents: {
            type: 'integer',
            description:
              'Money OUT in whole cents, always positive (e.g. $12.34 spent → 1234).',
          },
          categoryId: {
            type: ['string', 'null'],
            description:
              'The id of the best-fitting category from the provided list, or null if none fits well.',
          },
          isMoneyIn: {
            type: 'boolean',
            description:
              'true when the row is money coming IN (deposit, refund, card payment received) rather than spending.',
          },
        },
        required: ['date', 'description', 'amountCents', 'categoryId', 'isMoneyIn'],
        additionalProperties: false,
      },
    },
  },
  required: ['transactions'],
  additionalProperties: false,
}

export const categorizeStatement = onCall(
  { secrets: [anthropicKey], region: 'us-central1', timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in first.')
    }

    const { csvText, categories } = request.data ?? {}
    if (typeof csvText !== 'string' || !csvText.trim()) {
      throw new HttpsError('invalid-argument', 'No CSV text received.')
    }
    if (csvText.length > MAX_CSV_BYTES) {
      throw new HttpsError(
        'invalid-argument',
        'That file is too big for one statement — export one month at a time.',
      )
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new HttpsError('invalid-argument', 'Set up your categories first.')
    }

    const categoryList = categories
      .map((c) => `- id: ${c.id} — ${c.name}`)
      .join('\n')

    const client = new Anthropic({ apiKey: anthropicKey.value() })

    let response
    try {
      response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 16000,
        output_config: {
          format: { type: 'json_schema', schema: RESULT_SCHEMA },
        },
        system:
          'You turn raw bank/credit-card statement CSVs into clean transaction lists. ' +
          'Statements from different banks use different column layouts, date formats, ' +
          'and sign conventions (some mark spending negative, some positive) — detect ' +
          'the layout from the data. Skip header/footer rows, running-balance columns, ' +
          'and duplicate pending/posted pairs. Clean merchant names to how a person ' +
          'would say them. Assign each spending row the best-fitting category id from ' +
          'the list, or null when nothing fits well — never force a bad match.',
        messages: [
          {
            role: 'user',
            content:
              `My spending categories:\n${categoryList}\n\n` +
              `The statement CSV:\n\`\`\`\n${csvText}\n\`\`\``,
          },
        ],
      })
    } catch (err) {
      const apiMessage = err?.error?.error?.message || err?.message || 'unknown error'
      if (String(apiMessage).toLowerCase().includes('credit balance is too low')) {
        throw new HttpsError(
          'failed-precondition',
          'Anthropic billing needs attention — add credits in Anthropic, then try the import again.',
        )
      }
      throw new HttpsError('internal', `Anthropic request failed: ${apiMessage}`)
    }

    if (response.stop_reason === 'refusal') {
      throw new HttpsError('internal', 'The AI declined to process this file — try a different export.')
    }
    if (response.stop_reason === 'max_tokens') {
      throw new HttpsError('internal', 'That statement is too long in one go — export a shorter date range.')
    }

    const text = response.content.find((b) => b.type === 'text')?.text
    if (!text) {
      throw new HttpsError('internal', 'The AI returned nothing usable — try again.')
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new HttpsError('internal', 'The AI reply wasn’t valid JSON — try again.')
    }

    // Belt and suspenders: drop rows that don't hold up, even with the schema.
    const validCategoryIds = new Set(categories.map((c) => c.id))
    const transactions = (parsed.transactions ?? [])
      .filter(
        (t) =>
          /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
          typeof t.description === 'string' &&
          t.description.trim() &&
          Number.isInteger(t.amountCents) &&
          t.amountCents > 0,
      )
      .map((t) => ({
        date: t.date,
        description: t.description.trim(),
        amountCents: t.amountCents,
        categoryId: validCategoryIds.has(t.categoryId) ? t.categoryId : null,
        isMoneyIn: Boolean(t.isMoneyIn),
      }))

    return { transactions }
  },
)
