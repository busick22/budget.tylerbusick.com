// The one "month" the whole app is looking at. Dashboard, Spending, Bills and
// Income all read and write this shared value, so picking June on one tab keeps
// every tab on June until you change it. (Debt isn't month-scoped, so it opts
// out.) It's in-memory: a full page reload starts you back on today's month.

import { createContext, useContext, useMemo, useState } from 'react'
import { currentMonthKey } from '../lib/dates.js'

const MonthContext = createContext(null)

export function MonthProvider({ children }) {
  const [month, setMonth] = useState(currentMonthKey)
  const value = useMemo(() => ({ month, setMonth }), [month])
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  return useContext(MonthContext)
}
