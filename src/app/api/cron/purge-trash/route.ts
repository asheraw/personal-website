import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Runs daily (see .github/workflows/cron-purge-trash.yml -- originally
// Vercel's built-in Cron feature via vercel.json's crons entry, replaced
// with a GitHub Actions workflow once asheraw.com's DNS moved to Netlify,
// which has no equivalent built-in scheduler) -- permanently deletes any
// post that's been in Studio -> Posts -> Trash for 30+ days, AND any
// comment that's been in Studio -> Comments' Trash view for 30+ days
// (trashedAt set), AND any image asset that's been in Studio -> Media ->
// Trash for 30+ days (see MediaLibraryTool.tsx / imageAssetTrashType.ts).
// Both match the same TRASH_RETENTION_DAYS constant shown to Asher in
// their respective tools before it's actually reached.
//
// Fails closed: without CRON_SECRET configured (an environment variable on
// the live site, set in Netlify's own dashboard), every request is
// rejected -- a permanent-delete endpoint should never be reachable by a
// guessed URL. The GitHub Actions workflow sends `Authorization: Bearer
// <CRON_SECRET>` on each scheduled call, reading the same secret value
// from a GitHub repository secret; nothing else needs to know it.
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  // Posts first (their comments go with them, so the comment loop below doesn't have to). A post
  // is "in the trash" once Studio's Move to Trash stamps trashedAt on its draft and/or published
  // copy (see src/sanity/actions/postTrash.tsx); after 30 days both copies and every comment on
  // the post are deleted for good, in one transaction per post so a post is never half-deleted.
  // A post that something else still strongly references (e.g. a Link Page card) makes the
  // transaction fail; it stays in the trash and is retried tomorrow.
  const trashedPostDocs: { _id: string }[] = await writeClient.fetch(
    `*[_type == "post" && defined(trashedAt) && trashedAt < $cutoff]{_id}`,
    { cutoff },
    // raw: the default perspective hides drafts.* documents, and a trashed draft-only post must purge too.
    { perspective: "raw" }
  );
  const trashedPostBaseIds = [...new Set(trashedPostDocs.map((d) => d._id.replace(/^drafts\./, "")))];
  let postsDeleted = 0;
  let postsSkipped = 0;
  for (const baseId of trashedPostBaseIds) {
    try {
      const postIds = [baseId, `drafts.${baseId}`];
      const postComments: string[] = await writeClient.fetch(
        `*[_type == "comment" && post._ref in $postIds]._id`,
        { postIds }
      );
      const existing: string[] = await writeClient.fetch(`*[_id in $postIds]._id`, { postIds }, { perspective: "raw" });
      let tx = writeClient.transaction();
      for (const id of postComments) tx = tx.delete(id);
      for (const id of existing) tx = tx.delete(id);
      await tx.commit();
      postsDeleted++;
    } catch (err) {
      postsSkipped++;
      console.error(`purge-trash: could not delete post ${baseId}:`, err);
    }
  }

  // Shelve first-time drafts nobody has touched for 30 days (shelvedAt marks them; nothing is deleted).
  // They move to Studio -> Posts -> Shelved and off the Dashboard. Skipped: drafts that are just edits
  // to an already-published post, drafts scheduled to publish, and anything already trashed or shelved.
  // A draft's _updatedAt is its last edit, so this stamps drafts that have really been idle.
  const staleDrafts: { _id: string }[] = await writeClient.fetch(
    `*[_id in path("drafts.**") && _type == "post" && !defined(trashedAt) && !defined(shelvedAt) && !defined(scheduledPublishAt) && _updatedAt < $cutoff]{_id}`,
    { cutoff },
    { perspective: "raw" }
  );
  const livePostIds = new Set<string>(await writeClient.fetch(`*[_type == "post" && !(_id in path("drafts.**"))]._id`));
  let draftsShelved = 0;
  for (const d of staleDrafts) {
    if (livePostIds.has(d._id.replace(/^drafts\./, ""))) continue;
    try {
      await writeClient.patch(d._id).set({ shelvedAt: new Date().toISOString() }).commit();
      draftsShelved++;
    } catch (err) {
      console.error(`purge-trash: could not shelve draft ${d._id}:`, err);
    }
  }

  // One transaction per comment, not one covering all of them -- a reply
  // can still legitimately reference an expired parent (e.g. Asher's own
  // reply kept live after the comment it answers was trashed), which Sanity
  // refuses to delete out from under. A single shared transaction meant
  // that one such comment failed the whole batch, every single day, since
  // the earlier all-or-nothing version never made progress on the other,
  // unblocked comments either.
  const commentIds: string[] = await writeClient.fetch(
    `*[_type == "comment" && defined(trashedAt) && trashedAt < $cutoff]._id`,
    { cutoff }
  );
  let commentsDeleted = 0;
  let commentsSkipped = 0;
  for (const id of commentIds) {
    try {
      await writeClient.delete(id);
      commentsDeleted++;
    } catch (err) {
      // Still referenced (e.g. by a live reply) -- leave it trashed and
      // move on, same tolerance the image-asset loop below already has.
      commentsSkipped++;
      console.error(`purge-trash: could not delete comment ${id}:`, err);
    }
  }

  // Image assets get an extra check comments don't need: re-confirm
  // nothing references the asset anymore before actually deleting it. A
  // post could have started using an image again after it was trashed
  // (restored elsewhere, re-inserted from an old export) -- deleting the
  // real asset out from under a document that still points at it would leave
  // a broken image on the live site, so a still-referenced asset is left
  // trashed (not un-trashed, just not purged yet) rather than deleted.
  // Checks every document type, not just posts -- Media Library's "Replace
  // image" can repoint an author avatar or site settings image too.
  const trashDocs: { _id: string; assetId: string }[] = await writeClient.fetch(
    `*[_type == "imageAssetTrash" && defined(trashedAt) && trashedAt < $cutoff]{_id, assetId}`,
    { cutoff }
  );
  let imagesDeleted = 0;
  let imagesSkipped = 0;
  for (const doc of trashDocs) {
    try {
      const stillUsed: number = await writeClient.fetch(`count(*[references($id)])`, {
        id: doc.assetId,
      });
      if (stillUsed > 0) {
        imagesSkipped++;
        continue;
      }
      await writeClient.transaction().delete(doc._id).delete(doc.assetId).commit();
      imagesDeleted++;
    } catch (err) {
      imagesSkipped++;
      console.error(`purge-trash: could not delete image ${doc._id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    commentsDeleted,
    commentsSkipped,
    postsDeleted,
    postsSkipped,
    draftsShelved,
    imagesDeleted,
    imagesSkipped,
  });
}
