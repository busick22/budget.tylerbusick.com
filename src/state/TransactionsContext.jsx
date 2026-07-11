// Every transaction the owner has recorded.
// Firestore: users/{uid}/transactions/{id} →
//   { date ('YYYY-MM-DD'), description, amountCents (positive = money out),
//     categoryId (may be null or point at a deleted category), note, createdAt }
//
// One person's budget stays small (a few thousand rows over years), so we
// subscribe to the whole collection once and filter by month in memory —
// simpler and snappier than juggling per-month queries.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'

const TransactionsContext = createContext(null)

export function TransactionsProvider({ children }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setLoading(true)
      return undefined
    }
    const ref = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
    )
    return onSnapshot(
      ref,
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Transactions listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo(
    () => ({
      transactions,
      loading,

      /** All transactions inside one 'YYYY-MM' month, newest first. */
      forMonth(monthKey) {
        return transactions.filter((t) => t.date.startsWith(monthKey))
      },

      /** Cents spent per category id for a month: { catId: cents, ... } */
      spentByCategory(monthKey) {
        const totals = {}
        for (const t of transactions) {
          if (!t.date.startsWith(monthKey)) continue
          const key = t.categoryId ?? 'uncategorized'
          totals[key] = (totals[key] ?? 0) + t.amountCents
        }
        return totals
      },

      async addTransaction({ date, description, amountCents, categoryId, note }) {
        const ref = collection(db, 'users', user.uid, 'transactions')
        await addDoc(ref, {
          date,
          description,
          amountCents,
          categoryId: categoryId ?? null,
          note: note ?? '',
          createdAt: serverTimestamp(),
        })
      },

      async updateTransaction(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'transactions', id), patch)
      },

      async deleteTransaction(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
      },
    }),
    [transactions, loading, user],
  )

  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  )
}

export function useTransactions() {
  return useContext(TransactionsContext)
}
