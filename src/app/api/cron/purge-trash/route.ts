import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Runs daily (see vercel.json's crons entry) -- permanently deletes any
// comment that's been in Studio -> Comments' Trash view for 30+ days
// (trashedAt set), AND any image asset that's been in Studio -> Media ->
// Trash for 30+ days (see MediaLibraryTool.tsx / imageAssetTrashType.ts).
// Both match the same TRASH_RETENTION_DAYS constant shown to Asher in
// their respective tools before it's actually reached.
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

  const commentIds: string[] = await writeClient.fetch(
    `*[_type == "comment" && defined(trashedAt) && trashedAt < $cutoff]._id`,
    { cutoff }
  );
  if (commentIds.length > 0) {
    const tx = writeClient.transaction();
    for (const id of commentIds) tx.delete(id);
    await tx.commit();
  }

  // Image assets get an extra check comments don't need: re-confirm
  // nothing references the asset anymore before actually deleting it. A
  // post could have started using an image again after it was trashed
  // (restored elsewhere, re-inserted from an old export) -- deleting the
  // real asset out from under a post that still points at it would leave
  // a broken image on the live site, so a still-referenced asset is left
  // trashed (not un-trashed, just not purged yet) rather than deleted.
  const trashDocs: { _id: string; assetId: string }[] = await writeClient.fetch(
    `*[_type == "imageAssetTrash" && defined(trashedAt) && trashedAt < $cutoff]{_id, assetId}`,
    { cutoff }
  );
  let imagesDeleted = 0;
  let imagesSkipped = 0;
  for (const doc of trashDocs) {
    const stillUsed: number = await writeClient.fetch(`count(*[_type == "post" && references($id)])`, {
      id: doc.assetId,
    });
    if (stillUsed > 0) {
      imagesSkipped++;
      continue;
    }
    await writeClient.transaction().delete(doc._id).delete(doc.assetId).commit();
    imagesDeleted++;
  }

  return NextResponse.json({
    success: true,
    commentsDeleted: commentIds.length,
    imagesDeleted,
    imagesSkipped,
  });
}
