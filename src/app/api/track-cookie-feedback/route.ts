import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// One document per submission (mirrors /api/contact's shape), not a
// running-tally singleton like /api/track-consent -- each response carries
// its own free-text comment, so there's real value in browsing individual
// submissions in Studio rather than only ever seeing an aggregate. No IP,
// no cookie, nothing identifying is ever read or stored here.
export async function POST(request: NextRequest) {
  try {
    const { colours, taste, texture, comment } = await request.json();

    const ratings = { colours, taste, texture };
    for (const value of Object.values(ratings)) {
      if (typeof value !== "number" || value < 1 || value > 4) {
        return NextResponse.json({ success: false }, { status: 400 });
      }
    }

    await writeClient.create({
      _type: "cookieFeedback",
      colours,
      taste,
      texture,
      ...(typeof comment === "string" && comment.trim() ? { comment: comment.trim().slice(0, 2000) } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[track-cookie-feedback] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
