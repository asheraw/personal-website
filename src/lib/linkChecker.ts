import {writeClient} from '@/sanity/lib/write-client'

type MarkDef = {_type?: string; _key?: string; href?: string}
type Block = {_type?: string; markDefs?: MarkDef[]}

type Source = {type: 'post' | 'snippet'; title: string; slug?: string; id: string}
type LinkEntry = {url: string; isAffiliate: boolean; sources: Source[]}

const CHECK_TIMEOUT_MS = 8000
const CONCURRENCY = 6

// Deterministic, dependency-free short hash -- same URL always maps to the
// same document id, so re-running the checker upserts instead of piling up
// duplicate documents for a link that hasn't changed.
function hashUrl(url: string): string {
  let hash = 2166136261
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function extractLinksFromBlocks(blocks: unknown, source: Source, into: Map<string, LinkEntry>) {
  if (!Array.isArray(blocks)) return
  for (const block of blocks as Block[]) {
    if (block?._type !== 'block') continue
    for (const mark of block.markDefs ?? []) {
      const isAffiliate = mark._type === 'affiliateLink'
      const isPlainLink = mark._type === 'link'
      if (!isAffiliate && !isPlainLink) continue
      const url = mark.href?.trim()
      if (!url || !/^https?:\/\//.test(url)) continue
      const existing = into.get(url)
      if (existing) {
        existing.isAffiliate = existing.isAffiliate || isAffiliate
        if (!existing.sources.some((s) => s.id === source.id)) {
          existing.sources.push(source)
        }
      } else {
        into.set(url, {url, isAffiliate, sources: [source]})
      }
    }
  }
}

/** Every distinct http(s) URL used in any post or snippet's own rich text, with where it's used. */
export async function collectLinks(): Promise<LinkEntry[]> {
  const [posts, snippets] = await Promise.all([
    writeClient.fetch<{_id: string; title: string; slug: string; body: unknown}[]>(
      `*[_type == "post" && defined(slug.current)]{_id, title, "slug": slug.current, body}`,
    ),
    writeClient.fetch<{_id: string; title: string; content: unknown}[]>(
      `*[_type == "snippet"]{_id, title, content}`,
    ),
  ])

  const links = new Map<string, LinkEntry>()
  for (const post of posts) {
    extractLinksFromBlocks(post.body, {type: 'post', title: post.title, slug: post.slug, id: post._id}, links)
  }
  for (const snippet of snippets) {
    extractLinksFromBlocks(snippet.content, {type: 'snippet', title: snippet.title, id: snippet._id}, links)
  }
  return [...links.values()]
}

// 401/403/429 usually mean a site is refusing an automated/bot-looking
// request specifically -- not that the page itself is actually gone.
// Instagram in particular does this for essentially all non-browser
// traffic. Flagging these separately from a real 404/dead-domain failure
// is the difference between "broken" meaning something trustworthy versus
// crying wolf on links that are perfectly fine for an actual visitor.
//
// 500 joins this set on real, confirmed evidence, not a guess: webmd.com
// consistently returned 500 to this checker (from Vercel's own serverless
// IPs, even after the retry above), while the exact same URL came back a
// clean 200 from a different network every time it was tested directly --
// a persistent IP-reputation block (common for CDNs/WAFs against
// datacenter/cloud IP ranges specifically), not a real broken link. A
// genuinely dead page returning 500 would still get caught -- it just
// shows under "Possibly Blocked" instead of "Broken," same tradeoff
// already accepted for 401/403/429.
const BOT_BLOCK_STATUS_CODES = new Set([401, 403, 429, 500])

type CheckResult = {ok: boolean; statusCode?: number; error?: string; blocked: boolean}

// A one-off transient hiccup -- a server having a bad second, a dropped
// connection -- shouldn't get permanently reported as "broken" from a
// single unlucky request. Confirmed as a real problem, not a hypothetical
// one: a real check run recorded webmd.com as a 500, but the exact same
// URL came back a clean 200 moments later when re-checked directly. A
// non-2xx/5xx-shaped failure gets one retry, after a short pause, before
// it's actually recorded as broken.
const RETRY_DELAY_MS = 3000

async function attemptCheck(url: string): Promise<CheckResult> {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
        headers: {'User-Agent': 'Mozilla/5.0 (compatible; asheraw.com link checker)'},
      })
      // Some servers reject HEAD outright (405/501) even though the page
      // itself is fine -- fall through to a real GET rather than reporting
      // a false break.
      if (res.status === 405 || res.status === 501) continue
      return {ok: res.ok, statusCode: res.status, blocked: BOT_BLOCK_STATUS_CODES.has(res.status)}
    } catch (err) {
      if (method === 'GET') {
        return {ok: false, error: err instanceof Error ? err.message : 'Request failed', blocked: false}
      }
      // HEAD threw (some hosts refuse it outright, not just via a status
      // code) -- try GET before giving up.
    }
  }
  return {ok: false, error: 'Request failed', blocked: false}
}

async function checkUrl(url: string): Promise<CheckResult> {
  const first = await attemptCheck(url)
  if (first.ok) return first
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  return attemptCheck(url)
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker))
  return results
}

/**
 * Full run: re-extracts every link from current post/snippet content, checks
 * each one live, and upserts the result -- deleting any previously-checked
 * URL that no longer appears anywhere, so the registry never drifts from
 * what's actually in use. Shared by the on-demand "Check now" button
 * (/api/check-links) and the daily cron (/api/cron/check-links).
 */
export async function runLinkCheck(): Promise<{checked: number; broken: number}> {
  const links = await collectLinks()
  const now = new Date().toISOString()

  const existingDocs = await writeClient.fetch<{_id: string; url: string; ok?: boolean; brokenSince?: string}[]>(
    `*[_type == "linkCheck"]{_id, url, ok, brokenSince}`,
  )
  const existingByUrl = new Map(existingDocs.map((d) => [d.url, d]))
  const currentUrls = new Set(links.map((l) => l.url))

  const results = await mapWithConcurrency(links, CONCURRENCY, async (link) => {
    const result = await checkUrl(link.url)
    return {link, result}
  })

  const tx = writeClient.transaction()
  let broken = 0
  for (const {link, result} of results) {
    if (!result.ok) broken++
    const prev = existingByUrl.get(link.url)
    const brokenSince = result.ok ? undefined : (prev?.brokenSince ?? now)
    const id = `linkcheck-${hashUrl(link.url)}`
    tx.createOrReplace({
      _id: id,
      _type: 'linkCheck',
      url: link.url,
      isAffiliate: link.isAffiliate,
      sources: link.sources,
      ok: result.ok,
      statusCode: result.statusCode,
      error: result.error,
      blocked: result.blocked,
      lastCheckedAt: now,
      ...(brokenSince ? {brokenSince} : {}),
    })
  }

  // Clean up anything that no longer appears in any post/snippet.
  for (const doc of existingDocs) {
    if (!currentUrls.has(doc.url)) tx.delete(doc._id)
  }

  await tx.commit()
  return {checked: links.length, broken}
}
