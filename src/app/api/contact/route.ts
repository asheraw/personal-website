import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    const submission = {
      name, email, subject, message,
      countryCode: body.countryCode || "",
      phone: body.phone || "",
      submittedAt: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    };
    console.log("[contact] New submission:", submission);
    return NextResponse.json({ success: true, message: "Submission received." });
  } catch (error) {
    console.error("[contact] Error:", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
