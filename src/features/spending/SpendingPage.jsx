// Every transaction for the shown month. Two ways to look at it: by day
// (default) or by category — plus a filter to isolate one category so
// miscategorizations are easy to spot.
//
// "Select" mode turns the rows into checkboxes for bulk work: pick many, then
// set them all to a category at once, or delete them (with a confirm). Handy
// for cleaning up a whole imported batch.
//
// The Dashboard can send you here pre-filtered to a category (or to
// Uncategorized) via router state — that's the "drill into this gauge" flow.

import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Receipt, Sparkles, CalendarDays, Tag, ListChecks, Check } from 'lucide-react'
import MonthSwitcher from '../../components/MonthSwitcher.jsx'
import TransactionModal from './TransactionModal.jsx'
import ImportModal from './ImportModal.jsx'
import { useCategories } from '../../state/CategoriesContext.jsx'
import { useTransactions } from '../../state/TransactionsContext.jsx'
import { currentMonthKey, formatDay, todayKey } from '../../lib/dates.js'
import { formatCents } from '../../lib/money.js'
import { colorHex } from '../../lib/palette.js'
import './spending.css'

const UNCATEGORIZED = 'uncategorized'

export default function SpendingPage() {
  const { categories, byId } = useCategories()
  const { forMonth, deleteMany, setCategoryMany } = useTransactions()
  const location = useLocation()

  // A drill-in from the Dashboard arrives with { categoryId, month } in state.
  const [month, setMonth] = useState(location.state?.month ?? currentMonthKey())
  const [filterCat, setFilterCat] = useState(location.state?.categoryId ?? 'all')
  const [viewMode, setViewMode] = useState('day') // 'day' | 'category'
  const [editing, setEditing] = useState(null) // null | 'new' | transaction object
  const [importing, setImporting] = useState(false)

  // Select mode.
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const monthTx = useMemo(() => forMonth(month), [forMonth, month])

  const filtered = useMemo(() => {
    if (filterCat === 'all') return monthTx
    if (filterCat === UNCATEGORIZED) return monthTx.filter((t) => !t.categoryId)
    return monthTx.filter((t) => t.categoryId === filterCat)
  }, [monthTx, filterCat])

  const filteredTotal = filtered.reduce((a, t) => a + t.amountCents, 0)

  // By-day groups (newest day first — context already sorts newest-first).
  const days = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date).push(t)
    }
    return [...map.entries()]
  }, [filtered])

  // By-category groups (alphabetical; Uncategorized last so it stands out).
  const catGroups = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      const key = t.categoryId ?? UNCATEGORIZED
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    const groups = [...map.entries()].map(([key, list]) => ({
      key,
      category: key === UNCATEGORIZED ? null : byId(key),
      list,
      total: list.reduce((a, t) => a + t.amountCents, 0),
    }))
    groups.sort((a, b) => {
      if (a.key === UNCATEGORIZED) return 1
      if (b.key === UNCATEGORIZED) return -1
      return (a.category?.name ?? '').localeCompare(b.category?.name ?? '')
    })
    return groups
  }, [filtered, byId])

  // "Add" inside a past/future month should default to that month, not today.
  const defaultDate = month === currentMonthKey() ? todayKey() : `${month}-01`

  const filterName =
    filterCat === 'all'
      ? null
      : filterCat === UNCATEGORIZED
        ? 'Uncategorized'
        : (byId(filterCat)?.name ?? 'Category')

  // --- Selection helpers ---
  const filteredIds = filtered.map((t) => t.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))

  function toggleSelect(id) {
    setConfirmDelete(false)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setConfirmDelete(false)
    setSelectedIds(allSelected ? new Set() : new Set(filteredIds))
  }

  function exitSelect() {
    setSelecting(false)
    setSelectedIds(new Set())
    setConfirmDelete(false)
  }

  async function applyCategory(value) {
    if (!value || selectedIds.size === 0) return
    setBusy(true)
    try {
      await setCategoryMany([...selectedIds], value === UNCATEGORIZED ? null : value)
      // Stay in select mode with a fresh selection — the just-fixed rows drop
      // out of an Uncategorized filter on their own, so cleanup keeps flowing.
      setSelectedIds(new Set())
    } finally {
      setBusy(false)
    }
  }

  async function onDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBusy(true)
    try {
      await deleteMany([...selectedIds])
      setSelectedIds(new Set())
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page-enter" data-page="spending" data-scroll="locked">
      <header className="page-head">
        <h1 className="page-title">
          Spending
          <small>
            {monthTx.length === 0 ? (
              'No transactions this month'
            ) : (
              <>
                {filterName ? `${filterName}: ` : ''}
                {filtered.length} transaction{filtered.length === 1 ? '' : 's'} ·{' '}
                <span className="amount">{formatCents(filteredTotal)}</span>
              </>
            )}
          </small>
        </h1>
        <div className="spend-head-actions">
          <MonthSwitcher month={month} onChange={setMonth} />
          <button className="btn" onClick={() => setImporting(true)} title="Load or categorize a statement">
            <Sparkles size={15} aria-hidden="true" />
            Import
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
        </div>
      </header>

      {monthTx.length > 0 && (
        <div className="spend-toolbar">
          <div className="spend-viewtoggle" role="group" aria-label="Group transactions by">
            <button data-active={viewMode === 'day'} onClick={() => setViewMode('day')}>
              <CalendarDays size={14} aria-hidden="true" />
              By day
            </button>
            <button data-active={viewMode === 'category'} onClick={() => setViewMode('category')}>
              <Tag size={14} aria-hidden="true" />
              By category
            </button>
          </div>
          <div className="spend-toolbar-right">
            {!selecting && (
              <button className="btn" onClick={() => setSelecting(true)}>
                <ListChecks size={15} aria-hidden="true" />
                Select
              </button>
            )}
            <select
              className="field spend-filter"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              <option value={UNCATEGORIZED}>Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="page-scroll">
        {monthTx.length === 0 ? (
          <div className="empty-state">
            <Receipt aria-hidden="true" />
            <p>
              Nothing recorded for this month yet. Add what you spend and the
              dashboard gauges fill in as you go.
            </p>
            <button className="btn" onClick={() => setEditing('new')}>
              <Plus size={15} aria-hidden="true" />
              Add a transaction
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Receipt aria-hidden="true" />
            <p>Nothing in {filterName} this month.</p>
            <button className="btn" onClick={() => setFilterCat('all')}>
              Show all categories
            </button>
          </div>
        ) : viewMode === 'day' ? (
          days.map(([day, list]) => (
            <section key={day} className="spend-day">
              <h2 className="panel-title">{formatDay(day)}</h2>
              <div className="card spend-list">
                {list.map((t) => (
                  <TxRow
                    key={t.id}
                    tx={t}
                    category={byId(t.categoryId)}
                    selecting={selecting}
                    selected={selectedIds.has(t.id)}
                    onSelect={() => toggleSelect(t.id)}
                    onEdit={() => setEditing(t)}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          catGroups.map((group) => (
            <section key={group.key} className="spend-day">
              <h2 className="panel-title spend-cat-head">
                <span
                  className="spend-cat-dot"
                  style={{ '--cat': group.category ? colorHex(group.category.color) : 'var(--text-dim)' }}
                  aria-hidden="true"
                />
                {group.category?.name ?? 'Uncategorized'}
                <span className="spend-cat-total amount">{formatCents(group.total)}</span>
              </h2>
              <div className="card spend-list">
                {group.list.map((t) => (
                  <TxRow
                    key={t.id}
                    tx={t}
                    category={group.category}
                    selecting={selecting}
                    selected={selectedIds.has(t.id)}
                    onSelect={() => toggleSelect(t.id)}
                    onEdit={() => setEditing(t)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selecting && (
        <div className="spend-selectbar" role="toolbar" aria-label="Bulk actions">
          <span className="spend-selectbar-count">{selectedIds.size} selected</span>
          <button className="btn btn-ghost" onClick={toggleSelectAll} disabled={busy}>
            {allSelected ? 'Clear' : 'Select all'}
          </button>
          <select
            className="field spend-selectbar-cat"
            value=""
            onChange={(e) => applyCategory(e.target.value)}
            disabled={busy || selectedIds.size === 0}
            aria-label="Set category for selected"
          >
            <option value="" disabled>
              Set category…
            </option>
            <option value={UNCATEGORIZED}>Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-danger"
            onClick={onDeleteClick}
            disabled={busy || selectedIds.size === 0}
          >
            {confirmDelete ? `Delete ${selectedIds.size}?` : 'Delete'}
          </button>
          <button className="btn" onClick={exitSelect} disabled={busy}>
            Done
          </button>
        </div>
      )}

      {editing && (
        <TransactionModal
          transaction={editing === 'new' ? null : editing}
          defaultDate={defaultDate}
          onClose={() => setEditing(null)}
        />
      )}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
    </div>
  )
}

function TxRow({ tx, category, selecting, selected, onSelect, onEdit }) {
  return (
    <button
      className="spend-row"
      data-selecting={selecting}
      data-selected={selected}
      onClick={selecting ? onSelect : onEdit}
    >
      {selecting && (
        <span className="spend-row-check" aria-hidden="true">
          {selected && <Check size={13} />}
        </span>
      )}
      <span
        className="spend-row-dot"
        style={{ '--cat': category ? colorHex(category.color) : 'var(--text-dim)' }}
        aria-hidden="true"
      />
      <span className="spend-row-main">
        <span className="spend-row-desc">{tx.description}</span>
        <span className="spend-row-meta">
          {category?.name ?? 'Uncategorized'}
          {tx.note ? ` · ${tx.note}` : ''}
        </span>
      </span>
      <span className="spend-row-amount amount">{formatCents(tx.amountCents)}</span>
    </button>
  )
}
