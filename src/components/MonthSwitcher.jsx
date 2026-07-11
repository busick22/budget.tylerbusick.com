// ‹ July 2026 › — steps the shown month back and forth. Clicking the label
// jumps back to the current month.

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonth, shiftMonth } from '../lib/dates.js'

export default function MonthSwitcher({ month, onChange }) {
  const isCurrent = month === currentMonthKey()
  return (
    <div className="monthswitcher">
      <button
        className="icon-btn"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft size={17} />
      </button>
      <button
        className="monthswitcher-label"
        onClick={() => onChange(currentMonthKey())}
        title={isCurrent ? undefined : 'Jump to this month'}
        data-current={isCurrent}
      >
        {formatMonth(month)}
      </button>
      <button
        className="icon-btn"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  )
}
