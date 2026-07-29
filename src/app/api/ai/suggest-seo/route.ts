import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { truncateText } from "@/lib/text";
import { writeClient } from "@/sanity/lib/write-client";
import { DEFAULT_AI_PROMPT_INSTRUCTIONS } from "@/lib/aiPromptDefaults";

// Called from Studio's "Suggest SEO & Excerpt" button (see
// src/sanity/actions/suggestSeo.tsx). Never called for regular site
// visitors, and never writes anything on its own -- it only returns
// suggestions for the editor to review and choose from.
export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions aren't set up yet — GEMINI_API_KEY is missing. See RUNBOOK.md." },
      { status: 500 }
    );
  }

  const { title, bodyText } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to summarize yet." },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    // Used so tag suggestions reuse an already-established tag instead of
    // inventing a near-duplicate (e.g. "coaching" vs "Coaching") -- the
    // exact problem the Studio's tag autocomplete field is also there to
    // prevent.
    const existingTags: string[] = await writeClient.fetch(
      `array::unique(*[_type == "post" && defined(tags)].tags[])`
    );

    const existingTagsBlock = existingTags.length
      ? `\n\nExisting tags already used elsewhere on this blog: ${existingTags.slice(0, 60).join(", ")}. When one of these genuinely fits, reuse it with its exact existing spelling and capitalization rather than inventing a near-duplicate. Only suggest a new tag when nothing existing fits.`
      : "";

    // Editable in Studio under "AI Suggestion Settings" -- lets Asher tweak
    // tone, phrasing, and requirements without needing a code change. Falls
    // back to the same default shown as that field's starting value if the
    // document doesn't exist yet or the field was cleared.
    const settings: {promptInstructions?: string} | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{promptInstructions}`
    );
    const instructions = settings?.promptInstructions?.trim() || DEFAULT_AI_PROMPT_INSTRUCTIONS;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${instructions}${existingTagsBlock}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 suggested SEO titles, 70 characters or fewer each.",
            },
            excerpts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Exactly 3 suggested excerpts, 160 characters or fewer each, key point within the first 120 characters, written to create curiosity.",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "3-5 topic tags for the post, reusing an existing tag's exact spelling when one genuinely fits.",
            },
          },
          required: ["seoTitles", "excerpts", "tags"],
        },
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from model");

    const parsed = JSON.parse(raw) as { seoTitles?: string[]; excerpts?: string[]; tags?: string[] };

    const seoTitles = (parsed.seoTitles || [])
      .map((t) => truncateText(t.trim(), 70))
      .filter(Boolean)
      .slice(0, 3);
    const excerpts = (parsed.excerpts || [])
      .map((e) => truncateText(e.trim(), 160))
      .filter(Boolean)
      .slice(0, 3);
    const tags = (parsed.tags || [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (seoTitles.length === 0 || excerpts.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    return NextResponse.json({ seoTitles, excerpts, tags });
  } catch (error) {
    console.error("[ai/suggest-seo] failed:", error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment." },
      { status: 500 }
    );
  }
}
