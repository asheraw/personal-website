import {useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {AddDocumentIcon} from '@sanity/icons/AddDocument'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {CommentIcon} from '@sanity/icons/Comment'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {ShareIcon} from '@sanity/icons/Share'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {BugIcon} from '@sanity/icons/Bug'
import {SearchIcon} from '@sanity/icons/Search'
import {TrendUpwardIcon} from '@sanity/icons/TrendUpward'
import {ComponentIcon} from '@sanity/icons/Component'
import {usePendingCommentCount} from '../hooks/usePendingCommentCount'
import {usePendingContactCount} from '../hooks/usePendingContactCount'
import {openDocumentInStudio} from '../lib/openPostInStudio'

// Landing screen (see sanity.config.ts -- this tool is prepended before
// Sanity's own default tools, which is what makes it the first thing shown
// at bare /studio). Asher's own priority list, in order: quick actions,
// comments/contact, distribution, pending issues, stats -- this mirrors
// that exactly rather than an arbitrary layout.
//
// Every stat here already has a real tool/document behind it -- this
// doesn't duplicate data, it surfaces counts from the same sources
// NotFoundHitsTool/ErrorLogTool/ContentHealthTool/etc. already show, so a
// number here always matches what you'd see clicking through.
//
// Traffic/Google Analytics is deliberately not here: this project has no
// server-side GA integration today (checked -- no @google-analytics/data
// dependency, no service-account env vars), and wiring one up is a real
// new integration (Google Cloud service account, new credentials), not a
// dashboard-layout decision. Left as a plain note instead of a fake stat.

type DashboardData = {
  linkIssues: number
  notFoundPending: number
  errorPending: number
  searchPending: number
  scheduledCount: number
  consent: {acceptedCount?: number; declinedCount?: number} | null
  feedbackCount: number
  auditIssues: number
  socialNeeded: number
}

// Nested-structure links (Site Admin's own sub-items) use Sanity's real
// pane-URL format -- groups joined by `;` -- verified by reading Sanity's
// own router source rather than assumed; see structure.tsx for the
// explicit .id() values these paths depend on (an unset id defaults to
// camelCase(title), which gets genuinely ambiguous for a title like
// "404 Hits", so those ids are pinned by hand there). Top-level tools
// (Comments, Distribution, Editorial Calendar, Content Health) use their
// registered `name` from sanity.config.ts directly -- a different,
// simpler mechanism (name-based routing, not pane-stack topology), not
// the kind of guess that broke the old "open post" links (see RUNBOOK.md).
// notFoundHits/errorLog/searchQueries/cookies are all direct Site Admin
// children (briefly grouped one level deeper inside a "Logs" folder on
// 2026-08-11, flattened back out the same day on Asher's own reversal --
// "no need to put them too far in, you're right"). cookies points at the
// single merged Insights+Copy+Feedback pane (also 2026-08-11, second pass).
const LINKS = {
  comments: '/studio/comments',
  distribution: '/studio/distribution',
  calendar: '/studio/editorial-calendar',
  contentHealth: '/studio/content-health',
  contactSubmissions: '/studio/structure/siteAdmin;contactSubmissions',
  notFoundHits: '/studio/structure/siteAdmin;notFoundHits',
  errorLog: '/studio/structure/siteAdmin;errorLog',
  searchQueries: '/studio/structure/siteAdmin;searchQueries',
  cookies: '/studio/structure/siteAdmin;cookies',
}

// Deliberately doesn't also fetch posts/aiOutputLog -- usePostIssueCounts
// below covers those (audit issues + social-copy-needed both derive from
// the same two lists, so they share one fetch rather than pulling the same
// data twice across two hooks). Also deliberately doesn't compute a
// per-variant breakdown here anymore -- that lives in CookiesTool.tsx now,
// which has real room for it; this card only needs the overall total.
const QUERY = `{
  "linkIssues": count(*[_type == "linkCheck" && ok == false && (status == "pending" || !defined(status))]),
  "notFoundPending": count(*[_type == "notFoundHit" && (status == "pending" || !defined(status))]),
  "errorPending": count(*[_type == "errorLog" && (status == "pending" || !defined(status))]),
  "searchPending": count(*[_type == "searchQueryLog" && (status == "pending" || !defined(status))]),
  "scheduledCount": count(*[_id in path("drafts.**") && _type == "post" && defined(scheduledPublishAt)]),
  "consent": *[_id == "consentLog"][0]{acceptedCount, declinedCount},
  "feedbackCount": count(*[_type == "cookieFeedback"])
}`

// Mirrors ContentAuditTool.tsx's own issuesFor() exactly, dismissed checks
// included -- this count feeds the Dashboard's "Content Health issues"
// card, and it needs to agree with what that tool actually shows, or the
// two numbers silently drift apart the first time a check gets dismissed.
function activeIssueCount(p: {
  mainImage?: unknown
  hasAltText: boolean
  excerpt?: string
  categories?: unknown[]
  contentAuditDismissed?: string[]
}): number {
  const dismissed = new Set(p.contentAuditDismissed ?? [])
  let count = 0
  if (!p.mainImage) {
    if (!dismissed.has('hasImage')) count++
  } else if (!p.hasAltText && !dismissed.has('hasAltText')) count++
  if (!p.excerpt && !dismissed.has('hasExcerpt')) count++
  if (!p.categories?.length && !dismissed.has('hasCategory')) count++
  return count
}

function usePostIssueCounts(): {auditIssues: number; socialNeeded: number} | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [result, setResult] = useState<{auditIssues: number; socialNeeded: number} | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<{
        posts: {
          _id: string
          mainImage?: unknown
          hasAltText: boolean
          excerpt?: string
          categories?: unknown[]
          contentAuditDismissed?: string[]
        }[]
        socialDraftedSlugs: string[]
      }>(`{
        "posts": *[_type == "post" && defined(slug.current)]{
          _id, mainImage, "hasAltText": defined(coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText)), excerpt, categories, contentAuditDismissed
        },
        "socialDraftedSlugs": *[_type == "aiOutputLog" && feature == "social"].postSlug
      }`)
      .then(({posts, socialDraftedSlugs}) => {
        if (cancelled) return
        const auditIssues = posts.filter((p) => activeIssueCount(p) > 0).length
        const socialNeeded = posts.length - new Set(socialDraftedSlugs).size
        setResult({auditIssues, socialNeeded: Math.max(0, socialNeeded)})
      })
      .catch(() => {
        if (!cancelled) setResult({auditIssues: 0, socialNeeded: 0})
      })
    return () => {
      cancelled = true
    }
  }, [client])

  return result
}

