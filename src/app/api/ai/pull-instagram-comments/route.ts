import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { normalizeInstagramComments, type RawInstagramComment } from "@/lib/instagramCommentImport";
import { importSocialComments } from "@/lib/socialCommentImport";

// Pulls comments from a post's Instagram socialLinks entry via
// apify/instagram-comment-scraper (official Apify, validated against a real
// post -- see tasks/todo.md), normalizes them, and imports them through the
// same dedupe/preserve-status logic the Facebook route uses -- see
// src/lib/socialCommentImport.ts. Called from the "Pull comments" button on
// the Distribution dashboard (DistributionDashboardTool.tsx).
//
// Known limitation, confirmed against real output rather than assumed from
// the Actor's docs: on a free-tier Apify account this Actor only returns
// top-level comments (replies are gated to a paid Apify plan) and caps at
// the newest ~15 per post. Fine for Asher's actual comment volumes so far,
// but worth knowing if a busier post ever seems to be missing replies.
//
// APIFY_API_TOKEN is read server-side only, same env var the Facebook route
// already uses (one Apify account, multiple Actors).

const ACTOR_ID = "apify~instagram-comment-scraper";

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

  // No [0] -- every Instagram link on this post, not just the first.
  const post = await writeClient.fetch<{ instagramUrls?: string[]; slug?: string; title?: string } | null>(
    `*[_id == $postId][0]{"instagramUrls": socialLinks[platform == "Instagram"].url, "slug": slug.current, title}`,
    { postId }
  );

  if (post === null) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.instagramUrls?.length) {
    return NextResponse.json(
      { error: "This post has no Instagram link saved yet — add one under Discussion → Social links first." },
      { status: 400 }
    );
  }

  let items: RawInstagramComment[];
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
          directUrls: post.instagramUrls,
          resultsLimit: 200,
          includeNestedComments: true,
        }),
      }
    );

    if (res.status === 408) {
      return NextResponse.json(
        { error: "The Instagram comment pull took too long and timed out — try again in a moment." },
        { status: 504 }
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Apify run failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    items = await res.json();
  } catch (error) {
    console.error("[ai/pull-instagram-comments] Apify call failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach Instagram via Apify right now — try again in a moment." },
      { status: 502 }
    );
  }

  const comments = normalizeInstagramComments(items);

  try {
    const { created, matched } = await importSocialComments({
      client: writeClient,
      postId,
      comments,
      idPrefix: "instagram-comment-apify",
    });

    // Record the pull on the post's shareLog doc, same pattern the Facebook
    // route already uses.
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
          instagramCommentsLastPulledAt: new Date().toISOString(),
          instagramCommentsLastPulledCount: comments.length,
        })
        .commit();
    }

    return NextResponse.json({ pulled: comments.length, created, matched });
  } catch (error) {
    console.error("[ai/pull-instagram-comments] import failed:", error);
    return NextResponse.json(
      { error: "Comments were pulled but couldn't be saved — try again in a moment." },
      { status: 500 }
    );
  }
}
