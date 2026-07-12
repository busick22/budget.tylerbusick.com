// Savings goals as a reusable section — lives on the Income page, since saving
// is what you do with income. One card per goal with progress and a quick
// add-money action.

import { useState } from 'react'
import { Plus, Pencil, PiggyBank, PartyPopper } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import GoalModal from './GoalModal.jsx'
import { useGoals } from '../../state/GoalsContext.jsx'
import { formatCents, parseToCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './goals.css'

export default function GoalsSection() {
  const { goals } = useGoals()
  const [editing, setEditing] = useState(null) // null | 'new' | goal object
  const [adding, setAdding] = useState(null) // null | goal object

  const totalSaved = goals.reduce((a, g) => a + g.savedCents, 0)
  const totalTarget = goals.reduce((a, g) => a + g.targetCents, 0)

  return (
    <section className="goals-section">
      <div className="goals-section-head">
        <h2 className="panel-title">
          <PiggyBank size={13} aria-hidden="true" />
          Savings goals
          {goals.length > 0 && (
            <span className="goals-section-sub">
              <span className="amount">{formatCents(totalSaved)}</span> of{' '}
              <span className="amount">{formatCents(totalTarget)}</span>
            </span>
          )}
        </h2>
        <button className="btn" onClick={() => setEditing('new')}>
          <Plus size={15} aria-hidden="true" />
          New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <PiggyBank aria-hidden="true" />
          <p>
            Name what you&rsquo;re saving for — an emergency fund, a trip — set a
            target, and log money toward it whenever you stash some away.
          </p>
          <button className="btn" onClick={() => setEditing('new')}>
            <Plus size={15} aria-hidden="true" />
            Add a goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditing(goal)}
              onAdd={() => setAdding(goal)}
            />
          ))}
        </div>
      )}

      {editing && (
        <GoalModal goal={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {adding && <AddMoneyModal goal={adding} onClose={() => setAdding(null)} />}
    </section>
  )
}

function GoalCard({ goal, onEdit, onAdd }) {
  const hex = colorHex(goal.color)
  const ratio = goal.targetCents > 0 ? goal.savedCents / goal.targetCents : 0
  const done = goal.savedCents >= goal.targetCents

  return (
    <div className="card goal-card" data-done={done} style={{ '--cat': hex }}>
      <div className="goal-head">
        <span className="dash-gauge-dot" aria-hidden="true" />
        <h3>{goal.name}</h3>
        <button className="icon-btn" aria-label={`Edit ${goal.name}`} onClick={onEdit}>
          <Pencil size={14} />
        </button>
      </div>

      <div className="goal-nums">
        <strong className="amount">{formatCents(goal.savedCents)}</strong>
        <span className="amount">of {formatCents(goal.targetCents)}</span>
      </div>

      <div
        className="dash-gauge-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={goal.targetCents}
        aria-valuenow={Math.min(goal.savedCents, goal.targetCents)}
        aria-label={`${goal.name} progress`}
      >
        <div className="dash-gauge-fill" style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>

      <div className="goal-foot">
        {done ? (
          <p className="goal-done">
            <PartyPopper size={14} aria-hidden="true" />
            Goal reached!
          </p>
        ) : (
          <p>
            <span className="amount">{formatCents(goal.targetCents - goal.savedCents)}</span> to go
          </p>
        )}
        <button className="btn goal-add-btn" onClick={onAdd}>
          <Plus size={14} aria-hidden="true" />
          Add money
        </button>
      </div>
    </div>
  )
}

function AddMoneyModal({ goal, onClose }) {
  const { addToGoal } = useGoals()
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    const cents = parseToCents(amountText)
    // Negative is allowed on purpose — taking money back out of a goal.
    if (cents === null || cents === 0) {
      setError('Enter an amount like 50 (or -50 to take money out).')
      return
    }
    if (goal.savedCents + cents < 0) {
      setError(`That would go below zero — the goal has ${formatCents(goal.savedCents)} in it.`)
      return
    }
    setBusy(true)
    try {
      await addToGoal(goal.id, cents)
      onClose()
    } catch (err) {
      setError(err.message || 'Saving failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width={340} label={`Add to ${goal.name}`}>
      <h3>Add to {goal.name}</h3>
      <form onSubmit={onSubmit} className="goalmodal-form">
        <div>
          <label className="field-label" htmlFor="goal-addamount">
            Amount
          </label>
          <input
            id="goal-addamount"
            className="field amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="50"
            autoFocus
          />
        </div>
        {error && <p className="error-note">{error}</p>}
        <div className="goalmodal-actions">
          <span className="goalmodal-actions-gap" />
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
