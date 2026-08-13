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

// A comment's `post` reference pointing at `drafts.<id>` is what blocks
// that post's very first publish -- Sanity refuses to delete a draft
// (which is what publishing does under the hood) while anything still
// references its exact ID. See RUNBOOK.md's entry on this for the full
// back-and-forth getting here: a first version required a *published*
// counterpart to already exist before treating a comment as fixable, on
// the assumption Sanity rejects writing a reference to a not-yet-existing
// document -- wrong assumption (that only produces a Studio-side broken-
// reference warning, not a hard mutation failure), and it meant the tool
// could never fix a post that had never been published even once, which
// is exactly the case that matters here: no published counterpart CAN
// exist until this exact reference is fixed. Unconditional now --
// anything pointing at a drafts.-prefixed post ID gets offered a fix.
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

// `post->title` (and `post->slug`) only resolve once a real document
// exists at the referenced ID -- for a comment whose post hasn't been
// published yet, `post._ref` deliberately already points at where that
// post *will* live once it is (see the weak-reference fix documented in
// RUNBOOK.md), so both come back null until publishing actually happens.
// A bare "unknown post" in the meantime gives no way to tell one such
// comment apart from another. Post IDs in this project are the same
// string as their slug, so turning the ID itself into words is a real,
// readable stand-in, not a guess -- "wrote-these-in-2009" becomes "Wrote
// These In 2009 (not yet published)".
function fallbackPostLabel(postId: string | null): string {
  if (!postId) return 'unknown post'
  const slug = postId.replace(/^drafts\./, '')
  const words = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return `${words} (not yet published)`
}

