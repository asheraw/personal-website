import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

const VALID_SOURCES = new Set(["error", "unhandledrejection", "render"]);

// Called from ErrorMonitor.tsx (window.onerror / unhandledrejection) and
// (site)/error.tsx (React render errors). One document per distinct error
// message (see errorLogType.ts) -- repeat occurrences increment
// occurrenceCount rather than piling up a new document every time, same
// grouping approach as track-404/route.ts.
export async function POST(request: NextRequest) {
  try {
    const { message, stack, source, path } = await request.json();

    if (!message || typeof message !== "string" || !VALID_SOURCES.has(source)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Defensive caps -- this endpoint has no auth (same tradeoff as the
    // other public-facing tracking routes here), so nothing it receives
    // should be trusted to be well-formed or bounded in length.
    const safeMessage = message.slice(0, 500);
    const safeStack = typeof stack === "string" ? stack.slice(0, 3000) : undefined;
    const safePath = typeof path === "string" ? path.slice(0, 300) : undefined;
    const safeUserAgent = request.headers.get("user-agent")?.slice(0, 300) || undefined;

    // Deterministic id from the message + source, so the same recurring
    // error lands on the same document instead of creating a new one each
    // time. Not from the stack trace too -- the same logical error can have
    // slightly different stacks across browsers/minified builds, and
    // grouping by message keeps the log browsable instead of fracturing one
    // real bug into many near-duplicate entries.
    const idSource = `${source}-${safeMessage}`;
    let hash = 0;
    for (let i = 0; i < idSource.length; i++) {
      hash = (hash * 31 + idSource.charCodeAt(i)) | 0;
    }
    const id = `error-${Math.abs(hash).toString(36)}`;

    const now = new Date().toISOString();

    await writeClient.createIfNotExists({
      _id: id,
      _type: "errorLog",
      message: safeMessage,
      source,
      stack: safeStack,
      occurrenceCount: 0,
      firstSeenAt: now,
      occurrences: [],
      status: "pending",
    });

    // Read-modify-write rather than a blind append -- keeps the stored log
    // capped at the most recent 200 entries so a recurring error can't grow
    // this document without bound. occurrenceCount (incremented separately
    // below) stays the true total even past that cap.
    const existing = await writeClient.fetch<{
      occurrences?: { timestamp: string; path?: string; userAgent?: string }[];
    }>(`*[_id == $id][0]{occurrences}`, { id });
    const newOccurrence = {
      _key: `occ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
      ...(safePath ? { path: safePath } : {}),
      ...(safeUserAgent ? { userAgent: safeUserAgent } : {}),
    };
    const updatedOccurrences = [...(existing?.occurrences ?? []), newOccurrence].slice(-200);

    await writeClient
      .patch(id)
      .inc({ occurrenceCount: 1 })
      .set({ lastSeenAt: now, occurrences: updatedOccurrences })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Never let a tracking failure become a second, visible error --
    // worst case is just a missed data point.
    console.error("[track-error] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
