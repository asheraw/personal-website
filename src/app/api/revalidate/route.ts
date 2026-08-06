import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Clears the Data Cache for the blog section -- see RUNBOOK.md's
// "Publishing" section for the full mechanism this exists to work around:
// sanityFetch() reads through Sanity's CDN by design, cached in a layer
// that's meant to auto-clear the instant something's published but can
// get stuck if that chain doesn't fire for one specific publish. Calling
// this route forces a refresh regardless of why.
//
// No secret/auth -- deliberately, matching the other low-stakes public
// routes here (/api/track-404, /api/track-search, /api/track-share):
// worst-case misuse is a few extra Sanity reads, never data exposure or
// a content change, so gating this behind a secret Asher would have to
// set up and remember wasn't worth the friction for what it protects.
//
// Called automatically ~4s after every post Publish
// (src/sanity/actions/revalidateOnPublish.ts) -- this route existing on
// its own doesn't require Asher to do anything; it's wired up so
// clicking the same Publish button he already uses is enough.
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  // The listing (`/blog`) and every individual post page (`/blog/[slug]`)
  // are two separate page.tsx files with no shared layout.tsx between
  // them -- an earlier version of this route called
  // revalidatePath('/blog', 'layout'), which only actually works when a
  // real layout boundary exists at that path. It doesn't here, so that
  // call silently never reached individual post pages at all: the
  // listing picked up fresh data, but a specific post's own page stayed
  // stuck indefinitely regardless of anything else tried (confirmed
  // directly -- see RUNBOOK.md). Explicitly revalidating the `[slug]`
  // route pattern with `'page'` type is what actually reaches every post
  // page in one call, route-group folders like `(site)` included --
  // revalidatePath operates on the real URL, not the file-system path.
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  // A specific post's real, resolved URL is also revalidated directly
  // when known (revalidateOnPublish.ts passes ?path=/blog/<slug>) -- belt
  // and suspenders on top of the pattern-based call above, not required
  // for it to work, just an extra direct hit on the one post that
  // actually just changed.
  if (path) revalidatePath(path);

  return NextResponse.json({ revalidated: true, path: path || null });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
