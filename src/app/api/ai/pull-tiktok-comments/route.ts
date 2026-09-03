import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { normalizeTikTokComments, type RawTikTokComment } from "@/lib/tiktokCommentImport";
import { importSocialComments } from "@/lib/socialCommentImport";

// Pulls comments from a post's TikTok socialLinks entry via
// clockworks/tiktok-comments-scraper (official Apify, validated against a
// real public video -- see tasks/todo.md). Same shape as the Facebook/
// Instagram/LinkedIn/YouTube routes -- see src/lib/socialCommentImport.ts.

const ACTOR_ID = "clockworks~tiktok-comments-scraper";

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

  const post = await writeClient.fetch<{ tiktokUrl?: string; slug?: string; title?: string } | null>(
    `*[_id == $postId][0]{"tiktokUrl": socialLinks[platform == "TikTok"][0].url, "slug": slug.current, title}`,
    { postId }
  );

  if (post === null) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.tiktokUrl) {
    return NextResponse.json(
      { error: "This post has no TikTok link saved yet — add one under Discussion → Social links first." },
      { status: 400 }
    );
  }

  let items: RawTikTokComment[];
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
          postURLs: [post.tiktokUrl],
          commentsPerPost: 200,
          maxRepliesPerComment: 20,
        }),
      }
    );

    if (res.status === 408) {
      return NextResponse.json(
        { error: "The TikTok comment pull took too long and timed out — try again in a moment." },
        { status: 504 }
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Apify run failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    items = await res.json();
  } catch (error) {
    console.error("[ai/pull-tiktok-comments] Apify call failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach TikTok via Apify right now — try again in a moment." },
      { status: 502 }
    );
  }

  const comments = normalizeTikTokComments(items);

  try {
    const { created, matched } = await importSocialComments({
      client: writeClient,
      postId,
      comments,
      idPrefix: "tiktok-comment-apify",
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
          tiktokCommentsLastPulledAt: new Date().toISOString(),
          tiktokCommentsLastPulledCount: comments.length,
        })
        .commit();
    }

    return NextResponse.json({ pulled: comments.length, created, matched });
  } catch (error) {
    console.error("[ai/pull-tiktok-comments] import failed:", error);
    return NextResponse.json(
      { error: "Comments were pulled but couldn't be saved — try again in a moment." },
      { status: 500 }
    );
  }
}
