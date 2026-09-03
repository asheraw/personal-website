import type {NormalizedComment} from './socialCommentImport'

// YouTube-specific raw shape + normalizer. Shared dedupe/import logic lives
// in socialCommentImport.ts. Actor: streamers/youtube-comments-scraper
// (official Apify) -- validated against a real public video; replies come
// back as flat rows alongside top-level comments, linked via `replyToCid`.
//
// Known limitation, confirmed against real output rather than assumed: this
// Actor only returns a relative time string ("4 years ago", "2 months
// ago"), never an absolute/ISO date -- there's no real date to parse, so
// every YouTube-imported comment falls back to "now" as its stored date.
// Worth knowing if the comments list ever looks oddly out of chronological
// order for YouTube specifically.

export type RawYouTubeComment = {
  cid?: string
  replyToCid?: string | null
  comment?: string
  author?: string
}

export function normalizeYouTubeComments(items: RawYouTubeComment[]): NormalizedComment[] {
  return items
    .filter((i): i is Required<Pick<RawYouTubeComment, 'cid' | 'author' | 'comment'>> & RawYouTubeComment =>
      Boolean(i.cid && i.author && i.comment),
    )
    .map((i) => ({
      sourceId: i.cid,
      parentSourceId: i.replyToCid ?? null,
      name: i.author,
      message: i.comment,
      createdAt: new Date().toISOString(),
    }))
}
