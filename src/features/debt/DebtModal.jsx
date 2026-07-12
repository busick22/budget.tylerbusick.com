// Create or edit a debt: name, what it started at, what's left, color.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useDebts } from '../../state/DebtsContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'
import { CATEGORY_COLORS, nextFreeColor } from '../../lib/palette.js'

export default function DebtModal({ debt, onClose }) {
  const { debts, addDebt, updateDebt, deleteDebt } = useDebts()
  const isNew = !debt

  const [name, setName] = useState(debt?.name ?? '')
  const [startingText, setStartingText] = useState(
    debt ? centsToInput(debt.startingCents) : '',
  )
  const [balanceText, setBalanceText] = useState(debt ? centsToInput(debt.balanceCents) : '')
  const [color, setColor] = useState(
    debt?.color ?? nextFreeColor(debts.map((d) => d.color)),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the debt a name.')
      return
    }
    const startingCents = parseToCents(startingText)
    if (startingCents === null || startingCents <= 0) {
      setError('Starting amount should be a number like 8500.')
      return
    }
    // New debts start at the full amount unless told otherwise.
    const balanceCents =
      balanceText.trim() === '' && isNew ? startingCents : parseToCents(balanceText)
    if (balanceCents === null || balanceCents < 0) {
      setError('Balance left should be a number like 6200 (or empty for the full amount).')
      return
    }
    if (balanceCents > startingCents) {
      setError('The balance left can’t be more than the starting amount.')
      return
    }
    setBusy(true)
    const data = { name: trimmed, startingCents, balanceCents, color }
    try {
      if (isNew) await addDebt(data)
      else await updateDebt(debt.id, data)
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
      await deleteDebt(debt.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} label={isNew ? 'New debt' : 'Edit debt'}>
      <h3>{isNew ? 'New debt' : 'Edit debt'}</h3>

      <form onSubmit={onSave} className="debtmodal-form">
        <div>
          <label className="field-label" htmlFor="debt-name">
            Name
          </label>
          <input
            id="debt-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Car loan"
            autoFocus={isNew}
          />
        </div>

        <div className="debtmodal-row">
          <div>
            <label className="field-label" htmlFor="debt-start">
              Started at
            </label>
            <input
              id="debt-start"
              className="field amount"
              inputMode="decimal"
              value={startingText}
              onChange={(e) => setStartingText(e.target.value)}
              placeholder="8500"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="debt-balance">
              Left today
            </label>
            <input
              id="debt-balance"
              className="field amount"
              inputMode="decimal"
              value={balanceText}
              onChange={(e) => setBalanceText(e.target.value)}
              placeholder={isNew ? 'same as start' : '6200'}
            />
          </div>
        </div>

        <div>
          <span className="field-label">Color</span>
          <div className="catmodal-swatches" role="radiogroup" aria-label="Debt color">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={color === c.key}
                aria-label={c.key}
                className="catmodal-swatch"
                data-active={color === c.key}
                style={{ '--swatch': c.hex }}
                onClick={() => setColor(c.key)}
              />
            ))}
          </div>
        </div>

        {error && <p className="error-note">{error}</p>}
        {confirmDelete && (
          <p className="error-note">Delete “{debt.name}”? Click Delete again to confirm.</p>
        )}

        <div className="debtmodal-actions">
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>
          )}
          <span className="debtmodal-actions-gap" />
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
