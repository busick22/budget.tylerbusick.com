// Create or edit a category. Two kinds:
//   - expense (default): a spending category with a monthly limit.
//   - income: a source of income (Paycheck, Side gig…) — no limit shown.
// The `kind` prop is set when NEW; editing keeps the existing kind.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'
import { CATEGORY_COLORS, nextFreeColor } from '../../lib/palette.js'

export default function CategoryModal({ category, kind = 'expense', onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const isNew = !category
  const effectiveKind = category?.kind ?? kind
  const isIncome = effectiveKind === 'income'
  const noun = isIncome ? 'source' : 'category'

  const [name, setName] = useState(category?.name ?? '')
  const [limitText, setLimitText] = useState(
    category ? centsToInput(category.limitCents) : '',
  )
  const [color, setColor] = useState(
    category?.color ?? nextFreeColor(categories.map((c) => c.color)),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(`Give the ${noun} a name.`)
      return
    }
    // Income sources have no limit. For expenses, empty = 0 = "just track".
    let limitCents = 0
    if (!isIncome) {
      limitCents = limitText.trim() === '' ? 0 : parseToCents(limitText)
      if (limitCents === null || limitCents < 0) {
        setError('The limit should be an amount like 450 or 62.50.')
        return
      }
    }
    setBusy(true)
    try {
      if (isNew) await addCategory({ name: trimmed, limitCents, color, kind: effectiveKind })
      else await updateCategory(category.id, { name: trimmed, limitCents, color })
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
      await deleteCategory(category.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  const titleNoun = isIncome ? 'source' : 'category'

  return (
    <Modal onClose={onClose}>
      <h3>
        {isNew ? 'New' : 'Edit'} {titleNoun}
      </h3>

      <form onSubmit={onSave} className="catmodal-form">
        <div>
          <label className="field-label" htmlFor="cat-name">
            Name
          </label>
          <input
            id="cat-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isIncome ? 'Paycheck' : 'Groceries'}
            autoFocus={isNew}
          />
        </div>

        {!isIncome && (
          <div>
            <label className="field-label" htmlFor="cat-limit">
              Monthly limit
            </label>
            <input
              id="cat-limit"
              className="field amount"
              inputMode="decimal"
              value={limitText}
              onChange={(e) => setLimitText(e.target.value)}
              placeholder="450 — leave empty to just track"
            />
          </div>
        )}

        <div>
          <span className="field-label">Color</span>
          <div className="catmodal-swatches" role="radiogroup" aria-label={`${noun} color`}>
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
          <p className="error-note">
            Delete “{category.name}”? Its transactions stay, shown as{' '}
            {isIncome ? 'unassigned' : 'Uncategorized'}. Click Delete again to confirm.
          </p>
        )}

        <div className="catmodal-actions">
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
