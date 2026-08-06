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
  const path = request.nextUrl.searchParams.get("path") || "/blog";
  revalidatePath(path, "layout");
  if (path !== "/blog") revalidatePath("/blog", "layout");
  return NextResponse.json({ revalidated: true, path });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
