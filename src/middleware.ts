import { NextRequest, NextResponse } from "next/server";
import { apiVersion, dataset, projectId } from "@/sanity/env";

// Managed from Studio -> Redirects (src/sanity/schemaTypes/redirectType.ts).
// A plain fetch to Sanity's HTTP API, not the @sanity/client SDK -- keeps
// this dependency-free and definitely compatible with the Edge runtime
// middleware runs on. Cached in memory for CACHE_MS per edge instance
// (same tradeoff as the rest of this site's revalidate = 60 pages): a new
// or edited redirect takes up to a minute to apply, in exchange for not
// hitting Sanity on every single request.
const CACHE_MS = 60_000;

type RedirectEntry = { to: string; permanent: boolean };

let cache: { map: Map<string, RedirectEntry>; fetchedAt: number } | null = null;

async function getRedirectMap(): Promise<Map<string, RedirectEntry>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.map;
  }

  const query = encodeURIComponent(
    `*[_type == "redirect" && defined(from) && defined(to)]{from, to, permanent}`
  );
  const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const map = new Map<string, RedirectEntry>();
    for (const entry of json.result ?? []) {
      if (entry?.from && entry?.to) {
        map.set(entry.from, { to: entry.to, permanent: entry.permanent !== false });
      }
    }
    cache = { map, fetchedAt: Date.now() };
    return map;
  } catch {
    // A Sanity hiccup shouldn't take every page down -- fall back to
    // whatever was cached before (even if stale), or just no redirects
    // this time if there's nothing cached yet.
    return cache?.map ?? new Map();
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const map = await getRedirectMap();
  const entry = map.get(pathname);

  if (entry) {
    const destination = entry.to.startsWith("http") ? entry.to : new URL(entry.to, request.url);
    return NextResponse.redirect(destination, entry.permanent ? 301 : 302);
  }

  // Legacy ".html" URLs from the pre-migration site (e.g.
  // /blog/some-post.html) -- this app never serves a route ending in
  // .html, so stripping it and redirecting is always safe: either the
  // trimmed path is a real page, or it 404s exactly the way the .html
  // version would have anyway. Covers every old .html link at once,
  // instead of needing a one-by-one Redirect entry per post.
  if (pathname.endsWith(".html")) {
    return NextResponse.redirect(new URL(pathname.slice(0, -".html".length) || "/", request.url), 301);
  }

  return NextResponse.next();
}

// Excludes static assets, image optimization, and Studio itself -- a
// redirect should never fire for /studio/** (Sanity's own routing lives
// there) or for build artifacts that were never a real page anyway.
export const config = {
  matcher: ["/((?!_next/static|_next/image|studio|favicon.ico).*)"],
};
