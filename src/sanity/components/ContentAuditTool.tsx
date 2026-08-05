import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

type AuditRow = {
  _id: string
  title?: string
  slug?: string
  hasImage: boolean
  hasAltText: boolean
  hasExcerpt: boolean
  hasCategory: boolean
}

type RawRow = {
  _id: string
  title?: string
  slug?: string
  mainImage?: unknown
  hasAltText: boolean
  excerpt?: string
  categories?: unknown[]
}

const ISSUE_LABELS = {
  hasImage: 'No featured image',
  hasAltText: 'Missing alt text',
  hasExcerpt: 'No excerpt',
  hasCategory: 'No category',
} as const

function issuesFor(row: AuditRow): (keyof typeof ISSUE_LABELS)[] {
  const issues: (keyof typeof ISSUE_LABELS)[] = []
  if (!row.hasImage) issues.push('hasImage')
  else if (!row.hasAltText) issues.push('hasAltText')
  if (!row.hasExcerpt) issues.push('hasExcerpt')
  if (!row.hasCategory) issues.push('hasCategory')
  return issues
}

// Not "stale by age" -- asked Asher directly and old posts aging isn't a
// problem he wants flagged. What's actually useful: metadata that's
// genuinely missing, regardless of when a post was published. Four checks,
// all reading fields that already exist -- no schema change, no scan to
// run, just a live query computed and shown immediately. A post with
// nothing wrong doesn't show up at all, so the list stays short and
// actionable rather than a wall of green checkmarks.
export function ContentAuditTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<AuditRow[] | null>(null)

  const load = useCallback(() => {
    client
      .fetch<RawRow[]>(
        `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
          _id, title, "slug": slug.current, mainImage,
          "hasAltText": defined(coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText)),
          excerpt, categories
        }`,
      )
      .then((raw) =>
        setRows(
          raw.map((r) => ({
            _id: r._id,
            title: r.title,
            slug: r.slug,
            hasImage: !!r.mainImage,
            hasAltText: r.hasAltText,
            hasExcerpt: !!r.excerpt,
            hasCategory: !!r.categories?.length,
          })),
        ),
      )
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const flagged = rows.filter((r) => issuesFor(r).length > 0)

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3} wrap="wrap">
            <Text size={3} weight="bold">
              Content Audit
            </Text>
            <Badge tone={flagged.length > 0 ? 'caution' : 'positive'} fontSize={1}>
              {flagged.length > 0 ? `${flagged.length} need attention` : 'Nothing to flag'}
            </Badge>
          </Flex>
          <Text size={1} muted>
            Every published post checked for a featured image, image alt text, an excerpt, and at least
            one category — the things that actually affect how a post reads and shares, not how old it
            is. A post with nothing missing doesn&rsquo;t show up below.
          </Text>
        </Stack>

        {flagged.length === 0 && (
          <Text size={1} muted>
            No posts are missing any of the four checks.
          </Text>
        )}

        {flagged.length > 0 && (
          <Stack space={3}>
            {flagged.map((row) => (
              <Card key={row._id} padding={3} radius={2} border>
                <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
                  <Stack space={2} style={{minWidth: 0, flex: 1}}>
                    <Text size={1} weight="medium" textOverflow="ellipsis">
                      {row.title || 'Untitled'}
                    </Text>
                    <Flex gap={2} wrap="wrap">
                      {issuesFor(row).map((key) => (
                        <Badge key={key} tone="caution" fontSize={0}>
                          {ISSUE_LABELS[key]}
                        </Badge>
                      ))}
                    </Flex>
                  </Stack>
                  <Button
                    text="Open post"
                    mode="ghost"
                    fontSize={0}
                    padding={2}
                    onClick={() => window.open(`/studio/structure/post;${row._id}`, '_blank')}
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
