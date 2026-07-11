// Income: what's coming in each month, grouped by source, plus your savings
// goals (relocated here — saving is what you do with income). The month's
// income total sits up top; the Dashboard is where income meets spending (net).

import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Wallet, Pencil, FolderPlus } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import TransactionModal from '../spending/TransactionModal.jsx'
import CategoryModal from '../dashboard/CategoryModal.jsx'
import GoalsSection from '../goals/GoalsSection.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { currentMonthKey, todayKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './income.css'

const UNASSIGNED = 'unassigned'

export default function IncomePage() {
  const { byId } = useCategories()
  const { forMonth } = useTransactions()
  const location = useLocation()

  const [month, setMonth] = useState(location.state?.month ?? currentMonthKey())
  const [editing, setEditing] = useState(null) // null | 'new' | transaction
  const [editingSource, setEditingSource] = useState(null) // null | 'new' | source

  const monthIncome = useMemo(
    () => forMonth(month).filter((t) => (t.type ?? 'expense') === 'income'),
    [forMonth, month],
  )
  const total = monthIncome.reduce((a, t) => a + t.amountCents, 0)

  // Group by source (alphabetical; Unassigned last).
  const groups = useMemo(() => {
    const map = new Map()
    for (const t of monthIncome) {
      const key = t.categoryId ?? UNASSIGNED
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    const list = [...map.entries()].map(([key, items]) => ({
      key,
      source: key === UNASSIGNED ? null : byId(key),
      items,
      subtotal: items.reduce((a, t) => a + t.amountCents, 0),
    }))
    list.sort((a, b) => {
      if (a.key === UNASSIGNED) return 1
      if (b.key === UNASSIGNED) return -1
      return (a.source?.name ?? '').localeCompare(b.source?.name ?? '')
    })
    return list
  }, [monthIncome, byId])

  const defaultDate = month === currentMonthKey() ? todayKey() : `${month}-01`

  return (
    <div className="page page-enter" data-page="income">
      <header className="page-head">
        <h1 className="page-title">
          Income
          <small>
            {monthIncome.length === 0 ? (
              'What’s coming in this month'
            ) : (
              <>
                <span className="amount">{formatCents(total)}</span> in ·{' '}
                {monthIncome.length} entr{monthIncome.length === 1 ? 'y' : 'ies'}
              </>
            )}
          </small>
        </h1>
        <div className="income-head-actions">
          <MonthSwitcher month={month} onChange={setMonth} />
          <button className="btn" onClick={() => setEditingSource('new')} title="Add an income source">
            <FolderPlus size={15} aria-hidden="true" />
            Source
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" />
            Add income
          </button>
        </div>
      </header>

      <div className="page-scroll">
        {monthIncome.length === 0 ? (
          <div className="empty-state">
            <Wallet aria-hidden="true" />
            <p>
              No income logged this month yet. Add a paycheck or other money in,
              and set up sources (Paycheck, Side gig…) to see it grouped.
            </p>
            <button className="btn" onClick={() => setEditing('new')}>
              <Plus size={15} aria-hidden="true" />
              Add income
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="income-group">
              <h2 className="panel-title income-group-head">
                <span
                  className="income-dot"
                  style={{ '--cat': group.source ? colorHex(group.source.color) : 'var(--text-dim)' }}
                  aria-hidden="true"
                />
                {group.source?.name ?? 'Unassigned'}
                {group.source && (
                  <button
                    className="icon-btn income-source-edit"
                    aria-label={`Edit ${group.source.name}`}
                    onClick={() => setEditingSource(group.source)}
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <span className="income-group-total amount">{formatCents(group.subtotal)}</span>
              </h2>
              <div className="card income-list">
                {group.items.map((t) => (
                  <button key={t.id} className="income-row" onClick={() => setEditing(t)}>
                    <span className="income-row-main">
                      <span className="income-row-desc">{t.description}</span>
                      <span className="income-row-meta">
                        {t.date}
                        {t.note ? ` · ${t.note}` : ''}
                      </span>
                    </span>
                    <span className="income-row-amount amount">+{formatCents(t.amountCents)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}

        <GoalsSection />
      </div>

      {editing && (
        <TransactionModal
          transaction={editing === 'new' ? null : editing}
          defaultDate={defaultDate}
          defaultType="income"
          onClose={() => setEditing(null)}
        />
      )}
      {editingSource && (
        <CategoryModal
          category={editingSource === 'new' ? null : editingSource}
          kind="income"
          onClose={() => setEditingSource(null)}
        />
      )}
    </div>
  )
}
