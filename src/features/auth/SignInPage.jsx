import { useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'
import { BrandMark } from '../../app/Brand.jsx'
import { isFirebaseConfigured } from '../../firebase.js'
import './auth.css'

export default function SignInPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    run(() => signInWithEmail(email, password))
  }

  return (
    <div className="signin">
      <div className="signin-scene" aria-hidden="true" />

      <div className="signin-card page-enter">
        <div className="signin-brand">
          <BrandMark size={40} />
          <h1>Budget</h1>
          <p>Your money, in one place.</p>
        </div>

        {!isFirebaseConfigured && (
          <p className="signin-setup-note">
            Waiting on Firebase — paste the project config into{' '}
            <code>src/firebase.js</code> (steps in SETUP.md), then reload.
          </p>
        )}

        <form onSubmit={onSubmit} className="signin-form">
          <label className="field-label" htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className="field-label" htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="error-note">{error}</p>}

          <button className="btn btn-primary signin-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="signin-divider" role="presentation">
          <span>or</span>
        </div>

        <button
          className="btn signin-google"
          onClick={() => run(signInWithGoogle)}
          disabled={busy}
        >
          <GoogleGlyph />
          Continue with Google
        </button>

        <p className="signin-foot">Private workspace · one owner</p>
      </div>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17C3.1 21.1 7.2 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.2 6.7C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c2.3 0 3.8 1 4.7 1.8L20 3.2C18 1.2 15.2 0 12 0 7.2 0 3.1 2.9 1.2 6.7l3.9 3c.9-2.9 3.7-5 6.9-5z"
      />
    </svg>
  )
}
