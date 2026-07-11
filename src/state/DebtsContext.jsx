// Debts being paid down.
// Firestore: users/{uid}/debts/{id} →
//   { name, startingCents (what it began at), balanceCents (what's left),
//     color (palette key), createdAt }

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const DebtsContext = createContext(null)

export function DebtsProvider({ children }) {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setDebts([])
      setLoading(true)
      return undefined
    }
    const ref = collection(db, 'users', user.uid, 'debts')
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        next.sort((a, b) => a.name.localeCompare(b.name))
        setDebts(next)
        setLoading(false)
      },
      (err) => {
        console.error('Debts listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

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
