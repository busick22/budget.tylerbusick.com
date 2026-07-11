// Import a statement into reviewable rows, two ways:
//   • Load a prepared file — a JSON the /categorize command wrote. Free,
//     instant, no network. This is the main path.
//   • Categorize a raw CSV with AI — hands the CSV to the Cloud Function.
//     Optional; costs credits + needs setup.
// Either way you land on the same review step, and nothing is saved to
// Firestore until you hit Save there.

import { useMemo, useState } from 'react'
import { FileUp, Sparkles, ArrowDownToLine } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { parsePreparedFile, categorizeCsv, MAX_IMPORT_BYTES } from '../../lib/importer.js'
import { formatCents } from '../../lib/money.js'

export default function ImportModal({ onClose }) {
  // Imports land as expenses, so use the expense category list here.
  const { expenseCategories } = useCategories()
  const { addTransaction } = useTransactions()

  const [step, setStep] = useState('pick') // pick | working | review
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([]) // review rows: {...tx, include}
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Money-in rows (deposits, refunds) start unticked — this app tracks
  // spending — but the owner can tick one to record it anyway.
  function toReview(transactions) {
    setRows(transactions.map((t) => ({ ...t, include: !t.isMoneyIn })))
    setStep('review')
  }

  // --- Path 1: prepared JSON file (free, instant) ---
  async function onPreparedFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > MAX_IMPORT_BYTES) {
      setError('That file is unexpectedly large — is it the right one?')
      return
    }
    setFileName(file.name)
    try {
      const text = await file.text()
      toReview(parsePreparedFile(text, expenseCategories))
    } catch (err) {
      setError(err.message || 'Reading the file failed.')
    }
  }

  // --- Path 2: raw CSV via the AI Cloud Function (optional, costs credits) ---
  async function onCsvFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > MAX_IMPORT_BYTES) {
      setError('That file is too big for one statement — export one month at a time.')
      return
    }
    setFileName(file.name)
    setStep('working')
    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('That file looks empty.')
      const transactions = await categorizeCsv(text, expenseCategories)
      if (transactions.length === 0) {
        throw new Error('No transactions were found in that file — is it the right export?')
      }
      toReview(transactions)
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
            Prepare a file with the <code>/categorize</code> command in Claude
            Code or Codex — it reads your bank CSV, sorts each purchase into
            your categories, and asks about anything unclear — then load it
            here to review and save.
          </p>

          <label className="import-drop">
            <FileUp aria-hidden="true" />
            <span>Load a prepared file (.json)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={onPreparedFile}
              style={{ display: 'none' }}
            />
          </label>

          <div className="import-or" role="presentation">
            <span>or</span>
          </div>

          <label className="import-alt">
            <Sparkles size={14} aria-hidden="true" />
            <span>Upload a raw CSV and categorize it with the built-in AI</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onCsvFile}
              style={{ display: 'none' }}
            />
          </label>
          <p className="import-alt-note">
            The AI option calls the Anthropic API — needs setup (SETUP.md) and
            costs a few cents per statement.
          </p>

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
          <h3>Check the import</h3>
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
                  {expenseCategories.map((c) => (
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
