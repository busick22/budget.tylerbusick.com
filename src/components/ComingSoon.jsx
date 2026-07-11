// Placeholder body for areas that haven't been built yet. Each page keeps its
// real header so the navigation and theming are testable now; this card says
// plainly what will live there.

import { Hammer } from 'lucide-react'

export default function ComingSoon({ children }) {
  return (
    <div className="card empty-state" style={{ maxWidth: 520 }}>
      <Hammer aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
