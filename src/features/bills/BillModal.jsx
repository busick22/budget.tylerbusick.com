// Add or edit one recurring bill: name, amount, day of month it's due.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useBills } from '../../state/BillsContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'

export default function BillModal({ bill, onClose }) {
  const { addBill, updateBill, deleteBill } = useBills()
  const isNew = !bill

  const [name, setName] = useState(bill?.name ?? '')
  const [amountText, setAmountText] = useState(bill ? centsToInput(bill.amountCents) : '')
  const [dueDayText, setDueDayText] = useState(bill ? String(bill.dueDay) : '')
  const [note, setNote] = useState(bill?.note ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the bill a name.')
      return
    }
    const amountCents = parseToCents(amountText)
    if (amountCents === null || amountCents <= 0) {
      setError('The amount should be a number like 15.49.')
      return
    }
    const dueDay = Number(dueDayText)
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setError('Due day is the day of the month it hits — 1 to 31.')
      return
    }
    setBusy(true)
    const data = { name: trimmed, amountCents, dueDay, note: note.trim() }
    try {
      if (isNew) await addBill(data)
      else await updateBill(bill.id, data)
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
      await deleteBill(bill.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} label={isNew ? 'New bill' : 'Edit bill'}>
      <h3>{isNew ? 'New bill' : 'Edit bill'}</h3>

      <form onSubmit={onSave} className="billmodal-form">
        <div>
          <label className="field-label" htmlFor="bill-name">
            Name
          </label>
          <input
            id="bill-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix"
            autoFocus={isNew}
          />
        </div>

        <div className="billmodal-row">
          <div>
            <label className="field-label" htmlFor="bill-amount">
              Amount
            </label>
            <input
              id="bill-amount"
              className="field amount"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              placeholder="15.49"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="bill-dueday">
              Due day
            </label>
            <input
              id="bill-dueday"
              className="field"
              inputMode="numeric"
              value={dueDayText}
              onChange={(e) => setDueDayText(e.target.value)}
              placeholder="15"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="bill-note">
            Note <span className="billmodal-optional">(optional)</span>
          </label>
          <input
            id="bill-note"
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Annual plan renews in March"
          />
        </div>

        {error && <p className="error-note">{error}</p>}
        {confirmDelete && (
          <p className="error-note">Delete “{bill.name}”? Click Delete again to confirm.</p>
        )}

        <div className="billmodal-actions">
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>
          )}
          <span className="billmodal-actions-gap" />
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
