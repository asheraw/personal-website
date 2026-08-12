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
  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g&lang=en`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`;

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
      }))
      .filter((g): g is { id: string; title: string; thumbUrl: string; url: string } => !!g.url && !!g.thumbUrl);
    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json({ error: "GIF search failed." }, { status: 502 });
  }
}
