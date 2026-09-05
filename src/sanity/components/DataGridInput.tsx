import {Fragment, useRef, useState} from 'react'
import {set} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {useClient} from 'sanity'
import {Box, Button, Card, Checkbox, Flex, Select, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {ImageIcon} from '@sanity/icons/Image'
import {EditIcon} from '@sanity/icons/Edit'
import {urlFor} from '../lib/image'

type CellType = 'text' | 'richText' | 'checkbox' | 'select' | 'image' | 'date'

type MarkDef = {_type: 'link'; _key: string; href: string; openInSameTab: boolean}
type Span = {_type: 'span'; _key: string; text: string; marks: string[]}
type RichTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: MarkDef[]
  children: Span[]
}

type DataGridCell = {
  _key: string
  _type: 'dataGridCell'
  type: CellType
  text?: string
  richText?: RichTextBlock[]
  checked?: boolean
  selectValue?: string
  image?: {_type: 'image'; asset: {_type: 'reference'; _ref: string}}
}

type DataGridRow = {
  _key: string
  _type: 'dataGridRow'
  cells: DataGridCell[]
}

type ColumnOptionList = {_key: string; _type: 'columnOptionList'; options?: string[]}

type DataGridValue = {
  headerMode?: 'row' | 'column' | 'none'
  rows?: DataGridRow[]
  columnSelectOptions?: ColumnOptionList[]
}

const CELL_TYPE_LABELS: Record<CellType, string> = {
  text: 'Text',
  richText: 'Rich text',
  checkbox: 'Checkbox',
  select: 'Select',
  image: 'Image',
  date: 'Date',
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

function emptyCell(): DataGridCell {
  return {_key: randomKey(), _type: 'dataGridCell', type: 'text', text: ''}
}

// A small markdown-lite syntax (**bold**, _italic_, ~underline~,
// [text](url)) rather than a full contentEditable rich-text editor --
// gives real formatting without hand-rolling selection/range handling for
// a grid cell. Paragraphs still split on blank lines, same convention as
// scripts/migrate-callout-text.mjs, so migrated content (bold "From:"/
// "Why:" labels included) round-trips through this editor cleanly.
function parseMarkdownLiteParagraph(text: string): {children: Span[]; markDefs: MarkDef[]} {
  const children: Span[] = []
  const markDefs: MarkDef[] = []
  let lastIndex = 0
  const re = /\*\*(.+?)\*\*|_(.+?)_|~(.+?)~|\[(.+?)\]\(([^)]+?)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) {
      children.push({_type: 'span', _key: randomKey(), text: text.slice(lastIndex, m.index), marks: []})
    }
    if (m[1] !== undefined) {
      children.push({_type: 'span', _key: randomKey(), text: m[1], marks: ['strong']})
    } else if (m[2] !== undefined) {
      children.push({_type: 'span', _key: randomKey(), text: m[2], marks: ['em']})
    } else if (m[3] !== undefined) {
      children.push({_type: 'span', _key: randomKey(), text: m[3], marks: ['underline']})
    } else if (m[4] !== undefined) {
      const linkKey = randomKey()
      markDefs.push({_type: 'link', _key: linkKey, href: m[5], openInSameTab: false})
      children.push({_type: 'span', _key: randomKey(), text: m[4], marks: [linkKey]})
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    children.push({_type: 'span', _key: randomKey(), text: text.slice(lastIndex), marks: []})
  }
  if (children.length === 0) children.push({_type: 'span', _key: randomKey(), text: '', marks: []})
  return {children, markDefs}
}

function textToRichTextBlocks(text: string): RichTextBlock[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  const effective = paragraphs.length > 0 ? paragraphs : ['']
  return effective.map((paragraphText) => {
    const {children, markDefs} = parseMarkdownLiteParagraph(paragraphText)
    return {_type: 'block', _key: randomKey(), style: 'normal', markDefs, children}
  })
}

