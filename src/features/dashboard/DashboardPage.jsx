// The overview screen: your accounts, this month's money in vs. out, and a
// row of summary cards — one per area (Spending, Bills, Income, Debt, Goals) —
// each showing a headline figure and linking into its own tab for the detail.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings,
  Plus,
  Landmark,
  Receipt,
  CalendarClock,
  Wallet,
  TrendingDown,
  PiggyBank,
  ChevronRight,
} from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import AccountModal from './AccountModal.jsx'
import { useAccounts } from '../../state/AccountsContext.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { useBills } from '../../state/BillsContext.jsx'
import { useDebts } from '../../state/DebtsContext.jsx'
import { useGoals } from '../../state/GoalsContext.jsx'
import { useMonth } from '../../state/MonthContext.jsx'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './dashboard.css'

export default function DashboardPage() {
  const { accounts, totalBalance } = useAccounts()
  const { expenseCategories } = useCategories()
  const { spentByCategory, incomeBySource, forMonth } = useTransactions()
  const { bills } = useBills()
  const { debts } = useDebts()
  const { goals } = useGoals()
  const { month, setMonth } = useMonth()
  const [editingAccount, setEditingAccount] = useState(null) // null | 'new' | account

  const spent = useMemo(() => spentByCategory(month), [spentByCategory, month])
  const income = useMemo(() => incomeBySource(month), [incomeBySource, month])
  const incomeCount = useMemo(
    () => forMonth(month).filter((t) => (t.type ?? 'expense') === 'income').length,
    [forMonth, month],
  )

  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)
  const net = totalIncome - totalSpent
  const totalLimit = expenseCategories.reduce((a, c) => a + c.limitCents, 0)
  const uncategorized = spent.uncategorized ?? 0

  // Bills — for the shown month.
  const billsTotal = bills.reduce((a, b) => a + b.amountCents, 0)
  const billsPaid = bills
    .filter((b) => (b.paidMonths ?? []).includes(month))
    .reduce((a, b) => a + b.amountCents, 0)
  const billsUnpaidCount = bills.filter((b) => !(b.paidMonths ?? []).includes(month)).length

  // Debt & goals aren't month-scoped — they show current running totals.
  const debtLeft = debts.reduce((a, d) => a + d.balanceCents, 0)
  const debtStarting = debts.reduce((a, d) => a + d.startingCents, 0)
  const goalsSaved = goals.reduce((a, g) => a + g.savedCents, 0)
  const goalsTarget = goals.reduce((a, g) => a + g.targetCents, 0)

  return (
    <div className="page page-enter" data-page="dashboard" data-scroll="locked">
      <header className="page-head">
        <h1 className="page-title">Dashboard</h1>
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
              Add account
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

        {/* One summary card per area. */}
        <div className="dash-overview">
          <OverviewCard
            to="/spending"
            icon={Receipt}
            accent="var(--accent-spending)"
            label="Spending"
            headline={formatCents(totalSpent)}
            sub={
              totalLimit > 0 ? (
                <>of <span className="amount">{formatCents(totalLimit)}</span> in limits</>
              ) : expenseCategories.length === 0 ? (
                'No categories yet — add one to track'
              ) : (
                'spent this month'
              )
            }
            ratio={totalLimit > 0 ? totalSpent / totalLimit : null}
            tone={totalLimit > 0 && totalSpent > totalLimit ? 'over' : 'normal'}
            note={
              uncategorized > 0 ? (
                <>
                  <span className="amount">{formatCents(uncategorized)}</span> uncategorized
                </>
              ) : null
            }
          />

          <OverviewCard
            to="/bills"
            icon={CalendarClock}
            accent="var(--accent-bills)"
            label="Bills"
            headline={formatCents(billsPaid)}
            sub={
              bills.length === 0 ? (
                'No bills yet'
              ) : (
                <>paid of <span className="amount">{formatCents(billsTotal)}</span></>
              )
            }
            ratio={billsTotal > 0 ? billsPaid / billsTotal : null}
            tone="bills"
            note={
              billsUnpaidCount > 0 ? (
                <>{billsUnpaidCount} still due</>
              ) : bills.length > 0 ? (
                'all paid'
              ) : null
            }
          />

          <OverviewCard
            to="/income"
            icon={Wallet}
            accent="var(--accent-income)"
            label="Income"
            headline={formatCents(totalIncome)}
            sub={
              incomeCount === 0
                ? 'No income logged'
                : `${incomeCount} entr${incomeCount === 1 ? 'y' : 'ies'} this month`
            }
            ratio={null}
            tone="income"
          />

          <OverviewCard
            to="/debt"
            icon={TrendingDown}
            accent="var(--accent-debt)"
            label="Debt"
            headline={formatCents(debtLeft)}
            sub={
              debts.length === 0 ? (
                'No debt tracked'
              ) : (
                <>left of <span className="amount">{formatCents(debtStarting)}</span></>
              )
            }
            ratio={debtStarting > 0 ? (debtStarting - debtLeft) / debtStarting : null}
            tone="debt"
            note={debtLeft === 0 && debts.length > 0 ? 'debt-free 🎉' : null}
          />

          <OverviewCard
            to="/income"
            icon={PiggyBank}
            accent="var(--accent-dashboard)"
            label="Goals"
            headline={formatCents(goalsSaved)}
            sub={
              goals.length === 0 ? (
                'No goals yet'
              ) : (
                <>saved of <span className="amount">{formatCents(goalsTarget)}</span></>
              )
            }
            ratio={goalsTarget > 0 ? goalsSaved / goalsTarget : null}
            tone="goals"
          />
        </div>
      </div>

      {editingAccount && (
        <AccountModal
          account={editingAccount === 'new' ? null : editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  )
}

function OverviewCard({ to, icon: Icon, accent, label, headline, sub, ratio, tone, note }) {
  const pct = ratio == null ? null : Math.min(Math.max(ratio, 0), 1) * 100
  return (
    <Link to={to} className="dash-card" data-tone={tone} style={{ '--card-accent': accent }}>
      <div className="dash-card-head">
        <span className="dash-card-icon" aria-hidden="true">
          <Icon size={15} />
        </span>
        <span className="dash-card-label">{label}</span>
        <ChevronRight size={16} className="dash-card-arrow" aria-hidden="true" />
      </div>

      <strong className="amount dash-card-headline">{headline}</strong>
      <span className="dash-card-sub">{sub}</span>

      {pct != null && (
        <div className="dash-card-bar">
          <div className="dash-card-fill" style={{ width: `${pct}%` }} />
        </div>
      )}

      {note && <span className="dash-card-note">{note}</span>}
    </Link>
  )
}
