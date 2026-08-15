import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// Downloads a Giphy GIF server-side and re-uploads it into Sanity as a real
// image asset, returning the new asset's id. Called by
// GiphyAssetSource.tsx, the "Insert GIF (Giphy)" option available on every
// image field site-wide (Studio config, not scoped to just the post body).
//
// Server-side on purpose, same reasoning as everywhere else this project
// fetches an external image and hands it to Sanity (see
// generate-featured-image/route.ts): the site's CSP only allowlists
// *.giphy.com under img-src (for the public comment thread's plain <img>
// GIFs), not connect-src, so a client-side fetch() to Giphy's CDN would be
// blocked outright. Routing the download through here avoids widening that
// CSP surface for what's fundamentally a one-off editor action, not
// something the public site itself needs to reach.
//
// No hostname re-validation on the incoming URL the way /api/comments
// enforces for public submissions -- Studio is an authenticated editing
// tool, not a public-facing form, and the URL only ever comes from a real
// /api/gif-search result the picker itself just fetched.
export async function POST(request: NextRequest) {
  const { gifUrl, title } = await request.json();

  if (!gifUrl || typeof gifUrl !== "string" || !gifUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Missing or invalid gifUrl." }, { status: 400 });
  }

  try {
    const res = await fetch(gifUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return NextResponse.json({ error: "Couldn't download that GIF from Giphy." }, { status: 502 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `${(typeof title === "string" && title.trim() ? title.trim() : "giphy-gif").replace(/[^a-z0-9-]+/gi, "-").slice(0, 60)}.gif`;

    const asset = await writeClient.assets.upload("image", buffer, {
      filename,
      contentType: "image/gif",
    });

    return NextResponse.json({ assetId: asset._id });
  } catch (error) {
    console.error("[gif-upload] failed:", error);
    return NextResponse.json({ error: "Something went wrong bringing that GIF in — try again." }, { status: 500 });
  }
}
