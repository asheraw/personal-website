import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {useClient} from 'sanity'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'

type Status = 'pending' | 'ignored' | 'actioned'
type Source = 'error' | 'unhandledrejection' | 'render'
type Occurrence = {timestamp: string; path?: string; userAgent?: string}
type ErrorRow = {
  _id: string
  message: string
  source?: Source
  stack?: string
  occurrenceCount: number
  firstSeenAt: string
  lastSeenAt: string
  status?: Status
  resolutionNote?: string
  occurrences: Occurrence[]
}

const STATUS_OPTIONS: {value: Status; label: string}[] = [
  {value: 'pending', label: 'Pending'},
  {value: 'ignored', label: 'Ignored'},
  {value: 'actioned', label: 'Fixed'},
]

const SOURCE_LABELS: Record<Source, string> = {
  error: 'Uncaught script error',
  unhandledrejection: 'Unhandled promise rejection',
  render: 'React render error',
}

const SECTIONS: {
  status: Status
  title: string
  emptyLabel: string
  cardTone: 'caution' | 'transparent' | 'positive'
  badgeTone: 'caution' | 'default' | 'positive'
}[] = [
  {status: 'pending', title: 'Pending', emptyLabel: 'Nothing pending.', cardTone: 'caution', badgeTone: 'caution'},
  {status: 'ignored', title: 'Ignored', emptyLabel: 'Nothing ignored yet.', cardTone: 'transparent', badgeTone: 'default'},
  {status: 'actioned', title: 'Fixed', emptyLabel: 'Nothing marked fixed yet.', cardTone: 'positive', badgeTone: 'positive'},
]