function useDashboardCounts(): Omit<DashboardData, 'auditIssues' | 'socialNeeded'> | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [data, setData] = useState<Omit<DashboardData, 'auditIssues' | 'socialNeeded'> | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      // perspective: 'raw' -- scheduledCount needs to see drafts.* documents,
      // which the default query perspective excludes entirely; same
      // requirement EditorialCalendarTool already has for the same reason.
      .fetch<Omit<DashboardData, 'auditIssues' | 'socialNeeded'>>(QUERY, {}, {perspective: 'raw'})
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        // Leave counts unset -- individual cards show a dash rather than a
        // wrong number if a fetch fails.
      })
    return () => {
      cancelled = true
    }
  }, [client])

  return data
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ComponentType
  label: string
  value: number | string | null
  tone?: 'caution' | 'critical' | 'positive' | 'default'
  href: string
}) {
  const badgeTone = value === 0 ? 'positive' : (tone ?? 'caution')
  return (
    <Card as="a" href={href} radius={3} shadow={1} padding={4} tone={value && value !== 0 ? tone : undefined}>
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={3}>
          <Box>
            <Icon />
          </Box>
          <Text size={1} muted>
            {label}
          </Text>
        </Flex>
        {value === null ? (
          <Spinner muted />
        ) : (
          <Badge tone={badgeTone} fontSize={1} padding={2}>
            {value}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}

function SectionHeading({children}: {children: React.ReactNode}) {
  return (
    <Text size={1} weight="semibold" muted style={{textTransform: 'uppercase', letterSpacing: '0.08em'}}>
      {children}
    </Text>
  )
}

export function DashboardTool() {
  const pendingComments = usePendingCommentCount()
  const pendingContacts = usePendingContactCount()
  const counts = useDashboardCounts()
  const postIssues = usePostIssueCounts()

  const contentHealthTotal =
    counts && postIssues !== null ? counts.linkIssues + postIssues.auditIssues : null
  const totalPending =
    contentHealthTotal !== null && counts
      ? contentHealthTotal + counts.notFoundPending + counts.errorPending
      : null

  return (
    <Box padding={4} style={{maxWidth: 960, margin: '0 auto'}}>
      <Stack space={5}>
        <Stack space={2}>
          <Heading size={3}>Dashboard</Heading>
          <Text muted size={2}>
            {totalPending === null
              ? 'Loading...'
              : totalPending === 0
                ? 'Nothing needs attention right now.'
                : `${totalPending} thing${totalPending === 1 ? '' : 's'} worth a look.`}
          </Text>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Quick actions</SectionHeading>
          <Flex gap={3} wrap="wrap">
            <Button
              text="New post"
              icon={AddDocumentIcon}
              tone="primary"
              onClick={() => openDocumentInStudio('post', crypto.randomUUID())}
            />
            <Button as="a" href={LINKS.calendar} text="Schedule a post" icon={CalendarIcon} mode="ghost" />
          </Flex>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Comments &amp; contact</SectionHeading>
          <Grid columns={[1, 2]} gap={3}>
            <StatCard icon={CommentIcon} label="Pending comments" value={pendingComments} href={LINKS.comments} />
            <StatCard
              icon={EnvelopeIcon}
              label="Unread contact submissions"
              value={pendingContacts}
              href={LINKS.contactSubmissions}
            />
          </Grid>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Distribution</SectionHeading>
          <Grid columns={[1, 2]} gap={3}>
            <StatCard
              icon={ShareIcon}
              label="Posts without social copy drafted"
              value={postIssues?.socialNeeded ?? null}
              href={LINKS.distribution}
            />
            <StatCard
              icon={CalendarIcon}
              label="Scheduled, not yet published"
              value={counts?.scheduledCount ?? null}
              tone="default"
              href={LINKS.calendar}
            />
          </Grid>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Pending issues</SectionHeading>
          <Grid columns={[1, 2, 3]} gap={3}>
            <StatCard
              icon={CheckmarkCircleIcon}
              label="Content Health issues"
              value={contentHealthTotal}
              href={LINKS.contentHealth}
            />
            <StatCard
              icon={LinkRemovedIcon}
              label="404 hits pending"
              value={counts?.notFoundPending ?? null}
              href={LINKS.notFoundHits}
            />
            <StatCard icon={BugIcon} label="Error log pending" value={counts?.errorPending ?? null} href={LINKS.errorLog} />
          </Grid>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Stats</SectionHeading>
          <Grid columns={[1, 2, 3]} gap={3}>
            <Card radius={3} shadow={1} padding={4} as="a" href={LINKS.cookies}>
              <Flex align="center" gap={3}>
                <ComponentIcon />
                <Stack space={2}>
                  <Text size={1} muted>
                    Cookie consent &amp; feedback
                  </Text>
                  <Text size={2}>
                    {counts?.consent
                      ? `${counts.consent.acceptedCount ?? 0} accepted · ${counts.consent.declinedCount ?? 0} declined · ${counts?.feedbackCount ?? 0} taste-test${counts?.feedbackCount === 1 ? '' : 's'}`
                      : '—'}
                  </Text>
                </Stack>
              </Flex>
            </Card>
            <StatCard
              icon={SearchIcon}
              label="Search queries needing a look"
              value={counts?.searchPending ?? null}
              tone="default"
              href={LINKS.searchQueries}
            />
            <Card radius={3} shadow={1} padding={4} tone="transparent">
              <Flex align="center" gap={3}>
                <TrendUpwardIcon />
                <Text size={1} muted>
                  Traffic (Google Analytics) — not connected. Ask to set this up if you want it here.
                </Text>
              </Flex>
            </Card>
          </Grid>
        </Stack>
      </Stack>
    </Box>
  )
}
