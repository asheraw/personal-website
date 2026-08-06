import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { writeClient } from "@/sanity/lib/write-client";
import { isRateLimited } from "@/lib/rateLimit";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot — bots fill this, humans never see it (hidden field)
    if (body.website && body.website.trim() !== "") {
      console.log("[contact] Honeypot triggered — bot submission rejected");
      return NextResponse.json({ success: true });
    }

    const { name, email, subject, message } = body;
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address." }, { status: 400 });
    }

    const countryCode = body.countryCode || "";
    const phone = body.phone || "";
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limit: same IP submitting more than 3 messages in 15 minutes
    // gets rejected outright -- this endpoint also sends a real email on
    // every success, so a flood here is noisier and costs more than a
    // flood of comments. The honeypot above stops naive bots; this stops a
    // script posting straight to the endpoint repeatedly.
    if (
      await isRateLimited(writeClient, {
        type: "contactSubmission",
        ip,
        timestampField: "_createdAt",
        windowMs: 15 * 60 * 1000,
        max: 3,
      })
    ) {
      return NextResponse.json(
        { success: false, error: "You're sending messages faster than a real person would — please slow down and try again in a few minutes." },
        { status: 429 }
      );
    }

    // Step 1: write to Sanity FIRST, before attempting to send.
    // This is the record that survives even if the email step fails outright.
    let submission;
    try {
      submission = await writeClient.create({
        _type: "contactSubmission",
        name,
        email,
        subject,
        message,
        countryCode,
        phone,
        ip,
        emailSent: false,
      });
    } catch (dbError) {
      // If even the save fails, we genuinely have nothing —
      // tell the client honestly so it can offer the mailto fallback.
      console.error("[contact] Sanity write failed:", dbError);
      return NextResponse.json(
        { success: false, error: "Could not process your message. Please use the email link below instead." },
        { status: 500 }
      );
    }

    // Step 2: attempt the actual email send. Whatever happens from here on
    // out, the submission is already safely saved in Sanity -- so the
    // client always gets success:true past this point. Returning
    // success:false for an email-only failure previously showed a real
    // visitor a "Message failed to send" screen with a "Try again" button,
    // which just created a second, duplicate submission of a message that
    // had already gone through. Asher sees the gap (emailSent/emailError)
    // directly in Studio -> Contact Submissions instead -- no need for the
    // visitor to know or act on it.
    if (!resend || !NOTIFY_EMAIL) {
      console.error("[contact] Resend not configured — RESEND_API_KEY or CONTACT_NOTIFICATION_EMAIL missing.");
      return NextResponse.json({ success: true, message: "Submission received." });
    }

    try {
      await resend.emails.send({
        from: "AsherAw.com Contact Form <hello@asheraw.com>", // swap for a verified domain sender once DNS is set up
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `[Site Contact] ${subject}`,
        text: `From: ${name} <${email}>\nPhone: ${countryCode} ${phone}\n\n${message}`,
      });

      await writeClient.patch(submission._id).set({ emailSent: true }).commit();

      return NextResponse.json({ success: true, message: "Submission received." });
    } catch (emailError) {
      const errMsg = emailError instanceof Error ? emailError.message : "Unknown email error";
      console.error("[contact] Email send failed:", errMsg);

      await writeClient.patch(submission._id).set({ emailError: errMsg }).commit();

      return NextResponse.json({ success: true, message: "Submission received." });
    }
  } catch (error) {
    console.error("[contact] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please use the email link below instead." },
      { status: 500 }
    );
  }
}
