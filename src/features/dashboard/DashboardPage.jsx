// The heart of the app: your accounts, this month's money in vs. out, and
// spending against each category's limit — all in one place.

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings, Plus, Pencil, Gauge, Landmark } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import CategoryModal from './CategoryModal.jsx'
import AccountModal from './AccountModal.jsx'
import { useAccounts } from '../../state/AccountsContext.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { currentMonthKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './dashboard.css'

export default function DashboardPage() {
  const { accounts, totalBalance } = useAccounts()
  const { expenseCategories } = useCategories()
  const { spentByCategory, incomeBySource } = useTransactions()
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonthKey)
  const [editing, setEditing] = useState(null) // null | 'new' | category object
  const [editingAccount, setEditingAccount] = useState(null) // null | 'new' | account

  // Jump to the Spending page filtered to one category (or Uncategorized) for
  // the month currently shown here.
  function openInSpending(categoryId) {
    navigate('/spending', { state: { categoryId, month } })
  }

  const spent = useMemo(() => spentByCategory(month), [spentByCategory, month])
  const income = useMemo(() => incomeBySource(month), [incomeBySource, month])

  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)
  const net = totalIncome - totalSpent
  const totalLimit = expenseCategories.reduce((a, c) => a + c.limitCents, 0)
  const uncategorized = spent.uncategorized ?? 0

  return (
    <div className="page page-enter" data-page="dashboard">
      <header className="page-head">
        <h1 className="page-title">
          Dashboard
          <small>Your month at a glance</small>
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
        {/* Accounts / balance */}
        <div className="dash-accounts card">
          <div className="dash-accounts-head">
            <span className="panel-title">
              <Landmark size={13} aria-hidden="true" />
              Balance
            </span>
            <strong className="amount dash-balance">{formatCents(totalBalance)}</strong>
          </div>
          <div className="dash-accounts-list">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                className="dash-account"
                onClick={() => setEditingAccount(acc)}
                style={{ '--cat': colorHex(acc.color) }}
              >
                <span className="dash-account-dot" aria-hidden="true" />
                <span className="dash-account-name">{acc.name}</span>
                <span className="amount dash-account-bal">{formatCents(acc.balanceCents)}</span>
              </button>
            ))}
            <button className="dash-account dash-account-add" onClick={() => setEditingAccount('new')}>
              <Plus size={14} aria-hidden="true" />
              {accounts.length === 0 ? 'Add an account' : 'Account'}
            </button>
          </div>
        </div>

        {/* Cash flow: money in vs out this month */}
        <div className="dash-cashflow card">
          <div>
            <span className="panel-title">Income</span>
            <strong className="amount dash-in">{formatCents(totalIncome)}</strong>
          </div>
          <div>
            <span className="panel-title">Spent</span>
            <strong className="amount dash-out">{formatCents(totalSpent)}</strong>
          </div>
          <div data-negative={net < 0}>
            <span className="panel-title">Net</span>
            <strong className="amount">{net >= 0 ? '+' : ''}{formatCents(net)}</strong>
          </div>
        </div>

        {expenseCategories.length > 0 && (
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
          {expenseCategories.map((cat) => (
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
            {expenseCategories.length === 0 ? 'Set up your first category' : 'New category'}
          </button>
        </div>

        {expenseCategories.length === 0 && (
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
      {editingAccount && (
        <AccountModal
          account={editingAccount === 'new' ? null : editingAccount}
          onClose={() => setEditingAccount(null)}
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
