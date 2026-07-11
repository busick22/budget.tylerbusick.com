import { Moon, Sun, MonitorSmartphone, LogOut } from 'lucide-react'
import { useAuth } from '../../state/AuthContext.jsx'
import { useSettings } from '../../state/SettingsContext.jsx'
import './settings.css'

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: MonitorSmartphone },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, update } = useSettings()

  return (
    <div className="page page-enter" data-page="settings">
      <header className="page-head">
        <h1 className="page-title">
          Settings
          <small>Appearance and account</small>
        </h1>
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
    </div>
  )
}
