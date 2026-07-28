import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { writeClient } from "@/sanity/lib/write-client";

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

    // Step 2: attempt the actual email send.
    if (!resend || !NOTIFY_EMAIL) {
      console.error("[contact] Resend not configured — RESEND_API_KEY or CONTACT_NOTIFICATION_EMAIL missing.");
      return NextResponse.json({
        success: false,
        error: "Message saved, but the notification email couldn't be sent. Please use the email link below as backup.",
      });
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

      // The message IS saved in Sanity — but Asher won't see it until
      // he checks manually, so tell the visitor honestly and offer the fallback.
      return NextResponse.json({
        success: false,
        error: "Your message was saved, but the notification email failed to send. Please use the email link below as backup.",
      });
    }
  } catch (error) {
    console.error("[contact] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please use the email link below instead." },
      { status: 500 }
    );
  }
}
