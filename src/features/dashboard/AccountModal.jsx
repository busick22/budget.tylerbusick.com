// Create or edit an account: name, current balance, color. The balance is a
// number you keep in sync with your bank — editing it here IS how you update
// it (there's no automatic recompute; see AccountsContext for why).

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useAccounts } from '../../state/AccountsContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'
import { CATEGORY_COLORS, nextFreeColor } from '../../lib/palette.js'

export default function AccountModal({ account, onClose }) {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts()
  const isNew = !account

  const [name, setName] = useState(account?.name ?? '')
  // Balances can be negative (an overdrawn or credit account), so allow it.
  const [balanceText, setBalanceText] = useState(
    account ? centsToInput(account.balanceCents) : '',
  )
  const [color, setColor] = useState(
    account?.color ?? nextFreeColor(accounts.map((a) => a.color)),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the account a name.')
      return
    }
    const balanceCents = balanceText.trim() === '' ? 0 : parseToCents(balanceText)
    if (balanceCents === null) {
      setError('The balance should be a number like 1240.75 (or -50).')
      return
    }
    setBusy(true)
    try {
      if (isNew) await addAccount({ name: trimmed, balanceCents, color })
      else await updateAccount(account.id, { name: trimmed, balanceCents, color })
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
      await deleteAccount(account.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>{isNew ? 'New account' : 'Edit account'}</h3>

      <form onSubmit={onSave} className="catmodal-form">
        <div>
          <label className="field-label" htmlFor="acct-name">
            Name
          </label>
          <input
            id="acct-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Checking"
            autoFocus={isNew}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="acct-balance">
            Current balance
          </label>
          <input
            id="acct-balance"
            className="field amount"
            inputMode="decimal"
            value={balanceText}
            onChange={(e) => setBalanceText(e.target.value)}
            placeholder="1240.75"
          />
        </div>

        <div>
          <span className="field-label">Color</span>
          <div className="catmodal-swatches" role="radiogroup" aria-label="Account color">
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
          <p className="error-note">Delete “{account.name}”? Click Delete again to confirm.</p>
        )}

        <div className="catmodal-actions">
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>
          )}
          <span className="catmodal-actions-gap" />
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
