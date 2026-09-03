import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Select, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {useClient} from 'sanity'
import {openPostInStudio} from '../lib/openPostInStudio'
import {SharePanel} from './SharePanel'
import {PullFacebookCommentsButton} from './PullFacebookCommentsButton'

type Post = {_id: string; title: string; slug: string; publishedAt?: string; facebookUrl?: string}
type EngagementNote = {_key: string; note?: string; platform?: string; timestamp?: string}
type ShareLog = {
  postSlug: string
  totalShares?: number
  xCount?: number
  facebookCount?: number
  linkedinCount?: number
  whatsappCount?: number
  engagementNotes?: EngagementNote[]
  facebookCommentsLastPulledAt?: string
  facebookCommentsLastPulledCount?: number
}
type AiLog = {feature: string; postSlug?: string; _createdAt: string; usedActions?: {action?: string}[]}

const PLATFORMS = ['X (Twitter)', 'LinkedIn', 'Facebook', 'WhatsApp', 'Email', 'Other']

function shareLogId(slug: string): string {
  return `share-${slug}`
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function monthStartISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

// Ties together three things that were each already tracked separately --
// which posts have drafted social copy (AI Output Log), how many times
// each was actually shared (Social Shares), and now a place to jot down
// engagement by hand -- into one per-post view. This is the ACE spec's
// "distribution dashboard": Tier 1 (drafted copy + share counts + open
// post, in one place) and Tier 2 (a manual engagement log) together.
// Deliberately not automated engagement pulled from X/Facebook/LinkedIn's
// own APIs -- ACE_MASTER_SPEC.md is explicit that isn't worth the ongoing
// fees/OAuth/platform churn for a solo creator.
export function DistributionDashboardTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [shareLogs, setShareLogs] = useState<Record<string, ShareLog>>({})
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [noteDrafts, setNoteDrafts] = useState<Record<string, {note: string; platform: string}>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [postsResult, shareLogResult, aiLogResult] = await Promise.all([
      client.fetch<Post[]>(
        `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, "slug": slug.current, publishedAt, "facebookUrl": socialLinks[platform == "Facebook"][0].url}`,
      ),
      client.fetch<ShareLog[]>(
        `*[_type == "shareLog"]{postSlug, totalShares, xCount, facebookCount, linkedinCount, whatsappCount, engagementNotes, facebookCommentsLastPulledAt, facebookCommentsLastPulledCount}`,
      ),
      client.fetch<AiLog[]>(`*[_type == "aiOutputLog"]{feature, postSlug, _createdAt, usedActions[]{action}}`),
    ])
    setPosts(postsResult)
    setShareLogs(Object.fromEntries(shareLogResult.map((s) => [s.postSlug, s])))
    setAiLogs(aiLogResult)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  function toggleExpanded(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function saveNote(slug: string, title: string) {
    const draft = noteDrafts[slug]
    if (!draft?.note?.trim()) return
    setSavingSlug(slug)
    try {
      const id = shareLogId(slug)
      await client.createIfNotExists({
        _id: id,
        _type: 'shareLog',
        postSlug: slug,
        postTitle: title,
        totalShares: 0,
        xCount: 0,
        facebookCount: 0,
        linkedinCount: 0,
        whatsappCount: 0,
        emailCount: 0,
        copyLinkCount: 0,
        nativeCount: 0,
        engagementNotes: [],
      })
      const entry: EngagementNote = {
        _key: randomKey(),
        note: draft.note.trim(),
        platform: draft.platform || undefined,
        timestamp: new Date().toISOString(),
      }
      await client.patch(id).setIfMissing({engagementNotes: []}).append('engagementNotes', [entry]).commit()
      setNoteDrafts((prev) => ({...prev, [slug]: {note: '', platform: ''}}))
      await load()
    } finally {
      setSavingSlug(null)
    }
  }

  if (!posts) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const socialDraftedSlugs = new Set(aiLogs.filter((l) => l.feature === 'social').map((l) => l.postSlug))
  // Generation is still bundled (one suggest-social call drafts X/LinkedIn/
  // Facebook together -- see socialDraftedSlugs above), but "used" is
  // tracked per-platform via the exact strings SuggestSocialCopyShared.tsx
  // logs on each copy-button click ("Copied Facebook caption (option N)").
  // Only the display splits Facebook out here, not the generation itself.
  const facebookCopiedSlugs = new Set(
    aiLogs
      .filter((l) => l.feature === 'social' && l.usedActions?.some((a) => a.action?.startsWith('Copied Facebook caption')))
      .map((l) => l.postSlug),
  )
  const monthStart = monthStartISO()
  const usageThisMonth = aiLogs.filter((l) => l._createdAt >= monthStart).length
  const usageByFeature = aiLogs.reduce<Record<string, number>>((acc, l) => {
    acc[l.feature] = (acc[l.feature] ?? 0) + 1
    return acc
  }, {})

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Distribution
          </Text>
          <Text size={1} muted>
            Every post — whether social copy&rsquo;s been drafted, how many times it&rsquo;s actually been
            shared, and a place to jot down engagement by hand (a reply, a comment elsewhere) since none of
            that gets pulled automatically from X/LinkedIn/Facebook. &ldquo;Share this post&rdquo; drafts
            captions on demand, written to stand alone with no link attached — post the caption first, then
            paste the link as a follow-up reply/comment, which is what actually gets more reach on X and
            LinkedIn specifically.
          </Text>
          <Flex gap={3} wrap="wrap">
            <Badge tone="primary" fontSize={0}>
              {usageThisMonth} AI suggestion{usageThisMonth === 1 ? '' : 's'} this month
            </Badge>
            <Badge tone="default" fontSize={0}>
              {aiLogs.length} all time — SEO {usageByFeature.seo ?? 0} · Social {usageByFeature.social ?? 0} ·
              Image {usageByFeature.imagePrompt ?? 0}
            </Badge>
          </Flex>
        </Stack>

        <Stack space={3}>
          {posts.map((post) => {
            const isOpen = expanded.has(post.slug)
            const shareLog = shareLogs[post.slug]
            const notes = shareLog?.engagementNotes ?? []
            const drafted = socialDraftedSlugs.has(post.slug)
            const facebookCopied = facebookCopiedSlugs.has(post.slug)
            const draft = noteDrafts[post.slug] ?? {note: '', platform: ''}

            return (
              <Card key={post.slug} padding={3} radius={2} border>
                <Stack space={3}>
                  <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                    <Text size={1} weight="medium">
                      {post.title}
                    </Text>
                    <Flex align="center" gap={2}>
                      <Badge tone={drafted ? 'positive' : 'default'} fontSize={0}>
                        {drafted ? 'Social copy drafted' : 'Not drafted yet'}
                      </Badge>
                      {drafted && (
                        <Badge tone={facebookCopied ? 'positive' : 'caution'} fontSize={0}>
                          {facebookCopied ? 'Facebook copied' : 'Facebook not copied yet'}
                        </Badge>
                      )}
                      <Badge tone="default" fontSize={0}>
                        {shareLog?.totalShares ?? 0} share{(shareLog?.totalShares ?? 0) === 1 ? '' : 's'}
                      </Badge>
                      <Button
                        text="Open post"
                        mode="ghost"
                        fontSize={0}
                        padding={2}
                        onClick={() => openPostInStudio(post._id)}
                      />
                    </Flex>
                  </Flex>

                  <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
                    <SharePanel postId={post._id} title={post.title} slug={post.slug} />
                    {post.facebookUrl && (
                      <PullFacebookCommentsButton
                        postId={post._id}
                        lastPulledAt={shareLog?.facebookCommentsLastPulledAt}
                        lastPulledCount={shareLog?.facebookCommentsLastPulledCount}
                        onPulled={load}
                      />
                    )}
                  </Flex>

                  <Text
                    size={0}
                    style={{cursor: 'pointer', textDecoration: 'underline'}}
                    onClick={() => toggleExpanded(post.slug)}
                  >
                    {isOpen ? 'Hide' : 'Show'} engagement notes ({notes.length})
                  </Text>

                  {isOpen && (
                    <Stack space={3}>
                      {notes.length > 0 && (
                        <Stack space={2}>
                          {[...notes].reverse().map((n) => (
                            <Text key={n._key} size={1} muted>
                              {n.timestamp ? `${new Date(n.timestamp).toLocaleDateString()} — ` : ''}
                              {n.platform ? `[${n.platform}] ` : ''}
                              {n.note}
                            </Text>
                          ))}
                        </Stack>
                      )}
                      <Flex gap={2} wrap="wrap" align="flex-start">
                        <Box style={{flex: '1 1 240px'}}>
                          <TextArea
                            fontSize={1}
                            rows={2}
                            placeholder="e.g. Got 3 replies on LinkedIn asking about..."
                            value={draft.note}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({
                                ...prev,
                                [post.slug]: {...draft, note: e.currentTarget.value},
                              }))
                            }
                          />
                        </Box>
                        <Select
                          fontSize={1}
                          value={draft.platform}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [post.slug]: {...draft, platform: e.currentTarget.value},
                            }))
                          }
                          style={{width: 150}}
                        >
                          <option value="">Platform (optional)</option>
                          {PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </Select>
                        <Button
                          text={savingSlug === post.slug ? 'Saving…' : 'Add note'}
                          tone="primary"
                          fontSize={1}
                          disabled={!draft.note.trim() || savingSlug === post.slug}
                          onClick={() => saveNote(post.slug, post.title)}
                        />
                      </Flex>
                    </Stack>
                  )}
                </Stack>
              </Card>
            )
          })}
        </Stack>
      </Stack>
    </Box>
  )
}
