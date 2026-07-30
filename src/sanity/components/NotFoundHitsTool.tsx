import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Card, Checkbox, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

type Hit = {timestamp: string; referrer?: string}
type NotFoundRow = {
  _id: string
  path: string
  hitCount: number
  referrer?: string
  firstSeenAt: string
  lastSeenAt: string
  actioned: boolean
  hits: Hit[]
}

// A single overview page for every 404'd path, replacing the previous
// "click into each path's own document" pattern -- same reasoning as the
// Media and Comments tools. Sorted by hit count so the paths worth actually
// looking into surface first.
export function NotFoundHitsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<NotFoundRow[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    client
      .fetch<NotFoundRow[]>(
        `*[_type == "notFoundHit"] | order(hitCount desc){
          _id, path, hitCount, referrer, firstSeenAt, lastSeenAt, actioned, hits
        }`,
      )
      .then(setRows)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  async function toggleActioned(id: string, current: boolean) {
    setBusyId(id)
    try {
      await client.patch(id).set({actioned: !current}).commit()
      setRows((prev) => (prev ? prev.map((r) => (r._id === id ? {...r, actioned: !current} : r)) : prev))
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

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const notActioned = rows.filter((r) => !r.actioned)

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3}>
            <Text size={3} weight="bold">
              404 Hits
            </Text>
            {notActioned.length > 0 && (
              <Badge tone="caution" fontSize={1}>
                {notActioned.length} not yet actioned
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Every distinct broken-link path, most-hit first. Expand a row to see every individual hit --
            useful for spotting a burst pattern (scanning/bruteforcing) versus scattered organic hits.
          </Text>
        </Stack>

        {rows.length === 0 && (
          <Text size={1} muted>
            No 404s recorded yet.
          </Text>
        )}

        {rows.map((row) => {
          const isOpen = expanded.has(row._id)
          return (
            <Card key={row._id} padding={3} radius={2} border tone={row.actioned ? 'transparent' : 'caution'}>
              <Stack space={3}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                  <Text size={1} weight="medium" style={{fontFamily: 'monospace'}}>
                    {row.path}
                  </Text>
                  <Flex align="center" gap={3}>
                    <Badge tone={row.hitCount > 5 ? 'critical' : 'default'} fontSize={0}>
                      {row.hitCount}× hit{row.hitCount === 1 ? '' : 's'}
                    </Badge>
                    <Flex align="center" gap={2}>
                      <Checkbox
                        checked={row.actioned}
                        disabled={busyId === row._id}
                        onChange={() => toggleActioned(row._id, row.actioned)}
                      />
                      <Text size={1}>Actioned</Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Text size={0} muted>
                  First seen {new Date(row.firstSeenAt).toLocaleString()} · Last seen{' '}
                  {new Date(row.lastSeenAt).toLocaleString()}
                  {row.referrer ? ` · Last referrer: ${row.referrer}` : ''}
                </Text>
                {row.hits?.length > 0 && (
                  <Text
                    size={0}
                    style={{cursor: 'pointer', textDecoration: 'underline'}}
                    onClick={() => toggleExpanded(row._id)}
                  >
                    {isOpen ? 'Hide' : 'Show'} full hit log ({row.hits.length}
                    {row.hits.length >= 500 ? '+, capped at 500' : ''})
                  </Text>
                )}
                {isOpen && (
                  <Box style={{maxHeight: 240, overflowY: 'auto'}}>
                    <Stack space={1}>
                      {[...row.hits]
                        .reverse()
                        .map((hit, i) => (
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
        })}
      </Stack>
    </Box>
  )
}
