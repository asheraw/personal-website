import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
} from "@/lib/aiPromptDefaults";

// Called from Studio's "Suggest Image Prompt" action (see
// src/sanity/actions/suggestImagePrompt.tsx) -- the "generate a prompt,
// copy it, open DreamLab separately" workflow the ACE spec explicitly asks
// for instead of an automated Canva integration ("don't automate a
// <1-minute manual workflow unless a stable official API exists with clear
// long-term value"). Same "AI proposes, human copies" shape as
// suggest-social -- never generates an image itself, never writes to the
// post, only returns text for Asher to paste into DreamLab/Gemini by hand.
//
// Rebuilt 2026-08-13 around Asher's own established visual style (a
// steel-plate-engraving/sepia template he'd been pasting in by hand for
// most of his existing images) instead of asking Gemini to freely write
// the whole prompt from scratch. Gemini's job shrinks to exactly two
// things per idea: a concrete SUBJECT, and which of two composition modes
// (isolated specimen-plate vs. a full staged scene) actually fits that
// subject -- decided per idea, not fixed site-wide, so the 3 results are
// genuinely different shapes to choose from, not 3 reworded subjects in
// the same composition. Everything else in the final prompt (the
// crosshatching/sepia/paper description, the signature) comes from the
// fixed template below, substituted in verbatim server-side -- Gemini
// never touches that wording, so it can't drift from post to post.
function imagePromptTaskInstructions(mode1: string, mode2: string): string {
  return `You are helping a blogger come up with THREE distinct visual concepts for their post's featured/social image, each to be rendered by an AI image generator in a fixed illustration style the blogger has already established (you don't need to describe the art style yourself -- that's handled separately).

Before choosing a subject, think through the post like a visual director would:
- The central message of the piece
- The emotional response the image should create in a reader
- The strongest visual metaphor or human situation that captures that message -- not just a literal illustration of an event described in the post
- What would feel generic, misleading, or too on-the-nose, so you can avoid it

Based on the title and content given to you, and that thinking, for each of the 3 ideas provide:

1. A concrete, specific SUBJECT (not the full prompt, not the style description -- just what the image depicts): a single symbolic object/scene/moment drawn from the post's actual mood and themes. Never invent specific facts/people/events from the post as literal photographic subjects -- work from the post's mood and themes, not its literal claims. Write it as a noun phrase that flows directly into a longer sentence when followed by a comma -- e.g. "a solitary figure standing on a cliff edge at sunrise", NOT "A solitary figure stands on a cliff edge at sunrise." (no capital letter to start, no trailing period).
2. Which composition MODE (1 or 2) that subject fits better:
   - Mode 1: ${mode1}
   - Mode 2: ${mode2}
   Vary this across the 3 ideas where it genuinely fits -- don't default to the same mode for all three unless the post's content really only supports one shape of image.

Leave out any text/words to render in the image itself (AI image generators render text unreliably) -- describe the visual only, not any lettering.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions aren't set up yet — GEMINI_API_KEY is missing. See RUNBOOK.md." },
      { status: 500 }
    );
  }

  const { title, bodyText, slug } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to draft an image concept from yet." },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    // Editable in Studio under "AI Suggestion Settings" -- same fallback
    // pattern as suggest-seo's promptInstructions/voiceGuidance: falls back
    // to the shipped defaults if the document doesn't exist yet or a field
    // was cleared.
    const settings: { imagePromptTemplate?: string; compositionMode1?: string; compositionMode2?: string } | null =
      await writeClient.fetch(
        `*[_type == "aiPromptSettings"][0]{imagePromptTemplate, compositionMode1, compositionMode2}`
      );
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1Text = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2Text = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${imagePromptTaskInstructions(mode1Text, mode2Text)}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  mode: { type: Type.NUMBER },
                },
                required: ["subject", "mode"],
              },
              description: "Exactly 3 distinct ideas, each a concrete subject plus its composition mode (1 or 2).",
            },
          },
          required: ["ideas"],
        },
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from model");

    const parsed = JSON.parse(raw) as { ideas?: { subject?: string; mode?: number }[] };

    // Assembled here, not by Gemini -- {SUBJECT} and {COMPOSITION_MODE} are
    // the only two variables; the rest of `template` is used byte-for-byte
    // every time, which is the entire point of moving off a free-form
    // AI-written prompt (see the comment on imagePromptTaskInstructions
    // above).
    const ideas = (parsed.ideas || [])
      .map((idea) => {
        // Trailing period stripped, not just asked for in the instructions
        // above -- the template joins {SUBJECT} directly into a longer
        // sentence with a comma ("...hands, in the style of..."), and a
        // model that ignores the no-trailing-period instruction would
        // otherwise produce "...hands., in the style of..." Caught by an
        // actual test call, not assumed.
        const subject = idea.subject?.trim().replace(/[.。]+$/, "");
        const mode = idea.mode === 2 ? 2 : 1;
        if (!subject) return null;
        const modeText = mode === 2 ? mode2Text : mode1Text;
        // split/join, not .replace() -- replaces every occurrence, not
        // just the first, in case the template is ever edited in Studio to
        // reference {SUBJECT} or {COMPOSITION_MODE} more than once.
        const prompt = template.split("{SUBJECT}").join(subject).split("{COMPOSITION_MODE}").join(modeText);
        return { subject, mode, prompt };
      })
      .filter((idea): idea is { subject: string; mode: number; prompt: string } => idea !== null)
      .slice(0, 3);

    if (ideas.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "imagePrompt",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ ideas }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-image-prompt] output log failed:", logError);
    }

    return NextResponse.json({ ideas, logId });
  } catch (error) {
    console.error("[ai/suggest-image-prompt] failed:", error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment." },
      { status: 500 }
    );
  }
}
