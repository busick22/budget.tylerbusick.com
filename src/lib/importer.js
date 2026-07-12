// Turn a prepared statement-import JSON file into reviewable rows. The app
// does this locally in the browser: no backend, no API key, no network call.
//
// The review screen expects:
//   { date, description, amountCents, categoryId, isMoneyIn }

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
    throw new Error('That file isn’t valid JSON — check the prepared import file and try again.')
  }

  const list = Array.isArray(data) ? data : data?.transactions
  if (!Array.isArray(list)) {
    throw new Error('That file has no transactions list — is it a prepared import file?')
  }

  // Category NAME (lowercased) → app category. A source can only be attached
  // to income, and an expense category can only be attached to spending.
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]))

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

    const isMoneyIn = Boolean(t.isMoneyIn)
    const catName = typeof t.category === 'string' ? t.category.trim().toLowerCase() : ''
    const matchedCategory = byName.get(catName)
    const matchedKind = matchedCategory?.kind ?? 'expense'
    const categoryId = matchedCategory && (isMoneyIn ? matchedKind === 'income' : matchedKind === 'expense')
      ? matchedCategory.id
      : null

    rows.push({
      date: t.date,
      description,
      amountCents,
      categoryId,
      isMoneyIn,
    })
  }

  if (rows.length === 0) {
    throw new Error('No usable transactions were found in that file.')
  }
  return rows
}
