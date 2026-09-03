import {Fragment, useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Checkbox, Flex, Select, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {useClient} from 'sanity'
import {openPostInStudio} from '../lib/openPostInStudio'
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
  postedTo?: {
    facebook?: string
    instagram?: string
    tiktok?: string
    youtube?: string
    linkedin?: string
    x?: string
    threads?: string
  }
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

const PLATFORMS = [
  {key: 'facebook', label: 'Facebook'},
  {key: 'instagram', label: 'Instagram'},
  {key: 'tiktok', label: 'TikTok'},
  {key: 'youtube', label: 'YouTube'},
  {key: 'linkedin', label: 'LinkedIn'},
  {key: 'x', label: 'X'},
  {key: 'threads', label: 'Threads'},
] as const

export function DistributionDashboardTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [shareLogs, setShareLogs] = useState<Record<string, ShareLog>>({})
  const [linkPagePostIds, setLinkPagePostIds] = useState<Set<string>>(new Set())
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [noteDrafts, setNoteDrafts] = useState<Record<string, {note: string; platform: string}>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [postsResult, shareLogResult, aiLogResult, linkPageResult] = await Promise.all([
      client.fetch<Post[]>(
        `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id, title, "slug": slug.current, publishedAt, "facebookUrl": socialLinks[platform == "Facebook"][0].url, "instagramUrl": socialLinks[platform == "Instagram"][0].url, "tiktokUrl": socialLinks[platform == "TikTok"][0].url, "youtubeUrl": socialLinks[platform == "YouTube"][0].url, "linkedinUrl": socialLinks[platform == "LinkedIn"][0].url}`,
      ),
      client.fetch<ShareLog[]>(
        `*[_type == "shareLog"]{postSlug, totalShares, postedTo, newsletterSent, facebookCommentsLastPulledAt, facebookCommentsLastPulledCount, instagramCommentsLastPulledAt, instagramCommentsLastPulledCount, tiktokCommentsLastPulledAt, tiktokCommentsLastPulledCount, youtubeCommentsLastPulledAt, youtubeCommentsLastPulledCount, linkedinCommentsLastPulledAt, linkedinCommentsLastPulledCount, engagementNotes}`,
      ),
      client.fetch<AiLog[]>(`*[_type == "aiOutputLog"]{feature, postSlug, _createdAt, usedActions[]{action}}`),
      client.fetch<{items?: Array<{post?: {_ref: string}}>} | null>(
        `*[_type == "linkPage"][0]{items[]{post{_ref}}}`,
      ),
    ])
    setPosts(postsResult)
    setShareLogs(Object.fromEntries(shareLogResult.map((s) => [s.postSlug, s])))
    setAiLogs(aiLogResult)
    const linkIds = new Set((linkPageResult?.items ?? []).map((i) => i.post?._ref).filter(Boolean))
    setLinkPagePostIds(linkIds)
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

  async function togglePlatform(postSlug: string, platform: string, currentValue: string | undefined) {
    const shareLogId = `share-${postSlug}`
    const newValue = currentValue ? undefined : new Date().toISOString()

    try {
      await client.patch(shareLogId).set({postedTo: {[platform]: newValue}}).commit()
      await load()
    } catch (error) {
      console.error(`Failed to update ${platform}:`, error)
    }
  }

  async function toggleNewsletter(postSlug: string, currentValue: string | undefined) {
    const shareLogId = `share-${postSlug}`
    const newValue = currentValue ? undefined : new Date().toISOString()

    try {
      await client.patch(shareLogId).set({newsletterSent: newValue}).commit()
      await load()
    } catch (error) {
      console.error('Failed to update newsletter:', error)
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
  const commentsWaitingCount = Object.values(shareLogs).filter((log) => (log.engagementNotes ?? []).length > 0).length

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
          <Flex gap={3} wrap="wrap">
            <Badge tone={commentsWaitingCount > 0 ? 'caution' : 'default'} fontSize={0}>
              {commentsWaitingCount} post{commentsWaitingCount === 1 ? '' : 's'} with notes
            </Badge>
            <Badge tone="default" fontSize={0}>
              {posts.filter((p) => socialDraftedSlugs.has(p.slug)).length} social captions drafted
            </Badge>
          </Flex>
        </Stack>

        <div style={{overflowX: 'auto'}}>
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
                  borderBottom: '1px solid var(--card-border-color)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--card-bg-color)',
                }}
              >
                <th style={{padding: '8px', textAlign: 'left', fontWeight: 500, width: '240px'}}>Post</th>
                <th style={{padding: '8px', textAlign: 'center', fontWeight: 500, width: '48px'}}>📝</th>
                {PLATFORMS.map((p) => (
                  <th key={p.key} style={{padding: '8px', textAlign: 'center', fontWeight: 500, width: '56px'}}>
                    {p.label}
                  </th>
                ))}
                <th style={{padding: '8px', textAlign: 'center', fontWeight: 500, width: '56px'}}>📧</th>
                <th style={{padding: '8px', textAlign: 'center', fontWeight: 500, width: '56px'}}>📌</th>
                <th style={{padding: '8px', textAlign: 'center', fontWeight: 500, width: '48px'}}>💬</th>
                <th style={{padding: '8px', textAlign: 'left', fontWeight: 500, width: '80px'}}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const shareLog = shareLogs[post.slug]
                const isExpanded = expandedRows.has(post.slug)
                const isOnLinkPage = linkPagePostIds.has(post._id)
                const drafted = socialDraftedSlugs.has(post.slug)
                const notes = shareLog?.engagementNotes ?? []

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
                      {PLATFORMS.map((p) => {
                        const value = shareLog?.postedTo?.[p.key as keyof typeof shareLog.postedTo]
                        return (
                          <td key={p.key} style={{padding: '10px 8px', textAlign: 'center'}}>
                            <Checkbox
                              checked={Boolean(value)}
                              onChange={() => togglePlatform(post.slug, p.key, value)}
                            />
                          </td>
                        )
                      })}
                      <td style={{padding: '10px 8px', textAlign: 'center'}}>
                        <Checkbox
                          checked={Boolean(shareLog?.newsletterSent)}
                          onChange={() => toggleNewsletter(post.slug, shareLog?.newsletterSent)}
                        />
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center'}}>
                        {isOnLinkPage ? <span title="On link page">✓</span> : <span style={{opacity: 0.3}}>—</span>}
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
                        {notes.length > 0 ? <Badge tone="caution">{notes.length}</Badge> : null}
                      </td>
                      <td style={{padding: '10px 8px'}}>
                        <Button
                          text="Open"
                          mode="ghost"
                          fontSize={0}
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
                        <td colSpan={100} style={{padding: '16px 8px'}}>
                          <Stack space={3}>
                            <SharePanel postId={post._id} title={post.title} slug={post.slug} />

                            <Stack space={2}>
                              <Text size={0} weight="medium" muted>
                                Pull comments from platforms
                              </Text>
                              <Flex gap={2} wrap="wrap">
                                {post.facebookUrl && (
                                  <PullSocialCommentsButton
                                    platform="facebook"
                                    postId={post._id}
                                    lastPulledAt={shareLog?.facebookCommentsLastPulledAt}
                                    lastPulledCount={shareLog?.facebookCommentsLastPulledCount}
                                    onPulled={load}
                                  />
                                )}
                                {post.instagramUrl && (
                                  <PullSocialCommentsButton
                                    platform="instagram"
                                    postId={post._id}
                                    lastPulledAt={shareLog?.instagramCommentsLastPulledAt}
                                    lastPulledCount={shareLog?.instagramCommentsLastPulledCount}
                                    onPulled={load}
                                  />
                                )}
                                {post.tiktokUrl && (
                                  <PullSocialCommentsButton
                                    platform="tiktok"
                                    postId={post._id}
                                    lastPulledAt={shareLog?.tiktokCommentsLastPulledAt}
                                    lastPulledCount={shareLog?.tiktokCommentsLastPulledCount}
                                    onPulled={load}
                                  />
                                )}
                                {post.youtubeUrl && (
                                  <PullSocialCommentsButton
                                    platform="youtube"
                                    postId={post._id}
                                    lastPulledAt={shareLog?.youtubeCommentsLastPulledAt}
                                    lastPulledCount={shareLog?.youtubeCommentsLastPulledCount}
                                    onPulled={load}
                                  />
                                )}
                                {post.linkedinUrl && (
                                  <PullSocialCommentsButton
                                    platform="linkedin"
                                    postId={post._id}
                                    lastPulledAt={shareLog?.linkedinCommentsLastPulledAt}
                                    lastPulledCount={shareLog?.linkedinCommentsLastPulledCount}
                                    onPulled={load}
                                  />
                                )}
                              </Flex>
                            </Stack>

                            {notes.length > 0 && (
                              <Stack space={2}>
                                <Text size={0} weight="medium" muted>
                                  Engagement notes
                                </Text>
                                <Stack space={1}>
                                  {[...notes].reverse().map((n) => (
                                    <Text key={n._key} size={0} muted>
                                      {n.timestamp ? `${new Date(n.timestamp).toLocaleDateString()} — ` : ''}
                                      {n.platform ? `[${n.platform}] ` : ''}
                                      {n.note}
                                    </Text>
                                  ))}
                                </Stack>
                              </Stack>
                            )}

                            <Stack space={1}>
                              <Text size={0} weight="medium" muted>
                                Add note
                              </Text>
                              <Flex gap={2} align="flex-start">
                                <Box style={{flex: '1 1 200px'}}>
                                  <TextArea
                                    fontSize={0}
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
                                  fontSize={0}
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
                                  style={{width: 120}}
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
                                  fontSize={0}
                                  padding={2}
                                  disabled={!(noteDrafts[post.slug]?.note?.trim()) || savingSlug === post.slug}
                                  onClick={() => saveNote(post.slug, post.title)}
                                />
                              </Flex>
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
