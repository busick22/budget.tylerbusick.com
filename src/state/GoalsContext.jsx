// Savings goals.
// Firestore: users/{uid}/goals/{id} →
//   { name, targetCents, savedCents, color (palette key), createdAt }

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

const GoalsContext = createContext(null)

export function GoalsProvider({ children }) {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setGoals([])
      setLoading(true)
      return undefined
    }
    const ref = collection(db, 'users', user.uid, 'goals')
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        next.sort((a, b) => a.name.localeCompare(b.name))
        setGoals(next)
        setLoading(false)
      },
      (err) => {
        console.error('Goals listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo(
    () => ({
      goals,
      loading,

      async addGoal({ name, targetCents, savedCents, color }) {
        const ref = collection(db, 'users', user.uid, 'goals')
        await addDoc(ref, {
          name,
          targetCents,
          savedCents: savedCents ?? 0,
          color,
          createdAt: serverTimestamp(),
        })
      },

      async updateGoal(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'goals', id), patch)
      },

      /** Positive cents = money added; negative = taken back out. */
      async addToGoal(id, deltaCents) {
        await updateDoc(doc(db, 'users', user.uid, 'goals', id), {
          savedCents: increment(deltaCents),
        })
      },

      async deleteGoal(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'goals', id))
      },
    }),
    [goals, loading, user],
  )

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoals() {
  return useContext(GoalsContext)
}
