// Add or edit one transaction: what, how much, when, which category.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'
import { todayKey } from '../../lib/dates.js'

export default function TransactionModal({ transaction, defaultDate, onClose }) {
  const { categories } = useCategories()
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const isNew = !transaction

  const [description, setDescription] = useState(transaction?.description ?? '')
  const [amountText, setAmountText] = useState(
    transaction ? centsToInput(transaction.amountCents) : '',
  )
  const [date, setDate] = useState(transaction?.date ?? defaultDate ?? todayKey())
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = description.trim()
    if (!trimmed) {
      setError('What was this for? Give it a short description.')
      return
    }
    const amountCents = parseToCents(amountText)
    if (amountCents === null || amountCents <= 0) {
      setError('The amount should be a number like 8.50.')
      return
    }
    if (!date) {
      setError('Pick a date.')
      return
    }
    setBusy(true)
    const data = {
      description: trimmed,
      amountCents,
      date,
      categoryId: categoryId || null,
      note: note.trim(),
    }
    try {
      if (isNew) await addTransaction(data)
      else await updateTransaction(transaction.id, data)
      onClose()
    } catch (err) {
      setError(err.message || 'Saving failed.')
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBusy(true)
    try {
      await deleteTransaction(transaction.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>{isNew ? 'Add transaction' : 'Edit transaction'}</h3>

      <form onSubmit={onSave} className="txmodal-form">
        <div>
          <label className="field-label" htmlFor="tx-desc">
            Description
          </label>
          <input
            id="tx-desc"
            className="field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hy-Vee"
            autoFocus={isNew}
          />
        </div>

        <div className="txmodal-row">
          <div>
            <label className="field-label" htmlFor="tx-amount">
              Amount
            </label>
            <input
              id="tx-amount"
              className="field amount"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              placeholder="62.50"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="tx-date">
              Date
            </label>
            <input
              id="tx-date"
              className="field"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="tx-category">
            Category
          </label>
          <select
            id="tx-category"
            className="field"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="tx-note">
            Note <span className="txmodal-optional">(optional)</span>
          </label>
          <input
            id="tx-note"
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Split with Sarah"
          />
        </div>

        {error && <p className="error-note">{error}</p>}
        {confirmDelete && (
          <p className="error-note">Delete this transaction? Click Delete again to confirm.</p>
        )}

        <div className="txmodal-actions">
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onDelete}
              disabled={busy}
            >
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>
          )}
          <span className="txmodal-actions-gap" />
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
