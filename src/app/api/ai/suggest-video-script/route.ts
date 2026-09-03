import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";
import {
  DEFAULT_VIDEO_SCRIPT_INSTRUCTIONS,
  DEFAULT_VIDEO_STYLE_GUIDANCE,
  DEFAULT_VOICE_GUIDANCE,
} from "@/lib/aiPromptDefaults";
import { generateStructuredText, type AiTextProvider } from "@/lib/aiText";

// Breaks a post into a short-form video script (TikTok / Reels / Shorts
// style) -- each scene paired with narration, on-screen direction, AND a
// separate AI video-generation prompt, so the readable script and the
// video-gen prompts stay coherent with each other rather than being two
// independently-generated lists that can drift apart. Called from Studio's
// "Draft Video Script" action (see suggestVideoScript.tsx). Never writes a
// post's own content -- only returns scenes for the editor to review,
// copy, and use themselves (read the narration on camera, or paste a
// videoPrompt into an AI video tool).
export async function POST(request: NextRequest) {
  const { title, bodyText, slug } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to script yet." },
      { status: 400 }
    );
  }

  let provider: AiTextProvider = "gemini";

  try {
    const settings: {
      videoScriptInstructions?: string;
      videoStyleGuidance?: string;
      voiceGuidance?: string;
      textProvider?: AiTextProvider;
      textModel?: string;
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{videoScriptInstructions, videoStyleGuidance, voiceGuidance, textProvider, textModel}`
    );
    const instructions = settings?.videoScriptInstructions?.trim() || DEFAULT_VIDEO_SCRIPT_INSTRUCTIONS;
    const styleGuidance = settings?.videoStyleGuidance?.trim() || DEFAULT_VIDEO_STYLE_GUIDANCE;
    const voice = settings?.voiceGuidance?.trim() || DEFAULT_VOICE_GUIDANCE;
    provider = settings?.textProvider === "openrouter" ? "openrouter" : "gemini";

    const requiredKey = provider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredKey]) {
      return NextResponse.json(
        { error: `AI suggestions aren't set up yet — ${requiredKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }

    const parsed = await generateStructuredText<{
      scenes?: { narration?: string; onScreenDirection?: string; videoPrompt?: string }[];
    }>({
      provider,
      model: settings?.textModel?.trim() || undefined,
      schemaName: "video_script_scenes",
      contents: `${voice}

${instructions}

House visual style for every video prompt -- include this consistently, don't paraphrase it away:
${styleGuidance}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                narration: {
                  type: Type.STRING,
                  description: "What the author says out loud for this scene, conversational, easy to say naturally.",
                },
                onScreenDirection: {
                  type: Type.STRING,
                  description: "A short, practical note for what's happening on screen during this narration.",
                },
                videoPrompt: {
                  type: Type.STRING,
                  description:
                    "A full prompt for an AI video-generation tool describing this scene, including the house visual style, camera framing/movement, subject, action, mood, and a suggested clip length (5-8 seconds).",
                },
              },
              required: ["narration", "onScreenDirection", "videoPrompt"],
            },
            description: "3-6 scenes, ordered as they'd play in the finished video.",
          },
        },
        required: ["scenes"],
      },
    });

    const scenes = (parsed.scenes || [])
      .map((s) => ({
        narration: s.narration?.trim() || "",
        onScreenDirection: s.onScreenDirection?.trim() || "",
        videoPrompt: s.videoPrompt?.trim() || "",
      }))
      .filter((s) => s.narration && s.videoPrompt)
      .slice(0, 6);

    if (scenes.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "videoScript",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ scenes }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-video-script] output log failed:", logError);
    }

    return NextResponse.json({ scenes, logId });
  } catch (error) {
    console.error("[ai/suggest-video-script] failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /RESOURCE_EXHAUSTED|429|quota/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? provider === "openrouter"
            ? "Hit a rate limit on OpenRouter -- try again in a moment, or check your OpenRouter account's usage/credit balance. See RUNBOOK.md."
            : "Hit the free-tier daily limit for AI suggestions -- try again after it resets, or enable billing on the Gemini API project. See RUNBOOK.md."
          : "Couldn't get a suggestion right now — try again in a moment.",
      },
      { status: rateLimited ? 429 : 500 }
    );
  }
}
