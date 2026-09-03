import type {NormalizedComment} from './socialCommentImport'

// Facebook-specific raw shape + normalizer. Shared dedupe/import logic
// (findExistingMatch, importSocialComments) lives in socialCommentImport.ts
// -- see that file for the matching-rule rationale.

export type RawApifyComment = {
  id?: string
  replyToCommentId?: string
  profileName?: string
  text?: string
  date?: string
}

// Apify's `facebook-comments-scraper` returns one flat row per comment/
// reply -- `id` is the only truly unique per-row field. `commentId` (not
// used here) is actually the thread-ROOT id, shared across a top-level
// comment and every one of its replies -- confirmed against real data
// (see tasks/todo.md Task 1 findings), not assumed from the Actor's docs.
export function normalizeFacebookComments(items: RawApifyComment[]): NormalizedComment[] {
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
