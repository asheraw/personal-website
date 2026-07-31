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

// Matches THIRTY_DAYS_MS in /api/cron/purge-trash -- only used here for the
// "auto-deletes on ..." display, the actual purge happens server-side.
const TRASH_RETENTION_DAYS = 30

type CommentRow = {
  _id: string
  name: string
  email: string
  ip: string | null
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  createdAt: string
  editedAt: string | null
  trashedAt: string | null
  postId: string | null
  postTitle: string | null
  postSlug: string | null
  postCommentsLocked: boolean
  parentComment: string | null
  isAuthorReply: boolean
}

type PostGroup = {
  postId: string | null
  postTitle: string | null
  commentsLocked: boolean
  comments: CommentRow[]
}

const STATUS_TONE: Record<CommentRow['status'], 'caution' | 'positive' | 'critical'> = {
  pending: 'caution',
  approved: 'positive',
  rejected: 'critical',
  spam: 'critical',
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
//
// Extended same day: Edit (fixes a typo or formatting issue without
// bouncing out to the raw document editor) and Trash (soft delete -- a
// trashed comment never shows on the live site, but sits recoverable for
// 30 days before /api/cron/purge-trash removes it for good, or it can be
// deleted immediately from the Trash view).
export function CommentsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [viewingTrash, setViewingTrash] = useState(false)

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
          _id, name, email, ip, message, status, createdAt, editedAt, trashedAt, isAuthorReply,
          "postId": post._ref, "postTitle": post->title, "postSlug": post->slug.current,
          "postCommentsLocked": post->commentsLocked,
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

  // Soft delete -- hides the comment everywhere on the live site
  // immediately (every "approved" query also excludes anything with
  // trashedAt set), but keeps the document around, recoverable, until
  // either 30 days pass (auto-purged server-side, see
  // /api/cron/purge-trash) or it's deleted permanently from the Trash view
  // below. Trashing a comment with replies doesn't cascade-trash them --
  // they just stop rendering on the live site too, since the frontend only
  // ever nests a reply under a top-level comment that's still there.
  async function trashComment(id: string) {
    setBusyId(id)
    try {
      const trashedAt = new Date().toISOString()
      await client.patch(id).set({trashedAt}).commit()
      setComments((prev) => (prev ? prev.map((c) => (c._id === id ? {...c, trashedAt} : c)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  async function restoreComment(id: string) {
    setBusyId(id)
    try {
      await client.patch(id).unset(['trashedAt']).commit()
      setComments((prev) => (prev ? prev.map((c) => (c._id === id ? {...c, trashedAt: null} : c)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  // Actually irreversible, unlike trashComment -- only ever called from
  // the Trash view, after its own separate confirm step.
  async function deleteForever(id: string) {
    setBusyId(id)
    try {
      await client.delete(id)
      setComments((prev) => (prev ? prev.filter((c) => c._id !== id) : prev))
    } finally {
      setBusyId(null)
    }
  }

  // Locks/unlocks new comments on the post itself (commentsLocked on the
  // post document, not the comment) -- existing comments are untouched
  // either way, this only stops new ones. Reuses busyId to disable the
  // button mid-request even though postId and comment _id are different
  // id spaces that never collide. Patches every comment row sharing this
  // postId so the group's derived commentsLocked flag (and every card's
  // Reply button state) updates immediately, without a full reload.
  async function toggleCommentsLocked(postId: string, locked: boolean) {
    setBusyId(postId)
    try {
      await client.patch(postId).set({commentsLocked: locked}).commit()
      setComments((prev) =>
        prev ? prev.map((c) => (c.postId === postId ? {...c, postCommentsLocked: locked} : c)) : prev,
      )
    } finally {
      setBusyId(null)
    }
  }

  function startReply(id: string) {
    setReplyingId(id)
    setReplyText('')
  }

  function startEdit(comment: CommentRow) {
    setEditingId(comment._id)
    setEditText(comment.message)
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    setEditBusy(true)
    try {
      const editedAt = new Date().toISOString()
      await client.patch(id).set({message: editText.trim(), editedAt}).commit()
      setComments((prev) =>
        prev ? prev.map((c) => (c._id === id ? {...c, message: editText.trim(), editedAt} : c)) : prev,
      )
      setEditingId(null)
    } finally {
      setEditBusy(false)
    }
  }

  // Same flatten rule as /api/comments's POST handler, re-derived here
  // since this creates the document directly with client.create() rather
  // than going through that route: replies nest up to 3 levels deep, so
  // replying to an already-3rd-level comment attaches the new comment to
  // THAT comment's own parent instead, making it a sibling at the same
  // (3rd) level rather than nesting a 4th.
  function resolveReplyParentId(parent: CommentRow): string {
    if (parent.parentComment) {
      const parentsParent = comments?.find((c) => c._id === parent.parentComment)
      if (parentsParent?.parentComment) {
        return parent.parentComment
      }
    }
    return parent._id
  }

  // Replies are created already "approved" -- they're Asher's own words, not
  // visitor-submitted content that needs moderating -- and are never subject
  // to the honeypot/captcha checks the public form goes through, since this
  // only runs from inside authenticated Studio.
  async function submitReply(parent: CommentRow) {
    if (!replyText.trim() || !parent.postId) return
    setReplyBusy(true)
    try {
      const parentRef = resolveReplyParentId(parent)
      const created = await client.create({
        _type: 'comment',
        post: {_type: 'reference', _ref: parent.postId},
        name: REPLY_AUTHOR_NAME,
        email: '',
        message: replyText.trim(),
        status: 'approved',
        createdAt: new Date().toISOString(),
        parentComment: {_type: 'reference', _ref: parentRef},
        isAuthorReply: true,
      })
      setComments((prev) =>
        prev
          ? [
              {
                _id: created._id,
                name: REPLY_AUTHOR_NAME,
                email: '',
                ip: null,
                message: replyText.trim(),
                status: 'approved',
                createdAt: new Date().toISOString(),
                editedAt: null,
                trashedAt: null,
                postId: parent.postId,
                postTitle: parent.postTitle,
                postSlug: parent.postSlug,
                postCommentsLocked: parent.postCommentsLocked,
                parentComment: parentRef,
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

  const live = useMemo(() => comments?.filter((c) => !c.trashedAt) ?? [], [comments])
  const trashed = useMemo(
    () => (comments ?? []).filter((c) => c.trashedAt).sort((a, b) => +new Date(b.trashedAt!) - +new Date(a.trashedAt!)),
    [comments],
  )
  const pending = useMemo(() => live.filter((c) => c.status === 'pending'), [live])

  // Grouped by post, posts with anything pending first, then by most
  // recent activity -- so the thing most likely to need you shows up
  // without scrolling. Trashed comments never appear here at all.
  const groups = useMemo<PostGroup[]>(() => {
    const byPost = new Map<string, PostGroup>()
    for (const c of live) {
      const key = c.postId ?? 'unknown'
      if (!byPost.has(key))
        byPost.set(key, {postId: c.postId, postTitle: c.postTitle, commentsLocked: c.postCommentsLocked, comments: []})
      byPost.get(key)!.comments.push(c)
    }
    return [...byPost.values()].sort((a, b) => {
      const aPending = a.comments.some((c) => c.status === 'pending')
      const bPending = b.comments.some((c) => c.status === 'pending')
      if (aPending !== bPending) return aPending ? -1 : 1
      const latest = (g: PostGroup) => Math.max(...g.comments.map((c) => +new Date(c.createdAt)))
      return latest(b) - latest(a)
    })
  }, [live])

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
        <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Text size={3} weight="bold">
              Comments
            </Text>
            <Text size={1} muted>
              Nothing shows on the live site until approved here.
            </Text>
          </Stack>
          <Button
            text={viewingTrash ? 'Back to Comments' : `Trash (${trashed.length})`}
            mode={viewingTrash ? 'default' : 'ghost'}
            tone={viewingTrash ? 'primary' : undefined}
            fontSize={1}
            onClick={() => setViewingTrash((v) => !v)}
          />
        </Flex>

        {viewingTrash ? (
          <Stack space={3}>
            {trashed.length === 0 ? (
              <Text size={1} muted>
                Trash is empty.
              </Text>
            ) : (
              trashed.map((comment) => (
                <TrashedCommentCard
                  key={comment._id}
                  comment={comment}
                  busy={busyId === comment._id}
                  onRestore={() => restoreComment(comment._id)}
                  onDeleteForever={() => deleteForever(comment._id)}
                />
              ))
            )}
          </Stack>
        ) : (
          <>
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

            {live.length === 0 && (
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
                  <Flex align="center" gap={2} wrap="wrap">
                    <Text size={1} weight="semibold">
                      On &ldquo;{group.postTitle ?? 'unknown post'}&rdquo;
                    </Text>
                    {groupPending && (
                      <Badge tone="caution" fontSize={0}>
                        needs review
                      </Badge>
                    )}
                    {group.commentsLocked && (
                      <Badge tone="default" fontSize={0}>
                        comments locked
                      </Badge>
                    )}
                    {group.postId && (
                      <Button
                        text={group.commentsLocked ? 'Unlock comments' : 'Lock comments'}
                        mode="ghost"
                        fontSize={0}
                        padding={2}
                        disabled={busyId === group.postId}
                        onClick={() => toggleCommentsLocked(group.postId!, !group.commentsLocked)}
                      />
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
                            hasReplies={replies.length > 0}
                            editing={editingId === comment._id}
                            editText={editText}
                            editBusy={editBusy}
                            onEditTextChange={setEditText}
                            onApprove={() => setStatus(comment._id, 'approved')}
                            onReject={() => setStatus(comment._id, 'rejected')}
                            onSpam={() => setStatus(comment._id, 'spam')}
                            onTrash={() => trashComment(comment._id)}
                            onEditClick={() => startEdit(comment)}
                            onSaveEdit={() => saveEdit(comment._id)}
                            onCancelEdit={() => setEditingId(null)}
                            onReplyClick={replyingId === comment._id ? undefined : () => startReply(comment._id)}
                          />

                          {replyingId === comment._id && (
                            <InlineReplyForm
                              replyText={replyText}
                              replyBusy={replyBusy}
                              onChange={setReplyText}
                              onSubmit={() => submitReply(comment)}
                              onCancel={() => setReplyingId(null)}
                            />
                          )}

                          {/* Depth 2 (a reply to the original comment). */}
                          {replies.map((reply) => {
                            const replies3 = group.comments
                              .filter((r3) => r3.parentComment === reply._id)
                              .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))

                            return (
                              <Box key={reply._id} marginLeft={4}>
                                <Stack space={3}>
                                  <CommentCard
                                    comment={reply}
                                    isNew={isNew(reply)}
                                    busy={busyId === reply._id}
                                    hasReplies={replies3.length > 0}
                                    editing={editingId === reply._id}
                                    editText={editText}
                                    editBusy={editBusy}
                                    onEditTextChange={setEditText}
                                    onApprove={() => setStatus(reply._id, 'approved')}
                                    onReject={() => setStatus(reply._id, 'rejected')}
                                    onSpam={() => setStatus(reply._id, 'spam')}
                                    onTrash={() => trashComment(reply._id)}
                                    onEditClick={() => startEdit(reply)}
                                    onSaveEdit={() => saveEdit(reply._id)}
                                    onCancelEdit={() => setEditingId(null)}
                                    onReplyClick={replyingId === reply._id ? undefined : () => startReply(reply._id)}
                                    parentStatus={comment.status}
                                  />

                                  {replyingId === reply._id && (
                                    <InlineReplyForm
                                      replyText={replyText}
                                      replyBusy={replyBusy}
                                      onChange={setReplyText}
                                      onSubmit={() => submitReply(reply)}
                                      onCancel={() => setReplyingId(null)}
                                    />
                                  )}

                                  {/* Depth 3 (a reply to a reply) -- the
                                      deepest level. Its own Reply action
                                      stays available (submitReply flattens
                                      it back here via resolveReplyParentId
                                      instead of nesting a 4th level), so
                                      whatever it creates shows up as
                                      another card in this same list rather
                                      than nesting further. */}
                                  {replies3.map((reply3) => (
                                    <Box key={reply3._id} marginLeft={4}>
                                      <Stack space={3}>
                                        <CommentCard
                                          comment={reply3}
                                          isNew={isNew(reply3)}
                                          busy={busyId === reply3._id}
                                          editing={editingId === reply3._id}
                                          editText={editText}
                                          editBusy={editBusy}
                                          onEditTextChange={setEditText}
                                          onApprove={() => setStatus(reply3._id, 'approved')}
                                          onReject={() => setStatus(reply3._id, 'rejected')}
                                          onSpam={() => setStatus(reply3._id, 'spam')}
                                          onTrash={() => trashComment(reply3._id)}
                                          onEditClick={() => startEdit(reply3)}
                                          onSaveEdit={() => saveEdit(reply3._id)}
                                          onCancelEdit={() => setEditingId(null)}
                                          onReplyClick={
                                            replyingId === reply3._id ? undefined : () => startReply(reply3._id)
                                          }
                                          parentStatus={reply.status}
                                        />

                                        {replyingId === reply3._id && (
                                          <InlineReplyForm
                                            replyText={replyText}
                                            replyBusy={replyBusy}
                                            onChange={setReplyText}
                                            onSubmit={() => submitReply(reply3)}
                                            onCancel={() => setReplyingId(null)}
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )
                          })}
                        </Stack>
                      )
                    })}
                  </Stack>
                </Stack>
              )
            })}
          </>
        )}
      </Stack>
    </Box>
  )
}

// Shared by all 3 nesting levels -- identical form, just wired to whichever
// comment's Reply button was clicked.
function InlineReplyForm({
  replyText,
  replyBusy,
  onChange,
  onSubmit,
  onCancel,
}: {
  replyText: string
  replyBusy: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <Box marginLeft={4}>
      <Stack space={2}>
        <TextArea
          fontSize={1}
          rows={3}
          placeholder={`Reply as ${REPLY_AUTHOR_NAME}…`}
          value={replyText}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
        <Flex gap={2}>
          <Button
            text="Post reply"
            tone="primary"
            fontSize={1}
            disabled={replyBusy || !replyText.trim()}
            onClick={onSubmit}
          />
          <Button text="Cancel" mode="ghost" fontSize={1} disabled={replyBusy} onClick={onCancel} />
        </Flex>
      </Stack>
    </Box>
  )
}

function CommentCard({
  comment,
  isNew,
  busy,
  hasReplies,
  editing,
  editText,
  editBusy,
  onEditTextChange,
  onApprove,
  onReject,
  onSpam,
  onTrash,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onReplyClick,
  parentStatus,
}: {
  comment: CommentRow
  isNew: boolean
  busy: boolean
  hasReplies?: boolean
  editing: boolean
  editText: string
  editBusy: boolean
  onEditTextChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  onSpam: () => void
  onTrash: () => void
  onEditClick: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onReplyClick?: () => void
  parentStatus?: CommentRow['status']
}) {
  // Local to this card, not lifted to CommentsTool -- purely a UI
  // confirmation step before the actually-effectful onTrash fires.
  const [confirmingTrash, setConfirmingTrash] = useState(false)

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
            {comment.ip && comment.ip !== 'unknown' && (
              <Text size={0} muted>
                · {comment.ip}
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

        {editing ? (
          <Stack space={2}>
            <TextArea
              fontSize={1}
              rows={4}
              value={editText}
              onChange={(e) => onEditTextChange(e.currentTarget.value)}
            />
            <Flex gap={2}>
              <Button
                text="Save"
                tone="primary"
                fontSize={1}
                disabled={editBusy || !editText.trim()}
                onClick={onSaveEdit}
              />
              <Button text="Cancel" mode="ghost" fontSize={1} disabled={editBusy} onClick={onCancelEdit} />
            </Flex>
          </Stack>
        ) : (
          <>
            {/* whiteSpace: pre-wrap -- @sanity/ui's Text collapses newlines
                by default, which made every multi-paragraph comment look
                like one run-on block in this tool even though the live
                site (which does apply this) rendered the same message's
                line breaks correctly the whole time. The formatting was
                never actually lost, Studio just wasn't showing it. */}
            <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
              {comment.message}
            </Text>
            <Flex align="center" gap={2}>
              <Text size={0} muted>
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
              {comment.editedAt && (
                <Text size={0} muted>
                  · edited {new Date(comment.editedAt).toLocaleDateString()}
                </Text>
              )}
            </Flex>
          </>
        )}

        {!editing &&
          (confirmingTrash ? (
            <Card padding={2} radius={2} tone="critical" border>
              <Flex align="center" gap={2} wrap="wrap">
                <Text size={1}>
                  Move to trash{hasReplies ? ' — its replies will stay but be hidden' : ''}? Recoverable from
                  Trash for {TRASH_RETENTION_DAYS} days.
                </Text>
                <Button text="Yes, trash it" tone="critical" fontSize={1} disabled={busy} onClick={onTrash} />
                <Button
                  text="Cancel"
                  mode="ghost"
                  fontSize={1}
                  disabled={busy}
                  onClick={() => setConfirmingTrash(false)}
                />
              </Flex>
            </Card>
          ) : (
            <Flex gap={2} wrap="wrap">
              {comment.status !== 'approved' && (
                <Button text="Approve" tone="positive" fontSize={1} disabled={busy} onClick={onApprove} />
              )}
              {comment.status !== 'rejected' && (
                <Button text="Reject" tone="critical" mode="ghost" fontSize={1} disabled={busy} onClick={onReject} />
              )}
              {comment.status !== 'spam' && comment.status !== 'approved' && (
                <Button
                  text="Mark as Spam"
                  tone="critical"
                  mode="ghost"
                  fontSize={1}
                  disabled={busy}
                  onClick={onSpam}
                />
              )}
              {onReplyClick && <Button text="Reply" mode="ghost" fontSize={1} onClick={onReplyClick} />}
              <Button text="Edit" mode="ghost" fontSize={1} disabled={busy} onClick={onEditClick} />
              <Button
                text="Trash"
                tone="critical"
                mode="bleed"
                fontSize={1}
                disabled={busy}
                onClick={() => setConfirmingTrash(true)}
              />
            </Flex>
          ))}
      </Stack>
    </Card>
  )
}

function TrashedCommentCard({
  comment,
  busy,
  onRestore,
  onDeleteForever,
}: {
  comment: CommentRow
  busy: boolean
  onRestore: () => void
  onDeleteForever: () => void
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const purgeDate = comment.trashedAt
    ? new Date(+new Date(comment.trashedAt) + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    : null

  return (
    <Card padding={3} radius={2} border>
      <Stack space={3}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Flex align="center" gap={2} wrap="wrap">
            <Text size={1} weight="medium">
              {comment.name}
            </Text>
            {comment.email && (
              <Text size={0} muted>
                {comment.email}
              </Text>
            )}
          </Flex>
          <Text size={0} muted>
            On &ldquo;{comment.postTitle ?? 'unknown post'}&rdquo;
          </Text>
        </Flex>
        <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
          {comment.message}
        </Text>
        {purgeDate && (
          <Text size={0} muted>
            Auto-deletes {purgeDate.toLocaleDateString()} unless restored or deleted now.
          </Text>
        )}

        {confirmingDelete ? (
          <Card padding={2} radius={2} tone="critical" border>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={1}>Delete forever? This can&rsquo;t be undone.</Text>
              <Button
                text="Yes, delete forever"
                tone="critical"
                fontSize={1}
                disabled={busy}
                onClick={onDeleteForever}
              />
              <Button
                text="Cancel"
                mode="ghost"
                fontSize={1}
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
              />
            </Flex>
          </Card>
        ) : (
          <Flex gap={2} wrap="wrap">
            <Button text="Restore" tone="positive" fontSize={1} disabled={busy} onClick={onRestore} />
            <Button
              text="Delete Forever"
              tone="critical"
              mode="ghost"
              fontSize={1}
              disabled={busy}
              onClick={() => setConfirmingDelete(true)}
            />
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
