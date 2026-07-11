import { NavLink } from 'react-router-dom'
import { Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_ITEMS } from './nav.js'
import { BrandMark, BrandWordmark } from './Brand.jsx'

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-head">
        <BrandMark />
        {!collapsed && <BrandWordmark />}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="sidebar-link"
            style={{ '--item-accent': accent }}
            title={collapsed ? label : undefined}
          >
            <Icon aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <NavLink
          to="/settings"
          className="sidebar-link"
          style={{ '--item-accent': 'var(--accent)' }}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings aria-hidden="true" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          className="sidebar-link sidebar-collapse"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
