// Date helpers. Two plain-string shapes rule the app:
//   a "day"   is 'YYYY-MM-DD'  (how transactions store their date)
//   a "month" is 'YYYY-MM'     (what the dashboard and spending pages show)
// Strings compare correctly in date order, so no Date-object math is needed
// for filtering — startsWith(month) is enough.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Today as 'YYYY-MM-DD' in the device's own timezone. */
export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The current month as 'YYYY-MM'. */
export function currentMonthKey() {
  return todayKey().slice(0, 7)
}

/** 'YYYY-MM' ± n months → 'YYYY-MM'. */
export function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return `${year}-${pad(month)}`
}

/** '2026-07' → "July 2026". */
export function formatMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/** '2026-07-10' → "Thu, Jul 10" (or "Thu, Jul 10, 2025" if not this year). */
export function formatDay(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const opts = { weekday: 'short', month: 'short', day: 'numeric' }
  if (y !== new Date().getFullYear()) opts.year = 'numeric'
  return date.toLocaleDateString('en-US', opts)
}

function pad(n) {
  return String(n).padStart(2, '0')
}
