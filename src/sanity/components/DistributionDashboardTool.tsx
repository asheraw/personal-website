import {Fragment, useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Checkbox, Flex, Select, Spinner, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons/Search'
import {useClient} from 'sanity'
import {openPostInStudio} from '../lib/openPostInStudio'
import {PLATFORM_META, PlatformIcon, type SocialPlatform} from '../lib/platformIcons'
import {SharePanel} from './SharePanel'
import {PullSocialCommentsButton} from './PullSocialCommentsButton'

type Post = {
  _id: string
  title: string
  slug: string
  publishedAt?: string
  facebookUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  linkedinUrl?: string
}
type EngagementNote = {_key: string; note?: string; platform?: string; timestamp?: string}

type ShareLog = {
  postSlug: string
  totalShares?: number
  postedTo?: Partial<Record<SocialPlatform, string>>
  newsletterSent?: string
  facebookCommentsLastPulledAt?: string
  facebookCommentsLastPulledCount?: number
  instagramCommentsLastPulledAt?: string
  instagramCommentsLastPulledCount?: number
  tiktokCommentsLastPulledAt?: string
  tiktokCommentsLastPulledCount?: number
  youtubeCommentsLastPulledAt?: string
  youtubeCommentsLastPulledCount?: number
  linkedinCommentsLastPulledAt?: string
  linkedinCommentsLastPulledCount?: number
  engagementNotes?: EngagementNote[]
}

type AiLog = {feature: string; postSlug?: string; _createdAt: string; usedActions?: {action?: string}[]}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'threads']
// Only these five have a working Apify scraper behind them (see
// src/app/api/ai/pull-*-comments) -- X and Threads get one combined,
// permanently-disabled row instead of a broken button each.
const PULLABLE_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin']

type FilterKey = 'all' | 'needsPosting' | 'commentsWaiting'

function hasAnyDistribution(log: ShareLog | undefined): boolean {
  if (!log) return false
  if (log.newsletterSent) return true
  return Boolean(log.postedTo && Object.values(log.postedTo).some(Boolean))
}

