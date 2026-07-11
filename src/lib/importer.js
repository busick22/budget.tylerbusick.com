// Two ways a statement becomes reviewable rows:
//
//   1. parsePreparedFile — the free path. A JSON file the /categorize command
//      (Claude Code / Codex) wrote is read right here in the browser. No
//      network, no cost. Categories come in as NAMES, which we resolve to the
//      app's category ids so the command never needs to know the app's guts.
//
//   2. categorizeCsv — the optional AI path. Hands a raw CSV to the
//      `categorizeStatement` Cloud Function, which calls the Anthropic API.
//      Costs credits + needs setup; kept for when you want it.
//
// Both return the same row shape the review screen expects:
//   { date, description, amountCents, categoryId, isMoneyIn }

import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase.js'
import { parseToCents } from './money.js'

export const MAX_IMPORT_BYTES = 300_000

/**
 * Turn a prepared JSON file's text into reviewable rows.
 * @param {string} jsonText  the file contents
 * @param {Array<{id: string, name: string}>} categories  current app categories
 */
export function parsePreparedFile(jsonText, categories) {
  let data
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('That file isn’t valid JSON — re-run the /categorize command and try again.')
  }

  const list = Array.isArray(data) ? data : data?.transactions
  if (!Array.isArray(list)) {
    throw new Error('That file has no transactions list — is it a prepared import file?')
  }

  // Category NAME (lowercased) → app id. Unmatched names come in Uncategorized.
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]))

  const rows = []
  for (const t of list) {
    if (typeof t?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) continue

    const description = typeof t.description === 'string' ? t.description.trim() : ''
    if (!description) continue

    // Accept dollars (`amount`) or whole cents (`amountCents`).
    let amountCents = null
    if (Number.isInteger(t.amountCents)) amountCents = t.amountCents
    else if (t.amount != null) amountCents = parseToCents(String(t.amount))
    if (amountCents === null || amountCents <= 0) continue

    const catName = typeof t.category === 'string' ? t.category.trim().toLowerCase() : ''
    const categoryId = byName.get(catName) ?? null

    rows.push({
      date: t.date,
      description,
      amountCents,
      categoryId,
      isMoneyIn: Boolean(t.isMoneyIn),
    })
  }

  if (rows.length === 0) {
    throw new Error('No usable transactions were found in that file.')
  }
  return rows
}

/**
 * The optional AI path: send raw CSV text to the Cloud Function.
 * @param {string} csvText
 * @param {Array<{id: string, name: string}>} categories
 */
export async function categorizeCsv(csvText, categories) {
  const call = httpsCallable(functions, 'categorizeStatement', { timeout: 120_000 })
  const result = await call({
    csvText,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
  })
  return result.data.transactions
}
