import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CreateRedirectForm} from './CreateRedirectForm'

type Status = 'pending' | 'ignored' | 'actioned'
type Hit = {timestamp: string; referrer?: string}
type NotFoundRow = {
  _id: string
  path: string
  hitCount: number
  referrer?: string
  firstSeenAt: string
  lastSeenAt: string
  status?: Status
  hits: Hit[]
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
  {status: 'actioned', title: 'Actioned', emptyLabel: 'Nothing actioned yet.', cardTone: 'positive', badgeTone: 'positive'},
]

function NotFoundRowCard({
  row,
  isExpanded,
  onToggleExpanded,
  busy,
  onSetStatus,
  isCreatingRedirect,
  onToggleCreateRedirect,
  onRedirectCreated,
  tone,
}: {
  row: NotFoundRow
  isExpanded: boolean
  onToggleExpanded: () => void
  busy: boolean
  onSetStatus: (status: Status) => void
  isCreatingRedirect: boolean
  onToggleCreateRedirect: () => void
  onRedirectCreated: () => void
  tone: 'caution' | 'transparent' | 'positive'
}) {
  return (
    <Card padding={3} radius={2} border tone={tone}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Text size={1} weight="medium" style={{fontFamily: 'monospace'}}>
            {row.path}
          </Text>
          <Flex align="center" gap={3}>
            <Badge tone={row.hitCount > 5 ? 'critical' : 'default'} fontSize={0}>
              {row.hitCount}× hit{row.hitCount === 1 ? '' : 's'}
            </Badge>
            <Button
              text="Create redirect"
              icon={ArrowRightIcon}
              mode="ghost"
              fontSize={1}
              padding={2}
              onClick={onToggleCreateRedirect}
            />
            <Select
              value={row.status ?? 'pending'}
              disabled={busy}
              fontSize={1}
              padding={2}
              onChange={(event) => onSetStatus(event.currentTarget.value as Status)}
              style={{width: 130}}
            >
              <option value="pending">Pending</option>
              <option value="ignored">Ignored</option>
              <option value="actioned">Actioned</option>
            </Select>
          </Flex>
        </Flex>
        {isCreatingRedirect && (
          <CreateRedirectForm
            fromPath={row.path}
            onCancel={onToggleCreateRedirect}
            onCreated={onRedirectCreated}
          />
        )}
        <Text size={0} muted>
          First seen {new Date(row.firstSeenAt).toLocaleString()} · Last seen{' '}
          {new Date(row.lastSeenAt).toLocaleString()}
          {row.referrer ? ` · Last referrer: ${row.referrer}` : ''}
        </Text>
        {row.hits?.length > 0 && (
          <Text size={0} style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={onToggleExpanded}>
            {isExpanded ? 'Hide' : 'Show'} full hit log ({row.hits.length}
            {row.hits.length >= 500 ? '+, capped at 500' : ''})
          </Text>
        )}
        {isExpanded && (
          <Box style={{maxHeight: 240, overflowY: 'auto'}}>
            <Stack space={1}>
              {[...row.hits].reverse().map((hit, i) => (
                <Text key={i} size={0} muted style={{fontFamily: 'monospace'}}>
                  {new Date(hit.timestamp).toLocaleString()} — {hit.referrer || 'no referrer'}
                </Text>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  )
}

// A single overview page for every 404'd path, replacing the previous
// "click into each path's own document" pattern -- same reasoning as the
// Media and Comments tools. Grouped into three collapsible sections
// (Pending/Ignored/Actioned) instead of one flat list, so "what still needs
// a look" doesn't get buried under paths already dealt with or deliberately
// set aside. Within each section, sorted by hit count so the paths worth
// actually looking into surface first.
export function NotFoundHitsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<NotFoundRow[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creatingRedirectId, setCreatingRedirectId] = useState<string | null>(null)
  // Pending is the one section that actually needs a look every time, so it
  // starts open; Ignored/Actioned are settled business, collapsed by default.
  const [openSections, setOpenSections] = useState<Set<Status>>(new Set(['pending']))

  const load = useCallback(() => {
    client
      .fetch<NotFoundRow[]>(
        `*[_type == "notFoundHit"] | order(hitCount desc){
          _id, path, hitCount, referrer, firstSeenAt, lastSeenAt, status, hits
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
              404 Hits
            </Text>
            {pendingCount > 0 && (
              <Badge tone="caution" fontSize={1}>
                {pendingCount} pending
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Every distinct broken-link path, most-hit first within each group. Expand a row to see every
            individual hit -- useful for spotting a burst pattern (scanning/bruteforcing) versus scattered
            organic hits.
          </Text>
        </Stack>

        {rows.length === 0 && (
          <Text size={1} muted>
            No 404s recorded yet.
          </Text>
        )}

        {SECTIONS.map(({status, title, emptyLabel, cardTone, badgeTone}) => {
          const sectionRows = rows.filter((r) => (r.status ?? 'pending') === status)
          const isSectionOpen = openSections.has(status)
          if (rows.length === 0) return null
          return (
            <Stack key={status} space={3}>
              <Flex
                align="center"
                gap={2}
                style={{cursor: 'pointer'}}
                onClick={() => toggleSection(status)}
              >
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
                    <NotFoundRowCard
                      key={row._id}
                      row={row}
                      tone={cardTone}
                      isExpanded={expanded.has(row._id)}
                      onToggleExpanded={() => toggleExpanded(row._id)}
                      busy={busyId === row._id}
                      onSetStatus={(next) => setRowStatus(row._id, next)}
                      isCreatingRedirect={creatingRedirectId === row._id}
                      onToggleCreateRedirect={() =>
                        setCreatingRedirectId((current) => (current === row._id ? null : row._id))
                      }
                      onRedirectCreated={() => {
                        setRowStatus(row._id, 'actioned')
                        setCreatingRedirectId(null)
                      }}
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
