// Debts being paid down.
// Firestore: users/{uid}/debts/{id} →
//   { name, startingCents (what it began at), balanceCents (what's left),
//     color (palette key), createdAt }

import { createContext, useContext, useMemo } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { useUserCollection } from './useUserCollection.js'

const DebtsContext = createContext(null)
const sortByName = (a, b) => a.name.localeCompare(b.name)

export function DebtsProvider({ children }) {
  const { user } = useAuth()
  const [debts, loading] = useUserCollection(user, 'debts', sortByName, 'Debts')

  const value = useMemo(
    () => ({
      debts,
      loading,

      async addDebt({ name, startingCents, balanceCents, color }) {
        const ref = collection(db, 'users', user.uid, 'debts')
        await addDoc(ref, {
          name,
          startingCents,
          balanceCents,
          color,
          createdAt: serverTimestamp(),
        })
      },

      async updateDebt(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'debts', id), patch)
      },

      /** A payment shrinks the balance (never below zero — callers check). */
      async recordPayment(id, paymentCents) {
        await updateDoc(doc(db, 'users', user.uid, 'debts', id), {
          balanceCents: increment(-paymentCents),
        })
      },

      async deleteDebt(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'debts', id))
      },
    }),
    [debts, loading, user],
  )

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>
}

export function useDebts() {
  return useContext(DebtsContext)
}
