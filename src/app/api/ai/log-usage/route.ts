import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Called from the Studio dialogs (suggestSeo.tsx, suggestSocialCopy.tsx)
// the moment an editor actually applies or copies a suggestion --
// completes the "review queue" picture started by the aiOutputLog
// document each suggest-* route already creates. Never blocks or delays
// the actual apply/copy action in the UI; this is a fire-and-forget
// record of it, not a gate.
export async function POST(request: NextRequest) {
  try {
    const { logId, action } = await request.json();

    if (typeof logId !== "string" || !logId || typeof action !== "string" || !action) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const safeAction = action.slice(0, 200);
    const now = new Date().toISOString();

    const existing = await writeClient.fetch<{ usedActions?: { action: string; timestamp: string }[] }>(
      `*[_id == $id][0]{usedActions}`,
      { id: logId }
    );
    // Missing document (deleted, or a stale/tampered id from the client)
    // isn't worth erroring the UI over -- same "never let tracking failure
    // be visible" stance as every other tracking route in this codebase.
    if (existing === null) {
      return NextResponse.json({ success: true });
    }

    const newAction = {
      _key: `used-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: safeAction,
      timestamp: now,
    };
    const updatedActions = [...(existing.usedActions ?? []), newAction];

    await writeClient.patch(logId).set({ used: true, usedActions: updatedActions }).commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ai/log-usage] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
