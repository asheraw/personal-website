import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// GET /api/comments?postId=<sanity post _id> -- approved comments only,
// oldest first (a conversation reads top-to-bottom). Never returns email.
//
// Uses writeClient (useCdn: false), not the normal CDN-cached read client --
// confirmed via testing that the CDN client can take up to ~30-60s to
// reflect a status change, which would mean a comment approved in Studio
// doesn't actually show up live for a visitor refreshing right after. Worth
// the slightly higher read cost for comments specifically, where "did my
// approval take effect" should feel closer to instant.
export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing postId." }, { status: 400 });
  }

  const comments = await writeClient.fetch(
    `*[_type == "comment" && post._ref == $postId && status == "approved"] | order(createdAt asc){
      _id, name, message, createdAt
    }`,
    { postId }
  );

  return NextResponse.json({ comments });
}

// POST /api/comments -- creates a comment with status "pending". Nothing
// submitted here appears on the live site until approved in Studio.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot -- a hidden field real visitors never see or fill in.
    if (body.website && body.website.trim() !== "") {
      console.log("[comments] Honeypot triggered — bot submission rejected");
      return NextResponse.json({ success: true });
    }

    const { postId, name, email, message, captchaA, captchaB, captchaAnswer } = body;
    if (!postId || !name || !email || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    // Validated server-side (not just in the browser) -- a bot posting
    // directly to this endpoint, skipping the form, would otherwise bypass
    // this check entirely.
    if (
      typeof captchaA !== "number" ||
      typeof captchaB !== "number" ||
      parseInt(captchaAnswer, 10) !== captchaA + captchaB
    ) {
      return NextResponse.json({ success: false, error: "Please solve the math check correctly." }, { status: 400 });
    }

    if (message.length > 3000) {
      return NextResponse.json({ success: false, error: "Message is too long." }, { status: 400 });
    }

    await writeClient.create({
      _type: "comment",
      post: { _type: "reference", _ref: postId },
      name,
      email,
      message,
      status: "pending",
      // The schema's initialValue for this field only applies when a
      // document is created through Studio's own UI, not via the API --
      // confirmed by testing (a comment created here came back with
      // createdAt: null without this explicit set).
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[comments] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