function serializeSpan(span: Span, markDefsByKey: Record<string, MarkDef>): string {
  const linkDef = span.marks.map((k) => markDefsByKey[k]).find((d) => d && d._type === 'link')
  if (linkDef) return `[${span.text}](${linkDef.href})`
  let text = span.text
  if (span.marks.includes('strong')) text = `**${text}**`
  if (span.marks.includes('em')) text = `_${text}_`
  if (span.marks.includes('underline')) text = `~${text}~`
  return text
}

function richTextBlocksToPlainText(blocks: RichTextBlock[] | undefined): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((b) => {
      const markDefsByKey = Object.fromEntries((b.markDefs ?? []).map((d) => [d._key, d]))
      return (b.children ?? []).map((c) => serializeSpan(c, markDefsByKey)).join('')
    })
    .join('\n\n')
}

// Wraps the current textarea selection with markdown-lite syntax (e.g.
// "text" -> "**text**") -- the toolbar buttons' only job, since the actual
// parsing happens once, on the next onChange, via parseMarkdownLiteParagraph.
function wrapSelection(el: HTMLTextAreaElement, before: string, after: string): string {
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = el.value.slice(start, end) || 'text'
  return el.value.slice(0, start) + before + selected + after + el.value.slice(end)
}

// A spreadsheet-style editor for the `dataGrid` block type
// (blockContentType.ts) -- rows are Sanity's own ordered array (drag
// reorder is free via _key), columns are NOT a stored entity, just "however
// many cells the longest row has": moving/adding/removing a column means
// touching the same index across every row's cells array in one patch.
// Every mutation (add/remove/reorder/edit) rewrites the whole `rows` array
// and patches it in one `set(...)` call -- simplest correct approach for a
// nested, reorderable, ragged-by-construction structure, and avoids
// hand-rolling per-path array patches for every possible edit shape.
export function DataGridInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const gridValue = (value ?? {}) as DataGridValue
  const rows = gridValue.rows ?? []
  const headerMode = gridValue.headerMode ?? 'row'
  const columnSelectOptions = gridValue.columnSelectOptions ?? []
  const columnCount = Math.max(1, ...rows.map((r) => r.cells.length))
  const client = useClient({apiVersion: '2026-07-22'})
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  const [dragRowKey, setDragRowKey] = useState<string | null>(null)
  const [dragColIndex, setDragColIndex] = useState<number | null>(null)
  const [dragCell, setDragCell] = useState<{rowKey: string; colIndex: number} | null>(null)
  const [editingOptionsForCol, setEditingOptionsForCol] = useState<number | null>(null)
  const [uploadingCell, setUploadingCell] = useState<string | null>(null)

  function patchRows(newRows: DataGridRow[]) {
    onChange(set(newRows, ['rows']))
  }

  function patchHeaderMode(mode: 'row' | 'column' | 'none') {
    onChange(set(mode, ['headerMode']))
  }

  function patchColumnSelectOptions(next: ColumnOptionList[]) {
    onChange(set(next, ['columnSelectOptions']))
  }

  function setColumnOptions(colIdx: number, options: string[]) {
    const next = [...columnSelectOptions]
    const existing = next[colIdx]
    next[colIdx] = {_key: existing?._key ?? randomKey(), _type: 'columnOptionList', options}
    patchColumnSelectOptions(next)
  }

  function addRow() {
    const newRow: DataGridRow = {
      _key: randomKey(),
      _type: 'dataGridRow',
      cells: Array.from({length: columnCount}, () => emptyCell()),
    }
    patchRows([...rows, newRow])
  }

  function addColumn() {
    if (rows.length === 0) return
    patchRows(rows.map((r) => ({...r, cells: [...r.cells, emptyCell()]})))
    patchColumnSelectOptions([...columnSelectOptions, {_key: randomKey(), _type: 'columnOptionList', options: []}])
  }

  function removeRow(rowKey: string) {
    patchRows(rows.filter((r) => r._key !== rowKey))
  }

  function removeColumn(colIndex: number) {
    patchRows(rows.map((r) => ({...r, cells: r.cells.filter((_, i) => i !== colIndex)})))
    patchColumnSelectOptions(columnSelectOptions.filter((_, i) => i !== colIndex))
  }

  function moveRow(fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    const fromIdx = rows.findIndex((r) => r._key === fromKey)
    const toIdx = rows.findIndex((r) => r._key === toKey)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...rows]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    patchRows(next)
  }

  function moveColumn(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    patchRows(
      rows.map((r) => {
        const cells = [...r.cells]
        const [moved] = cells.splice(fromIdx, 1)
        cells.splice(toIdx, 0, moved)
        return {...r, cells}
      })
    )
    const nextOptions = [...columnSelectOptions]
    const [movedOptions] = nextOptions.splice(fromIdx, 1)
    nextOptions.splice(toIdx, 0, movedOptions ?? {_key: randomKey(), _type: 'columnOptionList', options: []})
    patchColumnSelectOptions(nextOptions)
  }

  // Cut-and-paste a cell: swaps the two cells' content (type + whichever
  // value field goes with it), keeping each cell's own _key attached to its
  // position -- simplest sensible behavior per the brief (no shifting
  // neighbours, no relational-move semantics).
  function swapCells(a: {rowKey: string; colIndex: number}, b: {rowKey: string; colIndex: number}) {
    if (a.rowKey === b.rowKey && a.colIndex === b.colIndex) return
    const rowA = rows.find((r) => r._key === a.rowKey)
    const rowB = rows.find((r) => r._key === b.rowKey)
    const cellA = rowA?.cells[a.colIndex]
    const cellB = rowB?.cells[b.colIndex]
    if (!cellA || !cellB) return
    const payload = (c: DataGridCell) => ({
      type: c.type,
      text: c.text,
      richText: c.richText,
      checked: c.checked,
      selectValue: c.selectValue,
      image: c.image,
    })
    const payloadA = payload(cellA)
    const payloadB = payload(cellB)
    patchRows(
      rows.map((r) => {
        if (r._key === a.rowKey && r._key === b.rowKey) {
          const cells = [...r.cells]
          cells[a.colIndex] = {...cells[a.colIndex], ...payloadB}
          cells[b.colIndex] = {...cells[b.colIndex], ...payloadA}
          return {...r, cells}
        }
        if (r._key === a.rowKey) {
          const cells = [...r.cells]
          cells[a.colIndex] = {...cells[a.colIndex], ...payloadB}
          return {...r, cells}
        }
        if (r._key === b.rowKey) {
          const cells = [...r.cells]
          cells[b.colIndex] = {...cells[b.colIndex], ...payloadA}
          return {...r, cells}
        }
        return r
      })
    )
  }

  function updateCell(rowKey: string, colIndex: number, patchFn: (cell: DataGridCell) => DataGridCell) {
    patchRows(
      rows.map((r) => (r._key !== rowKey ? r : {...r, cells: r.cells.map((c, i) => (i !== colIndex ? c : patchFn(c)))}))
    )
  }

  async function handleImageUpload(rowKey: string, colIndex: number, file: File) {
    const cellId = `${rowKey}:${colIndex}`
    setUploadingCell(cellId)
    try {
      const uploaded = await client.assets.upload('image', file, {filename: file.name})
      updateCell(rowKey, colIndex, (c) => ({...c, image: {_type: 'image', asset: {_type: 'reference', _ref: uploaded._id}}}))
    } finally {
      setUploadingCell((prev) => (prev === cellId ? null : prev))
    }
  }

  function isHeaderCell(rowIdx: number, colIdx: number) {
    if (headerMode === 'row') return rowIdx === 0
    if (headerMode === 'column') return colIdx === 0
    return false
  }

  function applyMark(rowKey: string, colIdx: number, cellId: string, before: string, after: string) {
    const el = textareaRefs.current[cellId]
    if (!el) return
    const newText = wrapSelection(el, before, after)
    updateCell(rowKey, colIdx, (c) => ({...c, richText: textToRichTextBlocks(newText)}))
  }

  return (
    <Stack space={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Flex align="center" gap={2}>
          <Text size={1} muted>
            Header:
          </Text>
          <Select
            fontSize={1}
            padding={2}
            value={headerMode}
            onChange={(e) => patchHeaderMode(e.currentTarget.value as 'row' | 'column' | 'none')}
          >
            <option value="row">First row</option>
            <option value="column">First column</option>
            <option value="none">None</option>
          </Select>
        </Flex>
        <Button icon={AddIcon} text="Add row" mode="ghost" fontSize={1} onClick={addRow} />
        <Button icon={AddIcon} text="Add column" mode="ghost" fontSize={1} onClick={addColumn} disabled={rows.length === 0} />
      </Flex>

      {rows.length === 0 ? (
        <Card padding={4} radius={2} border tone="transparent">
          <Text size={1} muted>
            No rows yet -- add one to start.
          </Text>
        </Card>
      ) : (
        // Bounded height with its own scroll, header row pinned to the top
        // of THIS box (not the page) -- a 30+ row grid used to push the
        // horizontal scrollbar to the very bottom of the page, unreachable
        // without scrolling past everything first.
        <Box style={{overflow: 'auto', maxHeight: '65vh', border: '1px solid var(--card-border-color)', borderRadius: 4}}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `24px repeat(${columnCount}, minmax(160px, 1fr))`,
              gap: 1,
              minWidth: columnCount * 160 + 24,
            }}
          >
            {/* Column drag handles + delete row, top-left corner blank */}
            <div style={{position: 'sticky', top: 0, zIndex: 2, background: 'var(--card-bg-color)'}} />
            {Array.from({length: columnCount}).map((_, colIdx) => (
              <div
                key={`col-${colIdx}`}
                draggable
                onDragStart={() => setDragColIndex(colIdx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragColIndex !== null) moveColumn(dragColIndex, colIdx)
                  setDragColIndex(null)
                }}
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  cursor: 'grab',
                  userSelect: 'none',
                  background: 'var(--card-bg-color)',
                  borderBottom: '1px solid var(--card-border-color)',
                }}
                title="Drag to reorder column"
              >
                <DragHandleIcon style={{opacity: 0.4}} />
                <Flex gap={1}>
                  <button
                    type="button"
                    onClick={() => setEditingOptionsForCol(colIdx)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5}}
                    title="Edit this column's Select options"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeColumn(colIdx)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5}}
                    title="Delete column"
                  >
                    <TrashIcon />
                  </button>
                </Flex>
              </div>
            ))}

            {editingOptionsForCol !== null && (
              <div style={{gridColumn: `2 / span ${columnCount}`, padding: '6px 8px', background: 'var(--card-bg-color)'}}>
                <TextInput
                  fontSize={0}
                  radius={1}
                  placeholder="Comma-separated options for this column's Select cells"
                  defaultValue={(columnSelectOptions[editingOptionsForCol]?.options ?? []).join(', ')}
                  onBlur={(e) => {
                    const options = e.currentTarget.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    setColumnOptions(editingOptionsForCol, options)
                    setEditingOptionsForCol(null)
                  }}
                  autoFocus
                />
              </div>
            )}

            {rows.map((row, rowIdx) => (
              <Fragment key={row._key}>
                <div
                  draggable
                  onDragStart={() => setDragRowKey(row._key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragRowKey) moveRow(dragRowKey, row._key)
                    setDragRowKey(null)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    gap: 4,
                  }}
                  title="Drag to reorder row"
                >
                  <DragHandleIcon style={{opacity: 0.4}} />
                  <button
                    type="button"
                    onClick={() => removeRow(row._key)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.5}}
                    title="Delete row"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {Array.from({length: columnCount}).map((_, colIdx) => {
                  const cell = row.cells[colIdx]
                  const cellId = `${row._key}:${colIdx}`
                  const header = isHeaderCell(rowIdx, colIdx)
                  if (!cell) {
                    return <div key={`empty-${cellId}`} />
                  }
                  return (
                    <Card
                      key={cellId}
                      padding={2}
                      radius={1}
                      tone={header ? 'transparent' : undefined}
                      style={{
                        background: header ? 'var(--card-muted-bg-color, rgba(150,150,150,0.08))' : undefined,
                        fontWeight: header ? 600 : undefined,
                      }}
                      draggable
                      onDragStart={() => setDragCell({rowKey: row._key, colIndex: colIdx})}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragCell) swapCells(dragCell, {rowKey: row._key, colIndex: colIdx})
                        setDragCell(null)
                      }}
                    >
                      <Stack space={2}>
                        <select
                          value={cell.type}
                          onChange={(e) => updateCell(row._key, colIdx, (c) => ({...c, type: e.currentTarget.value as CellType}))}
                          style={{fontSize: 10, opacity: 0.6, border: 'none', background: 'none', cursor: 'pointer', padding: 0}}
                        >
                          {(Object.keys(CELL_TYPE_LABELS) as CellType[]).map((t) => (
                            <option key={t} value={t}>
                              {CELL_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>

                        {cell.type === 'text' && (
                          <TextInput
                            fontSize={1}
                            radius={1}
                            value={cell.text ?? ''}
                            onChange={(e) => {
                              const text = e.currentTarget.value
                              updateCell(row._key, colIdx, (c) => ({...c, text}))
                            }}
                          />
                        )}

                        {cell.type === 'date' && (
                          <input
                            type="date"
                            value={cell.text ?? ''}
                            onChange={(e) => {
                              const text = e.currentTarget.value
                              updateCell(row._key, colIdx, (c) => ({...c, text}))
                            }}
                            style={{fontSize: 12, width: '100%'}}
                          />
                        )}

                        {cell.type === 'richText' && (
                          <Stack space={1}>
                            <Flex gap={1}>
                              <button
                                type="button"
                                title="Bold"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyMark(row._key, colIdx, cellId, '**', '**')}
                                style={{fontWeight: 700, fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px'}}
                              >
                                B
                              </button>
                              <button
                                type="button"
                                title="Italic"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyMark(row._key, colIdx, cellId, '_', '_')}
                                style={{fontStyle: 'italic', fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px'}}
                              >
                                I
                              </button>
                              <button
                                type="button"
                                title="Underline"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyMark(row._key, colIdx, cellId, '~', '~')}
                                style={{textDecoration: 'underline', fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px'}}
                              >
                                U
                              </button>
                              <button
                                type="button"
                                title="Link"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  const url = window.prompt('Link URL:', 'https://')
                                  if (url) applyMark(row._key, colIdx, cellId, '[', `](${url})`)
                                }}
                                style={{fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px'}}
                              >
                                Link
                              </button>
                            </Flex>
                            <TextArea
                              ref={(el: HTMLTextAreaElement | null) => {
                                textareaRefs.current[cellId] = el
                              }}
                              fontSize={1}
                              radius={1}
                              rows={3}
                              value={richTextBlocksToPlainText(cell.richText)}
                              onChange={(e) => {
                                const text = e.currentTarget.value
                                updateCell(row._key, colIdx, (c) => ({...c, richText: textToRichTextBlocks(text)}))
                              }}
                            />
                          </Stack>
                        )}

                        {cell.type === 'checkbox' && (
                          <Checkbox
                            checked={!!cell.checked}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked
                              updateCell(row._key, colIdx, (c) => ({...c, checked}))
                            }}
                          />
                        )}

                        {cell.type === 'select' && (
                          <Select
                            fontSize={1}
                            padding={2}
                            value={cell.selectValue ?? ''}
                            onChange={(e) => {
                              const selectValue = e.currentTarget.value
                              updateCell(row._key, colIdx, (c) => ({...c, selectValue}))
                            }}
                          >
                            <option value="">--</option>
                            {(columnSelectOptions[colIdx]?.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </Select>
                        )}

                        {cell.type === 'image' && (
                          <Stack space={2}>
                            {cell.image?.asset?._ref ? (
                              <img
                                src={urlFor(cell.image).width(160).url()}
                                alt=""
                                style={{width: '100%', borderRadius: 3, display: 'block'}}
                              />
                            ) : (
                              <Flex align="center" justify="center" style={{height: 48, opacity: 0.3}}>
                                <ImageIcon />
                              </Flex>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingCell === cellId}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(row._key, colIdx, file)
                                e.target.value = ''
                              }}
                              style={{fontSize: 10}}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </Box>
      )}
    </Stack>
  )
}
