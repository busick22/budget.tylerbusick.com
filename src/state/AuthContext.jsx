// Who is signed into the app. One owner account (Firebase Auth).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase.js'

const AuthContext = createContext(null)

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'That email and password don’t match.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/user-not-found': 'No account exists for that email.',
  'auth/wrong-password': 'That password isn’t right.',
  'auth/too-many-requests': 'Too many attempts — wait a minute and try again.',
  'auth/popup-closed-by-user': 'The Google window closed before finishing.',
  'auth/popup-blocked':
    'The Google window was blocked. Allow popups for this site, then try again.',
  'auth/operation-not-allowed':
    'That sign-in method isn’t enabled in Firebase yet (Authentication → Sign-in method).',
  'auth/invalid-api-key':
    'Firebase isn’t connected yet — paste the real config into src/firebase.js (see SETUP.md).',
}

function friendlyAuthError(err) {
  return FRIENDLY_ERRORS[err?.code] || err?.message || 'Sign-in failed.'
}

const NOT_CONFIGURED = new Error(
  'Firebase isn’t connected yet — paste the real config into src/firebase.js (see SETUP.md).',
)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(isFirebaseConfigured)

  useEffect(() => {
    // With placeholder config there's nothing to listen to — skip straight to
    // the sign-in screen instead of surfacing a cryptic Firebase error.
    if (!isFirebaseConfigured) return undefined
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setInitializing(false)
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      initializing,

      async signInWithEmail(email, password) {
        if (!isFirebaseConfigured) throw NOT_CONFIGURED
        try {
          await signInWithEmailAndPassword(auth, email, password)
        } catch (err) {
          throw new Error(friendlyAuthError(err))
        }
      },

      async signInWithGoogle() {
        if (!isFirebaseConfigured) throw NOT_CONFIGURED
        try {
          await signInWithPopup(auth, new GoogleAuthProvider())
        } catch (err) {
          if (err?.code === 'auth/popup-closed-by-user') return
          // Popup blocked (embedded browsers, strict blockers): send the whole
          // page to Google instead — we land back here signed in.
          if (err?.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, new GoogleAuthProvider())
            return
          }
          throw new Error(friendlyAuthError(err))
        }
      },

      signOut() {
        return firebaseSignOut(auth)
      },
    }),
    [user, initializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
