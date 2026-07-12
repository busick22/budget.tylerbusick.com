import { useState } from 'react'
import { Moon, Sun, MonitorSmartphone, LogOut, Plus, Pencil, FolderOpen, Wallet } from 'lucide-react'
import { useAuth } from '../../state/AuthContext.jsx'
import { useSettings } from '../../state/SettingsContext.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import CategoryModal from '../dashboard/CategoryModal.jsx'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './settings.css'

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: MonitorSmartphone },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, update } = useSettings()
  const { expenseCategories, incomeSources } = useCategories()

  // Edit target: { kind: 'expense'|'income', item: 'new' | category }.
  const [editing, setEditing] = useState(null)

  return (
    <div className="page page-enter" data-page="settings" data-scroll="locked">
      <header className="page-head">
        <h1 className="page-title">Settings</h1>
      </header>

      <div className="page-scroll settings-body">
        <section className="card settings-section">
          <h2 className="panel-title">Appearance</h2>
          <div className="settings-themes" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className="chip"
                role="radio"
                aria-checked={theme === id}
                data-active={theme === id}
                onClick={() => update({ theme: id })}
              >
                <Icon aria-hidden="true" size={14} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <CategoryManager
          title="Spending categories"
          icon={FolderOpen}
          items={expenseCategories}
          kind="expense"
          emptyText="No categories yet. Add one — give it a name and a monthly limit."
          onNew={() => setEditing({ kind: 'expense', item: 'new' })}
          onEdit={(cat) => setEditing({ kind: 'expense', item: cat })}
        />

        <CategoryManager
          title="Income sources"
          icon={Wallet}
          items={incomeSources}
          kind="income"
          emptyText="No sources yet. Add one — Paycheck, Side gig, and so on."
          onNew={() => setEditing({ kind: 'income', item: 'new' })}
          onEdit={(src) => setEditing({ kind: 'income', item: src })}
        />

        <section className="card settings-section">
          <h2 className="panel-title">Account</h2>
          <div className="settings-account">
            {user?.photoURL ? (
              <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="avatar" aria-hidden="true" />
            )}
            <div className="settings-account-info">
              <strong>{user?.displayName || 'Owner'}</strong>
              <span>{user?.email}</span>
            </div>
            <button className="btn btn-danger" onClick={signOut}>
              <LogOut aria-hidden="true" size={15} />
              Sign out
            </button>
          </div>
        </section>
      </div>

      {editing && (
        <CategoryModal
          category={editing.item === 'new' ? null : editing.item}
          kind={editing.kind}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function CategoryManager({ title, icon: Icon, items, kind, emptyText, onNew, onEdit }) {
  const isIncome = kind === 'income'
  return (
    <section className="card settings-section">
      <div className="settings-section-head">
        <h2 className="panel-title">
          <Icon size={13} aria-hidden="true" />
          {title}
        </h2>
        <button className="btn btn-sm" onClick={onNew}>
          <Plus size={14} aria-hidden="true" />
          New
        </button>
      </div>

      {items.length === 0 ? (
        <p className="settings-cat-empty">{emptyText}</p>
      ) : (
        <ul className="settings-cat-list">
          {items.map((cat) => (
            <li key={cat.id}>
              <button className="settings-cat-row" onClick={() => onEdit(cat)}>
                <span
                  className="settings-cat-dot"
                  style={{ '--cat': colorHex(cat.color) }}
                  aria-hidden="true"
                />
                <span className="settings-cat-name">{cat.name}</span>
                <span className="settings-cat-meta amount">
                  {isIncome
                    ? ''
                    : cat.limitCents > 0
                      ? `${formatCents(cat.limitCents)} / mo`
                      : 'no limit'}
                </span>
                <Pencil size={14} aria-hidden="true" className="settings-cat-edit" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
