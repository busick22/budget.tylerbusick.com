// Money helpers. Amounts are stored as WHOLE CENTS (integers) everywhere —
// adding floats like 0.1 + 0.2 drifts (0.30000000000000004), integers never do.
// Convert to dollars only at the moment of display.

/** 123456 → "$1,234.56" (negative cents → "-$12.34") */
export function formatCents(cents) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.round(cents))
  const dollars = Math.floor(abs / 100)
  const rest = String(abs % 100).padStart(2, '0')
  return `${sign}$${dollars.toLocaleString('en-US')}.${rest}`
}

/**
 * Parse what a person types into cents. Accepts "12", "12.5", "12.34",
 * "$1,234.56", " 8 ". Returns null when it isn't a usable amount.
 */
export function parseToCents(text) {
  if (typeof text !== 'string') return null
  const cleaned = text.replace(/[$,\s]/g, '')
  if (!cleaned || !/^-?\d*\.?\d{0,2}$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}

/** Cents → "12.34" for pre-filling an edit field (no $ or commas). */
export function centsToInput(cents) {
  return (cents / 100).toFixed(2)
}
