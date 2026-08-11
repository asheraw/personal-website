import {useCallback, useEffect, useState} from 'react'
import {Badge, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {CloseIcon} from '@sanity/icons/Close'
import {useClient} from 'sanity'
import {openPostInStudio} from '../lib/openPostInStudio'

type AuditRow = {
  _id: string
  title?: string
  hasImage: boolean
  hasAltText: boolean
  hasExcerpt: boolean
  hasCategory: boolean
  dismissed: string[]
}

type RawRow = {
  _id: string
  title?: string
  mainImage?: unknown
  hasAltText: boolean
  excerpt?: string
  categories?: unknown[]
  contentAuditDismissed?: string[]
}

const ISSUE_LABELS = {
  hasImage: 'No featured image',
  hasAltText: 'Missing alt text',
  hasExcerpt: 'No excerpt',
  hasCategory: 'No category',
} as const

type IssueKey = keyof typeof ISSUE_LABELS

function issuesFor(row: AuditRow): IssueKey[] {
  const issues: IssueKey[] = []
  if (!row.hasImage) issues.push('hasImage')
  else if (!row.hasAltText) issues.push('hasAltText')
  if (!row.hasExcerpt) issues.push('hasExcerpt')
  if (!row.hasCategory) issues.push('hasCategory')
  return issues
}

// Not "stale by age" -- asked Asher directly and old posts aging isn't a
// problem he wants flagged. What's actually useful: metadata that's
// genuinely missing, regardless of when a post was published. Four checks,
// all reading fields that already exist -- no schema change for the checks
// themselves, just a live query computed and shown immediately. A post
// with nothing wrong doesn't show up at all, so the list stays short and
// actionable rather than a wall of green checkmarks.
//
// Dismissal is per-check, not per-post (2026-08-11, Asher's own call) --
// "dismissing at the post level might catch too many issues and swipe them
// under the carpet." A post can have "no excerpt" dismissed while "missing
// alt text" still shows, and a dismissed check is always reversible from
// the "Dismissed" section below, never silently gone for good.
//
// No page-level title/padding of its own -- rendered as one tab inside
// ContentHealthTool.tsx, which provides the shared page chrome, alongside
// LinkCheckerTool as the other tab (merged 2026-08-05, real overlap: both
// are "which posts need a look" checks).
export function ContentAuditTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [showDismissed, setShowDismissed] = useState(false)

  const load = useCallback(() => {
    client
      .fetch<RawRow[]>(
        `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
          _id, title, mainImage,
          "hasAltText": defined(coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText)),
          excerpt, categories, contentAuditDismissed
        }`,
      )
      .then((raw) =>
        setRows(
          raw.map((r) => ({
            _id: r._id,
            title: r.title,
            hasImage: !!r.mainImage,
            hasAltText: r.hasAltText,
            hasExcerpt: !!r.excerpt,
            hasCategory: !!r.categories?.length,
            dismissed: r.contentAuditDismissed ?? [],
          })),
        ),
      )
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  const setDismissed = useCallback(
    async (postId: string, next: string[]) => {
      const key = postId
      setPending((prev) => new Set(prev).add(key))
      try {
        await client.patch(postId).set({contentAuditDismissed: next}).commit()
        setRows((prev) => prev?.map((r) => (r._id === postId ? {...r, dismissed: next} : r)) ?? prev)
      } finally {
        setPending((prev) => {
          const copy = new Set(prev)
          copy.delete(key)
          return copy
        })
      }
    },
    [client],
  )

  const dismiss = (row: AuditRow, key: IssueKey) => setDismissed(row._id, [...row.dismissed, key])
  const restore = (row: AuditRow, key: IssueKey) =>
    setDismissed(
      row._id,
      row.dismissed.filter((k) => k !== key),
    )

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const withActiveIssues = rows
    .map((row) => ({row, active: issuesFor(row).filter((k) => !row.dismissed.includes(k))}))
    .filter(({active}) => active.length > 0)
  const withDismissed = rows
    .map((row) => ({row, dismissedActive: issuesFor(row).filter((k) => row.dismissed.includes(k)), all: issuesFor(row)}))
    // A dismissed check only stays interesting to review while the
    // underlying issue is still actually true -- if the post got an
    // excerpt added later, "no excerpt" isn't an issue anymore whether or
    // not it was ever dismissed, so it shouldn't clutter this list either.
    .filter(({dismissedActive}) => dismissedActive.length > 0)

  return (
    <Stack space={4}>
      <Stack space={2}>
        <Flex align="center" gap={3} wrap="wrap">
          <Badge tone={withActiveIssues.length > 0 ? 'caution' : 'positive'} fontSize={1}>
            {withActiveIssues.length > 0 ? `${withActiveIssues.length} need attention` : 'Nothing to flag'}
          </Badge>
          {withDismissed.length > 0 && (
            <Button
              text={showDismissed ? 'Hide dismissed' : `Show dismissed (${withDismissed.length})`}
              mode="bleed"
              fontSize={0}
              padding={2}
              onClick={() => setShowDismissed((v) => !v)}
            />
          )}
        </Flex>
        <Text size={1} muted>
          Every published post checked for a featured image, image alt text, an excerpt, and at least one
          category — the things that actually affect how a post reads and shares, not how old it is. Click
          the &times; on a badge to dismiss that specific check for that post &mdash; dismissed checks stay
          reviewable below, never silently hidden for good.
        </Text>
      </Stack>

      {withActiveIssues.length === 0 && (
        <Text size={1} muted>
          No posts have an active (non-dismissed) issue.
        </Text>
      )}

      {withActiveIssues.length > 0 && (
        <Stack space={3}>
          {withActiveIssues.map(({row, active}) => (
            <Card key={row._id} padding={3} radius={2} border>
              <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
                <Stack space={2} style={{minWidth: 0, flex: 1}}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {row.title || 'Untitled'}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    {active.map((key) => (
                      <Badge key={key} tone="caution" fontSize={0} padding={2}>
                        <Flex align="center" gap={2}>
                          {ISSUE_LABELS[key]}
                          <button
                            type="button"
                            aria-label={`Dismiss "${ISSUE_LABELS[key]}" for this post`}
                            disabled={pending.has(row._id)}
                            onClick={() => dismiss(row, key)}
                            style={{
                              display: 'inline-flex',
                              border: 'none',
                              background: 'transparent',
                              cursor: pending.has(row._id) ? 'default' : 'pointer',
                              padding: 0,
                              color: 'inherit',
                            }}
                          >
                            <CloseIcon />
                          </button>
                        </Flex>
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
                <Button
                  text="Open post"
                  mode="ghost"
                  fontSize={0}
                  padding={2}
                  onClick={() => openPostInStudio(row._id)}
                />
              </Flex>
            </Card>
          ))}
        </Stack>
      )}

      {showDismissed && withDismissed.length > 0 && (
        <Stack space={3}>
          <Text size={1} weight="semibold" muted>
            Dismissed
          </Text>
          {withDismissed.map(({row, dismissedActive}) => (
            <Card key={row._id} padding={3} radius={2} border tone="transparent">
              <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
                <Stack space={2} style={{minWidth: 0, flex: 1}}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {row.title || 'Untitled'}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    {dismissedActive.map((key) => (
                      <Badge key={key} tone="default" fontSize={0} padding={2}>
                        <Flex align="center" gap={2}>
                          {ISSUE_LABELS[key]}
                          <button
                            type="button"
                            aria-label={`Restore "${ISSUE_LABELS[key]}" for this post`}
                            disabled={pending.has(row._id)}
                            onClick={() => restore(row, key)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: pending.has(row._id) ? 'default' : 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                              fontSize: 11,
                              color: 'inherit',
                            }}
                          >
                            Restore
                          </button>
                        </Flex>
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
                <Button
                  text="Open post"
                  mode="ghost"
                  fontSize={0}
                  padding={2}
                  onClick={() => openPostInStudio(row._id)}
                />
              </Flex>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
