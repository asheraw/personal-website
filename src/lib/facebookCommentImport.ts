import type {SanityClient} from 'next-sanity'

// Shared by the new Apify comment-pull route (src/app/api/ai/pull-facebook-
// comments/route.ts) -- the matching/dedupe rules here follow the same
// approach documented in RUNBOOK.md for the historical .txt-based Facebook
// importer: match by exact name+message first, then one containing the
// other (minor emoji/punctuation drift), falling back to name-only only for
// top-level comments (too loose for a reply -- the same person often
// replies more than once in one thread). A matched comment is left
// untouched, so an already-`approved` comment keeps that status; only a
// genuinely new comment gets created.

export type RawApifyComment = {
  id?: string
  replyToCommentId?: string
  profileName?: string
  text?: string
  date?: string
}

export type NormalizedComment = {
  sourceId: string
  parentSourceId: string | null
  name: string
  message: string
  createdAt: string
}

export type ExistingComment = {
  _id: string
  name: string
  message?: string
  parentComment?: {_ref: string} | null
}

// Apify's `facebook-comments-scraper` returns one flat row per comment/
// reply -- `id` is the only truly unique per-row field. `commentId` (not
// used here) is actually the thread-ROOT id, shared across a top-level
// comment and every one of its replies -- confirmed against real data
// (see tasks/todo.md Task 1 findings), not assumed from the Actor's docs.
export function normalizeApifyComments(items: RawApifyComment[]): NormalizedComment[] {
  return items
    .filter((i): i is Required<Pick<RawApifyComment, 'id' | 'profileName' | 'text'>> & RawApifyComment =>
      Boolean(i.id && i.profileName && i.text),
    )
    .map((i) => ({
      sourceId: i.id,
      parentSourceId: i.replyToCommentId ?? null,
      name: i.profileName,
      message: i.text,
      createdAt: i.date && !Number.isNaN(Date.parse(i.date)) ? i.date : new Date().toISOString(),
    }))
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

// Facebook displays Asher's own name inconsistently across comments/replies
// (sometimes "Asher Aw", sometimes just "Asher") -- both aliases are
// confirmed against real existing isAuthorReply comments in the dataset,
// not guessed.
const AUTHOR_NAME_ALIASES = new Set(['asher', 'asher aw'])

function isAuthorName(name: string): boolean {
  return AUTHOR_NAME_ALIASES.has(norm(name))
}

export function findExistingMatch(
  candidate: {name: string; message: string; isTopLevel: boolean},
  existing: ExistingComment[],
): ExistingComment | null {
  const name = norm(candidate.name)
  const message = norm(candidate.message)

  const exact = existing.find((e) => norm(e.name) === name && norm(e.message ?? '') === message)
  if (exact) return exact

  const containing = existing.find((e) => {
    if (norm(e.name) !== name) return false
    const em = norm(e.message ?? '')
    return Boolean(em && message && (em.includes(message) || message.includes(em)))
  })
  if (containing) return containing

  if (candidate.isTopLevel) {
    const nameOnly = existing.find((e) => norm(e.name) === name && !e.parentComment)
    if (nameOnly) return nameOnly
  }

  return null
}

// Orders comments so a reply is always processed after its parent --
// parents can appear anywhere in the Apify dataset, not necessarily before
// their replies. A reply whose parent never resolves within this batch
// (its ancestor wasn't included in this pull, e.g. cut off by resultsLimit)
// is placed last and imported as a top-level comment instead of dropped --
// same "flatten rather than lose the content" precedent as the 3-level-cap
// rule in /api/comments's own POST handler.
function orderParentsFirst(comments: NormalizedComment[]): NormalizedComment[] {
  const bySourceId = new Set(comments.map((c) => c.sourceId))
  const resolved = new Set<string>()
  const ordered: NormalizedComment[] = []
  let remaining = comments

  while (remaining.length > 0) {
    const [ready, notReady] = remaining.reduce<[NormalizedComment[], NormalizedComment[]]>(
      ([r, nr], c) => {
        const parentInBatch = c.parentSourceId && bySourceId.has(c.parentSourceId)
        const parentResolved = !c.parentSourceId || !parentInBatch || resolved.has(c.parentSourceId)
        return parentResolved ? [[...r, c], nr] : [r, [...nr, c]]
      },
      [[], []],
    )
    if (ready.length === 0) {
      // Every remaining item is waiting on a parent still waiting on
      // something else -- shouldn't happen without a cycle, but break
      // rather than loop forever; whatever's left imports as top-level.
      ordered.push(...notReady)
      break
    }
    ready.forEach((c) => resolved.add(c.sourceId))
    ordered.push(...ready)
    remaining = notReady
  }

  return ordered
}

export async function importFacebookComments({
  client,
  postId,
  comments,
}: {
  client: SanityClient
  postId: string
  comments: NormalizedComment[]
}): Promise<{created: number; matched: number}> {
  const existing = await client.fetch<ExistingComment[]>(
    `*[_type == "comment" && post._ref == $postId]{_id, name, message, parentComment}`,
    {postId},
  )

  const bySourceId = new Map<string, string>() // Apify sourceId -> Sanity _id
  let created = 0
  let matched = 0

  for (const c of orderParentsFirst(comments)) {
    const parentSanityId = c.parentSourceId ? bySourceId.get(c.parentSourceId) : undefined
    const isTopLevel = !parentSanityId

    const match = findExistingMatch({name: c.name, message: c.message, isTopLevel}, existing)
    if (match) {
      bySourceId.set(c.sourceId, match._id)
      matched++
      continue
    }

    const newId = `facebook-comment-apify-${crypto.randomUUID()}`
    await client.create({
      _id: newId,
      _type: 'comment',
      post: {_type: 'reference', _ref: postId},
      name: c.name,
      email: 'not-provided@facebook-import.invalid',
      message: c.message,
      status: 'pending',
      createdAt: c.createdAt,
      isAuthorReply: isAuthorName(c.name),
      ...(parentSanityId ? {parentComment: {_type: 'reference', _ref: parentSanityId}} : {}),
    })
    bySourceId.set(c.sourceId, newId)
    existing.push({_id: newId, name: c.name, message: c.message})
    created++
  }

  return {created, matched}
}
