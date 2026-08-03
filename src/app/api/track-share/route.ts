import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Matches the exact `label` values ShareBar.tsx's existing track() calls
// already use (t.label.toLowerCase() for the per-platform links, plus the
// two literal "copy_link"/"native" labels) -- one place both agree on the
// set, rather than two independently-typed lists that could drift apart.
const PLATFORM_FIELDS: Record<string, string> = {
  x: "xCount",
  facebook: "facebookCount",
  linkedin: "linkedinCount",
  whatsapp: "whatsappCount",
  email: "emailCount",
  copy_link: "copyLinkCount",
  native: "nativeCount",
};

// Called from ShareBar.tsx alongside its existing GA event, not instead of
// it -- this is the half of "which posts get shared where" that has to
// work regardless of analytics consent, same reasoning as
// /api/track-consent. One document per post (see shareLogType.ts),
// counts only, no visitor-identifying data at all.
export async function POST(request: NextRequest) {
  try {
    const { slug, title, platform } = await request.json();

    if (typeof slug !== "string" || !slug || !(platform in PLATFORM_FIELDS)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const safeSlug = slug.slice(0, 200);
    const safeTitle = typeof title === "string" ? title.slice(0, 300) : "";
    const id = `share-${safeSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 150) || "unknown"}`;
    const countField = PLATFORM_FIELDS[platform];
    const now = new Date().toISOString();

    await writeClient.createIfNotExists({
      _id: id,
      _type: "shareLog",
      postSlug: safeSlug,
      postTitle: safeTitle,
      totalShares: 0,
      xCount: 0,
      facebookCount: 0,
      linkedinCount: 0,
      whatsappCount: 0,
      emailCount: 0,
      copyLinkCount: 0,
      nativeCount: 0,
    });

    await writeClient
      .patch(id)
      .inc({ totalShares: 1, [countField]: 1 })
      .set({ lastSharedAt: now, ...(safeTitle ? { postTitle: safeTitle } : {}) })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[track-share] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
