import {useCallback, useEffect, useState} from 'react'
import {Badge, Button, Card, Flex, Select, Spinner, Stack, Text, Tooltip} from '@sanity/ui'
import type {CardTone} from '@sanity/ui'
import {useClient} from 'sanity'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {openDocumentInStudio} from '../lib/openPostInStudio'
import {ErrorMessage} from './ErrorMessage'

type DismissStatus = 'pending' | 'ignored' | 'actioned'
type Source = {type: 'post' | 'snippet'; title: string; slug?: string; id: string}
type LinkCheckRow = {
  _id: string
  url: string
  isAffiliate: boolean
  sources: Source[]
  ok?: boolean
  statusCode?: number
  error?: string
  blocked?: boolean
  lastCheckedAt?: string
  brokenSince?: string
  status?: DismissStatus
}

type SectionKey = 'broken' | 'blocked' | 'affiliate' | 'healthy'

const SECTIONS: {
  key: SectionKey
  title: string
  emptyLabel: string
  badgeTone: 'critical' | 'caution' | 'primary' | 'default'
}[] = [
  {key: 'broken', title: 'Broken', emptyLabel: 'Nothing broken as of the last check.', badgeTone: 'critical'},
  {
    key: 'blocked',
    title: 'Possibly Blocked',
    emptyLabel: 'Nothing flagged as bot-blocked.',
    badgeTone: 'caution',
  },
  {key: 'affiliate', title: 'Affiliate links', emptyLabel: 'No affiliate links in use yet.', badgeTone: 'primary'},
  {key: 'healthy', title: 'Everything else', emptyLabel: 'No other links yet.', badgeTone: 'default'},
]

// One-line, plain-English meaning per HTTP status this checker is likely to
// actually see -- shown as a tooltip on each status badge so "what does 429
// mean again" never needs a search engine. Codes outside this list still
// show their raw number; only the handful worth knowing by name are here.
const STATUS_MEANINGS: Record<number, string> = {
  400: "Bad Request — the server couldn't understand this request.",
  401: 'Unauthorized — this page requires being logged in to view.',
  403: "Forbidden — often an automated-traffic block, not necessarily that the page is gone.",
  404: "Not Found — the page genuinely doesn't exist at this address anymore.",
  410: 'Gone — deliberately, permanently removed by the site.',
  429: 'Too Many Requests — rate-limited. The site is blocking automated checks, not necessarily broken.',
  500: 'Internal Server Error — often the site genuinely erroring, but confirmed on real cases to also be an automated-traffic block, same as 403/429.',
  502: 'Bad Gateway — a server/proxy issue in front of their site, often temporary.',
  503: 'Service Unavailable — temporarily down or overloaded.',
  504: 'Gateway Timeout — the server took too long to respond.',
}

function statusMeaning(statusCode: number | undefined, error: string | undefined): string {
  if (statusCode) return STATUS_MEANINGS[statusCode] ?? `HTTP ${statusCode} — an error response from the server.`
  return error || 'The request failed before getting any response (timeout, DNS, or connection error).'
}

function cardTone(row: LinkCheckRow): CardTone {
  if (row.ok === false) return row.blocked ? 'caution' : 'critical'
  return 'transparent'
}

