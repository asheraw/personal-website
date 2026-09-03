import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { normalizeYouTubeComments, type RawYouTubeComment } from "@/lib/youtubeCommentImport";
import { importSocialComments } from "@/lib/socialCommentImport";

// Pulls comments from a post's YouTube socialLinks entry via
// streamers/youtube-comments-scraper (official Apify, validated against a
// real public video -- see tasks/todo.md). Same shape as the other pull-*
// routes -- see src/lib/socialCommentImport.ts.

const ACTOR_ID = "streamers~youtube-comments-scraper";

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

  const post = await writeClient.fetch<{ youtubeUrl?: string; slug?: string; title?: string } | null>(
    `*[_id == $postId][0]{"youtubeUrl": socialLinks[platform == "YouTube"][0].url, "slug": slug.current, title}`,
    { postId }
  );

  if (post === null) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.youtubeUrl) {
    return NextResponse.json(
      { error: "This post has no YouTube link saved yet — add one under Discussion → Social links first." },
      { status: 400 }
    );
  }

  let items: RawYouTubeComment[];
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
          startUrls: [{ url: post.youtubeUrl }],
          maxComments: 200,
          sortCommentsBy: "NEWEST_FIRST",
        }),
      }
    );

    if (res.status === 408) {
      return NextResponse.json(
        { error: "The YouTube comment pull took too long and timed out — try again in a moment." },
        { status: 504 }
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Apify run failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    items = await res.json();
  } catch (error) {
    console.error("[ai/pull-youtube-comments] Apify call failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach YouTube via Apify right now — try again in a moment." },
      { status: 502 }
    );
  }

  const comments = normalizeYouTubeComments(items);

  try {
    const { created, matched } = await importSocialComments({
      client: writeClient,
      postId,
      comments,
      idPrefix: "youtube-comment-apify",
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
          youtubeCommentsLastPulledAt: new Date().toISOString(),
          youtubeCommentsLastPulledCount: comments.length,
        })
        .commit();
    }

    return NextResponse.json({ pulled: comments.length, created, matched });
  } catch (error) {
    console.error("[ai/pull-youtube-comments] import failed:", error);
    return NextResponse.json(
      { error: "Comments were pulled but couldn't be saved — try again in a moment." },
      { status: 500 }
    );
  }
}
