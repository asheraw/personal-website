import type {NormalizedComment} from './socialCommentImport'

// LinkedIn-specific raw shape + normalizer. Shared dedupe/import logic lives
// in socialCommentImport.ts. Actor: harvestapi/linkedin-post-comments
// (third-party, no official Apify LinkedIn comment-scraper exists -- this
// one has the strongest usage/rating among the real options) -- validated
// against a real public post.
//
// Honest gap: the real test post had zero replies, so the actual reply
// shape (nested under each comment, per the Actor's own README, vs a flat
// row like TikTok/Facebook) hasn't been confirmed against real data.
// Written defensively to handle a nested `replies` array if present --
// worth re-checking the first time a real post with real replies gets
// pulled.

export type RawLinkedInComment = {
  id?: string
  commentary?: string
  createdAt?: string
  actor?: {name?: string}
  replies?: RawLinkedInComment[] | null
}

export function normalizeLinkedInComments(items: RawLinkedInComment[]): NormalizedComment[] {
  const out: NormalizedComment[] = []

  function walk(list: RawLinkedInComment[], parentSourceId: string | null) {
    for (const i of list) {
      const name = i.actor?.name
      if (!i.id || !name || !i.commentary) continue
      out.push({
        sourceId: i.id,
        parentSourceId,
        name,
        message: i.commentary,
        createdAt: i.createdAt && !Number.isNaN(Date.parse(i.createdAt)) ? i.createdAt : new Date().toISOString(),
      })
      if (Array.isArray(i.replies) && i.replies.length > 0) {
        walk(i.replies, i.id)
      }
    }
  }

  walk(items, null)
  return out
}
