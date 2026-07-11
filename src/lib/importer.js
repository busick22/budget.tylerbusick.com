// The client side of the AI statement import: hand the raw CSV text plus the
// category list to the `categorizeStatement` Cloud Function and get back
// clean rows for the review screen. Keeping this seam in one file means the
// UI never knows (or cares) how the categorizing happens.

import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase.js'

export const MAX_CSV_BYTES = 300_000

/**
 * @param {string} csvText  raw text of the exported statement CSV
 * @param {Array<{id: string, name: string}>} categories
 * @returns {Promise<Array<{date, description, amountCents, categoryId, isMoneyIn}>>}
 */
export async function categorizeCsv(csvText, categories) {
  const call = httpsCallable(functions, 'categorizeStatement', { timeout: 120_000 })
  const result = await call({
    csvText,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
  })
  return result.data.transactions
}
