import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";
import { CAROUSEL_IMAGE_ASPECT } from "@/lib/aiPromptDefaults";
import { generateImage, type AiImageProvider } from "@/lib/aiImage";

// Renders ONE carousel background from a ready-made prompt (the prompt
// comes from suggest-image-carousel, possibly hand-edited in Studio) and
// uploads it to Sanity's asset store. One slide per request on purpose:
// the Studio dialog loops over slides itself, so it can show each image as
// it lands, retry a single failure, and stop cleanly on a rate limit --
// instead of one long request that loses everything if slide 5 fails.
export async function POST(request: NextRequest) {
  const { prompt, slug, index } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "No image prompt to render." }, { status: 400 });
  }

  try {
    const settings: { imageProvider?: AiImageProvider; imageModel?: string } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{imageProvider, imageModel}`
    );
    const provider: AiImageProvider = settings?.imageProvider === "openrouter" ? "openrouter" : "gemini";
    const requiredKey = provider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredKey]) {
      return NextResponse.json(
        { error: `Image generation isn't set up yet — ${requiredKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }

    const { base64, mimeType } = await generateImage({
      provider,
      model: settings?.imageModel?.trim() || undefined,
      prompt: prompt.slice(0, 4000),
      aspectRatio: CAROUSEL_IMAGE_ASPECT.api,
    });
    const asset = await writeClient.assets.upload("image", Buffer.from(base64, "base64"), {
      filename: `${typeof slug === "string" && slug ? slug : "carousel"}-slide-${Number(index) || 0}.${mimeType.split("/")[1] || "png"}`,
      contentType: mimeType,
    });
    return NextResponse.json({ imageUrl: asset.url, assetId: asset._id });
  } catch (error) {
    console.error("[ai/generate-carousel-slide] failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? "Hit the image rate limit (free tier is tight) — wait a minute and retry, or paste the prompt into the Gemini app and upload the result instead."
          : "Couldn't render this image — try again, or paste the prompt into the Gemini app and upload the result instead.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
