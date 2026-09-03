import type {NormalizedComment} from './socialCommentImport'

// TikTok-specific raw shape + normalizer. Shared dedupe/import logic lives
// in socialCommentImport.ts. Actor: clockworks/tiktok-comments-scraper
// (official Apify) -- validated against a real public video; replies come
// back as flat rows alongside top-level comments, linked via `repliesToId`,
// the same flat shape Facebook uses (not Instagram's nested-array shape).

export type RawTikTokComment = {
  cid?: string
  repliesToId?: string | null
  text?: string
  uniqueId?: string
  createTimeISO?: string
}

export function normalizeTikTokComments(items: RawTikTokComment[]): NormalizedComment[] {
  return items
    .filter((i): i is Required<Pick<RawTikTokComment, 'cid' | 'uniqueId' | 'text'>> & RawTikTokComment =>
      Boolean(i.cid && i.uniqueId && i.text),
    )
    .map((i) => ({
      sourceId: i.cid,
      parentSourceId: i.repliesToId ?? null,
      name: i.uniqueId,
      message: i.text,
      createdAt: i.createTimeISO && !Number.isNaN(Date.parse(i.createTimeISO)) ? i.createTimeISO : new Date().toISOString(),
    }))
}
