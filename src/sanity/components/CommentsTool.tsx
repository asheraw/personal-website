import {useCallback, useEffect, useMemo, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {useClient} from 'sanity'

// Shown as the name on every reply created from this tool. Cosmetic only --
// the frontend's distinct reply styling keys off isAuthorReply, not this
// string, so it's safe to change here later without touching anything else.
const REPLY_AUTHOR_NAME = 'Asher Aw'

// Per-browser "have I seen this" bookmark -- there's no reliable Studio-side
// notion of "unread" without a lot more infrastructure (a per-user read
// receipt document, effectively), so this is deliberately simple: whatever
// showed up since the last time this tool was open, in this browser, gets a
// "New" tag. Doesn't sync across devices -- known limitation, not a bug.
const LAST_SEEN_KEY = 'asheraw-comments-last-seen'

type CommentRow = {
  _id: string
  name: string
  email: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  postId: string | null
  postTitle: string | null
  postSlug: string | null
  parentComment: string | null
  isAuthorReply: boolean
}

type PostGroup = {
  postId: string | null
  postTitle: string | null
  comments: CommentRow[]
}

const STATUS_TONE: Record<CommentRow['status'], 'caution' | 'positive' | 'critical'> = {
  pending: 'caution',
  approved: 'positive',
  rejected: 'critical',
}

// A custom Studio tool (not a plain document-type list) so pending comments
// can be moderated with one click each, instead of opening, editing, and
// saving every comment individually.
//
// Redesigned 2026-07-31: the original version was a single flat
// chronological list mixing every post's comments together, which made it
// hard to scan and gave no way to tell "have I already seen this" short of
// the small pending badge -- which only helps if you happen to be looking
// at Studio's nav bar right when something new comes in. Now: comments are
// grouped by post, replies nest directly under the comment they answer
// instead of a muted "replying to" text reference, posts with something
// pending sort to the top, and a real per-post-and-per-comment "New" marker
// tracks what's actually new since the last time this tool was open in this
// browser. The always-visible in-app fix for "I didn't know to look" is the
// email notification sent on every new comment (src/app/api/comments) --
// this redesign is about the page being worth looking at once you do.
export function CommentsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  // Captured once, on mount, before this same visit overwrites it below --
  // so "New" during THIS visit reflects the PREVIOUS visit's bookmark, and
  // only the next visit sees today's activity as no-longer-new.
  const [lastSeenAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(LAST_SEEN_KEY)
    } catch {
      return null
    }
  })

  const load = useCallback(() => {
    client
      .fetch<CommentRow[]>(
        `*[_type == "comment"] | order(createdAt desc){
          _id, name, email, message, status, createdAt, isAuthorReply,
          "postId": post._ref, "postTitle": post->title, "postSlug": post->slug.current,
          "parentComment": parentComment._ref
        }`,
      )
      .then(setComments)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!comments) return
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
    } catch {
      // Private browsing / storage disabled -- "New" tags just won't
      // persist between visits. Not worth failing anything over.
    }
  }, [comments])

  // Best-effort, fire-and-forget -- the reply is already saved/approved
  // regardless of whether this succeeds. Notifies everyone else already
  // subscribed ("notify on reply") elsewhere in the same thread; see
  // src/app/api/comments/notify-subscribers/route.ts for the actual
  // eligibility check and email send.
  function notifySubscribers(replyId: string) {
    fetch('/api/comments/notify-subscribers', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({replyId}),
    }).catch(() => {
      // Nothing actionable to do here -- logged server-side if it's a
      // real failure, and a missed notification isn't worth surfacing as
      // an error in the moderation UI.
    })
  }

  async function setStatus(id: string, status: CommentRow['status']) {
    setBusyId(id)
    try {
      await client.patch(id).set({status}).commit()
      setComments((prev) => (prev ? prev.map((c) => (c._id === id ? {...c, status} : c)) : prev))
      // A reply only just became visible -- a top-level comment being
      // approved has no replies-of-its-own to notify anyone about yet.
      const approvedComment = comments?.find((c) => c._id === id)
      if (status === 'approved' && approvedComment?.parentComment) {
        notifySubscribers(id)
      }
    } finally {
      setBusyId(null)
    }
  }

  function startReply(id: string) {
    setReplyingId(id)
    setReplyText('')
  }

  // Replies are created already "approved" -- they're Asher's own words, not
  // visitor-submitted content that needs moderating -- and are never subject
  // to the honeypot/captcha checks the public form goes through, since this
  // only runs from inside authenticated Studio.
  async function submitReply(parent: CommentRow) {
    if (!replyText.trim() || !parent.postId) return
    setReplyBusy(true)
    try {
      const created = await client.create({
        _type: 'comment',
        post: {_type: 'reference', _ref: parent.postId},
        name: REPLY_AUTHOR_NAME,
        email: '',
        message: replyText.trim(),
        status: 'approved',
        createdAt: new Date().toISOString(),
        parentComment: {_type: 'reference', _ref: parent._id},
        isAuthorReply: true,
      })
      setComments((prev) =>
        prev
          ? [
              {
                _id: created._id,
                name: REPLY_AUTHOR_NAME,
                email: '',
                message: replyText.trim(),
                status: 'approved',
                createdAt: new Date().toISOString(),
                postId: parent.postId,
                postTitle: parent.postTitle,
                postSlug: parent.postSlug,
                parentComment: parent._id,
                isAuthorReply: true,
              },
              ...prev,
            ]
          : prev,
      )
      setReplyingId(null)
      setReplyText('')
      notifySubscribers(created._id)
    } finally {
      setReplyBusy(false)
    }
  }

  const pending = useMemo(() => comments?.filter((c) => c.status === 'pending') ?? [], [comments])

  // Grouped by post, posts with anything pending first, then by most
  // recent activity -- so the thing most likely to need you shows up
  // without scrolling.
  const groups = useMemo<PostGroup[]>(() => {
    if (!comments) return []
    const byPost = new Map<string, PostGroup>()
    for (const c of comments) {
      const key = c.postId ?? 'unknown'
      if (!byPost.has(key)) byPost.set(key, {postId: c.postId, postTitle: c.postTitle, comments: []})
      byPost.get(key)!.comments.push(c)
    }
    return [...byPost.values()].sort((a, b) => {
      const aPending = a.comments.some((c) => c.status === 'pending')
      const bPending = b.comments.some((c) => c.status === 'pending')
      if (aPending !== bPending) return aPending ? -1 : 1
      const latest = (g: PostGroup) => Math.max(...g.comments.map((c) => +new Date(c.createdAt)))
      return latest(b) - latest(a)
    })
  }, [comments])

  function isNew(comment: CommentRow) {
    return lastSeenAt !== null && new Date(comment.createdAt) > new Date(lastSeenAt)
  }

  if (!comments) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Comments
          </Text>
          <Text size={1} muted>
            Nothing shows on the live site until approved here.
          </Text>
        </Stack>

        {pending.length > 0 && (
          <Card padding={4} radius={3} tone="caution" border>
            <Flex align="center" gap={3}>
              <Badge tone="caution" fontSize={2}>
                {pending.length}
              </Badge>
              <Text size={2} weight="semibold">
                {pending.length === 1 ? 'comment needs' : 'comments need'} your review
              </Text>
            </Flex>
          </Card>
        )}

        {comments.length === 0 && (
          <Text size={1} muted>
            No comments yet.
          </Text>
        )}

        {groups.map((group) => {
          const topLevel = group.comments
            .filter((c) => !c.parentComment)
            .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
          const groupPending = group.comments.some((c) => c.status === 'pending')

          return (
            <Stack key={group.postId ?? 'unknown'} space={3}>
              <Flex align="center" gap={2}>
                <Text size={1} weight="semibold">
                  On &ldquo;{group.postTitle ?? 'unknown post'}&rdquo;
                </Text>
                {groupPending && (
                  <Badge tone="caution" fontSize={0}>
                    needs review
                  </Badge>
                )}
              </Flex>

              <Stack space={4}>
                {topLevel.map((comment) => {
                  const replies = group.comments
                    .filter((r) => r.parentComment === comment._id)
                    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))

                  return (
                    <Stack key={comment._id} space={3}>
                      <CommentCard
                        comment={comment}
                        isNew={isNew(comment)}
                        busy={busyId === comment._id}
                        onApprove={() => setStatus(comment._id, 'approved')}
                        onReject={() => setStatus(comment._id, 'rejected')}
                        onReplyClick={replyingId === comment._id ? undefined : () => startReply(comment._id)}
                      />

                      {replyingId === comment._id && (
                        <Box marginLeft={4}>
                          <Stack space={2}>
                            <TextArea
                              fontSize={1}
                              rows={3}
                              placeholder={`Reply as ${REPLY_AUTHOR_NAME}…`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.currentTarget.value)}
                            />
                            <Flex gap={2}>
                              <Button
                                text="Post reply"
                                tone="primary"
                                fontSize={1}
                                disabled={replyBusy || !replyText.trim()}
                                onClick={() => submitReply(comment)}
                              />
                              <Button
                                text="Cancel"
                                mode="ghost"
                                fontSize={1}
                                disabled={replyBusy}
                                onClick={() => setReplyingId(null)}
                              />
                            </Flex>
                          </Stack>
                        </Box>
                      )}

                      {replies.map((reply) => (
                        <Box key={reply._id} marginLeft={4}>
                          <CommentCard
                            comment={reply}
                            isNew={isNew(reply)}
                            busy={busyId === reply._id}
                            onApprove={() => setStatus(reply._id, 'approved')}
                            onReject={() => setStatus(reply._id, 'rejected')}
                            parentStatus={comment.status}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )
                })}
              </Stack>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}

function CommentCard({
  comment,
  isNew,
  busy,
  onApprove,
  onReject,
  onReplyClick,
  parentStatus,
}: {
  comment: CommentRow
  isNew: boolean
  busy: boolean
  onApprove: () => void
  onReject: () => void
  onReplyClick?: () => void
  parentStatus?: CommentRow['status']
}) {
  return (
    <Card padding={3} radius={2} border tone={comment.isAuthorReply ? 'primary' : undefined}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Flex align="center" gap={2} wrap="wrap">
            {comment.parentComment && (
              <Text size={1} muted>
                ↳
              </Text>
            )}
            <Text size={1} weight="medium">
              {comment.name}
            </Text>
            {comment.email && (
              <Text size={0} muted>
                {comment.email}
              </Text>
            )}
            {isNew && (
              <Badge tone="primary" fontSize={0}>
                New
              </Badge>
            )}
          </Flex>
          <Badge tone={STATUS_TONE[comment.status]} fontSize={0}>
            {comment.status}
          </Badge>
        </Flex>
        {parentStatus && parentStatus !== 'approved' && (
          <Text size={0} muted>
            The comment this replies to isn&rsquo;t approved yet, so this reply won&rsquo;t show in context on
            the live site until it is.
          </Text>
        )}
        <Text size={1}>{comment.message}</Text>
        <Text size={0} muted>
          {new Date(comment.createdAt).toLocaleString()}
        </Text>
        <Flex gap={2} wrap="wrap">
          {comment.status !== 'approved' && (
            <Button text="Approve" tone="positive" fontSize={1} disabled={busy} onClick={onApprove} />
          )}
          {comment.status !== 'rejected' && (
            <Button text="Reject" tone="critical" mode="ghost" fontSize={1} disabled={busy} onClick={onReject} />
          )}
          {onReplyClick && <Button text="Reply" mode="ghost" fontSize={1} onClick={onReplyClick} />}
        </Flex>
      </Stack>
    </Card>
  )
}
