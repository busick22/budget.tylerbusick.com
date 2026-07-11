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
  writeBatch,
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

      /** All transactions inside one 'YYYY-MM' month, newest first. A missing
       *  `type` predates income support → treat as an expense. */
      forMonth(monthKey) {
        return transactions.filter((t) => t.date.startsWith(monthKey))
      },

      /** Cents SPENT per category id for a month — expenses only, so income
       *  never inflates a spending gauge. { catId: cents, ... } */
      spentByCategory(monthKey) {
        const totals = {}
        for (const t of transactions) {
          if (!t.date.startsWith(monthKey)) continue
          if ((t.type ?? 'expense') === 'income') continue
          const key = t.categoryId ?? 'uncategorized'
          totals[key] = (totals[key] ?? 0) + t.amountCents
        }
        return totals
      },

      /** Cents of INCOME per source id for a month: { sourceId: cents, ... }.
       *  Income with no source is bucketed under 'unassigned'. */
      incomeBySource(monthKey) {
        const totals = {}
        for (const t of transactions) {
          if (!t.date.startsWith(monthKey)) continue
          if ((t.type ?? 'expense') !== 'income') continue
          const key = t.categoryId ?? 'unassigned'
          totals[key] = (totals[key] ?? 0) + t.amountCents
        }
        return totals
      },

      async addTransaction({ date, description, amountCents, categoryId, note, type }) {
        const ref = collection(db, 'users', user.uid, 'transactions')
        await addDoc(ref, {
          date,
          description,
          amountCents,
          categoryId: categoryId ?? null,
          note: note ?? '',
          type: type ?? 'expense',
          createdAt: serverTimestamp(),
        })
      },

      async updateTransaction(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'transactions', id), patch)
      },

      async deleteTransaction(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
      },

      // Bulk actions for the Spending page's select mode. Firestore batches
      // cap at 500 writes, so we chunk — though one person's selections stay
      // well under that. Live listeners refresh the UI once the batch commits.
      async deleteMany(ids) {
        for (let i = 0; i < ids.length; i += 450) {
          const batch = writeBatch(db)
          for (const id of ids.slice(i, i + 450)) {
            batch.delete(doc(db, 'users', user.uid, 'transactions', id))
          }
          await batch.commit()
        }
      },

      async setCategoryMany(ids, categoryId) {
        for (let i = 0; i < ids.length; i += 450) {
          const batch = writeBatch(db)
          for (const id of ids.slice(i, i + 450)) {
            batch.update(doc(db, 'users', user.uid, 'transactions', id), { categoryId })
          }
          await batch.commit()
        }
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
