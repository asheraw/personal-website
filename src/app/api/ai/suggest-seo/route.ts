import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { truncateText } from "@/lib/text";

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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are helping a blogger choose SEO metadata for a post they're about to publish. Based on the title and content below, suggest THREE options each for an SEO title and an excerpt, so the author can pick the one they like best (they'll edit it afterward, so these are starting points, not final copy).

Write in the author's own voice as it comes through in the content — not generic marketing copy. Never invent facts, quotes, numbers, or details that aren't actually in the post.

SEO titles: 70 characters or fewer each.

Excerpts: 160 characters or fewer each (this doubles as the meta description AND the blog listing preview). Two hard requirements for every excerpt:
1. The post's single most important point, value, or keyword must appear within the FIRST 120 characters — mobile search results often cut off well before 160, so don't save the point for the end.
2. Write to create curiosity that earns the click — an open loop, a specific tension, or a concrete detail — never a flat, generic summary that already gives everything away.

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
          },
          required: ["seoTitles", "excerpts"],
        },
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from model");

    const parsed = JSON.parse(raw) as { seoTitles?: string[]; excerpts?: string[] };

    const seoTitles = (parsed.seoTitles || [])
      .map((t) => truncateText(t.trim(), 70))
      .filter(Boolean)
      .slice(0, 3);
    const excerpts = (parsed.excerpts || [])
      .map((e) => truncateText(e.trim(), 160))
      .filter(Boolean)
      .slice(0, 3);

    if (seoTitles.length === 0 || excerpts.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    return NextResponse.json({ seoTitles, excerpts });
  } catch (error) {
    console.error("[ai/suggest-seo] failed:", error);
    // TEMP: surfacing the real error message while diagnosing a live issue
    // (2026-07-30) -- revert to the generic message once resolved, this
    // endpoint has no auth and shouldn't leak internals long-term.
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment.", detail },
      { status: 500 }
    );
  }
}
