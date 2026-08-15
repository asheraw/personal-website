import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
} from "@/lib/aiPromptDefaults";

// The automated sibling of suggest-image-prompt/route.ts. That route
// deliberately stops at handing Asher 3 prompts to paste into DreamLab by
// hand -- the ACE spec's own rule against automating a sub-one-minute
// manual step without a stable official API. Gemini's own image model
// (gemini-2.5-flash-image, "Nano Banana") is exactly that stable official
// API, so this route goes one step further: pick the single best concept
// instead of 3 options (there's no human choosing here), render it, upload
// it straight into Sanity's asset store, and patch it onto the post's
// mainImage in one call. Built for the 40-post Facebook-import backlog
// (see scripts/process-facebook-backlog.mjs) but kept as a real, permanent
// Studio action (see ../../../../sanity/actions/generateFeaturedImage.tsx)
// since Asher asked for "generate and attach automatically" as an ongoing
// capability, not a one-off script trick.
function singleIdeaInstructions(mode1: string, mode2: string): string {
  return `You are choosing ONE visual concept for a blogger's post's featured/social image, to be rendered by an AI image generator in a fixed illustration style you don't need to describe yourself (that's handled separately). Based on the title and content given to you, pick whichever single idea would be the most visually appealing and curiosity-inducing to someone scrolling past it -- the one most likely to earn a click -- and provide:

1. A concrete, specific SUBJECT (not the full prompt, not the style description -- just what the image depicts): a single symbolic object/scene/moment drawn from the post's actual mood and themes. Never invent specific facts/people/events from the post as literal photographic subjects -- work from the post's mood and themes, not its literal claims. Write it as a noun phrase that flows directly into a longer sentence when followed by a comma -- e.g. "a solitary figure standing on a cliff edge at sunrise", NOT "A solitary figure stands on a cliff edge at sunrise." (no capital letter to start, no trailing period).
2. Which composition MODE (1 or 2) that subject fits better:
   - Mode 1: ${mode1}
   - Mode 2: ${mode2}

Leave out any text/words to render in the image itself (AI image generators render text unreliably) -- describe the visual only, not any lettering.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions aren't set up yet — GEMINI_API_KEY is missing. See RUNBOOK.md." },
      { status: 500 }
    );
  }

  const { title, bodyText, slug, postId } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to draft an image concept from yet." },
      { status: 400 }
    );
  }
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "Missing postId to attach the image to." }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    // Same settings document, same fallback defaults as
    // suggest-image-prompt/route.ts -- editing the template in Studio's AI
    // Workspace applies to both this and the manual 3-option flow equally.
    const settings: { imagePromptTemplate?: string; compositionMode1?: string; compositionMode2?: string } | null =
      await writeClient.fetch(
        `*[_type == "aiPromptSettings"][0]{imagePromptTemplate, compositionMode1, compositionMode2}`
      );
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1Text = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2Text = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;

    const ideaResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${singleIdeaInstructions(mode1Text, mode2Text)}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            mode: { type: Type.NUMBER },
          },
          required: ["subject", "mode"],
        },
      },
    });

    const ideaRaw = ideaResponse.text;
    if (!ideaRaw) throw new Error("Empty response from model");
    const ideaParsed = JSON.parse(ideaRaw) as { subject?: string; mode?: number };
    const subject = ideaParsed.subject?.trim().replace(/[.。]+$/, "");
    if (!subject) throw new Error("Suggestion was incomplete");
    const mode = ideaParsed.mode === 2 ? 2 : 1;
    const modeText = mode === 2 ? mode2Text : mode1Text;
    const prompt = template.split("{SUBJECT}").join(subject).split("{COMPOSITION_MODE}").join(modeText);

    // Second Gemini call, image-capable model. responseModalities must
    // include IMAGE (TEXT alone would just be a written description) --
    // requesting both is the documented shape; the image is read off
    // whichever returned part carries inlineData, any accompanying text
    // part is discarded.
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });

    const parts = imageResponse.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("The image model didn't return an image this time");
    }
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const buffer = Buffer.from(imagePart.inlineData.data, "base64");

    const asset = await writeClient.assets.upload("image", buffer, {
      filename: `${typeof slug === "string" && slug ? slug : "featured"}-ai.${mimeType.split("/")[1] || "png"}`,
      contentType: mimeType,
    });

    await writeClient
      .patch(postId)
      .set({
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: subject,
        },
      })
      .commit();

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "featuredImage",
        postTitle: title.slice(0, 300),
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ subject, mode, prompt }, null, 2),
        used: true,
        usedActions: [`Generated and attached featured image: "${subject}"`],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/generate-featured-image] output log failed:", logError);
    }

    return NextResponse.json({ subject, mode, prompt, assetId: asset._id, assetUrl: asset.url, logId });
  } catch (error) {
    console.error("[ai/generate-featured-image] failed:", error);
    const message = error instanceof Error ? error.message : "Couldn't generate an image right now — try again in a moment.";
    // Surfaced as a real 429 (not the generic 500 below) when it's actually
    // a rate/quota wall -- lets a caller (Studio or a script) tell that
    // apart from a one-off failure worth just retrying.
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json({ error: message }, { status: rateLimited ? 429 : 500 });
  }
}
