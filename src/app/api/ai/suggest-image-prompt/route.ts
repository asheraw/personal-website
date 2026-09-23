import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
  DEFAULT_IMAGE_PROMPT_TASK_INSTRUCTIONS,
} from "@/lib/aiPromptDefaults";
import { generateStructuredText } from "@/lib/aiText";

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
//
// The task text itself (`taskInstructions`) used to be hardcoded here --
// moved into aiPromptSettings (Studio -> AI Workspace -> Suggestion
// Settings -> Prompts -> "Suggest Image Prompt instructions") on Asher's
// ask, same reasoning as every other feature's task instructions: lets him
// tweak the thinking process, or reuse/test it elsewhere, without a code
// change. {MODE_1}/{MODE_2} are substituted the same split/join way
// imagePromptTemplate's own {SUBJECT}/{COMPOSITION_MODE} are below.
function imagePromptTaskInstructions(taskInstructions: string, mode1: string, mode2: string): string {
  return taskInstructions.split("{MODE_1}").join(mode1).split("{MODE_2}").join(mode2);
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

  try {
    // Editable in Studio under "AI Suggestion Settings" -- same fallback
    // pattern as suggest-seo's promptInstructions/voiceGuidance: falls back
    // to the shipped defaults if the document doesn't exist yet or a field
    // was cleared.
    const settings: {
      imagePromptTemplate?: string;
      compositionMode1?: string;
      compositionMode2?: string;
      imagePromptTaskInstructions?: string;
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{imagePromptTemplate, compositionMode1, compositionMode2, imagePromptTaskInstructions}`
    );
    const template = settings?.imagePromptTemplate?.trim() || DEFAULT_IMAGE_PROMPT_TEMPLATE;
    const mode1Text = settings?.compositionMode1?.trim() || DEFAULT_COMPOSITION_MODE_1;
    const mode2Text = settings?.compositionMode2?.trim() || DEFAULT_COMPOSITION_MODE_2;
    const taskInstructions = settings?.imagePromptTaskInstructions?.trim() || DEFAULT_IMAGE_PROMPT_TASK_INSTRUCTIONS;

    const parsed = await generateStructuredText<{ ideas?: { subject?: string; mode?: number }[] }>({
      provider: "gemini",
      schemaName: "image_prompt_ideas",
      contents: `${imagePromptTaskInstructions(taskInstructions, mode1Text, mode2Text)}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
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
    });

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
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? "Hit the free-tier daily limit for AI suggestions -- try again after it resets, or enable billing on the Gemini API project. See RUNBOOK.md."
          : "Couldn't get a suggestion right now — try again in a moment.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
