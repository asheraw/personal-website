import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { truncateText } from "@/lib/text";

// Called from Studio's "Draft Social Copy" action (see
// src/sanity/actions/suggestSocialCopy.tsx). Same "AI proposes, human
// copies it themselves" shape as suggest-seo -- this never posts
// anywhere or writes to the document; it only returns text for Asher to
// copy and paste into X/LinkedIn/Facebook's own composer when he
// announces a post there himself. Deliberately separate from ShareBar
// (reader-facing resharing of an existing post) -- this is
// author-facing: drafting the caption for Asher's *own* outbound post
// announcing something new.
const DEFAULT_SOCIAL_PROMPT_INSTRUCTIONS = `You are helping a blogger draft social captions to announce a post they just published, for their own X (Twitter), LinkedIn, and Facebook accounts. Based on the title and content given to you, write TWO options for each platform so the author can pick what they like best (they'll edit it afterward, so these are starting points, not final copy).

Write in the author's own voice as it comes through in the content -- not generic marketing copy, not hashtag-stuffed, not empty hype ("Exciting news!!"). Never invent facts, quotes, numbers, or details that aren't actually in the post.

Do not include the actual URL in any of the text -- assume the link will be attached separately when the author posts it (X shows a link preview card, LinkedIn/Facebook do too), so repeating it in the caption is redundant. Do not use hashtags unless the post's own content makes a specific one obviously relevant -- most posts don't need any.

X (Twitter): short and punchy, 240 characters or fewer each (leaves comfortable room for a link card). A hook, not a summary -- give a reason to click, don't give away the whole point.

LinkedIn: more room to work with -- 2-4 short paragraphs, professional but still personal, the way someone actually talks, not corporate-speak. Can open with a specific moment, question, or claim from the post rather than "I just published a new post."

Facebook: mid-length, conversational, warmer/more casual than LinkedIn -- written the way you'd tell a friend about it, not an announcement.`;

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
      { error: "Add a title and write some of the post first — there's nothing to draft captions from yet." },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${DEFAULT_SOCIAL_PROMPT_INSTRUCTIONS}

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 options, 240 characters or fewer each, no URL, no hashtags unless clearly warranted.",
            },
            linkedin: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 options, 2-4 short paragraphs each, professional but personal, no URL.",
            },
            facebook: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 options, mid-length, conversational, no URL.",
            },
          },
          required: ["x", "linkedin", "facebook"],
        },
      },
    });

    const raw = response.text;
    if (!raw) throw new Error("Empty response from model");

    const parsed = JSON.parse(raw) as { x?: string[]; linkedin?: string[]; facebook?: string[] };

    const x = (parsed.x || []).map((t) => truncateText(t.trim(), 240)).filter(Boolean).slice(0, 2);
    const linkedin = (parsed.linkedin || []).map((t) => t.trim()).filter(Boolean).slice(0, 2);
    const facebook = (parsed.facebook || []).map((t) => t.trim()).filter(Boolean).slice(0, 2);

    if (x.length === 0 || linkedin.length === 0 || facebook.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    return NextResponse.json({ x, linkedin, facebook });
  } catch (error) {
    console.error("[ai/suggest-social] failed:", error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment." },
      { status: 500 }
    );
  }
}
