import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_COMIC_INSTRUCTIONS,
  DEFAULT_MEME_INSTRUCTIONS,
  DEFAULT_VOICE_GUIDANCE,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
  CAROUSEL_IMAGE_ASPECT,
  fillImagePromptTemplate,
} from "@/lib/aiPromptDefaults";
import { generateStructuredText, type AiTextProvider } from "@/lib/aiText";

// Text half of the comic-strip and meme generators (kind: "comic" | "meme"):
// writes the captions and, per picture, a ready-to-paste image prompt in
// the house engraving style. Makes NO images -- same split as
// suggest-image-carousel: generate-carousel-slide renders one picture per
// request (or Asher pastes the prompt into the free Gemini app and uploads
// the result), and /api/og/comic + /api/og/meme lay the text over it, since
// image models letter unreliably. Called from the AI Tools tab.
export async function POST(request: NextRequest) {
  const { kind, title, bodyText, slug } = await request.json();

  if (kind !== "comic" && kind !== "meme") {
    return NextResponse.json({ error: "Unknown kind." }, { status: 400 });
  }
  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to work from yet." },
      { status: 400 }
    );
  }

  let provider: AiTextProvider = "gemini";

  try {
    const settings: {
      voiceGuidance?: string;
      imagePromptTemplate?: string;
      compositionMode1?: string;
      compositionMode2?: string;
      textProvider?: AiTextProvider;
      textModel?: string;
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{voiceGuidance, imagePromptTemplate, compositionMode1, compositionMode2, textProvider, textModel}`
    );
    provider = settings?.textProvider === "openrouter" ? "openrouter" : "gemini";
    const requiredKey = provider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredKey]) {
      return NextResponse.json(
        { error: `AI suggestions aren't set up yet — ${requiredKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }
    const voice = settings?.voiceGuidance?.trim() || DEFAULT_VOICE_GUIDANCE;
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1 = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2 = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;

    // Comics default to the fuller scene composition (mode 2) -- a strip
    // panel needs a place for the character to be in; memes let the model
    // choose, like the carousel does.
    const buildPrompt = (subject: string, mode: number) =>
      fillImagePromptTemplate(template, {
        subject,
        composition: mode === 1 ? mode1 : mode2,
        aspectSentence: CAROUSEL_IMAGE_ASPECT.sentence,
      })
        // The compositor adds all text; the image itself must stay text-free.
        .replace(/No text on the visual except[^.]*\./, "No text, letters, speech bubbles or signatures anywhere in the image.");

    const common = { provider, model: settings?.textModel?.trim() || undefined };
    const content = `Title: ${title}\n\nContent:\n${bodyText.slice(0, 8000)}`;
    let output: unknown;

    if (kind === "comic") {
      const parsed = await generateStructuredText<{ panels?: { caption?: string; subject?: string }[] }>({
        ...common,
        schemaName: "comic_panels",
        contents: `${voice}\n\n${DEFAULT_COMIC_INSTRUCTIONS}\n\nExactly 4 panels.\n\n${content}`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            panels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  caption: { type: Type.STRING, description: "Text shown on the panel, 90 characters or fewer." },
                  subject: {
                    type: Type.STRING,
                    description: "What the panel shows, repeating the recurring character's exact description. No lettering.",
                  },
                },
                required: ["caption", "subject"],
              },
              description: "Exactly 4 panels: setup, build, turn, punchline.",
            },
          },
          required: ["panels"],
        },
      });
      const panels = (parsed.panels || [])
        .filter((p) => p.caption?.trim() && p.subject?.trim())
        .slice(0, 4)
        .map((p) => ({
          caption: p.caption!.trim().slice(0, 120),
          subject: p.subject!.trim(),
          prompt: buildPrompt(p.subject!.trim(), 2),
        }));
      if (panels.length < 4) throw new Error("Suggestion was incomplete");
      output = { panels };
    } else {
      const parsed = await generateStructuredText<{
        memes?: { top?: string; bottom?: string; subject?: string; mode?: number }[];
      }>({
        ...common,
        schemaName: "memes",
        contents: `${voice}\n\n${DEFAULT_MEME_INSTRUCTIONS}\n\nFor each meme also say which composition MODE fits the subject better:\n- Mode 1: ${mode1}\n- Mode 2: ${mode2}\n\n${content}`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            memes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  top: { type: Type.STRING, description: "Top line, 60 characters or fewer." },
                  bottom: { type: Type.STRING, description: "Bottom line / punchline, 60 characters or fewer." },
                  subject: { type: Type.STRING, description: "What the picture shows. No lettering." },
                  mode: { type: Type.NUMBER, description: "1 or 2." },
                },
                required: ["top", "bottom", "subject", "mode"],
              },
              description: "Exactly 3 memes.",
            },
          },
          required: ["memes"],
        },
      });
      const memes = (parsed.memes || [])
        .filter((m) => m.top?.trim() && m.bottom?.trim() && m.subject?.trim())
        .slice(0, 3)
        .map((m) => ({
          top: m.top!.trim().slice(0, 80),
          bottom: m.bottom!.trim().slice(0, 80),
          subject: m.subject!.trim(),
          prompt: buildPrompt(m.subject!.trim(), m.mode === 1 ? 1 : 2),
        }));
      if (memes.length === 0) throw new Error("Suggestion was incomplete");
      output = { memes };
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: kind,
        postTitle: title.slice(0, 300),
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify(output, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-visual] output log failed:", logError);
    }

    return NextResponse.json({ ...(output as object), logId });
  } catch (error) {
    console.error("[ai/suggest-visual] failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? provider === "openrouter"
            ? "Hit a rate limit on OpenRouter -- try again in a moment, or check your OpenRouter account's usage/credit balance. See RUNBOOK.md."
            : "Hit the free-tier daily limit for AI suggestions -- try again after it resets, or enable billing on the Gemini API project. See RUNBOOK.md."
          : "Couldn't write this right now — try again in a moment.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
