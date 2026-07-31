import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { writeClient } from "@/sanity/lib/write-client";
import { buildReplyNotificationEmail } from "@/lib/emails";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = "https://asheraw.com";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type Subscriber = { _id: string; name: string; email: string };

// POST /api/comments/notify-subscribers -- called after a reply becomes
// visible (an author reply from Studio, always auto-approved; or a
// visitor's reply the moment it gets approved in Studio's moderation
// queue -- never on creation, since a still-pending reply isn't visible
// yet and "come see the reply" would be broken). Emails everyone else
// already in the same thread who opted in with "notify on reply" and
// hasn't expired, then pushes their subscription forward another 30 days
// -- an active conversation keeps its subscribers subscribed; a quiet one
// lapses on its own.
export async function POST(request: NextRequest) {
  try {
    const { replyId } = await request.json();
    if (!replyId) {
      return NextResponse.json({ success: false, error: "Missing replyId." }, { status: 400 });
    }

    const reply = await writeClient.fetch(
      `*[_id == $replyId][0]{
        _id, name, email, message, status, trashedAt,
        "postSlug": post->slug.current,
        "postTitle": post->title,
        "parentComment": parentComment._ref
      }`,
      { replyId }
    );

    // Nothing to notify about: no such comment, not actually visible yet
    // (not approved, or trashed even though it's technically "approved"),
    // or (shouldn't happen, but defensively) not itself a reply.
    if (!reply || reply.status !== "approved" || reply.trashedAt || !reply.parentComment) {
      return NextResponse.json({ success: true });
    }

    const subscribers: Subscriber[] = await writeClient.fetch(
      `*[
        _type == "comment" && status == "approved" && !defined(trashedAt) && notifyOnReply == true &&
        defined(notifyExpiresAt) && notifyExpiresAt > now() &&
        (_id == $topLevelId || parentComment._ref == $topLevelId) &&
        _id != $replyId
      ]{_id, name, email}`,
      { topLevelId: reply.parentComment, replyId }
    );

    const replierEmail = (reply.email ?? "").toLowerCase();
    const seenEmails = new Set<string>();
    const toNotify = subscribers.filter((sub) => {
      const email = sub.email?.toLowerCase();
      if (!email || email === replierEmail || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });

    if (resend && toNotify.length > 0) {
      const postUrl = `${SITE_URL}/blog/${reply.postSlug}#comments`;

      await Promise.allSettled(
        toNotify.map(async (sub) => {
          const unsubscribeUrl = `${SITE_URL}/api/comments/unsubscribe?id=${sub._id}`;
          const { subject, html, text } = buildReplyNotificationEmail({
            replierName: reply.name,
            message: reply.message,
            postTitle: reply.postTitle ?? "a post",
            postUrl,
            unsubscribeUrl,
          });
          try {
            await resend.emails.send({
              from: "AsherAw.com Comments <hello@asheraw.com>",
              to: sub.email,
              subject,
              html,
              text,
            });
          } catch (emailError) {
            console.error("[comments] Reply-notification email failed:", emailError);
          }
        })
      );

      const newExpiry = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
      const tx = writeClient.transaction();
      for (const sub of toNotify) {
        tx.patch(sub._id, (p) => p.set({ notifyExpiresAt: newExpiry }));
      }
      await tx.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[comments] notify-subscribers failed:", error);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
