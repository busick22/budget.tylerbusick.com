// Recurring monthly bills & subscriptions.
// Firestore: users/{uid}/bills/{id} →
//   { name, amountCents, dueDay (1–31), note, paidMonths: ['2026-07', ...], createdAt }
// "Paid" is tracked per month by pushing the month key into paidMonths.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const BillsContext = createContext(null)

export function BillsProvider({ children }) {
  const { user } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setBills([])
      setLoading(true)
      return undefined
    }
    const ref = collection(db, 'users', user.uid, 'bills')
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        next.sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name))
        setBills(next)
        setLoading(false)
      },
      (err) => {
        console.error('Bills listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo(
    () => ({
      bills,
      loading,

      async addBill({ name, amountCents, dueDay, note }) {
        const ref = collection(db, 'users', user.uid, 'bills')
        await addDoc(ref, {
          name,
          amountCents,
          dueDay,
          note: note ?? '',
          paidMonths: [],
          createdAt: serverTimestamp(),
        })
      },

      async updateBill(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'bills', id), patch)
      },

      async setPaid(id, monthKey, paid) {
        await updateDoc(doc(db, 'users', user.uid, 'bills', id), {
          paidMonths: paid ? arrayUnion(monthKey) : arrayRemove(monthKey),
        })
      },

      async deleteBill(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'bills', id))
      },
    }),
    [bills, loading, user],
  )

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>
}

export function useBills() {
  return useContext(BillsContext)
}
