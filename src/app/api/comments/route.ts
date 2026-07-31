import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { writeClient } from "@/sanity/lib/write-client";

// Reuses the same Resend setup + destination inbox as the contact form
// (RESEND_API_KEY, CONTACT_NOTIFICATION_EMAIL) -- both are "tell Asher
// something needs a look," no reason to configure a second inbox.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || "";
const STUDIO_COMMENTS_URL = "https://asheraw.com/studio/comments";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    `*[_type == "comment" && post._ref == $postId && status == "approved" && !defined(trashedAt)] | order(createdAt asc){
      _id, name, message, createdAt, isAuthorReply,
      "parentComment": parentComment._ref
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

    const { postId, name, email, message, captchaA, captchaB, captchaAnswer, parentComment, notifyOnReply } = body;
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
      return NextResponse.json(
        { success: false, error: "Please solve the math check correctly — your comment hasn't been lost, just fix the answer and send again." },
        { status: 400 }
      );
    }

    if (message.length > 3000) {
      return NextResponse.json({ success: false, error: "Message is too long." }, { status: 400 });
    }

    // Also doubles as the postId-exists check -- this route never
    // validated that before locking existed, since a bad postId just
    // created an orphaned comment nobody could see. Fetched once and
    // reused below for the notification email's subject line, instead of
    // fetching the post a second time.
    const post = await writeClient.fetch(`*[_id == $postId][0]{title, commentsLocked}`, { postId });
    if (!post) {
      return NextResponse.json({ success: false, error: "That post doesn't exist." }, { status: 400 });
    }
    if (post.commentsLocked) {
      return NextResponse.json({ success: false, error: "Comments are closed for this post." }, { status: 400 });
    }

    // Replies nest up to 3 levels deep (comment -> reply -> reply to that
    // reply), then flatten: replying to an already-3rd-level comment
    // attaches the new comment to THAT comment's own parent instead,
    // making it a sibling at the same (3rd) level rather than nesting a
    // 4th. Re-checked here, not just handled by the UI always sending
    // "the comment you clicked Reply on" as parentComment, since a request
    // crafted by hand could otherwise target any comment ID directly. The
    // target also has to actually belong to this same post and already be
    // approved (a visitor can only ever see, and therefore only ever click
    // "Reply" on, an approved comment in the first place).
    let parentRef: string | undefined;
    if (parentComment) {
      const target = await writeClient.fetch(
        `*[_type == "comment" && _id == $parentComment][0]{
          post, status,
          "parentComment": parentComment._ref,
          "grandparentComment": parentComment->parentComment._ref
        }`,
        { parentComment }
      );
      if (!target || target.post?._ref !== postId || target.status !== "approved") {
        return NextResponse.json({ success: false, error: "Can't reply to that comment." }, { status: 400 });
      }
      // target has a grandparent => target is already the 3rd (deepest)
      // level => attach to target's own parent instead of target itself.
      parentRef = target.grandparentComment ? target.parentComment : parentComment;
    }

    // Same header the contact form already reads. Not authoritative (a
    // determined spammer can rotate IPs), but combined with the email
    // check below it's a real deterrent against the common case: the same
    // script or person retrying after a rejection.
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const normalizedEmail = email.toLowerCase();

    // Once something's been marked Spam in Studio, matching future
    // submissions (same email, or same IP if it's a real one) go straight
    // to "spam" status instead of "pending" -- still saved for the record,
    // never shown on the site, and skipped in the notification email
    // below so this doesn't just move the moderation burden into Asher's
    // inbox instead of Studio.
    const isKnownSpammer = await writeClient.fetch<boolean>(
      `count(*[
        _type == "comment" && status == "spam" &&
        (lower(email) == $email || (ip == $ip && $ip != "unknown"))
      ]) > 0`,
      { email: normalizedEmail, ip }
    );

    await writeClient.create({
      _type: "comment",
      post: { _type: "reference", _ref: postId },
      name,
      email,
      ip,
      message,
      status: isKnownSpammer ? "spam" : "pending",
      // The schema's initialValue for this field only applies when a
      // document is created through Studio's own UI, not via the API --
      // confirmed by testing (a comment created here came back with
      // createdAt: null without this explicit set).
      createdAt: new Date().toISOString(),
      ...(parentRef ? { parentComment: { _type: "reference", _ref: parentRef } } : {}),
      // Opt-in, unchecked by default -- "email me when someone replies
      // (to my comment, or to this same thread)". Starts a 30-day clock
      // immediately, even though the comment itself is still pending: the
      // subscription is on the commenter's own timeline, not the
      // moderation queue's. See /api/comments/notify-subscribers for what
      // actually sends the email, only once a reply is approved/visible.
      ...(notifyOnReply && !isKnownSpammer
        ? { notifyOnReply: true, notifyExpiresAt: new Date(Date.now() + THIRTY_DAYS_MS).toISOString() }
        : { notifyOnReply: false }),
    });

    // Best-effort notification -- the comment is already safely saved and
    // waiting in Studio's moderation queue regardless of what happens here,
    // so a failed or unconfigured email never turns into a failure the
    // visitor sees. This exists because the in-Studio "pending" badge alone
    // wasn't enough: Asher missed real comments for days until a reader
    // told him directly, since nothing prompted him to actually open Studio
    // and look. Mirrors the contact form's exact Resend setup. Skipped
    // entirely for a known-spammer match -- the whole point of auto-
    // flagging is to keep this out of Asher's inbox, not just Studio's
    // queue.
    if (resend && NOTIFY_EMAIL && !isKnownSpammer) {
      try {
        await resend.emails.send({
          from: "AsherAw.com/blog Notifications <blogcomment@asheraw.com>",
          to: NOTIFY_EMAIL,
          subject: parentRef
            ? `[Site Comment] ${name} replied on "${post?.title ?? "a post"}"`
            : `[Site Comment] ${name} commented on "${post?.title ?? "a post"}"`,
          text: `${name} <${email}>${parentRef ? " (replying to another comment)" : ""}:\n\n${message}\n\nApprove, reject, or reply: ${STUDIO_COMMENTS_URL}`,
        });
      } catch (emailError) {
        // Logged, not surfaced -- see the comment above.
        console.error("[comments] Notification email failed:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[comments] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