function ErrorRowCard({
  row,
  isExpanded,
  onToggleExpanded,
  busy,
  onSetStatus,
  onSaveNote,
  tone,
}: {
  row: ErrorRow
  isExpanded: boolean
  onToggleExpanded: () => void
  busy: boolean
  onSetStatus: (status: Status) => void
  onSaveNote: (note: string) => void
  tone: 'caution' | 'transparent' | 'positive'
}) {
  // Local draft, not written back on every keystroke -- saved once when the
  // textarea loses focus, same "edit freely, commit on blur" pattern as
  // other Studio tools here rather than a separate Edit/Save toggle for
  // what's usually a couple of sentences.
  const [noteDraft, setNoteDraft] = useState(row.resolutionNote ?? '')
  const status = row.status ?? 'pending'

  return (
    <Card padding={3} radius={2} border tone={tone}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Text size={1} weight="medium" style={{fontFamily: 'monospace'}}>
            {row.message}
          </Text>
          <Flex align="center" gap={3} wrap="wrap">
            <Badge tone={row.occurrenceCount > 5 ? 'critical' : 'default'} fontSize={0}>
              {row.occurrenceCount}×
            </Badge>
            <Badge tone="default" fontSize={0}>
              {row.source ? SOURCE_LABELS[row.source] : 'unknown source'}
            </Badge>
            {/* Three plain buttons instead of a <select> -- Asher reported the
                dropdown's own arrow wasn't clickable. Rather than chase down
                exactly why a native select's hit-area was misbehaving, this
                sidesteps it: every option is its own real button, always
                visible, nothing hidden behind an arrow to begin with. */}
            <Flex gap={1}>
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  text={opt.label}
                  fontSize={1}
                  padding={2}
                  mode={status === opt.value ? 'default' : 'ghost'}
                  tone={status === opt.value ? 'primary' : 'default'}
                  disabled={busy}
                  onClick={() => onSetStatus(opt.value)}
                />
              ))}
            </Flex>
          </Flex>
        </Flex>
        <Text size={0} muted>
          First seen {new Date(row.firstSeenAt).toLocaleString()} · Last seen{' '}
          {new Date(row.lastSeenAt).toLocaleString()}
        </Text>
        {status !== 'pending' && (
          <Stack space={2}>
            <Text size={0} weight="medium" muted>
              Resolution note -- why this was {status === 'ignored' ? 'ignored' : 'marked fixed'}
            </Text>
            <TextArea
              fontSize={1}
              rows={2}
              value={noteDraft}
              placeholder="Explain the reasoning here so it's not lost once this chat is gone..."
              onChange={(event) => setNoteDraft(event.currentTarget.value)}
              onBlur={() => {
                if (noteDraft !== (row.resolutionNote ?? '')) onSaveNote(noteDraft)
              }}
            />
          </Stack>
        )}
        {(row.stack || row.occurrences?.length > 0) && (
          <Text size={0} style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={onToggleExpanded}>
            {isExpanded ? 'Hide' : 'Show'} stack trace & occurrence log ({row.occurrences?.length ?? 0}
            {row.occurrences?.length >= 200 ? '+, capped at 200' : ''})
          </Text>
        )}
        {isExpanded && (
          <Stack space={3}>
            {row.stack && (
              <Box
                padding={2}
                style={{background: 'rgba(0,0,0,0.05)', borderRadius: 4, fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}
              >
                <Text size={0} style={{fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}>
                  {row.stack}
                </Text>
              </Box>
            )}
            <Box style={{maxHeight: 240, overflowY: 'auto'}}>
              <Stack space={1}>
                {[...row.occurrences].reverse().map((occ, i) => (
                  <Text key={i} size={0} muted style={{fontFamily: 'monospace'}}>
                    {new Date(occ.timestamp).toLocaleString()} — {occ.path || 'unknown page'}
                    {occ.userAgent ? ` — ${occ.userAgent}` : ''}
                  </Text>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

// Same overview-page pattern as NotFoundHitsTool.tsx: one document per
// distinct error message (see errorLogType.ts), grouped into
// Pending/Ignored/Fixed sections, most-seen-first within each. Populated by
// ErrorMonitor.tsx (uncaught errors + unhandled promise rejections, every
// page) and (site)/error.tsx (React render errors) via /api/track-error.
// This IS where the writing happens, despite the name -- status changes and
// resolution notes both patch straight from here, since this hand-built
// tool (not Sanity's generic document form) is the only place either field
// is ever actually shown or edited.
export function ErrorLogTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<ErrorRow[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Set<Status>>(new Set(['pending']))

  const load = useCallback(() => {
    client
      .fetch<ErrorRow[]>(
        `*[_type == "errorLog"] | order(occurrenceCount desc){
          _id, message, source, stack, occurrenceCount, firstSeenAt, lastSeenAt, status, resolutionNote, occurrences
        }`,
      )
      .then(setRows)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  async function setRowStatus(id: string, status: Status) {
    setBusyId(id)
    try {
      await client.patch(id).set({status}).commit()
      setRows((prev) => (prev ? prev.map((r) => (r._id === id ? {...r, status} : r)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  async function setRowNote(id: string, resolutionNote: string) {
    await client.patch(id).set({resolutionNote}).commit()
    setRows((prev) => (prev ? prev.map((r) => (r._id === id ? {...r, resolutionNote} : r)) : prev))
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSection(status: Status) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const pendingCount = rows.filter((r) => (r.status ?? 'pending') === 'pending').length

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3}>
            <Text size={3} weight="bold">
              Error Log
            </Text>
            {pendingCount > 0 && (
              <Badge tone="caution" fontSize={1}>
                {pendingCount} pending
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Every distinct JS error caught in any browser that loaded the site -- real visitors and local dev
            testing alike, uncaught script errors, unhandled promise rejections, and React render errors --
            most-seen first within each group. Server-side errors (a failed API call, a bad Sanity write)
            aren't here; those already land in Netlify's own function logs.
          </Text>
        </Stack>

        {rows.length === 0 && (
          <Text size={1} muted>
            No errors recorded yet.
          </Text>
        )}

        {SECTIONS.map(({status, title, emptyLabel, cardTone, badgeTone}) => {
          const sectionRows = rows.filter((r) => (r.status ?? 'pending') === status)
          const isSectionOpen = openSections.has(status)
          if (rows.length === 0) return null
          return (
            <Stack key={status} space={3}>
              <Flex align="center" gap={2} style={{cursor: 'pointer'}} onClick={() => toggleSection(status)}>
                <Text size={1}>{isSectionOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</Text>
                <Text size={2} weight="semibold">
                  {title}
                </Text>
                <Badge tone={sectionRows.length > 0 ? badgeTone : 'default'} fontSize={0}>
                  {sectionRows.length}
                </Badge>
              </Flex>
              {isSectionOpen && (
                <Stack space={3} paddingLeft={1}>
                  {sectionRows.length === 0 && (
                    <Text size={1} muted>
                      {emptyLabel}
                    </Text>
                  )}
                  {sectionRows.map((row) => (
                    <ErrorRowCard
                      key={row._id}
                      row={row}
                      tone={cardTone}
                      isExpanded={expanded.has(row._id)}
                      onToggleExpanded={() => toggleExpanded(row._id)}
                      busy={busyId === row._id}
                      onSetStatus={(next) => setRowStatus(row._id, next)}
                      onSaveNote={(note) => setRowNote(row._id, note)}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}
