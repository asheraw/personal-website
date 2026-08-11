import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

const DOC_ID = "consentLog";

// Called from CookieConsent.tsx on both Accept and Decline. This exists
// because GA/GTM itself can never answer "how many people declined" --
// GTM doesn't load at all for a visitor who declines (see Analytics.tsx),
// so there's no tag inside Google Analytics that could ever see that
// click. This route is a first-party alternative: no IP address, no
// cookie, nothing that identifies who clicked, just a running tally --
// same "anonymous count" shape as /api/track-404.
// Known variant ids from CookieConsent.tsx's own VARIANTS list -- anything
// else (a stale client build, a hand-crafted request) is dropped rather
// than stored, so the Dashboard's per-variant breakdown never has to guard
// against a mystery fourth bucket.
const KNOWN_VARIANTS = new Set(["current", "formal", "cookieTasting"]);

export async function POST(request: NextRequest) {
  try {
    const { choice, variant } = await request.json();

    if (choice !== "accepted" && choice !== "declined") {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    const safeVariant = typeof variant === "string" && KNOWN_VARIANTS.has(variant) ? variant : undefined;

    const now = new Date().toISOString();

    await writeClient.createIfNotExists({
      _id: DOC_ID,
      _type: "consentLog",
      acceptedCount: 0,
      declinedCount: 0,
      entries: [],
    });

    const existing = await writeClient.fetch<{ entries?: { choice: string; timestamp: string; variant?: string }[] }>(
      `*[_id == $id][0]{entries}`,
      { id: DOC_ID }
    );
    const newEntry = {
      _key: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      choice,
      timestamp: now,
      ...(safeVariant ? { variant: safeVariant } : {}),
    };
    const updatedEntries = [...(existing?.entries ?? []), newEntry].slice(-1000);

    const countField = choice === "accepted" ? "acceptedCount" : "declinedCount";
    await writeClient
      .patch(DOC_ID)
      .inc({ [countField]: 1 })
      .set({ entries: updatedEntries })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Never let a tracking failure be visible to the visitor -- worst case
    // is just a missed data point, not a broken banner.
    console.error("[track-consent] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
