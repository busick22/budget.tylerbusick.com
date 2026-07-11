// The Budget mark: a gauge ring, three-quarters spent.

export function BrandMark({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-dashboard)" />
          <stop offset="1" stopColor="var(--accent-goals)" />
        </linearGradient>
      </defs>
      <path
        d="M 32 12 A 20 20 0 1 1 12 32"
        fill="none"
        stroke="url(#brand-g)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="5" fill="url(#brand-g)" />
    </svg>
  )
}

export function BrandWordmark() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.05rem',
        letterSpacing: '0.01em',
      }}
    >
      Budget
    </span>
  )
}
