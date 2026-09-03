import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
} from "@/lib/aiPromptDefaults";
import { generateStructuredText, type AiTextProvider } from "@/lib/aiText";
import { generateImage, type AiImageProvider } from "@/lib/aiImage";

// Generates the raw materials for an image-carousel post: N quotable lines
// picked word-for-word from the post's own content (reusing the same
// "exact substring" approach already proven in suggest-seo's pullQuotes
// field), each paired with a background-only image in the site's house
// illustration style -- explicitly no text baked into the image, the same
// "leave out text/words" instruction generate-featured-image's template
// already carries, since image models render legible text unreliably.
//
// Deliberately NOT a full compositing/attach pipeline: this uploads each
// background to Sanity's asset store (so there's a stable URL to open/
// download) but never patches the post and never writes a new schema
// field. Asher builds the actual editable carousel in Canva himself, using
// these backgrounds + quote text as raw material -- same "generate,
// review, human finishes" shape as suggest-image-prompt's "paste into
// DreamLab by hand" precedent, just producing real images instead of
// prompt text. Called from Studio's "Draft Image Carousel" action.
export async function POST(request: NextRequest) {
  const { title, bodyText, slug } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to pull quotes from yet." },
      { status: 400 }
    );
  }

  let textProvider: AiTextProvider = "gemini";

  try {
    const settings: {
      carouselQuoteInstructions?: string;
      carouselSlideCount?: number;
      imagePromptTemplate?: string;
      compositionMode1?: string;
      compositionMode2?: string;
      textProvider?: AiTextProvider;
      textModel?: string;
      imageProvider?: AiImageProvider;
      imageModel?: string;
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{carouselQuoteInstructions, carouselSlideCount, imagePromptTemplate, compositionMode1, compositionMode2, textProvider, textModel, imageProvider, imageModel}`
    );
    const quoteInstructions = settings?.carouselQuoteInstructions?.trim() || DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS;
    const slideCount =
      typeof settings?.carouselSlideCount === "number" && settings.carouselSlideCount >= 4 && settings.carouselSlideCount <= 8
        ? settings.carouselSlideCount
        : 6;
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1Text = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2Text = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;
    textProvider = settings?.textProvider === "openrouter" ? "openrouter" : "gemini";
    const imageProvider: AiImageProvider = settings?.imageProvider === "openrouter" ? "openrouter" : "gemini";

    const requiredTextKey = textProvider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredTextKey]) {
      return NextResponse.json(
        { error: `AI suggestions aren't set up yet — ${requiredTextKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }
    const requiredImageKey = imageProvider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredImageKey]) {
      return NextResponse.json(
        { error: `Image generation isn't set up yet — ${requiredImageKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }

    // One combined call: each picked quote is paired with a visual concept
    // for its own background (same subject/mode idea generate-featured-
    // image uses for its single image), so this stays one text call plus
    // one image call per slide rather than a separate subject-selection
    // call for every slide too.
    const parsed = await generateStructuredText<{
      slides?: { quote?: string; subject?: string; mode?: number }[];
    }>({
      provider: textProvider,
      model: settings?.textModel?.trim() || undefined,
      schemaName: "carousel_slides",
      contents: `${quoteInstructions}

For each quote, also provide a concrete visual SUBJECT for that slide's background image (a single symbolic object/scene/moment drawn from the quote's own mood, not a literal illustration of it) and which composition MODE fits better:
- Mode 1: ${mode1Text}
- Mode 2: ${mode2Text}
Leave out any text/words to render in the image itself -- describe the visual only, not lettering.

Pick exactly ${slideCount} quotes.

Title: ${title}

Content:
${bodyText.slice(0, 8000)}`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING, description: "Word-for-word, an exact substring of the content given." },
                subject: { type: Type.STRING, description: "A concrete visual subject for this slide's background." },
                mode: { type: Type.NUMBER, description: "1 or 2." },
              },
              required: ["quote", "subject", "mode"],
            },
            description: `Exactly ${slideCount} slides.`,
          },
        },
        required: ["slides"],
      },
    });

    const candidates = (parsed.slides || []).filter((s) => s.quote?.trim() && s.subject?.trim()).slice(0, slideCount);
    if (candidates.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    const slides: { quote: string; imageUrl: string; assetId: string }[] = [];
    let hitRateLimit = false;

    for (const candidate of candidates) {
      const subject = candidate.subject!.trim();
      const modeText = candidate.mode === 2 ? mode2Text : mode1Text;
      const prompt = template.split("{SUBJECT}").join(subject).split("{COMPOSITION_MODE}").join(modeText);

      try {
        const { base64, mimeType } = await generateImage({
          provider: imageProvider,
          model: settings?.imageModel?.trim() || undefined,
          prompt,
        });
        const buffer = Buffer.from(base64, "base64");
        const asset = await writeClient.assets.upload("image", buffer, {
          filename: `${typeof slug === "string" && slug ? slug : "carousel"}-slide-${slides.length + 1}.${mimeType.split("/")[1] || "png"}`,
          contentType: mimeType,
        });
        slides.push({ quote: candidate.quote!.trim(), imageUrl: asset.url, assetId: asset._id });
      } catch (imageError) {
        const message = imageError instanceof Error ? imageError.message : String(imageError);
        console.error("[ai/suggest-image-carousel] slide image failed:", imageError);
        if (/RESOURCE_EXHAUSTED|429|quota/i.test(message)) {
          // Stop trying further slides rather than hitting an already-
          // exhausted quota N more times -- return whatever succeeded.
          hitRateLimit = true;
          break;
        }
        // A one-off failure on this single slide -- skip it, keep trying
        // the rest rather than failing the whole batch over one image.
      }
    }

    if (slides.length === 0) {
      // The outer catch below detects a rate limit by matching
      // "429"/"RESOURCE_EXHAUSTED"/"quota" in the thrown message -- that
      // substring has to survive being re-thrown here, or a real rate
      // limit silently falls through to the generic 500 response instead
      // of a proper 429.
      throw new Error(
        hitRateLimit
          ? "RESOURCE_EXHAUSTED: hit a rate limit before any slide could be generated"
          : "Couldn't generate any carousel slides this time"
      );
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "imageCarousel",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ slides: slides.map((s) => ({ quote: s.quote, assetId: s.assetId })) }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-image-carousel] output log failed:", logError);
    }

    return NextResponse.json({
      slides,
      requestedCount: candidates.length,
      warning:
        slides.length < candidates.length
          ? `Only ${slides.length} of ${candidates.length} slides could be generated${hitRateLimit ? " (hit a rate limit partway through)" : ""} -- try again for the rest in a moment.`
          : undefined,
      logId,
    });
  } catch (error) {
    console.error("[ai/suggest-image-carousel] failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? textProvider === "openrouter"
            ? "Hit a rate limit on OpenRouter -- try again in a moment, or check your OpenRouter account's usage/credit balance. See RUNBOOK.md."
            : "Hit the free-tier daily limit for AI suggestions -- try again after it resets, or enable billing on the Gemini API project. See RUNBOOK.md."
          : "Couldn't generate the carousel right now — try again in a moment.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
