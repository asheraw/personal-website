import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Called from src/app/not-found.tsx. One document per distinct missing
// path (see notFoundHitType.ts) -- repeat hits increment hitCount rather
// than piling up a new document every time, so Studio stays browsable
// instead of turning into a flood of near-identical entries.
export async function POST(request: NextRequest) {
  try {
    const { path, referrer } = await request.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Defensive caps -- this endpoint has no auth (same tradeoff as the
    // other public-facing routes here), so nothing it receives should be
    // trusted to be well-formed or bounded in length.
    const safePath = path.slice(0, 300);
    const safeReferrer = typeof referrer === "string" ? referrer.slice(0, 300) : undefined;

    // Deterministic id from the path, so repeat hits land on the same
    // document instead of creating a new one each time.
    const id = `notfound-${safePath.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120) || "root"}`;

    const now = new Date().toISOString();

    await writeClient.createIfNotExists({
      _id: id,
      _type: "notFoundHit",
      path: safePath,
      hitCount: 0,
      firstSeenAt: now,
      hits: [],
    });

    // Read-modify-write rather than a blind append: keeps the stored log
    // capped at the most recent 500 entries so a path getting hammered
    // (bot scanning, deliberate bruteforcing) can't grow this document
    // without bound. hitCount (incremented separately below) stays the true
    // total even past that cap.
    const existing = await writeClient.fetch<{ hits?: { timestamp: string; referrer?: string }[] }>(
      `*[_id == $id][0]{hits}`,
      { id }
    );
    const newHit = {
      _key: `hit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      ...(safeReferrer ? { referrer: safeReferrer } : {}),
    };
    const updatedHits = [...(existing?.hits ?? []), newHit].slice(-500);

    await writeClient
      .patch(id)
      .inc({ hitCount: 1 })
      .set({ lastSeenAt: now, hits: updatedHits, ...(safeReferrer ? { referrer: safeReferrer } : {}) })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Never let a tracking failure be visible to the visitor -- worst case
    // is just a missed data point, not a broken page.
    console.error("[track-404] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
