import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

export function useUserCollection(user, collectionName, sortItems, errorLabel) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(true)
      return undefined
    }

    const ref = collection(db, 'users', user.uid, collectionName)
    return onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (sortItems) next.sort(sortItems)
        setItems(next)
        setLoading(false)
      },
      (err) => {
        console.error(`${errorLabel} listener failed:`, err)
        setLoading(false)
      },
    )
  }, [collectionName, errorLabel, sortItems, user])

  return [items, loading]
}
