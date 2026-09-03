import type {NormalizedComment} from './socialCommentImport'

// Instagram-specific raw shape + normalizer. Shared dedupe/import logic
// lives in socialCommentImport.ts.

export type RawInstagramComment = {
  id?: string
  text?: string
  ownerUsername?: string
  timestamp?: string
  // apify/instagram-comment-scraper returns one row per top-level comment,
  // each optionally carrying its own replies nested inside -- unlike
  // Facebook's flat one-row-per-comment-or-reply shape. Confirmed against
  // real output that a free-tier Apify account never actually gets this
  // populated (it's gated to a paid Apify plan on this Actor -- see
  // tasks/todo.md), so this is handled defensively rather than assumed.
  replies?: RawInstagramComment[] | null
}

export function normalizeInstagramComments(items: RawInstagramComment[]): NormalizedComment[] {
  const out: NormalizedComment[] = []

  function walk(list: RawInstagramComment[], parentSourceId: string | null) {
    for (const i of list) {
      if (!i.id || !i.ownerUsername || !i.text) continue
      out.push({
        sourceId: i.id,
        parentSourceId,
        name: i.ownerUsername,
        message: i.text,
        createdAt: i.timestamp && !Number.isNaN(Date.parse(i.timestamp)) ? i.timestamp : new Date().toISOString(),
      })
      if (Array.isArray(i.replies) && i.replies.length > 0) {
        walk(i.replies, i.id)
      }
    }
  }

  walk(items, null)
  return out
}
