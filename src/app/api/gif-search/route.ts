import { NextRequest, NextResponse } from "next/server";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

// In-memory, per-instance, best-effort -- not a persistent store, resets on
// cold start. Search-as-you-type from the comment form debounces client-side
// (see GifPickerButton), so real usage stays well under this; it exists to
// cap a scripted flood against Giphy's own hourly quota (100 req/hour on the
// free Beta key), not to be a precise limiter. Same tradeoff already
// accepted for middleware.ts's in-memory redirect cache -- good enough for
// this site's traffic level, not worth a persistent store for.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const recentHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  if (ip === "unknown") return false;
  const now = Date.now();
  const timestamps = (recentHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  recentHits.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

type GiphyImage = { url: string };
type GiphyGif = {
  id: string;
  title?: string;
  images: {
    fixed_height?: GiphyImage;
    fixed_height_small?: GiphyImage;
    original?: GiphyImage;
  };
};

// GET /api/gif-search?q=<term> -- proxies Giphy's search (or trending, when
// there's no query yet, so the picker isn't blank the moment it opens).
// Server-side only: keeps GIPHY_API_KEY out of the browser, and lets every
// request force Giphy's own "g" content rating -- comments here are
// genuinely public and not pre-moderated at submission time (moderation
// happens after, in Studio -> Comments), so this is worth forcing even
// though Asher still reviews everything before it goes live.
export async function GET(request: NextRequest) {
  if (!GIPHY_API_KEY) {
    return NextResponse.json({ error: "GIF search isn't configured." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many searches -- try again in a minute." }, { status: 429 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  // Clamped rather than trusted as-is -- this is a public, unauthenticated
  // route (rate-limited above, but still), and an arbitrary huge offset is
  // a pointless upstream request to Giphy that can only ever return nothing.
  const offsetParam = Number(request.nextUrl.searchParams.get("offset"));
  const offset = Number.isFinite(offsetParam) ? Math.max(0, Math.min(offsetParam, 4000)) : 0;
  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&offset=${offset}&rating=g&lang=en`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&offset=${offset}&rating=g`;

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return NextResponse.json({ error: "GIF search failed." }, { status: 502 });
    }
    const json = await res.json();
    const gifs = ((json.data ?? []) as GiphyGif[])
      .map((g) => ({
        id: g.id,
        title: g.title || "GIF",
        thumbUrl: g.images.fixed_height_small?.url ?? g.images.fixed_height?.url,
        url: g.images.fixed_height?.url,
        // Full-resolution source -- comments only ever needed the smaller
        // fixed_height rendition, but inserting one into a post's actual
        // body (see GifPickerInput.tsx) deserves the real quality Giphy
        // has, not the comment-thumbnail size.
        originalUrl: g.images.original?.url ?? g.images.fixed_height?.url,
      }))
      .filter((g): g is { id: string; title: string; thumbUrl: string; url: string; originalUrl: string } => !!g.url && !!g.thumbUrl);
    // Giphy's own pagination.total_count is the authoritative "is there
    // more" signal -- gifs.length alone would under-count whenever this
    // batch's own filter() above drops a malformed result, silently ending
    // the scroll one batch early.
    const pagination = json.pagination as { offset?: number; count?: number; total_count?: number } | undefined;
    const hasMore = pagination
      ? (pagination.offset ?? offset) + (pagination.count ?? gifs.length) < (pagination.total_count ?? 0)
      : false;
    return NextResponse.json({ gifs, hasMore, nextOffset: offset + 24 });
  } catch {
    return NextResponse.json({ error: "GIF search failed." }, { status: 502 });
  }
}
