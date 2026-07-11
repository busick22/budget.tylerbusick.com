// The owner's accounts and their balances — checking, savings, etc.
// Firestore: users/{uid}/accounts/{id} → { name, balanceCents, color, createdAt }
//
// Balances are MANUALLY maintained (a number you set from your bank), not
// computed from transactions. That's on purpose: a computed balance drifts
// from the bank's real number (fees, interest, timing), which is the classic
// budget-app frustration. Here the bank stays the source of truth; the app
// shows your income/spending activity on top.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const AccountsContext = createContext(null)

export function AccountsProvider({ children }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAccounts([])
      setLoading(true)
      return undefined
    }
    const ref = collection(db, 'users', user.uid, 'accounts')
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        next.sort((a, b) => a.name.localeCompare(b.name))
        setAccounts(next)
        setLoading(false)
      },
      (err) => {
        console.error('Accounts listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

  const totalBalance = accounts.reduce((a, acc) => a + acc.balanceCents, 0)

  const value = useMemo(
    () => ({
      accounts,
      loading,
      totalBalance,

      async addAccount({ name, balanceCents, color }) {
        const ref = collection(db, 'users', user.uid, 'accounts')
        await addDoc(ref, { name, balanceCents, color, createdAt: serverTimestamp() })
      },

      async updateAccount(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', id), patch)
      },

      async deleteAccount(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id))
      },
    }),
    [accounts, loading, totalBalance, user],
  )

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>
}

export function useAccounts() {
  return useContext(AccountsContext)
}
