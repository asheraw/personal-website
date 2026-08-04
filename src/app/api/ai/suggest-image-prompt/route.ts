import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { writeClient } from "@/sanity/lib/write-client";

// Called from Studio's "Suggest Image Prompt" action (see
// src/sanity/actions/suggestImagePrompt.tsx) -- the "generate a prompt,
// copy it, open DreamLab separately" workflow the ACE spec explicitly asks
// for instead of an automated Canva integration ("don't automate a
// <1-minute manual workflow unless a stable official API exists with clear
// long-term value"). Same "AI proposes, human copies" shape as
// suggest-social -- never generates an image itself, never writes to the
// post, only returns text for Asher to paste into DreamLab (or any other
// image generator) by hand.
const IMAGE_PROMPT_TASK_INSTRUCTIONS = `You are helping a blogger come up with an AI image-generation prompt for their post's featured/social image, to paste into an AI image generator (like Canva's DreamLab). Based on the title and content given to you, write TWO different visual concepts so the author can pick whichever fits the post's mood best.

Each should be a single, concrete, well-composed prompt (1-3 sentences) describing a specific scene, subject, composition, and mood/lighting -- not vague ("an image about writing") and not a list of keywords. Favor a photographic or editorial-illustration style unless the post's own content clearly calls for something else. Never invent specific facts/people/events from the post as literal photographic subjects -- work from the post's mood and themes, not its literal claims.

Leave out any text/words to render in the image itself (AI image generators render text unreliably) -- describe the visual only.`;

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
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${IMAGE_PROMPT_TASK_INSTRUCTIONS}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 distinct visual concepts, each a concrete 1-3 sentence prompt.",
            },
          },
          required: ["prompts"],
        },
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from model");

    const parsed = JSON.parse(raw) as { prompts?: string[] };
    const prompts = (parsed.prompts || []).map((t) => t.trim()).filter(Boolean).slice(0, 2);

    if (prompts.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "imagePrompt",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ prompts }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-image-prompt] output log failed:", logError);
    }

    return NextResponse.json({ prompts, logId });
  } catch (error) {
    console.error("[ai/suggest-image-prompt] failed:", error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment." },
      { status: 500 }
    );
  }
}
