import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Called from BlogSearch.tsx once a query "settles" (debounced client-side
// -- see BlogSearch.tsx for why), not on every keystroke. One document per
// distinct normalized query (see searchQueryLogType.ts) -- repeat searches
// increment hitCount rather than piling up a new document every time,
// same reasoning as /api/track-404.
export async function POST(request: NextRequest) {
  try {
    const { query, resultCount } = await request.json();

    if (typeof query !== "string" || !query.trim() || typeof resultCount !== "number") {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Normalized (trimmed, lowercased, collapsed whitespace) so "Podcast",
    // " podcast ", and "podcast" all land on the same document instead of
    // three near-identical ones. Defensive length cap -- this endpoint has
    // no auth (same tradeoff as the other public-facing tracking routes
    // here), so nothing it receives should be trusted to be well-formed.
    const safeQuery = query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
    if (!safeQuery) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    const safeResultCount = Math.max(0, Math.min(9999, Math.round(resultCount)));

    // Deterministic id from the normalized query, so repeat searches land
    // on the same document instead of creating a new one each time.
    const id = `search-${safeQuery.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 150) || "blank"}`;

    const now = new Date().toISOString();

    await writeClient.createIfNotExists({
      _id: id,
      _type: "searchQueryLog",
      query: safeQuery,
      hitCount: 0,
      firstSeenAt: now,
      hits: [],
      status: "pending",
    });

    // Read-modify-write rather than a blind append: keeps the stored log
    // capped at the most recent 500 entries, mirroring /api/track-404.
    const existing = await writeClient.fetch<{
      hits?: { timestamp: string; resultCount?: number }[];
    }>(`*[_id == $id][0]{hits}`, { id });
    const newHit = {
      _key: `hit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      resultCount: safeResultCount,
    };
    const updatedHits = [...(existing?.hits ?? []), newHit].slice(-500);

    await writeClient
      .patch(id)
      .inc({ hitCount: 1 })
      .set({
        lastSeenAt: now,
        lastResultCount: safeResultCount,
        hits: updatedHits,
      })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Never let a tracking failure be visible to the visitor -- worst case
    // is just a missed data point, not a broken search box.
    console.error("[track-search] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
