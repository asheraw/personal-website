import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Called from Studio's "Suggest SEO & Excerpt" button (see
// src/sanity/actions/suggestSeo.tsx). Never called for regular site
// visitors, and never writes anything on its own -- it only returns a
// suggestion for the editor to review and choose to apply.
export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions aren't set up yet — ANTHROPIC_API_KEY is missing. See RUNBOOK.md." },
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      tools: [
        {
          name: "provide_seo_suggestion",
          description: "Provide the suggested SEO title and excerpt for the blog post.",
          input_schema: {
            type: "object",
            properties: {
              seoTitle: {
                type: "string",
                description: "Suggested SEO title, 70 characters or fewer.",
              },
              excerpt: {
                type: "string",
                description:
                  "Suggested excerpt, 160 characters or fewer, used as both the meta description and the blog listing preview.",
              },
            },
            required: ["seoTitle", "excerpt"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "provide_seo_suggestion" },
      messages: [
        {
          role: "user",
          content: `You are helping write SEO metadata for a personal blog post. Based on the title and content below, suggest an SEO title (70 characters or fewer) and an excerpt (160 characters or fewer, works as both a meta description and a blog-listing preview).

Write in the author's own voice as it comes through in the content — not generic marketing copy. Never invent facts, quotes, numbers, or details that aren't actually in the post.

Title: ${title}

Content:
${bodyText.slice(0, 6000)}`,
        },
      ],
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model didn't return a structured suggestion");
    }

    const input = toolUse.input as { seoTitle?: string; excerpt?: string };
    const seoTitle = (input.seoTitle || "").slice(0, 70).trim();
    const excerpt = (input.excerpt || "").slice(0, 160).trim();

    if (!seoTitle || !excerpt) {
      throw new Error("Suggestion was incomplete");
    }

    return NextResponse.json({ seoTitle, excerpt });
  } catch (error) {
    console.error("[ai/suggest-seo] failed:", error);
    return NextResponse.json(
      { error: "Couldn't get a suggestion right now — try again in a moment." },
      { status: 500 }
    );
  }
}
