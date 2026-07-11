// Every transaction for the shown month, newest day first. Click a row to
// edit it; the + button (or the empty state) adds one.

import { useMemo, useState } from 'react'
import { Plus, Receipt, Sparkles } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import TransactionModal from './TransactionModal.jsx'
import ImportModal from './ImportModal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { currentMonthKey, formatDay, todayKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './spending.css'

export default function SpendingPage() {
  const { byId } = useCategories()
  const { forMonth } = useTransactions()
  const [month, setMonth] = useState(currentMonthKey)
  const [editing, setEditing] = useState(null) // null | 'new' | transaction object
  const [importing, setImporting] = useState(false)

  const monthTx = useMemo(() => forMonth(month), [forMonth, month])
  const monthTotal = monthTx.reduce((a, t) => a + t.amountCents, 0)

  // Group into [dayKey, transactions[]] pairs, newest day first (the context
  // already sorts newest-first, so grouping preserves that order).
  const days = useMemo(() => {
    const map = new Map()
    for (const t of monthTx) {
      if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date).push(t)
    }
    return [...map.entries()]
  }, [monthTx])

  // "Add" inside a past/future month should default to that month, not today.
  const defaultDate = month === currentMonthKey() ? todayKey() : `${month}-01`

  return (
    <div className="page page-enter" data-page="spending" data-scroll="locked">
      <header className="page-head">
        <h1 className="page-title">
          Spending
          <small>
            {monthTx.length === 0 ? (
              'No transactions this month'
            ) : (
              <>
                {monthTx.length} transaction{monthTx.length === 1 ? '' : 's'} ·{' '}
                <span className="amount">{formatCents(monthTotal)}</span>
              </>
            )}
          </small>
        </h1>
        <div className="spend-head-actions">
          <MonthSwitcher month={month} onChange={setMonth} />
          <button className="btn" onClick={() => setImporting(true)} title="Upload a bank CSV — the AI categorizes it">
            <Sparkles size={15} aria-hidden="true" />
            Import
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
        </div>
      </header>

      <div className="page-scroll">
        {days.length === 0 ? (
          <div className="empty-state">
            <Receipt aria-hidden="true" />
            <p>
              Nothing recorded for this month yet. Add what you spend and the
              dashboard gauges fill in as you go.
            </p>
            <button className="btn" onClick={() => setEditing('new')}>
              <Plus size={15} aria-hidden="true" />
              Add a transaction
            </button>
          </div>
        ) : (
          days.map(([day, list]) => (
            <section key={day} className="spend-day">
              <h2 className="panel-title">{formatDay(day)}</h2>
              <div className="card spend-list">
                {list.map((t) => (
                  <TxRow key={t.id} tx={t} category={byId(t.categoryId)} onClick={() => setEditing(t)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {editing && (
        <TransactionModal
          transaction={editing === 'new' ? null : editing}
          defaultDate={defaultDate}
          onClose={() => setEditing(null)}
        />
      )}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
    </div>
  )
}

function TxRow({ tx, category, onClick }) {
  return (
    <button className="spend-row" onClick={onClick}>
      <span
        className="spend-row-dot"
        style={{ '--cat': category ? colorHex(category.color) : 'var(--text-dim)' }}
        aria-hidden="true"
      />
      <span className="spend-row-main">
        <span className="spend-row-desc">{tx.description}</span>
        <span className="spend-row-meta">
          {category?.name ?? 'Uncategorized'}
          {tx.note ? ` · ${tx.note}` : ''}
        </span>
      </span>
      <span className="spend-row-amount amount">{formatCents(tx.amountCents)}</span>
    </button>
  )
}
