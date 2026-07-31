import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Runs daily (see vercel.json's crons entry) -- permanently deletes any
// comment that's been in Studio -> Comments' Trash view for 30+ days
// (trashedAt set). Matches TRASH_RETENTION_DAYS in CommentsTool.tsx, which
// shows the same 30-day figure to Asher before it's actually reached.
//
// Fails closed: without CRON_SECRET configured (Settings -> Environment
// Variables in Vercel), every request is rejected -- a permanent-delete
// endpoint should never be reachable by a guessed URL. Vercel automatically
// sends `Authorization: Bearer <CRON_SECRET>` on its own scheduled calls
// once that variable is set; nothing else needs to know the value.
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const ids: string[] = await writeClient.fetch(
    `*[_type == "comment" && defined(trashedAt) && trashedAt < $cutoff]._id`,
    { cutoff }
  );

  if (ids.length > 0) {
    const tx = writeClient.transaction();
    for (const id of ids) tx.delete(id);
    await tx.commit();
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
