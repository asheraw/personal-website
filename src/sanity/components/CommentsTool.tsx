import {useCallback, useEffect, useMemo, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Grid, Spinner, Stack, Text, TextArea, TextInput} from '@sanity/ui'
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

// A comment's `post` reference pointing at `drafts.<id>` only actually
// blocks anything once that post has a *published* counterpart too (the
// exact "cannot be deleted, referenced by ..." publish failure) -- a post
// that has never been published yet legitimately has no other ID for a
// comment to point at, and stripping this prefix there would repoint the
// comment at a document that doesn't exist, which Sanity's own reference
// validation rejects outright. First version of this fix (2026-08-13)
// missed that distinction entirely: it flagged every drafts.-referencing
// comment as "stuck" (578 of them, almost the entire pending backlog --
// nearly all from a bulk historical import of posts that are still
// sitting unpublished, not actually broken), and "Fix them now" threw on
// the very first one that pointed at a not-yet-published post, silently
// aborting the whole loop with zero feedback -- which is exactly why
// Asher's click looked like it did nothing and the real, already-
// publishable post's four comments were never even reached.
const DRAFTS_PREFIX = 'drafts.'

// <input type="datetime-local"> works in the browser's own local time, with
// no timezone suffix -- `new Date(isoString)` already handles turning that
// back into the right instant on save, but going the other way (showing an
// existing UTC createdAt correctly pre-filled) needs the timezone offset
// subtracted by hand, or toISOString() below would show it shifted to UTC.
function isoToLocalInputValue(iso: string): string {
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

type CommentRow = {
  _id: string
  name: string
  email: string
  ip: string | null
  message: string | null
  gifUrl: string | null
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
  postSlug: string | null
  commentsLocked: boolean
  comments: CommentRow[]
}

const SITE_HOST = 'asheraw.com'

// Fixed widths for every column after the title, same idea as
// ContactSubmissionsTool's own COLUMNS constant -- each group header is its
// own separate Grid instance (one per post), so only fixed fr/rem values,
// never `auto`, keep the count/lock/show columns lined up row to row
// regardless of how long any one post's title or Lock/Unlock label is.
// The title column absorbs whatever's left and truncates with an ellipsis
// instead of pushing the others out of alignment.
const GROUP_HEADER_COLUMNS = 'minmax(0, 1fr) 6rem 8.5rem 4rem'

const STATUS_TONE: Record<CommentRow['status'], 'caution' | 'positive' | 'critical'> = {
  pending: 'caution',
  approved: 'positive',
  rejected: 'critical',
  spam: 'critical',
}

// A plain <img>, not next/image -- Studio doesn't run through Next's image
// optimizer for arbitrary external URLs anyway, and GIF animation isn't
// guaranteed to survive re-encoding through it. Shown here so a GIF
// comment can actually be reviewed before Approve, not approved blind.
function CommentGifPreview({url}: {url: string}) {
  // eslint-disable-next-line @next/next/no-img-element -- Studio component, not a Next page; animated GIF, not safe to route through next/image's optimizer
  return <img src={url} alt="" style={{maxHeight: 160, maxWidth: '100%', borderRadius: 6, display: 'block'}} />
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
  const [editDate, setEditDate] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [viewingTrash, setViewingTrash] = useState(false)
  const [search, setSearch] = useState('')
  const [fixingStuck, setFixingStuck] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)
  // Which drafts.-referenced posts actually have a published counterpart
  // right now -- the only ones a comment can safely be repointed at. See
  // DRAFTS_PREFIX's comment above for why this check exists at all.
  const [publishedCounterparts, setPublishedCounterparts] = useState<Set<string>>(new Set())
  // Explicit overrides of the default expand/collapse state (see
  // groupIsExpanded below) -- a group the user has opened or closed by hand
  // stays that way regardless of its pending status, until they toggle it
  // again or reload.
  const [expandOverrides, setExpandOverrides] = useState<Record<string, boolean>>({})

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
          _id, name, email, ip, message, gifUrl, status, createdAt, editedAt, trashedAt, isAuthorReply,
          "postId": post._ref, "postTitle": post->title, "postSlug": post->slug.current,
          "postCommentsLocked": post->commentsLocked,
          "parentComment": parentComment._ref
        }`,
      )
      .then((rows) => {
        setComments(rows)

        // One extra existence check, not per-comment -- collapses every
        // drafts.-referenced comment down to its unique candidate
        // published ID first, so a post with 40 imported comments only
        // costs one ID in this query, not 40.
        const candidateIds = Array.from(
          new Set(
            rows
              .map((r) => r.postId)
              .filter((id): id is string => !!id && id.startsWith(DRAFTS_PREFIX))
              .map((id) => id.slice(DRAFTS_PREFIX.length)),
          ),
        )
        if (candidateIds.length === 0) {
          setPublishedCounterparts(new Set())
          return
        }
        client.fetch<string[]>(`*[_id in $ids]._id`, {ids: candidateIds}).then((existing) => {
          setPublishedCounterparts(new Set(existing))
        })
      })
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
      // Approving/rejecting/spamming the *last* pending comment in a group
      // makes it "settled" -- which would otherwise auto-collapse the whole
      // group the instant this action lands (see isExpanded below), closing
      // it out from under whatever the user meant to do next, like replying
      // to the comment they just approved. Pin it open, same as an explicit
      // manual expand, the moment it's touched.
      const groupKey = approvedComment?.postId ?? 'unknown'
      setExpandOverrides((prev) => ({...prev, [groupKey]: true}))
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
    setEditText(comment.message ?? '')
    setEditDate(isoToLocalInputValue(comment.createdAt))
  }

  async function saveEdit(id: string) {
    if (!editText.trim() || !editDate) return
    setEditBusy(true)
    try {
      const editedAt = new Date().toISOString()
      const createdAt = new Date(editDate).toISOString()
      await client.patch(id).set({message: editText.trim(), createdAt, editedAt}).commit()
      setComments((prev) =>
        prev ? prev.map((c) => (c._id === id ? {...c, message: editText.trim(), createdAt, editedAt} : c)) : prev,
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
                gifUrl: null,
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
  const stuckComments = useMemo(
    () =>
      (comments ?? []).filter((c) => {
        const id = c.postId ?? ''
        if (!id.startsWith(DRAFTS_PREFIX)) return false
        // Only a real, fixable problem once the published counterpart
        // actually exists -- see DRAFTS_PREFIX's comment for why a post
        // that's never been published yet doesn't count as "stuck."
        return publishedCounterparts.has(id.slice(DRAFTS_PREFIX.length))
      }),
    [comments, publishedCounterparts],
  )
  const searchTerm = search.trim().toLowerCase()

  // A comment created (usually imported, e.g. an old Facebook comment
  // brought over by hand) while its post was still unpublished sometimes
  // ends up with `post` pointing at the post's *draft* ID instead of its
  // published one. Invisible day to day -- the title still resolves fine
  // for display, since the draft document carries the same title -- but
  // it silently blocks that post from ever being published: Sanity won't
  // delete a draft (which is what publishing does under the hood) while
  // anything still references its exact ID. Repoints the reference at the
  // same post's published ID; doesn't touch the comment's own content,
  // status, or trashed state. Same fix as scripts/fix-draft-referenced-
  // comments.mjs, as a real button here instead of something that needs a
  // terminal and a write token to run.
  async function fixStuckReference(id: string, postId: string) {
    setBusyId(id)
    try {
      const fixedRef = postId.slice(DRAFTS_PREFIX.length)
      await client.patch(id).set({'post._ref': fixedRef}).commit()
      setComments((prev) => (prev ? prev.map((c) => (c._id === id ? {...c, postId: fixedRef} : c)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  // One at a time, not Promise.all in parallel -- same reasoning as the
  // Media library's own mass upload: one failure shouldn't take the rest
  // down with it in an unhandled Promise.all rejection. Each one is now
  // its own try/catch, not one try/catch around the whole loop -- the
  // first version let a single failure silently kill every fix after it
  // with zero feedback, which is exactly how this looked like it "did
  // nothing" the first time around.
  async function fixAllStuckReferences() {
    setFixingStuck(true)
    setFixError(null)
    const failedNames: string[] = []
    try {
      for (const comment of stuckComments) {
        if (!comment.postId) continue
        try {
          await fixStuckReference(comment._id, comment.postId)
        } catch {
          failedNames.push(comment.name || '(unnamed)')
        }
      }
    } finally {
      setFixingStuck(false)
      if (failedNames.length > 0) {
        setFixError(`Couldn't fix ${failedNames.length} of them: ${failedNames.join(', ')}. Nothing else changed for those -- try again, or let me know.`)
      }
    }
  }

  function commentText(c: CommentRow): string {
    return `${c.name} ${c.message ?? ''}`.toLowerCase()
  }

  // A reply matching but its parent not (or vice versa) would read as
  // context-free gibberish on its own -- so a search match keeps its whole
  // thread (top-level comment + every level of reply under it) rather than
  // just the one card that happens to contain the term.
  function threadFamily(group: PostGroup, topLevelComment: CommentRow): CommentRow[] {
    const replies = group.comments.filter((c) => c.parentComment === topLevelComment._id)
    const replies3 = group.comments.filter((c) => replies.some((r) => r._id === c.parentComment))
    return [topLevelComment, ...replies, ...replies3]
  }

  // Grouped by post, posts with anything pending first, then by most
  // recent activity -- so the thing most likely to need you shows up
  // without scrolling. Trashed comments never appear here at all.
  const groups = useMemo<PostGroup[]>(() => {
    const byPost = new Map<string, PostGroup>()
    for (const c of live) {
      const key = c.postId ?? 'unknown'
      if (!byPost.has(key))
        byPost.set(key, {
          postId: c.postId,
          postTitle: c.postTitle,
          postSlug: c.postSlug,
          commentsLocked: c.postCommentsLocked,
          comments: [],
        })
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

  // Per group, which top-level threads to actually show -- every one of
  // them when there's no search, or just the threads whose family (or
  // whose post's own title) matches when there is. A group with nothing
  // left after that is dropped entirely rather than rendering an empty
  // "On ..." header.
  const visibleGroups = useMemo(() => {
    return groups
      .map((group) => {
        // Newest first -- the whole point of scanning a post's group is
        // "what's new since I last looked," and the newest is what should
        // be sitting right at the top, not whatever's oldest. Replies
        // within a thread stay oldest-first further down (a conversation
        // reads the way it happened, not backwards).
        const allTopLevel = group.comments
          .filter((c) => !c.parentComment)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        if (!searchTerm) return {group, topLevel: allTopLevel}
        const titleMatches = !!group.postTitle?.toLowerCase().includes(searchTerm)
        const topLevel = titleMatches
          ? allTopLevel
          : allTopLevel.filter((c) => threadFamily(group, c).some((f) => commentText(f).includes(searchTerm)))
        return {group, topLevel}
      })
      .filter(({topLevel}) => !searchTerm || topLevel.length > 0)
  }, [groups, searchTerm])

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

        {stuckComments.length > 0 && (
          <Card padding={4} radius={3} tone="critical" border>
            <Stack space={3}>
              <Flex align="center" gap={3} wrap="wrap">
                <Badge tone="critical" fontSize={2}>
                  {stuckComments.length}
                </Badge>
                <Text size={2} weight="semibold">
                  {stuckComments.length === 1 ? 'comment is' : 'comments are'} stuck pointing at an unpublished
                  version of their post
                </Text>
              </Flex>
              <Text size={1} muted>
                Usually an old imported comment (like a Facebook comment brought over by hand) created before its
                post was published. Harmless on its own, but it can silently block that post from ever
                publishing. Fixing this only repoints the comment at the right post -- nothing about the
                comment itself changes.
              </Text>
              <Box>
                <Button
                  text={fixingStuck ? 'Fixing…' : `Fix ${stuckComments.length === 1 ? 'it' : 'them'} now`}
                  tone="critical"
                  fontSize={1}
                  disabled={fixingStuck}
                  onClick={fixAllStuckReferences}
                />
              </Box>
              {fixError && (
                <Text size={1} weight="semibold">
                  {fixError}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {!viewingTrash && (
          <TextInput
            fontSize={1}
            placeholder="Search by name or comment text…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            clearButton={search.length > 0}
            onClear={() => setSearch('')}
          />
        )}

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

            {searchTerm && visibleGroups.length === 0 && (
              <Text size={1} muted>
                No comments match &ldquo;{search.trim()}&rdquo;.
              </Text>
            )}

            {visibleGroups.map(({group, topLevel}) => {
              const key = group.postId ?? 'unknown'
              const groupPending = group.comments.some((c) => c.status === 'pending')
              // Settled (nothing pending) groups collapse by default -- with
              // dozens of old posts' worth of restored comments, a fully
              // expanded page for content that never needs a second look is
              // exactly what made this tool feel heavy. A search in progress
              // always shows its results in full; that's the point of it.
              const isExpanded = !!searchTerm || (expandOverrides[key] ?? groupPending)
              const totalCount = group.comments.length

              return (
                <Stack key={key} space={3}>
                  <Grid columns={4} gap={2} style={{gridTemplateColumns: GROUP_HEADER_COLUMNS, alignItems: 'center'}}>
                    <Flex align="center" gap={2} style={{minWidth: 0}}>
                      <Text size={1} weight="semibold" textOverflow="ellipsis" style={{minWidth: 0}}>
                        On &ldquo;
                        {group.postSlug ? (
                          <a
                            href={`https://${SITE_HOST}/blog/${group.postSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{color: 'inherit', textDecoration: 'underline'}}
                          >
                            {group.postTitle ?? 'unknown post'}
                          </a>
                        ) : (
                          group.postTitle ?? 'unknown post'
                        )}
                        &rdquo;
                      </Text>
                      {groupPending && (
                        <Badge tone="caution" fontSize={0}>
                          needs review
                        </Badge>
                      )}
                      {group.commentsLocked && (
                        <Badge tone="default" fontSize={0}>
                          locked
                        </Badge>
                      )}
                    </Flex>
                    <Badge tone="default" fontSize={0}>
                      {totalCount} {totalCount === 1 ? 'comment' : 'comments'}
                    </Badge>
                    {group.postId ? (
                      <Button
                        text={group.commentsLocked ? 'Unlock comments' : 'Lock comments'}
                        mode="ghost"
                        fontSize={0}
                        padding={2}
                        disabled={busyId === group.postId}
                        onClick={() => toggleCommentsLocked(group.postId!, !group.commentsLocked)}
                      />
                    ) : (
                      <span />
                    )}
                    {!searchTerm ? (
                      <Button
                        text={isExpanded ? 'Hide' : 'Show'}
                        mode="ghost"
                        fontSize={0}
                        padding={2}
                        onClick={() => setExpandOverrides((prev) => ({...prev, [key]: !isExpanded}))}
                      />
                    ) : (
                      <span />
                    )}
                  </Grid>

                  {isExpanded && (
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
                            editDate={editDate}
                            editBusy={editBusy}
                            onEditTextChange={setEditText}
                            onEditDateChange={setEditDate}
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
                                    editDate={editDate}
                                    editBusy={editBusy}
                                    onEditTextChange={setEditText}
                                    onEditDateChange={setEditDate}
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
                                          editDate={editDate}
                                          editBusy={editBusy}
                                          onEditTextChange={setEditText}
                                          onEditDateChange={setEditDate}
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
                  )}
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
  editDate,
  editBusy,
  onEditTextChange,
  onEditDateChange,
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
  editDate: string
  editBusy: boolean
  onEditTextChange: (value: string) => void
  onEditDateChange: (value: string) => void
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

  // One joined line rather than several separate Flex children with
  // hand-glued "· " prefixes -- those misaligned the moment they wrapped
  // onto more than one row, especially once emails got longer (restored
  // comments use a placeholder address). A single string always wraps as
  // plain text, so the spacing stays consistent no matter the width.
  const metaLine = [
    new Date(comment.createdAt).toLocaleString(),
    comment.email || null,
    comment.ip && comment.ip !== 'unknown' ? comment.ip : null,
    comment.editedAt ? `edited ${new Date(comment.editedAt).toLocaleDateString()}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card padding={3} radius={2} border tone={comment.isAuthorReply ? 'primary' : undefined}>
      <Stack space={3}>
        <Stack space={2}>
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
          <Text size={0} muted>
            {metaLine}
          </Text>
        </Stack>
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
            {/* Lets a restored, backdated comment (e.g. one recovered from
                the Wayback Machine for an old post) show its real original
                date instead of whenever it happened to be re-entered. */}
            <Stack space={1}>
              <Text size={0} muted>
                Submitted
              </Text>
              <TextInput
                type="datetime-local"
                fontSize={1}
                value={editDate}
                onChange={(e) => onEditDateChange(e.currentTarget.value)}
              />
            </Stack>
            <Flex gap={2}>
              <Button
                text="Save"
                tone="primary"
                fontSize={1}
                disabled={editBusy || !editText.trim() || !editDate}
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
            {comment.message && (
              <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                {comment.message}
              </Text>
            )}
            {comment.gifUrl && <CommentGifPreview url={comment.gifUrl} />}
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
            On &ldquo;
            {comment.postSlug ? (
              <a
                href={`https://${SITE_HOST}/blog/${comment.postSlug}`}
                target="_blank"
                rel="noreferrer"
                style={{color: 'inherit', textDecoration: 'underline'}}
              >
                {comment.postTitle ?? 'unknown post'}
              </a>
            ) : (
              comment.postTitle ?? 'unknown post'
            )}
            &rdquo;
          </Text>
        </Flex>
        {comment.message && (
          <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
            {comment.message}
          </Text>
        )}
        {comment.gifUrl && <CommentGifPreview url={comment.gifUrl} />}
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
