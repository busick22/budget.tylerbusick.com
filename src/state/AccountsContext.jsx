// The owner's accounts and their balances — checking, savings, etc.
// Firestore: users/{uid}/accounts/{id} → { name, balanceCents, color, createdAt }
//
// Balances are MANUALLY maintained (a number you set from your bank), not
// computed from transactions. That's on purpose: a computed balance drifts
// from the bank's real number (fees, interest, timing), which is the classic
// budget-app frustration. Here the bank stays the source of truth; the app
// shows your income/spending activity on top.

import { createContext, useContext, useMemo } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { useUserCollection } from './useUserCollection.js'

const AccountsContext = createContext(null)
const sortByName = (a, b) => a.name.localeCompare(b.name)

export function AccountsProvider({ children }) {
  const { user } = useAuth()
  const [accounts, loading] = useUserCollection(user, 'accounts', sortByName, 'Accounts')

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
