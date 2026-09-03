import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { truncateText } from "@/lib/text";
import { writeClient } from "@/sanity/lib/write-client";
import { DEFAULT_LINKEDIN_TRIM_INSTRUCTIONS, DEFAULT_VOICE_GUIDANCE } from "@/lib/aiPromptDefaults";
import { generateStructuredText, type AiTextProvider } from "@/lib/aiText";

// Compresses a post's actual, full content into a standalone, native
// LinkedIn post -- deliberately a different feature from suggest-social's
// existing LinkedIn caption (an announcement/teaser meant to run alongside
// a link posted separately in the first comment). This one needs no
// outbound link at all: LinkedIn's own algorithm rewards content people
// never have to leave the platform to read. Called from Studio's
// "Draft LinkedIn Post" action (see suggestLinkedInPost.tsx). Never writes
// a post's own content on its own -- only returns options for the editor
// to review, copy, and post directly on LinkedIn themselves.
export async function POST(request: NextRequest) {
  const { title, bodyText, slug } = await request.json();

  if (!title || !bodyText || typeof title !== "string" || typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "Add a title and write some of the post first — there's nothing to condense yet." },
      { status: 400 }
    );
  }

  let provider: AiTextProvider = "gemini";

  try {
    const settings: {
      linkedinTrimInstructions?: string;
      voiceGuidance?: string;
      textProvider?: AiTextProvider;
      textModel?: string;
    } | null = await writeClient.fetch(
      `*[_type == "aiPromptSettings"][0]{linkedinTrimInstructions, voiceGuidance, textProvider, textModel}`
    );
    const instructions = settings?.linkedinTrimInstructions?.trim() || DEFAULT_LINKEDIN_TRIM_INSTRUCTIONS;
    const voice = settings?.voiceGuidance?.trim() || DEFAULT_VOICE_GUIDANCE;
    provider = settings?.textProvider === "openrouter" ? "openrouter" : "gemini";

    const requiredKey = provider === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY";
    if (!process.env[requiredKey]) {
      return NextResponse.json(
        { error: `AI suggestions aren't set up yet — ${requiredKey} is missing. See RUNBOOK.md.` },
        { status: 500 }
      );
    }

    const parsed = await generateStructuredText<{ posts?: string[] }>({
      provider,
      model: settings?.textModel?.trim() || undefined,
      schemaName: "linkedin_native_posts",
      contents: `${voice}

${instructions}

Title: ${title}

Content:
${bodyText.slice(0, 12000)}`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          posts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Exactly 2 complete, standalone LinkedIn post options, each roughly 1,300-1,900 characters, opening with a hook that works before 'see more' truncation.",
          },
        },
        required: ["posts"],
      },
    });

    // 3000 is LinkedIn's real hard cap -- defensively enforced here
    // regardless of what the model actually returned, same pattern every
    // other route uses for its own length limits.
    const posts = (parsed.posts || []).map((p) => truncateText(p.trim(), 3000)).filter(Boolean).slice(0, 2);

    if (posts.length === 0) {
      throw new Error("Suggestion was incomplete");
    }

    let logId: string | null = null;
    try {
      const created = await writeClient.create({
        _type: "aiOutputLog",
        feature: "linkedinTrim",
        postTitle: typeof title === "string" ? title.slice(0, 300) : "",
        postSlug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        output: JSON.stringify({ posts }, null, 2),
        used: false,
        usedActions: [],
      });
      logId = created._id;
    } catch (logError) {
      console.error("[ai/suggest-linkedin-post] output log failed:", logError);
    }

    return NextResponse.json({ posts, logId });
  } catch (error) {
    console.error("[ai/suggest-linkedin-post] failed:", error);
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
