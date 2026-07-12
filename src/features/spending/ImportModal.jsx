// Import a prepared statement file into reviewable rows. Nothing is saved to
// Firestore until you check the rows and hit Save.

import { useMemo, useState } from 'react'
import { FileUp, ArrowDownToLine } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { parsePreparedFile, MAX_IMPORT_BYTES } from '../../lib/importer.js'
import { formatCents } from '../../lib/money.js'

export default function ImportModal({ onClose }) {
  const { categories, expenseCategories, incomeSources } = useCategories()
  const { addTransaction } = useTransactions()

  const [step, setStep] = useState('pick') // pick | review
  const [rows, setRows] = useState([]) // review rows: {...tx, include}
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function toReview(transactions) {
    setRows(transactions.map((t) => ({ ...t, include: true })))
    setStep('review')
  }

  async function onPreparedFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > MAX_IMPORT_BYTES) {
      setError('That file is unexpectedly large — is it the right one?')
      return
    }
    try {
      const text = await file.text()
      toReview(parsePreparedFile(text, categories))
    } catch (err) {
      setError(err.message || 'Reading the file failed.')
    }
  }

  function patchRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const included = useMemo(() => rows.filter((r) => r.include), [rows])
  const includedExpenses = included.filter((r) => !r.isMoneyIn)
  const includedIncome = included.filter((r) => r.isMoneyIn)
  const expenseTotal = includedExpenses.reduce((a, r) => a + r.amountCents, 0)
  const incomeTotal = includedIncome.reduce((a, r) => a + r.amountCents, 0)

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
          type: row.isMoneyIn ? 'income' : 'expense',
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Saving failed partway — check the Spending and Income lists before retrying.')
      setBusy(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      width={step === 'review' ? 640 : undefined}
      label={step === 'review' ? 'Check the import' : 'Import a statement'}
      dismissible={!busy}
    >
      {step === 'pick' && (
        <>
          <h3>Import a statement</h3>
          <p className="import-blurb">
            Load a prepared JSON file, review each row, then save the ones you
            want. Purchases go to Spending; money coming in goes to Income.
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

          {error && <p className="error-note">{error}</p>}
        </>
      )}

      {step === 'review' && (
        <>
          <h3>Check the import</h3>
          <p className="import-blurb">
            {included.length} of {rows.length} rows will be saved ·{' '}
            <span className="amount">{formatCents(expenseTotal)}</span> spending
            {includedIncome.length > 0 && (
              <> · <span className="amount import-total-in">+{formatCents(incomeTotal)}</span> income</>
            )}
            . Untick anything you want to skip. Money coming in will appear on Income.
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
                  aria-label={row.isMoneyIn ? `Income source for ${row.description}` : `Category for ${row.description}`}
                >
                  <option value="">{row.isMoneyIn ? 'Unassigned source' : 'Uncategorized'}</option>
                  {(row.isMoneyIn ? incomeSources : expenseCategories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="import-row-amount amount" data-money-in={row.isMoneyIn}>
                  {row.isMoneyIn ? '+' : ''}{formatCents(row.amountCents)}
                </span>
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
