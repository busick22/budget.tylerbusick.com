// Savings goals.
// Firestore: users/{uid}/goals/{id} →
//   { name, targetCents, savedCents, color (palette key), createdAt }

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

const GoalsContext = createContext(null)
const sortByName = (a, b) => a.name.localeCompare(b.name)

export function GoalsProvider({ children }) {
  const { user } = useAuth()
  const [goals, loading] = useUserCollection(user, 'goals', sortByName, 'Goals')

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
