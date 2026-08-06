import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Card, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'

type Status = 'pending' | 'ignored' | 'actioned'
type Hit = {timestamp: string; resultCount?: number}
type QueryRow = {
  _id: string
  query: string
  hitCount: number
  lastResultCount?: number
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

function QueryRowCard({
  row,
  isExpanded,
  onToggleExpanded,
  busy,
  onSetStatus,
  tone,
}: {
  row: QueryRow
  isExpanded: boolean
  onToggleExpanded: () => void
  busy: boolean
  onSetStatus: (status: Status) => void
  tone: 'caution' | 'transparent' | 'positive'
}) {
  const noResults = row.lastResultCount === 0
  return (
    <Card padding={3} radius={2} border tone={tone}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Text size={1} weight="medium">
            &ldquo;{row.query}&rdquo;
          </Text>
          <Flex align="center" gap={3}>
            {noResults && (
              <Badge tone="critical" fontSize={0}>
                no results
              </Badge>
            )}
            <Badge tone={row.hitCount > 5 ? 'critical' : 'default'} fontSize={0}>
              {row.hitCount}× searched
            </Badge>
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
        <Text size={0} muted>
          First searched {new Date(row.firstSeenAt).toLocaleString()} · Last searched{' '}
          {new Date(row.lastSeenAt).toLocaleString()}
          {typeof row.lastResultCount === 'number'
            ? ` · Last time: ${row.lastResultCount} result${row.lastResultCount === 1 ? '' : 's'}`
            : ''}
        </Text>
        {row.hits?.length > 0 && (
          <Text size={0} style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={onToggleExpanded}>
            {isExpanded ? 'Hide' : 'Show'} full search log ({row.hits.length}
            {row.hits.length >= 500 ? '+, capped at 500' : ''})
          </Text>
        )}
        {isExpanded && (
          <Box style={{maxHeight: 240, overflowY: 'auto'}}>
            <Stack space={1}>
              {[...row.hits].reverse().map((hit, i) => (
                <Text key={i} size={0} muted style={{fontFamily: 'monospace'}}>
                  {new Date(hit.timestamp).toLocaleString()} — {hit.resultCount ?? 0} result
                  {hit.resultCount === 1 ? '' : 's'}
                </Text>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  )
}

// Same overview-page pattern as 404 Hits: one document per distinct search
// query instead of clicking into each one individually, grouped into
// collapsible Pending/Ignored/Actioned sections. The point isn't traffic
// stats -- it's surfacing what readers are actually looking for on this
// blog that either doesn't exist yet (a "no results" badge) or that the
// current search index isn't finding (worth checking before assuming it's
// a real gap). Query text only, no visitor-identifying data at all.
export function SearchQueriesTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<QueryRow[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Set<Status>>(new Set(['pending']))

  const load = useCallback(() => {
    client
      .fetch<QueryRow[]>(
        `*[_type == "searchQueryLog"] | order(hitCount desc){
          _id, query, hitCount, lastResultCount, firstSeenAt, lastSeenAt, status, hits
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
  const noResultsCount = rows.filter((r) => (r.status ?? 'pending') === 'pending' && r.lastResultCount === 0).length

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3} wrap="wrap">
            <Text size={3} weight="bold">
              Search Queries
            </Text>
            {pendingCount > 0 && (
              <Badge tone="caution" fontSize={1}>
                {pendingCount} pending
              </Badge>
            )}
            {noResultsCount > 0 && (
              <Badge tone="critical" fontSize={1}>
                {noResultsCount} with no results
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Every distinct thing searched on the blog, most-searched first within each group. A &ldquo;no
            results&rdquo; badge is the strongest signal here -- someone looked for something this blog doesn&rsquo;t
            have (yet). Mark a query Actioned once you&rsquo;ve written about it, or Ignored if it&rsquo;s not
            worth pursuing.
          </Text>
        </Stack>

        {rows.length === 0 && (
          <Text size={1} muted>
            No searches recorded yet.
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
                    <QueryRowCard
                      key={row._id}
                      row={row}
                      tone={cardTone}
                      isExpanded={expanded.has(row._id)}
                      onToggleExpanded={() => toggleExpanded(row._id)}
                      busy={busyId === row._id}
                      onSetStatus={(next) => setRowStatus(row._id, next)}
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