// A broken-link checker, external-link monitor, and affiliate-link
// registry in one place -- three separate items on the roadmap that all
// come down to "what URLs does the site's own content point to, and are
// they still good." Every post and reusable snippet's rich text gets
// scanned (src/lib/linkChecker.ts) for plain and affiliate links; results
// persist as `linkCheck` documents so this stays a browsable record between
// runs, not just a one-off report. The daily cron
// (.github/workflows/cron-check-links.yml) is what makes this "monitoring"
// instead of an on-demand audit -- Check Now here just runs that same
// check early.
//
// No page-level title/padding of its own -- rendered as one tab inside
// ContentHealthTool.tsx, alongside ContentAuditTool (merged 2026-08-05,
// real overlap: both are "which posts need a look" checks).
export function LinkCheckerTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<LinkCheckRow[] | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['broken', 'blocked', 'affiliate']))
  const [dismissedOpen, setDismissedOpen] = useState<Set<SectionKey>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    client
      .fetch<LinkCheckRow[]>(
        `*[_type == "linkCheck"] | order(url asc){
          _id, url, isAffiliate, sources, ok, statusCode, error, blocked, lastCheckedAt, brokenSince, status
        }`,
      )
      .then(setRows)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  // Added 2026-08-11 -- this tool had no dismiss mechanism at all, which
  // was the actual reason Content Health kept showing the same flagged
  // links with no way to say "I know, this one's fine" (a 403 from a site
  // that blocks automated checks, for instance). Same pending/ignored/
  // actioned pattern NotFoundHitsTool already uses. Rows stay in their
  // Broken/Possibly Blocked section regardless of status -- only the
  // top-line "needs attention" counts (here and on the Dashboard) exclude
  // ignored ones, so nothing is removed from view, just no longer counted
  // as something to act on.
  async function setRowStatus(id: string, status: DismissStatus) {
    setBusyId(id)
    try {
      await client.patch(id).set({status}).commit()
      setRows((prev) => (prev ? prev.map((r) => (r._id === id ? {...r, status} : r)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  async function checkNow() {
    setChecking(true)
    setCheckError('')
    try {
      const res = await fetch('/api/check-links', {method: 'POST'})
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Check failed')
      await load()
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : 'Check failed')
    } finally {
      setChecking(false)
    }
  }

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleDismissed(key: SectionKey) {
    setDismissedOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
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

  // "Broken" means a genuine failure -- a real 404, a dead domain, a
  // connection error. 401/403/429 get their own section: those status
  // codes mean the site actively refused an automated-looking request,
  // which happens to perfectly fine pages (Instagram in particular blocks
  // almost all non-browser traffic this way) -- not the same thing as the
  // page actually being gone.
  const broken = rows.filter((r) => r.ok === false && !r.blocked)
  const blocked = rows.filter((r) => r.ok === false && r.blocked)
  const affiliate = rows.filter((r) => r.ok !== false && r.isAffiliate)
  const healthy = rows.filter((r) => r.ok !== false && !r.isAffiliate)
  const byKey: Record<SectionKey, LinkCheckRow[]> = {broken, blocked, affiliate, healthy}
  const isPending = (r: LinkCheckRow) => (r.status ?? 'pending') === 'pending'
  const activeBroken = broken.filter(isPending)
  const activeBlocked = blocked.filter(isPending)

  const lastChecked = rows.reduce<string | undefined>((latest, r) => {
    if (!r.lastCheckedAt) return latest
    return !latest || r.lastCheckedAt > latest ? r.lastCheckedAt : latest
  }, undefined)

  return (
    <Stack space={4}>
      <Stack space={2}>
        <Flex align="center" gap={3} wrap="wrap">
          {activeBroken.length > 0 && (
            <Badge tone="critical" fontSize={1}>
              {activeBroken.length} broken
            </Badge>
          )}
          {activeBlocked.length > 0 && (
            <Badge tone="caution" fontSize={1}>
              {activeBlocked.length} possibly blocked
            </Badge>
          )}
          <Button
            text={checking ? 'Checking…' : 'Check now'}
            icon={RefreshIcon}
            mode="ghost"
            tone="primary"
            fontSize={1}
            disabled={checking}
            onClick={checkNow}
          />
        </Flex>
        <Text size={1} muted>
          Every link inside a post or reusable snippet&rsquo;s own text, checked live and re-checked
          automatically once a day. Links that come back 401/403/429 show under &ldquo;Possibly
          Blocked&rdquo; instead of Broken -- those codes usually mean a site is refusing an automated
          check specifically (Instagram does this to almost all non-browser traffic), not that the page is
          actually gone. A link that briefly fails gets one automatic retry before it&rsquo;s ever recorded
          as broken, so a server having one bad second doesn&rsquo;t get flagged. Links to this site&rsquo;s
          own pages are checked against what&rsquo;s actually in Sanity instead of a live request, so the
          hosting platform&rsquo;s own bot protection can&rsquo;t flag them by mistake. Hover any status badge for
          what it means. Removed or changed a link and don&rsquo;t want to wait for tomorrow&rsquo;s
          automatic check? Click Check now to refresh immediately. A broken or possibly-blocked link can be
          marked Ignored or Actioned if it&rsquo;s handled or not actually worth fixing -- it moves into
          that section&rsquo;s &ldquo;Show dismissed&rdquo; list, reversible any time, and stops counting
          toward the numbers above.
          {lastChecked && ` Last checked ${new Date(lastChecked).toLocaleString()}.`}
        </Text>
        {checkError && <ErrorMessage>{checkError}</ErrorMessage>}
      </Stack>

      {rows.length === 0 && (
        <Text size={1} muted>
          No links found yet in any post or snippet -- click Check now once one exists.
        </Text>
      )}

      {rows.length > 0 &&
        SECTIONS.map(({key, title, emptyLabel, badgeTone}) => {
          const sectionRows = byKey[key]
          const hasDismissal = key === 'broken' || key === 'blocked'
          // Ignored/actioned rows move out of the visible list into a
          // separate collapsed area (2026-08-11) -- the first version left
          // dismissed rows sitting right where they were, with only the
          // top summary badge reflecting the dismissal. Asher marked two
          // rows Ignored and reported "nothing happens," reasonably, since
          // the section's own count and the row itself never changed.
          // Matches the pattern ContentAuditTool already established (and
          // Asher already approved): active rows visible by default,
          // dismissed ones tucked behind a "Show dismissed" toggle.
          const activeRows = hasDismissal ? sectionRows.filter(isPending) : sectionRows
          const dismissedRows = hasDismissal ? sectionRows.filter((r) => !isPending(r)) : []
          const isOpen = openSections.has(key)
          const isDismissedOpen = dismissedOpen.has(key)
          return (
            <Stack key={key} space={3}>
              <Flex align="center" gap={2} style={{cursor: 'pointer'}} onClick={() => toggleSection(key)}>
                <Text size={1}>{isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</Text>
                <Text size={2} weight="semibold">
                  {title}
                </Text>
                <Badge tone={activeRows.length > 0 ? badgeTone : 'default'} fontSize={0}>
                  {activeRows.length}
                </Badge>
              </Flex>
              {isOpen && (
                <Stack space={3} paddingLeft={1}>
                  {activeRows.length === 0 && dismissedRows.length === 0 && (
                    <Text size={1} muted>
                      {emptyLabel}
                    </Text>
                  )}
                  {activeRows.length === 0 && dismissedRows.length > 0 && (
                    <Text size={1} muted>
                      Nothing pending -- {dismissedRows.length} dismissed below.
                    </Text>
                  )}
                  {activeRows.map((row) => (
                    <LinkRowCard
                      key={row._id}
                      row={row}
                      showStatus={hasDismissal}
                      busy={busyId === row._id}
                      onSetStatus={(status) => setRowStatus(row._id, status)}
                    />
                  ))}
                  {dismissedRows.length > 0 && (
                    <Stack space={3}>
                      <Text
                        size={0}
                        muted
                        style={{cursor: 'pointer', textDecoration: 'underline'}}
                        onClick={() => toggleDismissed(key)}
                      >
                        {isDismissedOpen ? 'Hide' : 'Show'} dismissed ({dismissedRows.length})
                      </Text>
                      {isDismissedOpen &&
                        dismissedRows.map((row) => (
                          <LinkRowCard
                            key={row._id}
                            row={row}
                            showStatus
                            busy={busyId === row._id}
                            onSetStatus={(status) => setRowStatus(row._id, status)}
                          />
                        ))}
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          )
        })}
    </Stack>
  )
}

function LinkRowCard({
  row,
  showStatus,
  busy,
  onSetStatus,
}: {
  row: LinkCheckRow
  showStatus: boolean
  busy: boolean
  onSetStatus: (status: DismissStatus) => void
}) {
  return (
    <Card padding={3} radius={2} border tone={cardTone(row)}>
      <Stack space={2}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Text size={1} weight="medium" style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>
            {row.url}
          </Text>
          <Flex align="center" gap={2}>
            {row.isAffiliate && (
              <Badge tone="primary" fontSize={0}>
                affiliate
              </Badge>
            )}
            {row.ok === false ? (
              <Tooltip
                content={
                  <Text size={1} style={{maxWidth: 240}}>
                    {statusMeaning(row.statusCode, row.error)}
                  </Text>
                }
                padding={2}
                placement="top"
              >
                <Badge tone={row.blocked ? 'caution' : 'critical'} fontSize={0} style={{cursor: 'help'}}>
                  {row.statusCode ? `HTTP ${row.statusCode}` : row.error || 'broken'}
                </Badge>
              </Tooltip>
            ) : (
              <Badge tone="positive" fontSize={0}>
                {row.statusCode ? `HTTP ${row.statusCode}` : 'ok'}
              </Badge>
            )}
            {showStatus && (
              <Select
                value={row.status ?? 'pending'}
                disabled={busy}
                fontSize={0}
                padding={2}
                onChange={(event) => onSetStatus(event.currentTarget.value as DismissStatus)}
                style={{width: 110}}
              >
                <option value="pending">Pending</option>
                <option value="ignored">Ignored</option>
                <option value="actioned">Actioned</option>
              </Select>
            )}
          </Flex>
        </Flex>
        <Flex gap={2} wrap="wrap" align="center">
          {row.sources.length === 0 && (
            <Text size={0} muted>
              No longer referenced
            </Text>
          )}
          {row.sources.map((source, i) => (
            <Flex key={source.id} align="center" gap={2}>
              {i > 0 && (
                <Text size={0} muted>
                  ·
                </Text>
              )}
              <Text
                size={0}
                muted
                style={{cursor: 'pointer', textDecoration: 'underline'}}
                onClick={() => openDocumentInStudio(source.type, source.id)}
              >
                {source.type === 'post' ? 'Post: ' : 'Snippet: '}
                {source.title}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Text size={0} muted>
          {row.lastCheckedAt && `Last checked ${new Date(row.lastCheckedAt).toLocaleString()}`}
          {row.brokenSince && ` · Broken since ${new Date(row.brokenSince).toLocaleDateString()}`}
        </Text>
      </Stack>
    </Card>
  )
}
