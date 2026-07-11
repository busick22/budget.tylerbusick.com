// The heart of the app: this month's spending against each category's limit.

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings, Plus, Pencil, Gauge } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import CategoryModal from './CategoryModal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { currentMonthKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './dashboard.css'

export default function DashboardPage() {
  const { categories } = useCategories()
  const { spentByCategory } = useTransactions()
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonthKey)
  const [editing, setEditing] = useState(null) // null | 'new' | category object

  // Jump to the Spending page filtered to one category (or Uncategorized) for
  // the month currently shown here.
  function openInSpending(categoryId) {
    navigate('/spending', { state: { categoryId, month } })
  }

  const spent = useMemo(() => spentByCategory(month), [spentByCategory, month])

  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
  const totalLimit = categories.reduce((a, c) => a + c.limitCents, 0)
  const uncategorized = spent.uncategorized ?? 0

  return (
    <div className="page page-enter" data-page="dashboard">
      <header className="page-head">
        <h1 className="page-title">
          Dashboard
          <small>Spending vs. your limits</small>
        </h1>
        <div className="dash-head-actions">
          <MonthSwitcher month={month} onChange={setMonth} />
          {/* On mobile the sidebar is hidden, so this is the way into Settings. */}
          <Link to="/settings" className="icon-btn" aria-label="Settings">
            <Settings size={18} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="page-scroll">
        {categories.length > 0 && (
          <div className="dash-summary card">
            <div>
              <span className="panel-title">Spent</span>
              <strong className="amount">{formatCents(totalSpent)}</strong>
            </div>
            <div>
              <span className="panel-title">Limits</span>
              <strong className="amount">{formatCents(totalLimit)}</strong>
            </div>
            <div data-over={totalLimit > 0 && totalSpent > totalLimit}>
              <span className="panel-title">Left</span>
              <strong className="amount">{formatCents(totalLimit - totalSpent)}</strong>
            </div>
          </div>
        )}

        <div className="dash-grid">
          {categories.map((cat) => (
            <GaugeCard
              key={cat.id}
              category={cat}
              spentCents={spent[cat.id] ?? 0}
              onEdit={() => setEditing(cat)}
              onOpen={() => openInSpending(cat.id)}
            />
          ))}

          <button className="card dash-add" onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            {categories.length === 0 ? 'Set up your first category' : 'New category'}
          </button>
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            <Gauge aria-hidden="true" />
            <p>
              Categories are how Budget works: name one (Groceries, Gas…), give
              it a monthly limit, and every gauge on this page tracks it.
            </p>
          </div>
        )}

        {uncategorized > 0 && (
          <p className="dash-uncat">
            <span className="amount">{formatCents(uncategorized)}</span> this month is
            uncategorized —{' '}
            <Link to="/spending" state={{ categoryId: 'uncategorized', month }}>
              assign categories
            </Link>
            .
          </p>
        )}
      </div>

      {editing && (
        <CategoryModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function GaugeCard({ category, spentCents, onEdit, onOpen }) {
  const { limitCents } = category
  const hex = colorHex(category.color)
  const hasLimit = limitCents > 0
  const ratio = hasLimit ? spentCents / limitCents : 0
  const over = hasLimit && spentCents > limitCents
  const near = hasLimit && !over && ratio >= 0.85

  return (
    <div
      className="card dash-gauge"
      data-over={over}
      data-near={near}
      style={{ '--cat': hex }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      title={`See ${category.name} transactions`}
    >
      <div className="dash-gauge-head">
        <span className="dash-gauge-dot" aria-hidden="true" />
        <h3>{category.name}</h3>
        <button
          className="icon-btn"
          aria-label={`Edit ${category.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="dash-gauge-nums">
        <strong className="amount">{formatCents(spentCents)}</strong>
        {hasLimit ? (
          <span className="amount">of {formatCents(limitCents)}</span>
        ) : (
          <span>no limit — tracking</span>
        )}
      </div>

      {hasLimit && (
        <>
          <div
            className="dash-gauge-bar"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={limitCents}
            aria-valuenow={Math.min(spentCents, limitCents)}
            aria-label={`${category.name} spending`}
          >
            <div
              className="dash-gauge-fill"
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          <p className="dash-gauge-foot">
            {over ? (
              <>
                <span className="amount">{formatCents(spentCents - limitCents)}</span> over
              </>
            ) : (
              <>
                <span className="amount">{formatCents(limitCents - spentCents)}</span> left
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
