import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { normalizeLinkedInComments, type RawLinkedInComment } from "@/lib/linkedinCommentImport";
import { importSocialComments } from "@/lib/socialCommentImport";

// Pulls comments from a post's LinkedIn socialLinks entry via
// harvestapi/linkedin-post-comments (third-party -- no official Apify
// LinkedIn comment-scraper exists; this one has the strongest usage/rating
// among the real options, validated against a real public post -- see
// tasks/todo.md). Same shape as the other pull-* routes -- see
// src/lib/socialCommentImport.ts.

const ACTOR_ID = "harvestapi~linkedin-post-comments";

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

  // No [0] -- every LinkedIn link on this post, not just the first.
  const post = await writeClient.fetch<{ linkedinUrls?: string[]; slug?: string; title?: string } | null>(
    `*[_id == $postId][0]{"linkedinUrls": socialLinks[platform == "LinkedIn"].url, "slug": slug.current, title}`,
    { postId }
  );

  if (post === null) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.linkedinUrls?.length) {
    return NextResponse.json(
      { error: "This post has no LinkedIn link saved yet — add one under Discussion → Social links first." },
      { status: 400 }
    );
  }

  let items: RawLinkedInComment[];
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
          posts: post.linkedinUrls,
          maxItems: 200,
          scrapeReplies: true,
        }),
      }
    );

    if (res.status === 408) {
      return NextResponse.json(
        { error: "The LinkedIn comment pull took too long and timed out — try again in a moment." },
        { status: 504 }
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Apify run failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    items = await res.json();
  } catch (error) {
    console.error("[ai/pull-linkedin-comments] Apify call failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach LinkedIn via Apify right now — try again in a moment." },
      { status: 502 }
    );
  }

  const comments = normalizeLinkedInComments(items);

  try {
    const { created, matched } = await importSocialComments({
      client: writeClient,
      postId,
      comments,
      idPrefix: "linkedin-comment-apify",
    });

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
          linkedinCommentsLastPulledAt: new Date().toISOString(),
          linkedinCommentsLastPulledCount: comments.length,
        })
        .commit();
    }

    return NextResponse.json({ pulled: comments.length, created, matched });
  } catch (error) {
    console.error("[ai/pull-linkedin-comments] import failed:", error);
    return NextResponse.json(
      { error: "Comments were pulled but couldn't be saved — try again in a moment." },
      { status: 500 }
    );
  }
}
