// Owner preferences — just the theme for now. Stored in one Firestore doc
// (users/{uid}/settings/prefs) so it follows the owner across devices; the
// theme is also mirrored to localStorage so the right colors paint instantly
// on the next load, before Firestore answers.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const SettingsContext = createContext(null)

const DEFAULTS = {
  theme: 'dark', // 'dark' | 'light' | 'system'
}

function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.dataset.theme = resolved
  try {
    localStorage.setItem('budget:theme', resolved)
  } catch {
    /* ignore */
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULTS)
      applyTheme(DEFAULTS.theme)
      return undefined
    }
    const ref = doc(db, 'users', user.uid, 'settings', 'prefs')
    return onSnapshot(
      ref,
      (snap) => {
        const stored = snap.data() || {}
        setSettings({ ...DEFAULTS, ...stored })
      },
      (err) => console.error('Settings listener failed:', err),
    )
  }, [user])

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  const value = useMemo(
    () => ({
      ...settings,

      async update(patch) {
        setSettings((prev) => ({ ...prev, ...patch }))
        if (!user) return
        const ref = doc(db, 'users', user.uid, 'settings', 'prefs')
        try {
          await setDoc(ref, patch, { merge: true })
        } catch (err) {
          console.error('Saving settings failed:', err)
        }
      },
    }),
    [settings, user],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
