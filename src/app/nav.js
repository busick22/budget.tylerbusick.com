// The five main areas. Each gets its own accent color, applied to the page
// via the --page-accent CSS variable (see AppShell).

import { Gauge, Receipt, CalendarClock, PiggyBank, TrendingDown } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Gauge, accent: 'var(--accent-dashboard)' },
  { to: '/spending', label: 'Spending', icon: Receipt, accent: 'var(--accent-spending)' },
  { to: '/bills', label: 'Bills', icon: CalendarClock, accent: 'var(--accent-bills)' },
  { to: '/goals', label: 'Goals', icon: PiggyBank, accent: 'var(--accent-goals)' },
  { to: '/debt', label: 'Debt', icon: TrendingDown, accent: 'var(--accent-debt)' },
]
