import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Manual escape hatch for exactly the incident RUNBOOK.md documents
// 2026-08-06: sanityFetch()'s underlying Data Cache is meant to be
// invalidated automatically the instant something's published (via
// Sanity's Live Content API's own sync-tag -> revalidateTag chain), but
// that chain depends on a live event actually reaching this deployment
// and being processed successfully. If it doesn't -- for whatever
// reason, on whichever specific publish -- the cached data has nothing
// else forcing it to refresh, and a plain redeploy doesn't touch this
// cache layer at all (Vercel's Data Cache is deliberately designed to
// survive redeploys). This route calls revalidatePath() directly as a
// manual override for exactly that stuck-cache case.
//
// GET, not POST -- deliberately, so this can be triggered by just
// visiting a URL (bookmarkable, no terminal/curl needed) rather than
// requiring tooling a non-technical site owner wouldn't have on hand.
// Low blast radius either way: worst case of misuse is a few extra
// Sanity reads, never data exposure or a content change, so the
// GET-for-convenience tradeoff is a reasonable one here.
//
// Requires a one-time REVALIDATE_SECRET environment variable in Vercel
// (same shape as CRON_SECRET/RESEND_API_KEY) -- fails closed (401) if
// it isn't set, rather than allowing anyone who finds this URL to
// trigger cache invalidation for free.
export async function GET(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET isn't set in Vercel yet." },
      { status: 500 }
    );
  }
  if (request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ revalidated: false, error: "Invalid secret." }, { status: 401 });
  }

  // Defaults to clearing the whole blog section -- covers "the post's own
  // page still looks stale" and "it's not showing up on the listing yet"
  // in one call, without needing to know or guess a specific slug.
  const path = request.nextUrl.searchParams.get("path") || "/blog";
  revalidatePath(path, "layout");
  if (path !== "/blog") revalidatePath("/blog", "layout");

  return NextResponse.json({ revalidated: true, path });
}
