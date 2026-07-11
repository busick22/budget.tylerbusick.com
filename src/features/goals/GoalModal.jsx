// Create or edit a savings goal: name, target, color (and starting amount
// when new). Adding money later happens right on the goal card.

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import { useGoals } from '../../state/GoalsContext.jsx'
import { parseToCents, centsToInput } from '../../lib/money.js'
import { CATEGORY_COLORS, nextFreeColor } from '../../lib/palette.js'

export default function GoalModal({ goal, onClose }) {
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals()
  const isNew = !goal

  const [name, setName] = useState(goal?.name ?? '')
  const [targetText, setTargetText] = useState(goal ? centsToInput(goal.targetCents) : '')
  const [startText, setStartText] = useState('')
  const [color, setColor] = useState(
    goal?.color ?? nextFreeColor(goals.map((g) => g.color)),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function onSave(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the goal a name.')
      return
    }
    const targetCents = parseToCents(targetText)
    if (targetCents === null || targetCents <= 0) {
      setError('The target should be an amount like 2000.')
      return
    }
    const savedCents = startText.trim() === '' ? 0 : parseToCents(startText)
    if (savedCents === null || savedCents < 0) {
      setError('Already saved should be an amount like 250 (or empty).')
      return
    }
    setBusy(true)
    try {
      if (isNew) await addGoal({ name: trimmed, targetCents, savedCents, color })
      else await updateGoal(goal.id, { name: trimmed, targetCents, color })
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
      await deleteGoal(goal.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Deleting failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>{isNew ? 'New goal' : 'Edit goal'}</h3>

      <form onSubmit={onSave} className="goalmodal-form">
        <div>
          <label className="field-label" htmlFor="goal-name">
            Name
          </label>
          <input
            id="goal-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Emergency fund"
            autoFocus={isNew}
          />
        </div>

        <div className="goalmodal-row">
          <div>
            <label className="field-label" htmlFor="goal-target">
              Target
            </label>
            <input
              id="goal-target"
              className="field amount"
              inputMode="decimal"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="2000"
            />
          </div>
          {isNew && (
            <div>
              <label className="field-label" htmlFor="goal-start">
                Already saved
              </label>
              <input
                id="goal-start"
                className="field amount"
                inputMode="decimal"
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
        </div>

        <div>
          <span className="field-label">Color</span>
          <div className="catmodal-swatches" role="radiogroup" aria-label="Goal color">
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
          <p className="error-note">Delete “{goal.name}”? Click Delete again to confirm.</p>
        )}

        <div className="goalmodal-actions">
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={busy}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </button>
          )}
          <span className="goalmodal-actions-gap" />
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