export function DistributionDashboardTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [shareLogs, setShareLogs] = useState<Record<string, ShareLog>>({})
  const [linkPagePostIds, setLinkPagePostIds] = useState<Set<string>>(new Set())
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [pendingCommentsByPost, setPendingCommentsByPost] = useState<Record<string, number>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [noteDrafts, setNoteDrafts] = useState<Record<string, {note: string; platform: string}>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const load = useCallback(async () => {
    const [postsResult, shareLogResult, aiLogResult, linkPageResult, pendingCommentsResult] = await Promise.all([
      client.fetch<Post[]>(
        // !(_id in path("drafts.**")) excludes the draft half of a post
        // that's currently being edited -- without it, an in-progress post
        // matches this query twice (its published _id and its drafts.<id>
        // counterpart, same slug on both), producing a duplicate React key.
        `*[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current)] | order(publishedAt desc){_id, title, "slug": slug.current, publishedAt, "facebookUrl": socialLinks[platform == "Facebook"][0].url, "instagramUrl": socialLinks[platform == "Instagram"][0].url, "tiktokUrl": socialLinks[platform == "TikTok"][0].url, "youtubeUrl": socialLinks[platform == "YouTube"][0].url, "linkedinUrl": socialLinks[platform == "LinkedIn"][0].url}`,
      ),
      client.fetch<ShareLog[]>(
        `*[_type == "shareLog"]{postSlug, totalShares, postedTo, newsletterSent, facebookCommentsLastPulledAt, facebookCommentsLastPulledCount, instagramCommentsLastPulledAt, instagramCommentsLastPulledCount, tiktokCommentsLastPulledAt, tiktokCommentsLastPulledCount, youtubeCommentsLastPulledAt, youtubeCommentsLastPulledCount, linkedinCommentsLastPulledAt, linkedinCommentsLastPulledCount, engagementNotes}`,
      ),
      client.fetch<AiLog[]>(`*[_type == "aiOutputLog"]{feature, postSlug, _createdAt, usedActions[]{action}}`),
      client.fetch<{items?: Array<{post?: {_ref: string}}>} | null>(
        `*[_type == "linkPage"][0]{items[]{post{_ref}}}`,
      ),
      // Same "comment" documents the Comments moderation tool works from --
      // pulled social comments land here too (see socialCommentImport.ts),
      // so this is the real "needs your approval" count per post, not the
      // separate freeform engagement-notes log below.
      client.fetch<{postId: string}[]>(
        `*[_type == "comment" && status == "pending" && defined(post._ref)]{"postId": post._ref}`,
      ),
    ])
    setPosts(postsResult)
    setShareLogs(Object.fromEntries(shareLogResult.map((s) => [s.postSlug, s])))
    setAiLogs(aiLogResult)
    const linkIds = new Set(
      (linkPageResult?.items ?? []).map((i) => i.post?._ref).filter((ref): ref is string => Boolean(ref)),
    )
    setLinkPagePostIds(linkIds)
    const pendingCounts: Record<string, number> = {}
    for (const c of pendingCommentsResult) {
      if (!c.postId) continue
      pendingCounts[c.postId] = (pendingCounts[c.postId] ?? 0) + 1
    }
    setPendingCommentsByPost(pendingCounts)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  function toggleRow(slug: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  // Applies a change to one post's local shareLog state immediately, before
  // the network call resolves -- a checkbox should tick the instant you
  // click it, not wait on a create-if-missing + patch round trip (and
  // previously a full dashboard reload on top of that, see load() below).
  function updateShareLogLocally(slug: string, updater: (log: ShareLog) => ShareLog) {
    setShareLogs((prev) => ({
      ...prev,
      [slug]: updater(prev[slug] ?? {postSlug: slug}),
    }))
  }

  async function togglePlatform(post: Post, platform: string, currentValue: string | undefined) {
    const shareLogId = `share-${post.slug}`
    const newValue = currentValue ? undefined : new Date().toISOString()

    updateShareLogLocally(post.slug, (log) => ({...log, postedTo: {...log.postedTo, [platform]: newValue}}))

    try {
      // createIfNotExists is a no-op once the doc already exists (from a
      // note, a comment pull, or an earlier checkbox) -- needed here
      // because plenty of posts have never had a shareLog created yet, and
      // patching a document that doesn't exist fails outright.
      await client.createIfNotExists({
        _id: shareLogId,
        _type: 'shareLog',
        postSlug: post.slug,
        postTitle: post.title,
        totalShares: 0,
      })
      const patch = client.patch(shareLogId)
      // .set({postedTo: {[platform]: ...}}) would REPLACE the whole
      // postedTo object, wiping every other platform already checked --
      // the path form only touches this one sub-field. unset (not a
      // set-to-undefined, which JSON silently drops from the request body
      // entirely) is what actually clears a checkbox back off.
      if (currentValue) {
        await patch.unset([`postedTo.${platform}`]).commit()
      } else {
        await patch.set({[`postedTo.${platform}`]: newValue}).commit()
      }
    } catch (error) {
      console.error(`Failed to update ${platform}:`, error)
      updateShareLogLocally(post.slug, (log) => ({...log, postedTo: {...log.postedTo, [platform]: currentValue}}))
    }
  }

  async function toggleNewsletter(post: Post, currentValue: string | undefined) {
    const shareLogId = `share-${post.slug}`
    const newValue = currentValue ? undefined : new Date().toISOString()

    updateShareLogLocally(post.slug, (log) => ({...log, newsletterSent: newValue}))

    try {
      await client.createIfNotExists({
        _id: shareLogId,
        _type: 'shareLog',
        postSlug: post.slug,
        postTitle: post.title,
        totalShares: 0,
      })
      const patch = client.patch(shareLogId)
      if (currentValue) {
        await patch.unset(['newsletterSent']).commit()
      } else {
        await patch.set({newsletterSent: newValue}).commit()
      }
    } catch (error) {
      console.error('Failed to update newsletter:', error)
      updateShareLogLocally(post.slug, (log) => ({...log, newsletterSent: currentValue}))
    }
  }

  async function saveNote(slug: string, title: string) {
    const draft = noteDrafts[slug]
    if (!draft?.note?.trim()) return
    setSavingSlug(slug)
    try {
      const id = `share-${slug}`
      await client.createIfNotExists({
        _id: id,
        _type: 'shareLog',
        postSlug: slug,
        postTitle: title,
        totalShares: 0,
      })
      const entry: EngagementNote = {
        _key: Math.random().toString(36).slice(2, 10),
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
  // Generation is bundled (one suggest-social call drafts X/LinkedIn/
  // Facebook together), but "copied" is tracked per-platform via the exact
  // strings SuggestSocialCopyShared.tsx logs on each copy-button click.
  const facebookCopiedSlugs = new Set(
    aiLogs
      .filter((l) => l.feature === 'social' && l.usedActions?.some((a) => a.action?.startsWith('Copied Facebook caption')))
      .map((l) => l.postSlug),
  )
  const needsPostingCount = posts.filter((p) => !hasAnyDistribution(shareLogs[p.slug])).length
  const commentsWaitingPostCount = posts.filter((p) => (pendingCommentsByPost[p._id] ?? 0) > 0).length
  const totalPendingComments = Object.values(pendingCommentsByPost).reduce((sum, n) => sum + n, 0)

  const filteredPosts = posts.filter((post) => {
    if (searchQuery.trim() && !post.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false
    if (activeFilter === 'needsPosting' && hasAnyDistribution(shareLogs[post.slug])) return false
    if (activeFilter === 'commentsWaiting' && !(pendingCommentsByPost[post._id] > 0)) return false
    return true
  })

  const filterPills: {key: FilterKey; label: string; count: number}[] = [
    {key: 'all', label: 'All', count: posts.length},
    {key: 'needsPosting', label: 'Needs posting', count: needsPostingCount},
    {key: 'commentsWaiting', label: 'Comments waiting', count: commentsWaitingPostCount},
  ]

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={2} weight="bold">
            Distribution
          </Text>
          <Text size={1} muted>
            Where each post has been sent and what came back. Ticking a box is your own record — nothing posts
            anywhere automatically.
          </Text>
        </Stack>

        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Flex gap={2} align="center" wrap="wrap">
            <TextInput
              icon={SearchIcon}
              placeholder="Search posts…"
              fontSize={1}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{width: 220}}
            />
            {filterPills.map((pill) => (
              <Button
                key={pill.key}
                text={`${pill.label} ${pill.count}`}
                mode={activeFilter === pill.key ? 'default' : 'bleed'}
                tone={activeFilter === pill.key ? 'primary' : 'default'}
                fontSize={1}
                padding={3}
                onClick={() => setActiveFilter(pill.key)}
              />
            ))}
          </Flex>
          <Flex gap={3} wrap="wrap">
            <Badge tone={totalPendingComments > 0 ? 'caution' : 'default'} fontSize={1}>
              {totalPendingComments} comment{totalPendingComments === 1 ? '' : 's'} to review
            </Badge>
            <Badge tone="default" fontSize={1}>
              {aiLogs.length} AI draft{aiLogs.length === 1 ? '' : 's'} all time
            </Badge>
          </Flex>
        </Flex>

        {/* Bounded height + overflow:auto on both axes (not just overflowX) is
            required for position:sticky on the header rows to actually work --
            overflowX alone implicitly forces overflowY to auto too, but with
            no height limit the div just grows to fit everything, so it never
            becomes the real scrolling container and sticky has nothing to
            stick to. Giving it its own scrollbar here is what makes the
            header actually pin in place while the body scrolls underneath. */}
        <div style={{overflow: 'auto', maxHeight: 'calc(100vh - 340px)'}}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--card-bg-color)',
                  zIndex: 2,
                }}
              >
                <th colSpan={2}></th>
                <th
                  colSpan={ALL_PLATFORMS.length + 2}
                  style={{
                    padding: '4px 8px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--card-muted-fg-color)',
                  }}
                >
                  Posted to — your own record
                </th>
                <th colSpan={2}></th>
              </tr>
              <tr
                style={{
                  borderBottom: '1px solid var(--card-border-color)',
                  position: 'sticky',
                  top: '26px',
                  background: 'var(--card-bg-color)',
                  zIndex: 2,
                }}
              >
                <th style={{padding: '10px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 500, width: '240px'}}>
                  Post
                </th>
                <th
                  title="Social caption drafted"
                  style={{padding: '10px 8px', textAlign: 'center', fontSize: '18px', width: '48px'}}
                >
                  📝
                </th>
                {ALL_PLATFORMS.map((platform) => (
                  <th
                    key={platform}
                    title={PLATFORM_META[platform].label}
                    style={{padding: '10px 8px', textAlign: 'center', width: '52px'}}
                  >
                    <PlatformIcon platform={platform} size={20} />
                  </th>
                ))}
                <th
                  title="Newsletter sent"
                  style={{padding: '10px 8px', textAlign: 'center', fontSize: '18px', width: '52px'}}
                >
                  📧
                </th>
                <th
                  title="On link page"
                  style={{padding: '10px 8px', textAlign: 'center', fontSize: '18px', width: '52px'}}
                >
                  📌
                </th>
                <th
                  title="Comments waiting for review"
                  style={{padding: '10px 8px', textAlign: 'center', fontSize: '18px', width: '48px'}}
                >
                  💬
                </th>
                <th style={{padding: '10px 8px', textAlign: 'left', fontSize: '14px', fontWeight: 500, width: '80px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const shareLog = shareLogs[post.slug]
                const isExpanded = expandedRows.has(post.slug)
                const isOnLinkPage = linkPagePostIds.has(post._id)
                const drafted = socialDraftedSlugs.has(post.slug)
                const facebookCopied = facebookCopiedSlugs.has(post.slug)
                const notes = shareLog?.engagementNotes ?? []
                const pendingCount = pendingCommentsByPost[post._id] ?? 0

                const pullInfo: Partial<Record<SocialPlatform, {url?: string; lastPulledAt?: string; lastPulledCount?: number}>> = {
                  facebook: {
                    url: post.facebookUrl,
                    lastPulledAt: shareLog?.facebookCommentsLastPulledAt,
                    lastPulledCount: shareLog?.facebookCommentsLastPulledCount,
                  },
                  instagram: {
                    url: post.instagramUrl,
                    lastPulledAt: shareLog?.instagramCommentsLastPulledAt,
                    lastPulledCount: shareLog?.instagramCommentsLastPulledCount,
                  },
                  tiktok: {
                    url: post.tiktokUrl,
                    lastPulledAt: shareLog?.tiktokCommentsLastPulledAt,
                    lastPulledCount: shareLog?.tiktokCommentsLastPulledCount,
                  },
                  youtube: {
                    url: post.youtubeUrl,
                    lastPulledAt: shareLog?.youtubeCommentsLastPulledAt,
                    lastPulledCount: shareLog?.youtubeCommentsLastPulledCount,
                  },
                  linkedin: {
                    url: post.linkedinUrl,
                    lastPulledAt: shareLog?.linkedinCommentsLastPulledAt,
                    lastPulledCount: shareLog?.linkedinCommentsLastPulledCount,
                  },
                }

                const captionsStatusText = !drafted
                  ? 'No captions drafted yet'
                  : facebookCopied
                    ? 'Captions drafted · Facebook copied'
                    : 'Captions drafted'

                return (
                  <Fragment key={post.slug}>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--card-border-color)',
                        backgroundColor: isExpanded ? 'var(--card-hover-bg-color)' : 'transparent',
                      }}
                    >
                      <td style={{padding: '10px 8px'}}>
                        <Text size={1} weight="medium" style={{cursor: 'pointer'}} onClick={() => toggleRow(post.slug)}>
                          {isExpanded ? '▼' : '▶'} {post.title}
                        </Text>
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center'}}>
                        {drafted ? <span title="Caption drafted">✓</span> : <span style={{opacity: 0.3}}>—</span>}
                      </td>
                      {ALL_PLATFORMS.map((platform) => {
                        const value = shareLog?.postedTo?.[platform]
                        return (
                          <td key={platform} style={{padding: '10px 8px', textAlign: 'center'}}>
                            <Checkbox
                              checked={Boolean(value)}
                              onChange={() => togglePlatform(post, platform, value)}
                            />
                          </td>
                        )
                      })}
                      <td style={{padding: '10px 8px', textAlign: 'center'}}>
                        <Checkbox
                          checked={Boolean(shareLog?.newsletterSent)}
                          onChange={() => toggleNewsletter(post, shareLog?.newsletterSent)}
                        />
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center'}}>
                        {isOnLinkPage ? <span title="On link page">✓</span> : <span style={{opacity: 0.3}}>—</span>}
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
                        {pendingCount > 0 ? <Badge tone="caution">{pendingCount}</Badge> : null}
                      </td>
                      <td style={{padding: '10px 8px'}}>
                        <Button
                          text="Open"
                          mode="ghost"
                          fontSize={1}
                          padding={2}
                          onClick={() => openPostInStudio(post._id)}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        style={{
                          borderBottom: '1px solid var(--card-border-color)',
                          backgroundColor: 'var(--card-hover-bg-color)',
                        }}
                      >
                        <td colSpan={100} style={{padding: '20px 16px'}}>
                          {/* The td spans every column (colSpan=100), so its own width is
                              the full ~13-column table -- well over 1600px. Without a cap
                              here, the notes textarea below (flex-grow) stretches to fill
                              that whole width, turning a normal-sized input into a mostly
                              empty box. */}
                          <Stack space={4} style={{maxWidth: '760px'}}>
                            <SharePanel postId={post._id} title={post.title} slug={post.slug} />

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
                              <Stack space={3}>
                                <Text
                                  size={1}
                                  weight="semibold"
                                  muted
                                  style={{letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px'}}
                                >
                                  Pull comments back
                                </Text>
                                <Stack space={4}>
                                  {PULLABLE_PLATFORMS.map((platform) => {
                                    const info = pullInfo[platform]
                                    const statusText = info?.lastPulledAt
                                      ? `${info.lastPulledCount ?? 0} pulled · ${new Date(info.lastPulledAt).toLocaleDateString()}`
                                      : info?.url
                                        ? 'Not pulled yet'
                                        : 'No link saved yet'
                                    return (
                                      <Flex key={platform} justify="space-between" align="center" gap={3}>
                                        <Flex align="center" gap={3}>
                                          <PlatformIcon platform={platform} size={22} />
                                          <Stack space={2}>
                                            <Text size={1} weight="medium">
                                              {PLATFORM_META[platform].label}
                                            </Text>
                                            <Text size={1} muted={!info?.lastPulledAt}>
                                              {statusText}
                                            </Text>
                                            {platform === 'instagram' && (
                                              <Text size={0} muted>
                                                Replies need a paid Apify plan
                                              </Text>
                                            )}
                                          </Stack>
                                        </Flex>
                                        <PullSocialCommentsButton
                                          platform={platform}
                                          postId={post._id}
                                          onPulled={load}
                                          disabled={!info?.url}
                                          disabledReason={!info?.url ? 'No link saved yet' : undefined}
                                        />
                                      </Flex>
                                    )
                                  })}
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <Stack space={2}>
                                      <Text size={1} weight="medium">
                                        X · Threads
                                      </Text>
                                      <Text size={1} muted>
                                        No reliable scraper worth building on yet
                                      </Text>
                                    </Stack>
                                    <Button
                                      text="Pull comments"
                                      mode="ghost"
                                      fontSize={1}
                                      padding={3}
                                      radius={6}
                                      disabled
                                      title="No reliable scraper worth building on yet"
                                    />
                                  </Flex>
                                </Stack>
                              </Stack>

                              <Stack space={3}>
                                <Text
                                  size={1}
                                  weight="semibold"
                                  muted
                                  style={{letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px'}}
                                >
                                  This post
                                </Text>
                                <Stack space={4}>
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <Text size={1}>
                                      {pendingCount > 0
                                        ? `${pendingCount} comment${pendingCount === 1 ? '' : 's'} waiting for your approval`
                                        : 'No comments waiting'}
                                    </Text>
                                    <Button
                                      text="Review"
                                      mode="ghost"
                                      tone={pendingCount > 0 ? 'primary' : undefined}
                                      fontSize={1}
                                      padding={3}
                                      radius={6}
                                      onClick={() => window.open('/studio/comments', '_blank')}
                                    />
                                  </Flex>
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <Text size={1}>
                                      {isOnLinkPage ? 'On the link page' : 'Not on the link page yet'}
                                    </Text>
                                    <Button
                                      text="Open link page"
                                      mode="ghost"
                                      fontSize={1}
                                      padding={3}
                                      radius={6}
                                      onClick={() => window.open('/studio/intent/edit/id=linkPage;type=linkPage/', '_blank')}
                                    />
                                  </Flex>
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <Text size={1}>{captionsStatusText}</Text>
                                    <Button
                                      text="Draft captions"
                                      mode="ghost"
                                      fontSize={1}
                                      padding={3}
                                      radius={6}
                                      onClick={() => openPostInStudio(post._id)}
                                    />
                                  </Flex>
                                </Stack>
                              </Stack>
                            </div>

                            <Stack space={3}>
                              <Text
                                size={1}
                                weight="semibold"
                                muted
                                style={{letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px'}}
                              >
                                Engagement notes
                              </Text>
                              {notes.length === 0 ? (
                                <Box
                                  padding={3}
                                  style={{border: '1px dashed var(--card-border-color)', borderRadius: 6}}
                                >
                                  <Text size={1} muted style={{fontStyle: 'italic'}}>
                                    No notes yet — jot down a reply or DM that happened off-site.
                                  </Text>
                                </Box>
                              ) : (
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
                              <Flex gap={2} align="flex-start">
                                <Box style={{flex: '1 1 200px'}}>
                                  <TextArea
                                    fontSize={1}
                                    rows={2}
                                    placeholder="e.g. Got 3 replies asking about..."
                                    value={noteDrafts[post.slug]?.note ?? ''}
                                    onChange={(e) =>
                                      setNoteDrafts((prev) => ({
                                        ...prev,
                                        [post.slug]: {
                                          ...prev[post.slug],
                                          note: e.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </Box>
                                <Select
                                  fontSize={1}
                                  value={noteDrafts[post.slug]?.platform ?? ''}
                                  onChange={(e) =>
                                    setNoteDrafts((prev) => ({
                                      ...prev,
                                      [post.slug]: {
                                        ...prev[post.slug],
                                        platform: e.currentTarget.value,
                                      },
                                    }))
                                  }
                                  style={{width: 130}}
                                >
                                  <option value="">Platform</option>
                                  <option value="Facebook">Facebook</option>
                                  <option value="Instagram">Instagram</option>
                                  <option value="TikTok">TikTok</option>
                                  <option value="YouTube">YouTube</option>
                                  <option value="LinkedIn">LinkedIn</option>
                                  <option value="X">X</option>
                                  <option value="Threads">Threads</option>
                                  <option value="Newsletter">Newsletter</option>
                                </Select>
                                <Button
                                  text={savingSlug === post.slug ? 'Saving…' : 'Add'}
                                  tone="primary"
                                  fontSize={1}
                                  padding={3}
                                  disabled={!(noteDrafts[post.slug]?.note?.trim()) || savingSlug === post.slug}
                                  onClick={() => saveNote(post.slug, post.title)}
                                />
                              </Flex>
                              <Text size={0} muted>
                                Links live on the post itself, under Discussion → Social links. Add one there and
                                its Pull button switches on here.
                              </Text>
                            </Stack>
                          </Stack>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Stack>
    </Box>
  )
}
