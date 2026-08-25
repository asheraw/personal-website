import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { PAGINATED_POSTS_QUERY, type PostSummary } from "@/sanity/lib/queries";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 24;

// Backs BlogPostList's "Load more" -- the first page of posts is rendered
// server-side by /blog itself; this only serves pages after that. `start`
// is defensively floored at 0 and `limit` capped, since both come from the
// client and this route has no auth (same tradeoff as the other
// public-facing routes in this codebase, e.g. /api/track-404).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = Math.max(0, parseInt(searchParams.get("start") ?? "0", 10) || 0);
    const requestedLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
    const end = start + limit;
    const excludeId = searchParams.get("excludeId") ?? "";

    const posts = await client.fetch<PostSummary[]>(PAGINATED_POSTS_QUERY, { start, end, excludeId });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[blog/posts] failed:", error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
