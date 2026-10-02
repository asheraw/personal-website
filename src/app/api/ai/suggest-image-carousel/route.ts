import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
  CAROUSEL_IMAGE_ASPECT,
  fillImagePromptTemplate,
} from "@/lib/aiPromptDefaults";
import { generateStructuredText, type AiTextProvider } from "@/lib/aiText";

// Text half of the image-carousel feature: picks as many quotable lines
// as the post actually supports (up to carouselSlideCount, the cap), each
// word-for-word from the post's own content (same "exact substring"
// approach as suggest-seo's pullQuotes -- here actually verified, below),
// each paired with a background concept and a ready-to-paste image prompt
// in the house illustration style.
//
// Deliberately makes NO images: that's generate-carousel-slide's job, one
// slide per request, so one slow/rate-limited image never sinks the batch
// -- and so the prompt can instead be pasted by hand into the free Gemini
// app, which is how Asher has been making them. The quote text is laid
// over the background by /api/og/quote, not baked in by the image model
// (image models render lettering unreliably). Called from Studio's "Draft
// Image Carousel" action.
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
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{carouselQuoteInstructions, carouselSlideCount, imagePromptTemplate, compositionMode1, compositionMode2, textProvider, textModel}`
    );
    const quoteInstructions = settings?.carouselQuoteInstructions?.trim() || DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS;
    const maxSlides =
      typeof settings?.carouselSlideCount === "number" && settings.carouselSlideCount >= 3 && settings.carouselSlideCount <= 12
        ? settings.carouselSlideCount
        : 8;
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1Text = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2Text = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;
    textProvider = settings?.textProvider === "openrouter" ? "openrouter" : "gemini";

    const requiredTextKey = textProvider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredTextKey]) {
      return NextResponse.json(
        { error: `AI suggestions aren't set up yet — ${requiredTextKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }

    // One combined call: each picked quote is paired with a visual concept
    // for its own background (same subject/mode idea generate-featured-
    // image uses for its single image).
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

Pick as many quotes as the post genuinely supports -- at least 3, at most ${maxSlides}. A short or thin post gets fewer slides; never pad with weak lines to hit a number.

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
            description: `3 to ${maxSlides} slides, only as many as the content earns.`,
          },
        },
        required: ["slides"],
      },
    });

    // The prompt asks for exact substrings, but a model can still tweak
    // punctuation -- compare with whitespace and curly quotes normalised,
    // and drop anything that isn't really in the post.
    const norm = (t: string) =>
      t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
    const haystack = norm(bodyText);
    const slides = (parsed.slides || [])
      .filter((s) => s.quote?.trim() && s.subject?.trim() && haystack.includes(norm(s.quote)))
      .slice(0, maxSlides)
      .map((s) => {
        const subject = s.subject!.trim();
        const prompt = fillImagePromptTemplate(template, {
          subject,
          composition: s.mode === 2 ? mode2Text : mode1Text,
          aspectSentence: CAROUSEL_IMAGE_ASPECT.sentence,
        })
          // The shared template asks the model to letter an "Asher Aw, 1984"
          // signature; here the card compositor stamps that instead, so the
          // image itself must stay text-free.
          .replace(/No text on the visual except[^.]*\./, "No text, letters or signatures anywhere in the image.");
        return { quote: s.quote!.trim(), subject, prompt };
      });

    if (slides.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "imageCarousel",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ slides: slides.map((s) => ({ quote: s.quote, subject: s.subject })) }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-image-carousel] output log failed:", logError);
    }

    return NextResponse.json({ slides, logId });
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
          : "Couldn't pick carousel quotes right now — try again in a moment.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
