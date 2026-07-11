// The colors a category can have. Stored by key (not hex) so we can tune the
// actual shades later without touching saved data. Every shade was picked to
// read clearly on both the dark and light themes.

export const CATEGORY_COLORS = [
  { key: 'emerald', hex: '#3ecf8e' },
  { key: 'cyan', hex: '#38cfe0' },
  { key: 'sky', hex: '#5eb2f6' },
  { key: 'violet', hex: '#8f9cf7' },
  { key: 'plum', hex: '#c688ec' },
  { key: 'rose', hex: '#f2718a' },
  { key: 'coral', hex: '#f4886a' },
  { key: 'amber', hex: '#f5b453' },
  { key: 'lime', hex: '#a8d15c' },
  { key: 'slate', hex: '#93a8b8' },
]

export function colorHex(key) {
  return CATEGORY_COLORS.find((c) => c.key === key)?.hex ?? CATEGORY_COLORS[0].hex
}

/** Pick the first color not already used, cycling if all are taken. */
export function nextFreeColor(usedKeys) {
  const free = CATEGORY_COLORS.find((c) => !usedKeys.includes(c.key))
  return (free ?? CATEGORY_COLORS[usedKeys.length % CATEGORY_COLORS.length]).key
}
