// Recurring bills for the shown month: due day, amount, and a paid checkbox.
// Sorted by due day, unpaid first within the month view's mental model.

import { useMemo, useState } from 'react'
import { Plus, CalendarClock, Check } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import BillModal from './BillModal.jsx'
import { useBills } from '../../state/BillsContext.jsx'
import { currentMonthKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import './bills.css'

export default function BillsPage() {
  const { bills, setPaid } = useBills()
  const [month, setMonth] = useState(currentMonthKey)
  const [editing, setEditing] = useState(null) // null | 'new' | bill object

  const monthTotal = bills.reduce((a, b) => a + b.amountCents, 0)
  const paidTotal = bills
    .filter((b) => (b.paidMonths ?? []).includes(month))
    .reduce((a, b) => a + b.amountCents, 0)

  const sorted = useMemo(
    () => [...bills].sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name)),
    [bills],
  )

  return (
    <div className="page page-enter" data-page="bills" data-scroll="locked">
      <header className="page-head">
        <h1 className="page-title">
          Bills
          <small>
            {bills.length === 0 ? (
              'Recurring bills & subscriptions'
            ) : (
              <>
                <span className="amount">{formatCents(paidTotal)}</span> paid of{' '}
                <span className="amount">{formatCents(monthTotal)}</span> / month
              </>
            )}
          </small>
        </h1>
        <div className="bills-head-actions">
          <MonthSwitcher month={month} onChange={setMonth} />
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
        </div>
      </header>

      <div className="page-scroll">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <CalendarClock aria-hidden="true" />
            <p>
              List what hits every month — rent, phone, subscriptions — and
              check each one off as it gets paid.
            </p>
            <button className="btn" onClick={() => setEditing('new')}>
              <Plus size={15} aria-hidden="true" />
              Add a bill
            </button>
          </div>
        ) : (
          <div className="card bills-list">
            {sorted.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                paid={(bill.paidMonths ?? []).includes(month)}
                onTogglePaid={(paid) => setPaid(bill.id, month, paid)}
                onEdit={() => setEditing(bill)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <BillModal bill={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function BillRow({ bill, paid, onTogglePaid, onEdit }) {
  return (
    <div className="bill-row" data-paid={paid}>
      <button
        className="bill-check"
        role="checkbox"
        aria-checked={paid}
        aria-label={`${bill.name} paid this month`}
        onClick={() => onTogglePaid(!paid)}
      >
        {paid && <Check size={13} aria-hidden="true" />}
      </button>
      <button className="bill-main" onClick={onEdit}>
        <span className="bill-name">{bill.name}</span>
        <span className="bill-meta">
          due the {ordinal(bill.dueDay)}
          {bill.note ? ` · ${bill.note}` : ''}
        </span>
      </button>
      <span className="bill-amount amount">{formatCents(bill.amountCents)}</span>
    </div>
  )
}

function ordinal(n) {
  const rem10 = n % 10
  const rem100 = n % 100
  if (rem10 === 1 && rem100 !== 11) return `${n}st`
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`
  return `${n}th`
}
