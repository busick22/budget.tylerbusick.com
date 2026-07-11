// Debts: one card per debt showing how much is paid off, with a quick
// record-payment action. The bar fills as the debt shrinks.

import { useState } from 'react'
import { Plus, Pencil, TrendingDown, PartyPopper } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import DebtModal from './DebtModal.jsx'
import { useDebts } from '../../state/DebtsContext.jsx'
import { formatCents, parseToCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './debt.css'

export default function DebtPage() {
  const { debts } = useDebts()
  const [editing, setEditing] = useState(null) // null | 'new' | debt object
  const [paying, setPaying] = useState(null) // null | debt object

  const totalLeft = debts.reduce((a, d) => a + d.balanceCents, 0)
  const totalStarting = debts.reduce((a, d) => a + d.startingCents, 0)

  return (
    <div className="page page-enter" data-page="debt">
      <header className="page-head">
        <h1 className="page-title">
          Debt
          <small>
            {debts.length === 0 ? (
              'Paying it down'
            ) : (
              <>
                <span className="amount">{formatCents(totalLeft)}</span> left of{' '}
                <span className="amount">{formatCents(totalStarting)}</span>
              </>
            )}
          </small>
        </h1>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden="true" />
          New debt
        </button>
      </header>

      {debts.length === 0 ? (
        <div className="empty-state">
          <TrendingDown aria-hidden="true" />
          <p>
            Track a loan or card balance here and log payments as you make
            them — the bar fills up as the debt goes down.
          </p>
          <button className="btn" onClick={() => setEditing('new')}>
            <Plus size={15} aria-hidden="true" />
            Add a debt
          </button>
        </div>
      ) : (
        <div className="debt-grid">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={() => setEditing(debt)}
              onPay={() => setPaying(debt)}
            />
          ))}
        </div>
      )}

      {editing && (
        <DebtModal debt={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {paying && <PaymentModal debt={paying} onClose={() => setPaying(null)} />}
    </div>
  )
}

function DebtCard({ debt, onEdit, onPay }) {
  const hex = colorHex(debt.color)
  const paidCents = debt.startingCents - debt.balanceCents
  const ratio = debt.startingCents > 0 ? paidCents / debt.startingCents : 0
  const done = debt.balanceCents <= 0

  return (
    <div className="card debt-card" data-done={done} style={{ '--cat': hex }}>
      <div className="goal-head">
        <span className="dash-gauge-dot" aria-hidden="true" />
        <h3>{debt.name}</h3>
        <button className="icon-btn" aria-label={`Edit ${debt.name}`} onClick={onEdit}>
          <Pencil size={14} />
        </button>
      </div>

      <div className="goal-nums">
        <strong className="amount">{formatCents(debt.balanceCents)}</strong>
        <span>left of <span className="amount">{formatCents(debt.startingCents)}</span></span>
      </div>

      <div
        className="dash-gauge-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={debt.startingCents}
        aria-valuenow={paidCents}
        aria-label={`${debt.name} paid off`}
      >
        <div className="dash-gauge-fill" style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>

      <div className="goal-foot">
        {done ? (
          <p className="goal-done">
            <PartyPopper size={14} aria-hidden="true" />
            Paid off!
          </p>
        ) : (
          <p>
            <span className="amount">{formatCents(paidCents)}</span> paid so far
          </p>
        )}
        {!done && (
          <button className="btn goal-add-btn" onClick={onPay}>
            <Plus size={14} aria-hidden="true" />
            Payment
          </button>
        )}
      </div>
    </div>
  )
}

function PaymentModal({ debt, onClose }) {
  const { recordPayment } = useDebts()
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    const cents = parseToCents(amountText)
    if (cents === null || cents <= 0) {
      setError('Enter a payment amount like 150.')
      return
    }
    if (cents > debt.balanceCents) {
      setError(`That's more than what's left (${formatCents(debt.balanceCents)}).`)
      return
    }
    setBusy(true)
    try {
      await recordPayment(debt.id, cents)
      onClose()
    } catch (err) {
      setError(err.message || 'Saving failed.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width={340}>
      <h3>Payment on {debt.name}</h3>
      <form onSubmit={onSubmit} className="debtmodal-form">
        <div>
          <label className="field-label" htmlFor="debt-payment">
            Amount
          </label>
          <input
            id="debt-payment"
            className="field amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="150"
            autoFocus
          />
        </div>
        {error && <p className="error-note">{error}</p>}
        <div className="debtmodal-actions">
          <span className="debtmodal-actions-gap" />
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Record'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
