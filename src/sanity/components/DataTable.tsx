import {useMemo, useState} from 'react'
import type {ReactNode} from 'react'
import {Flex, Text} from '@sanity/ui'
import {SortIcon} from '@sanity/icons/Sort'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DragHandleIcon} from '@sanity/icons/DragHandle'

export type DataTableColumn = {
  id: string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: DataTableRow) => ReactNode
}

export type DataTableRow = {id: string} & Record<string, unknown>

type SortState = {columnId: string; direction: 'asc' | 'desc'} | null

// A generic, reusable table for Studio tools -- not tied to any one
// dataset. Two orientations, sortable columns, and optional drag-to-
// reorder for both columns and rows.
//
// ROW orientation (default): the header is the first row. Render this
// directly in normal page flow (no bounded-height wrapper with its own
// scrollbar) -- position:sticky on the header row then sticks as the page
// scrolls THROUGH the table's own rows and releases itself automatically
// the instant the table's bottom edge scrolls past, with no extra JS
// needed for that "stick, then let go" behavior. (Contrast with
// DistributionDashboardTool.tsx's table, which deliberately wraps itself
// in its own bounded-height scroll box instead -- a different, intentional
// choice for a long single dashboard, not a mistake to copy here.)
//
// COLUMN orientation: the header is the first COLUMN instead (property
// labels running down the left side, one data row per table column) --
// for a small number of records with many fields, read top-to-bottom
// instead of left-to-right. That label column gets position:sticky; left:0
// inside its own horizontally-scrollable wrapper, so it stays visible
// while scrolling sideways on mobile.
//
// Reordering uses plain HTML5 drag-and-drop (draggable/onDragStart/
// onDragOver/onDrop) rather than a new dependency -- deliberately simple,
// no drop-indicator animation, just a same-frame reorder on drop. Row
// reordering is disabled while a sort is active (dragging rows into a
// manual order and having a sort silently override it next render would
// be confusing) -- clear the sort first.
export function DataTable({
  columns,
  rows,
  orientation = 'rows',
  reorderableColumns = false,
  reorderableRows = false,
  onReorderColumns,
  onReorderRows,
  emptyMessage = 'Nothing to show yet.',
}: {
  columns: DataTableColumn[]
  rows: DataTableRow[]
  orientation?: 'rows' | 'columns'
  reorderableColumns?: boolean
  reorderableRows?: boolean
  onReorderColumns?: (newColumnOrder: string[]) => void
  onReorderRows?: (newRowOrder: string[]) => void
  emptyMessage?: string
}) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((c) => c.id))
  const [rowOrder, setRowOrder] = useState<string[]>(() => rows.map((r) => r.id))
  const [sort, setSort] = useState<SortState>(null)
  const [dragColumnId, setDragColumnId] = useState<string | null>(null)
  const [dragRowId, setDragRowId] = useState<string | null>(null)

  // Re-derive display order from the latest columns/rows props each time,
  // falling back to prop order for anything not seen in the locally
  // tracked order yet (new data loaded, or first render).
  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]))
    const known = columnOrder.map((id) => byId.get(id)).filter((c): c is DataTableColumn => Boolean(c))
    const missing = columns.filter((c) => !columnOrder.includes(c.id))
    return [...known, ...missing]
  }, [columns, columnOrder])

  const orderedRowsBase = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.id, r]))
    const known = rowOrder.map((id) => byId.get(id)).filter((r): r is DataTableRow => Boolean(r))
    const missing = rows.filter((r) => !rowOrder.includes(r.id))
    return [...known, ...missing]
  }, [rows, rowOrder])

  const sortedRows = useMemo(() => {
    if (!sort) return orderedRowsBase
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...orderedRowsBase].sort((a, b) => {
      const av = a[sort.columnId]
      const bv = b[sort.columnId]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [orderedRowsBase, sort])

  function handleSort(columnId: string) {
    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) return {columnId, direction: 'asc'}
      if (prev.direction === 'asc') return {columnId, direction: 'desc'}
      return null
    })
  }

  function reorder(order: string[], fromId: string, toId: string): string[] {
    const next = [...order]
    const fromIdx = next.indexOf(fromId)
    const toIdx = next.indexOf(toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return order
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, fromId)
    return next
  }

  function moveColumn(fromId: string, toId: string) {
    setColumnOrder((prev) => {
      const next = reorder(prev, fromId, toId)
      if (next !== prev) onReorderColumns?.(next)
      return next
    })
  }

  function moveRow(fromId: string, toId: string) {
    setRowOrder((prev) => {
      const next = reorder(prev, fromId, toId)
      if (next !== prev) onReorderRows?.(next)
      return next
    })
  }

  const rowsAreManuallyOrdered = reorderableRows && !sort
  const cellStyle: React.CSSProperties = {padding: '8px 12px', textAlign: 'left'}

  if (rows.length === 0) {
    return (
      <Flex align="center" justify="center" padding={4}>
        <Text size={1} muted>
          {emptyMessage}
        </Text>
      </Flex>
    )
  }

  if (orientation === 'columns') {
    return (
      <div style={{overflowX: 'auto'}}>
        <table style={{borderCollapse: 'collapse', width: '100%', fontSize: '13px'}}>
          <tbody>
            {orderedColumns.map((col) => (
              <tr key={col.id} style={{borderBottom: '1px solid var(--card-border-color)'}}>
                <th
                  style={{
                    ...cellStyle,
                    position: 'sticky',
                    left: 0,
                    background: 'var(--card-bg-color)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                >
                  {col.label}
                </th>
                {sortedRows.map((row) => (
                  <td key={row.id} style={{...cellStyle, whiteSpace: 'nowrap'}}>
                    {col.render ? col.render(row) : String(row[col.id] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <table style={{borderCollapse: 'collapse', width: '100%', fontSize: '13px'}}>
      <thead>
        <tr>
          {reorderableRows && <th style={{width: 28, position: 'sticky', top: 0, background: 'var(--card-bg-color)'}} />}
          {orderedColumns.map((col) => (
            <th
              key={col.id}
              draggable={reorderableColumns}
              onDragStart={() => setDragColumnId(col.id)}
              onDragOver={(e) => reorderableColumns && e.preventDefault()}
              onDrop={() => {
                if (dragColumnId) moveColumn(dragColumnId, col.id)
                setDragColumnId(null)
              }}
              style={{
                ...cellStyle,
                position: 'sticky',
                top: 0,
                background: 'var(--card-bg-color)',
                borderBottom: '1px solid var(--card-border-color)',
                fontWeight: 500,
                cursor: reorderableColumns ? 'grab' : undefined,
                userSelect: 'none',
                width: col.width,
              }}
            >
              <Flex align="center" gap={2}>
                {reorderableColumns && <DragHandleIcon style={{opacity: 0.4, flexShrink: 0}} />}
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <span>{col.label}</span>
                    {sort?.columnId === col.id ? (
                      sort.direction === 'asc' ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      )
                    ) : (
                      <SortIcon style={{opacity: 0.3}} />
                    )}
                  </button>
                ) : (
                  <span>{col.label}</span>
                )}
              </Flex>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr
            key={row.id}
            draggable={rowsAreManuallyOrdered}
            onDragStart={() => rowsAreManuallyOrdered && setDragRowId(row.id)}
            onDragOver={(e) => rowsAreManuallyOrdered && e.preventDefault()}
            onDrop={() => {
              if (dragRowId) moveRow(dragRowId, row.id)
              setDragRowId(null)
            }}
            style={{borderBottom: '1px solid var(--card-border-color)'}}
          >
            {reorderableRows && (
              <td
                style={{
                  padding: '8px',
                  cursor: rowsAreManuallyOrdered ? 'grab' : 'not-allowed',
                  opacity: rowsAreManuallyOrdered ? 1 : 0.3,
                }}
                title={rowsAreManuallyOrdered ? 'Drag to reorder' : 'Clear the sort to reorder rows manually'}
              >
                <DragHandleIcon />
              </td>
            )}
            {orderedColumns.map((col) => (
              <td key={col.id} style={cellStyle}>
                {col.render ? col.render(row) : String(row[col.id] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
