// Shared modal. Closes on backdrop click or Escape.

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ onClose, children, width, label, dismissible = true }) {
  useEffect(() => {
    const onKey = (e) => {
      if (dismissible && e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismissible, onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={width ? { width } : undefined}
      >
        {dismissible && (
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
