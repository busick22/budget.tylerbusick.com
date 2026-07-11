// The signed-in frame: desktop gets a collapsible sidebar, mobile gets a
// bottom tab bar. Which one shows is pure CSS (media queries) — both are
// always rendered, so there's no resize flicker.

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import { NAV_ITEMS } from './nav.js'
import './shell.css'

export default function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('budget:sidebar') === 'collapsed'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('budget:sidebar', collapsed ? 'collapsed' : 'open')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  // Each area tints the page with its own accent.
  const active = NAV_ITEMS.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )
  const pageAccent = active?.accent ?? 'var(--accent)'

  return (
    <div className="shell" data-collapsed={collapsed}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="shell-main" style={{ '--page-accent': pageAccent }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
