import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Runs once daily (see .github/workflows/cron-publish-scheduled.yml --
// originally Vercel's built-in Cron feature via vercel.json's crons entry,
// replaced with a GitHub Actions workflow once asheraw.com's DNS moved to
// Netlify, which has no equivalent built-in scheduler) -- publishes any
// unpublished draft post whose scheduledPublishAt (postType.ts) has
// arrived, without Asher needing to come back and click Publish by hand.
// GitHub's own scheduled-workflow triggers aren't guaranteed to fire at
// the exact minute requested (documented GitHub behaviour -- can run
// several minutes late under load), so "scheduled for March 5" still
// means "goes live sometime that day," not a precise time -- documented
// on the field itself so this isn't a surprise later.
//
// Only ever touches documents that are BOTH still a draft AND have
// scheduledPublishAt in the past -- an already-published post is
// completely untouched by this route regardless of what its
// scheduledPublishAt says (that field only matters before first publish).
//
// Same CRON_SECRET auth pattern as the other two crons in this project.
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  try {
    // perspective: 'raw' is required on every one of these -- this API's
    // default query perspective excludes drafts.* documents entirely,
    // even from an exact _id match, unless explicitly asked for. Mutations
    // (patch/transaction) aren't affected by this -- perspective only
    // changes what a query can *see*, not what a write can *target*.
    const dueDrafts: { _id: string; publishedAt?: string; scheduledPublishAt: string }[] =
      await writeClient.fetch(
        `*[_id in path("drafts.**") && _type == "post" && defined(scheduledPublishAt) && scheduledPublishAt <= $now]{
          _id, publishedAt, scheduledPublishAt
        }`,
        { now },
        { perspective: "raw" }
      );

    let published = 0;
    const errors: string[] = [];

    for (const draft of dueDrafts) {
      const publishedId = draft._id.replace(/^drafts\./, "");
      try {
        const fullDraft = await writeClient.fetch(
          `*[_id == $id][0]`,
          { id: draft._id },
          { perspective: "raw" }
        );
        if (!fullDraft) continue;

        // A stale publishedAt (still sitting at whatever it was set to
        // when the draft was first created) would show the wrong date on
        // a post that's only going live today -- same reasoning as
        // withAutoPublishDate.ts's own "the date reflects when it went
        // live." A deliberately-set future publishedAt is left alone.
        const currentPublishedAt = fullDraft.publishedAt as string | undefined;
        const finalPublishedAt =
          !currentPublishedAt || new Date(currentPublishedAt) < new Date(draft.scheduledPublishAt)
            ? draft.scheduledPublishAt
            : currentPublishedAt;

        // scheduledPublishAt's job is done the moment this runs -- leaving
        // it set on the published doc made ScheduledPublishInput.tsx's own
        // "date has passed" warning banner keep firing forever afterward,
        // since it only checks the date, not whether a draft still exists.
        const { scheduledPublishAt: _scheduledPublishAt, ...publishedFields } = fullDraft;

        await writeClient
          .transaction()
          .createOrReplace({
            ...publishedFields,
            _id: publishedId,
            publishedAt: finalPublishedAt,
          })
          .delete(draft._id)
          .commit();

        published++;
      } catch (err) {
        errors.push(`${publishedId}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    return NextResponse.json({ success: true, checked: dueDrafts.length, published, errors });
  } catch (error) {
    console.error("[cron/publish-scheduled] failed:", error);
    return NextResponse.json({ success: false, error: "Scheduled publish check failed" }, { status: 500 });
  }
}
