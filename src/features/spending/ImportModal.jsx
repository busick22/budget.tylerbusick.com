// The AI statement import, in three steps:
//   1. pick    — choose the CSV you exported from the bank
//   2. working — Claude reads and categorizes it (via the Cloud Function)
//   3. review  — fix anything it got wrong, untick rows to skip, then save
// Nothing is written to Firestore until Save on the review step.

import { useMemo, useState } from 'react'
import { FileUp, Sparkles, ArrowDownToLine } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { categorizeCsv, MAX_CSV_BYTES } from '../../lib/importer.js'
import { formatCents } from '../../lib/money.js'

export default function ImportModal({ onClose }) {
  const { categories } = useCategories()
  const { addTransaction } = useTransactions()

  const [step, setStep] = useState('pick') // pick | working | review
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([]) // review rows: {...tx, include}
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > MAX_CSV_BYTES) {
      setError('That file is too big for one statement — export one month at a time.')
      return
    }
    setFileName(file.name)
    setStep('working')
    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('That file looks empty.')
      const transactions = await categorizeCsv(text, categories)
      if (transactions.length === 0) {
        throw new Error('No transactions were found in that file — is it the right export?')
      }
      // Money-in rows (deposits, refunds) start unticked — this app tracks
      // spending, but the owner can tick one to record it anyway.
      setRows(transactions.map((t) => ({ ...t, include: !t.isMoneyIn })))
      setStep('review')
    } catch (err) {
      setError(err.message || 'Reading the statement failed — try again.')
      setStep('pick')
    }
  }

  function patchRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const included = useMemo(() => rows.filter((r) => r.include), [rows])
  const includedTotal = included.reduce((a, r) => a + r.amountCents, 0)

  async function onSave() {
    setBusy(true)
    setError('')
    try {
      for (const row of included) {
        await addTransaction({
          date: row.date,
          description: row.description,
          amountCents: row.amountCents,
          categoryId: row.categoryId,
          note: '',
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Saving failed partway — check the Spending list before retrying.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={busy ? () => {} : onClose} width={step === 'review' ? 640 : undefined}>
      {step === 'pick' && (
        <>
          <h3>Import a statement</h3>
          <p className="import-blurb">
            Export a CSV from your bank or card site, drop it here, and the AI
            reads every line — sorting each purchase into your categories for
            you to check before anything is saved.
          </p>
          <label className="import-drop">
            <FileUp aria-hidden="true" />
            <span>Choose a CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              style={{ display: 'none' }}
            />
          </label>
          {error && <p className="error-note">{error}</p>}
        </>
      )}

      {step === 'working' && (
        <div className="import-working">
          <Sparkles aria-hidden="true" className="import-working-icon" />
          <h3>Reading {fileName}…</h3>
          <p>The AI is sorting each line into your categories. About 15–30 seconds.</p>
          <div className="spinner" />
        </div>
      )}

      {step === 'review' && (
        <>
          <h3>Check the AI&rsquo;s work</h3>
          <p className="import-blurb">
            {included.length} of {rows.length} rows will be saved ·{' '}
            <span className="amount">{formatCents(includedTotal)}</span>. Untick anything to
            skip it; money coming <em>in</em> starts unticked.
          </p>

          <div className="import-rows">
            {rows.map((row, i) => (
              <div key={i} className="import-row" data-included={row.include}>
                <input
                  type="checkbox"
                  checked={row.include}
                  onChange={(e) => patchRow(i, { include: e.target.checked })}
                  aria-label={`Include ${row.description}`}
                />
                <div className="import-row-main">
                  <span className="import-row-desc">
                    {row.description}
                    {row.isMoneyIn && <em className="import-row-in">money in</em>}
                  </span>
                  <span className="import-row-date">{row.date}</span>
                </div>
                <select
                  className="field import-row-cat"
                  value={row.categoryId ?? ''}
                  onChange={(e) => patchRow(i, { categoryId: e.target.value || null })}
                  disabled={!row.include}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="import-row-amount amount">{formatCents(row.amountCents)}</span>
              </div>
            ))}
          </div>

          {error && <p className="error-note">{error}</p>}

          <div className="import-actions">
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={busy || included.length === 0}
            >
              <ArrowDownToLine size={15} aria-hidden="true" />
              {busy ? 'Saving…' : `Save ${included.length} transaction${included.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