// A post that's never been published can't be published *at all* while
// anything still strongly references its draft ID (Sanity refuses to
// delete a document something else points at, and publishing a document
// is delete-the-draft-and-write-the-published-version under the hood).
// Deliberately not scoped to `_type == "comment"` -- an earlier version
// of this whole feature was, and it silently missed the actual blockers
// on a real post because they turned out not to be `comment` documents
// at all (this codebase has no `facebookComment` schema, or any schema,
// for whatever these were -- created directly against the dataset,
// outside anything this repo defines). GROQ's `references()` finds
// anything pointing at a given document regardless of its `_type`, which
// is what actually matches Sanity's own "cannot be deleted, referenced by
// ..." error -- that error doesn't care about type either.
type StuckPostBlocker = {
  _id: string
  _type: string
  // The field on the blocking document that holds the reference, e.g.
  // "post" -- found by scanning the document's own top-level fields for
  // one whose value is a reference pointing at the stuck draft, since
  // there's no schema here to just look this up in. Null if that scan
  // came up empty (a reference nested deeper than one level, most
  // likely) -- shown as "needs a manual look" rather than guessed at.
  fieldName: string | null
}
type StuckPost = {
  draftId: string
  postTitle: string
  publishedId: string
  blockers: StuckPostBlocker[]
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
  const [stuckPosts, setStuckPosts] = useState<StuckPost[]>([])
  const [fixingStuckId, setFixingStuckId] = useState<string | null>(null)
  const [fixError, setFixError] = useState<{draftId: string; message: string} | null>(null)
  const [publishingDrafts, setPublishingDrafts] = useState(false)
  const [publishProgress, setPublishProgress] = useState<{done: number; total: number} | null>(null)
  const [publishDraftsError, setPublishDraftsError] = useState<string | null>(null)
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
      .then(setComments)
  }, [client])

  // One query, server-side correlated subquery -- not one round trip per
  // draft post -- finds every draft post that has at least one document
  // (any type) referencing it. `blockers` comes back as full raw
  // documents (no projection) specifically so the field-name scan below
  // has something real to search.
  const loadStuckPosts = useCallback(() => {
    client
      .fetch<{_id: string; title: string; blockers: Record<string, unknown>[]}[]>(
        `*[_type == "post" && _id in path("drafts.**")]{
          _id, title,
          "blockers": *[references(^._id)]
        }[count(blockers) > 0]`,
      )
      .then((rows) => {
        setStuckPosts(
          rows.map((row) => ({
            draftId: row._id,
            postTitle: row.title || '(untitled)',
            publishedId: row._id.slice(DRAFTS_PREFIX.length),
            blockers: row.blockers.map((doc) => {
              const fieldName =
                Object.keys(doc).find((key) => {
                  const val = doc[key] as {_ref?: unknown} | undefined
                  return !!val && typeof val === 'object' && !Array.isArray(val) && val._ref === row._id
                }) ?? null
              return {_id: doc._id as string, _type: doc._type as string, fieldName}
            }),
          })),
        )
      })
  }, [client])

  useEffect(() => {
    load()
    loadStuckPosts()
  }, [load, loadStuckPosts])

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
  // `comment` documents are never meant to sit in draft state -- moderation
  // is the `status` field, not Sanity's draft/publish mechanism (see this
  // file's own header comment) -- so any comment whose _id is still
  // drafts.-prefixed is a leftover from the same legacy-import quirk
  // documented in RUNBOOK.md. Setting `status: 'approved'` on one of these
  // (the normal Approve button, unchanged) only patches the draft -- the
  // live site's own comment query only ever reads published content, so an
  // "approved" draft comment silently never shows up for a visitor, with
  // nothing in Studio itself hinting that anything's wrong.
  const draftComments = useMemo(() => (comments ?? []).filter((c) => c._id.startsWith(DRAFTS_PREFIX)), [comments])
  const searchTerm = search.trim().toLowerCase()

  // Sanity's client has no single "publish" verb -- publishing a draft is,
  // under the hood, write the same content at the ID with the drafts.
  // prefix stripped, then delete the draft, done as one transaction so
  // there's never a moment with both or neither existing. `parentComment`
  // and `post` are repointed at their own already-published (drafts.-
  // stripped) form in the same write, since a comment thread's own
  // internal references need the same fix -- both fields are weak
  // references now specifically so this can be written even if a reply
  // publishes before whatever it's replying to.
  async function publishComment(id: string) {
    const doc = await client.getDocument(id)
    if (!doc) throw new Error('draft document not found')
    const publishedId = id.slice(DRAFTS_PREFIX.length)
    const patched: Record<string, unknown> = {...doc, _id: publishedId}
    for (const field of ['post', 'parentComment'] as const) {
      const ref = patched[field] as {_ref?: string} | undefined
      if (ref?._ref?.startsWith(DRAFTS_PREFIX)) {
        patched[field] = {...ref, _ref: ref._ref.slice(DRAFTS_PREFIX.length), _weak: true}
      }
    }
    await client.transaction().createOrReplace(patched as never).delete(id).commit()
  }

  // At the scale of the actual legacy-import backlog (hundreds, not a
  // handful), one-at-a-time sequential publishing has no visible progress
  // and takes long enough to genuinely look frozen -- exactly what Asher
  // hit. Small concurrent batches (Promise.allSettled, not Promise.all --
  // one failure in a batch shouldn't lose the rest of that same batch's
  // results) cut the wall-clock time substantially while still bounding
  // how many requests fire at once, and a live done/total count means
  // "Publishing…" is never the only signal something's still happening.
  const PUBLISH_BATCH_SIZE = 8
  // A reply's own `parentComment` points at another *comment*, and a
  // legacy-imported thread nests up to 3 levels deep -- so unlike `post`
  // (which every comment points at but nothing points back at), a
  // still-drafted parent comment can genuinely be blocked from deleting
  // by a sibling reply that hasn't been processed yet, even inside the
  // same batch (Promise.allSettled fires all of a batch's requests
  // concurrently, so which one's delete actually lands first on Sanity's
  // server is a race). Multiple passes fix this without needing to work
  // out the real dependency order by hand: each pass's successes clear
  // the way for whatever failed only because of a still-unpublished
  // sibling, so a comment that fails now typically succeeds next pass.
  // Stops once a pass fails on the exact same set as the pass before it
  // -- that's not an ordering issue anymore, it's a real, different
  // failure, and retrying it again would just spin.
  const PUBLISH_MAX_PASSES = 6

  async function publishAllDraftComments() {
    setPublishingDrafts(true)
    setPublishDraftsError(null)
    const total = draftComments.length
    setPublishProgress({done: 0, total})
    let remaining = draftComments
    let publishedCount = 0
    let previousFailedSignature: string | null = null
    let lastFailures: {name: string; id: string; reason: string}[] = []
    try {
      for (let pass = 0; pass < PUBLISH_MAX_PASSES && remaining.length > 0; pass++) {
        const stillFailing: typeof remaining = []
        const passFailures: {name: string; id: string; reason: string}[] = []
        for (let i = 0; i < remaining.length; i += PUBLISH_BATCH_SIZE) {
          const batch = remaining.slice(i, i + PUBLISH_BATCH_SIZE)
          const results = await Promise.allSettled(batch.map((c) => publishComment(c._id)))
          results.forEach((result, idx) => {
            const c = batch[idx]
            if (result.status === 'fulfilled') {
              publishedCount++
            } else {
              stillFailing.push(c)
              const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
              passFailures.push({name: c.name, id: c._id, reason})
            }
          })
          setPublishProgress({done: publishedCount, total})
        }
        lastFailures = passFailures
        const signature = stillFailing
          .map((c) => c._id)
          .sort()
          .join(',')
        remaining = stillFailing
        if (signature === previousFailedSignature) break
        previousFailedSignature = signature
      }
    } finally {
      setPublishingDrafts(false)
      setPublishProgress(null)
      setPublishDraftsError(
        remaining.length > 0
          ? `Couldn't publish ${remaining.length}: ${lastFailures
              .slice(0, 20)
              .map((f) => `${f.name || '(unnamed)'} (${f.id}): ${f.reason}`)
              .join('; ')}${lastFailures.length > 20 ? `; and ${lastFailures.length - 20} more` : ''}.`
          : null,
      )
      load()
    }
  }

  // Repoints every blocker with a known field at the post's published ID
  // in one go -- one blocker at a time, each its own try/catch (not one
  // around the whole loop), so a single real failure surfaces as a
  // specific message instead of silently stopping every fix after it.
  // Blockers with no known field (fieldName null -- the one-level scan in
  // loadStuckPosts came up empty) are skipped and called out separately,
  // never guessed at.
  async function fixStuckPost(stuck: StuckPost) {
    setFixingStuckId(stuck.draftId)
    setFixError(null)
    const failed: string[] = []
    try {
      for (const blocker of stuck.blockers) {
        if (!blocker.fieldName) continue
        try {
          // _weak: true alongside the repointed _ref, not just the _ref
          // alone -- confirmed by the real error text a plain _ref fix
          // produced here ("references non-existent document ..."): a
          // normal (strong) reference can't be written pointing at a
          // document that doesn't exist yet, and this post has never
          // published, so its published-ID document genuinely doesn't
          // exist until publishing succeeds -- which is exactly what's
          // blocked. A weak reference is allowed to point at a
          // not-yet-existing document; once Asher publishes and that
          // document comes into existence, this same reference resolves
          // correctly with no further action needed.
          await client
            .patch(blocker._id)
            .set({[`${blocker.fieldName}._ref`]: stuck.publishedId, [`${blocker.fieldName}._weak`]: true})
            .commit()
        } catch (err) {
          // The real reason matters here -- a bare catch that only records
          // which document failed (an earlier version of this) gives
          // nothing to actually diagnose a repeat failure with.
          const reason = err instanceof Error ? err.message : String(err)
          failed.push(`${blocker._type} (${blocker._id}): ${reason}`)
        }
      }
    } finally {
      setFixingStuckId(null)
      setFixError(
        failed.length > 0
          ? {draftId: stuck.draftId, message: `Couldn't fix ${failed.length}: ${failed.join('; ')}.`}
          : null,
      )
      loadStuckPosts()
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
      {/* Group header's own gridTemplateColumns is fixed rem widths (see
          GROUP_HEADER_COLUMNS) so the count/lock/show columns stay aligned
          row to row regardless of title length -- correct on desktop, but
          on a narrow phone those three fixed columns (~18.5rem combined)
          crowd the title column down to nothing, exactly what happened
          when Asher used this on mobile: every row read as a bare
          "2 comments / Lock comments / Show" with no way to tell which
          post it was. A stylesheet !important is what actually beats an
          inline style's own specificity here -- the Grid needs its literal
          gridTemplateColumns overridden below a real device width, not
          just deprioritized. */}
      <style>{`
        @media (max-width: 640px) {
          .asheraw-group-header-grid {
            grid-template-columns: 1fr !important;
            row-gap: 8px !important;
          }
        }
      `}</style>
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

        {stuckPosts.map((stuck) => {
          const knownBlockers = stuck.blockers.filter((b) => b.fieldName)
          const unknownBlockers = stuck.blockers.filter((b) => !b.fieldName)
          return (
            <Card key={stuck.draftId} padding={4} radius={3} tone="critical" border>
              <Stack space={3}>
                <Flex align="center" gap={3} wrap="wrap">
                  <Badge tone="critical" fontSize={2}>
                    {stuck.blockers.length}
                  </Badge>
                  <Text size={2} weight="semibold">
                    document(s) are blocking "{stuck.postTitle}" from ever publishing
                  </Text>
                </Flex>
                <Text size={1} muted>
                  Usually an old imported item (like a Facebook comment brought over by hand) created before this
                  post was published. Harmless on its own, but Sanity won't let a post publish while anything
                  still points at its unpublished version. Fixing this only repoints those items at the right
                  post -- nothing else about them changes.
                </Text>
                {knownBlockers.length > 0 && (
                  <Box>
                    <Button
                      text={fixingStuckId === stuck.draftId ? 'Fixing…' : `Fix ${knownBlockers.length === 1 ? 'it' : 'them'} now`}
                      tone="critical"
                      fontSize={1}
                      disabled={fixingStuckId === stuck.draftId}
                      onClick={() => fixStuckPost(stuck)}
                    />
                  </Box>
                )}
                {unknownBlockers.length > 0 && (
                  <Text size={1} weight="semibold">
                    {unknownBlockers.length} of these couldn't be identified automatically -- needs a manual look:{' '}
                    {unknownBlockers.map((b) => `${b._type} (${b._id})`).join(', ')}.
                  </Text>
                )}
                {fixError && fixError.draftId === stuck.draftId && (
                  <Text size={1} weight="semibold">
                    {fixError.message}
                  </Text>
                )}
              </Stack>
            </Card>
          )
        })}

        {draftComments.length > 0 && (
          <Card padding={4} radius={3} tone="critical" border>
            <Stack space={3}>
              <Flex align="center" gap={3} wrap="wrap">
                <Badge tone="critical" fontSize={2}>
                  {draftComments.length}
                </Badge>
                <Text size={2} weight="semibold">
                  {draftComments.length === 1 ? "comment is" : "comments are"} sitting unpublished and won't show on
                  your site
                </Text>
              </Flex>
              <Text size={1} muted>
                Same legacy-import issue as the other box above, but on the comment itself this time -- these were
                imported directly into a draft state that never got published. Approving one only updates the draft;
                your live site only shows fully published content, so it stays invisible to visitors either way.
                Fixing this publishes them for real -- their content, name, and status all stay exactly as they are.
                {draftComments.length > 50 &&
                  ` That's a lot at once, so this counts up as it goes -- stay on this page until it finishes rather than closing the tab partway through.`}
              </Text>
              <Box>
                <Button
                  text={
                    publishingDrafts
                      ? `Publishing… ${publishProgress ? `${publishProgress.done}/${publishProgress.total}` : ''}`
                      : `Publish ${draftComments.length === 1 ? 'it' : 'them'} now`
                  }
                  tone="critical"
                  fontSize={1}
                  disabled={publishingDrafts}
                  onClick={publishAllDraftComments}
                />
              </Box>
              {publishDraftsError && (
                <Text size={1} weight="semibold">
                  {publishDraftsError}
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
                  <Grid
                    columns={4}
                    gap={2}
                    className="asheraw-group-header-grid"
                    style={{gridTemplateColumns: GROUP_HEADER_COLUMNS, alignItems: 'center'}}
                  >
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
                            {group.postTitle ?? fallbackPostLabel(group.postId)}
                          </a>
                        ) : (
                          group.postTitle ?? fallbackPostLabel(group.postId)
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
                {comment.postTitle ?? fallbackPostLabel(comment.postId)}
              </a>
            ) : (
              comment.postTitle ?? fallbackPostLabel(comment.postId)
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
