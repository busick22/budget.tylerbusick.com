// The owner's spending categories, each with a monthly limit.
// Firestore: users/{uid}/categories/{id} →
//   { name, limitCents (0 = just track, no limit), color (palette key), createdAt }

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

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCategories([])
      setLoading(true)
      return undefined
    }
    const ref = collection(db, 'users', user.uid, 'categories')
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        next.sort((a, b) => a.name.localeCompare(b.name))
        setCategories(next)
        setLoading(false)
      },
      (err) => {
        console.error('Categories listener failed:', err)
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo(
    () => ({
      categories,
      loading,

      byId(id) {
        return categories.find((c) => c.id === id) ?? null
      },

      async addCategory({ name, limitCents, color }) {
        const ref = collection(db, 'users', user.uid, 'categories')
        await addDoc(ref, { name, limitCents, color, createdAt: serverTimestamp() })
      },

      async updateCategory(id, patch) {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), patch)
      },

      async deleteCategory(id) {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id))
      },
    }),
    [categories, loading, user],
  )

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}

export function useCategories() {
  return useContext(CategoriesContext)
}
