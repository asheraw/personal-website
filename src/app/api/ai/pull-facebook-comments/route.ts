import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { normalizeFacebookComments, type RawApifyComment } from "@/lib/facebookCommentImport";
import { importSocialComments } from "@/lib/socialCommentImport";

// Pulls comments from a post's Facebook socialLinks entry via the Apify
// Actor validated in tasks/todo.md Task 1 (apify/facebook-comments-scraper),
// normalizes them, and imports them through the same dedupe/preserve-status
// logic the historical .txt importer used -- see src/lib/
// facebookCommentImport.ts. Called from the "Pull comments" button on the
// Distribution dashboard (DistributionDashboardTool.tsx).
//
// APIFY_API_TOKEN is read server-side only, never returned to the client --
// same "keep API keys server-side" rule as GEMINI_API_KEY/GIPHY_API_KEY.
// This is a separate token from this session's own Apify MCP access, which
// was only ever used for Task 1's one-off research spike.

const ACTOR_ID = "apify~facebook-comments-scraper";

export async function POST(request: NextRequest) {
  const { postId } = await request.json();

  if (typeof postId !== "string" || !postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json(
      { error: "Comment pulling isn't set up yet — APIFY_API_TOKEN is missing. See RUNBOOK.md." },
      { status: 500 }
    );
  }

  // socialLinks[platform == "Facebook"] (no [0]) returns every entry for
  // this platform, not just the first -- a post shared to Facebook more
  // than once (e.g. a re-share weeks later) previously had every URL past
  // the first silently ignored. Apify's startUrls already accepts more
  // than one, so this is one call covering every link, not a loop.
  const post = await writeClient.fetch<{ facebookUrls?: string[]; slug?: string; title?: string } | null>(
    `*[_id == $postId][0]{"facebookUrls": socialLinks[platform == "Facebook"].url, "slug": slug.current, title}`,
    { postId }
  );

  if (post === null) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.facebookUrls?.length) {
    return NextResponse.json(
      { error: "This post has no Facebook link saved yet — add one under Discussion → Social links first." },
      { status: 400 }
    );
  }

  let items: RawApifyComment[];
  try {
    const res = await fetch(
      `https://api.apify.com/v2/actors/${ACTOR_ID}/run-sync-get-dataset-items?timeout=120`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.APIFY_API_TOKEN}`,
        },
        body: JSON.stringify({
          startUrls: post.facebookUrls.map((url) => ({ url })),
          resultsLimit: 200,
          includeNestedComments: true,
          viewOption: "RANKED_UNFILTERED",
        }),
      }
    );

    if (res.status === 408) {
      return NextResponse.json(
        { error: "The Facebook comment pull took too long and timed out — try again in a moment." },
        { status: 504 }
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Apify run failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    items = await res.json();
  } catch (error) {
    console.error("[ai/pull-facebook-comments] Apify call failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach Facebook via Apify right now — try again in a moment." },
      { status: 502 }
    );
  }

  const comments = normalizeFacebookComments(items);

  try {
    const { created, matched } = await importSocialComments({
      client: writeClient,
      postId,
      comments,
      idPrefix: "facebook-comment-apify",
    });

    // Record the pull on the post's shareLog doc (share-<slug>, same
    // singleton-per-post pattern DistributionDashboardTool.tsx already
    // uses for engagement notes) so the dashboard can show "last pulled"
    // without re-pulling just to check.
    if (post.slug) {
      const shareLogId = `share-${post.slug}`;
      await writeClient.createIfNotExists({
        _id: shareLogId,
        _type: "shareLog",
        postSlug: post.slug,
        postTitle: post.title,
        totalShares: 0,
      });
      await writeClient
        .patch(shareLogId)
        .set({
          facebookCommentsLastPulledAt: new Date().toISOString(),
          facebookCommentsLastPulledCount: comments.length,
        })
        .commit();
    }

    return NextResponse.json({ pulled: comments.length, created, matched });
  } catch (error) {
    console.error("[ai/pull-facebook-comments] import failed:", error);
    return NextResponse.json(
      { error: "Comments were pulled but couldn't be saved — try again in a moment." },
      { status: 500 }
    );
  }
}
