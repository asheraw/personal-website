import { GoogleGenAI, Type } from "@google/genai";
import type { SchemaUnion } from "@google/genai";

// One place every suggest-* route calls through for its text generation,
// instead of each one wrapping @google/genai directly. Every route still
// describes its output shape the exact same way it always has -- Gemini's
// own Type.OBJECT/ARRAY/STRING responseSchema convention -- and this
// function is what decides whether that schema actually goes to Gemini or
// gets translated into OpenAI-style JSON Schema for OpenRouter. Adding
// OpenRouter as a second provider should never mean touching how a route
// describes what it wants back.
export type AiTextProvider = "gemini" | "openrouter";

const DEFAULT_OPENROUTER_TEXT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_GEMINI_TEXT_MODEL = "gemini-3.6-flash";
// gemini-3.6-flash is the current model Google's own API error message
// points at when an older pinned version (2.5/2.0) gets sunset -- but a
// pinned version can still go down on its own: confirmed 2026-09-23, every
// call to it was failing with a real 503 "currently experiencing high
// demand" for hours, not a one-off blip. The `-latest` alias tracks
// whichever flash release Google currently has healthy capacity behind,
// so it's the fallback here, not the default -- an alias can silently
// change behavior over time, which is fine for "rescue this one call" but
// not something to pin every request to permanently.
// Tried in order, one at a time, when the model before it returns 503 --
// a single fallback wasn't enough: on 2026-10-08 both the pinned model and
// "-latest" were 503ing together while the lighter models answered fine.
const GEMINI_FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];

function isUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /"code":503|UNAVAILABLE|currently experiencing high demand/i.test(message);
}

// Recursively maps Gemini's Type enum (Type.OBJECT, Type.ARRAY, ...) onto
// plain JSON Schema type strings -- the two are structurally identical
// (properties/items/required all mean the same thing in both), so this is
// a type-name swap, not a real schema rewrite.
function geminiSchemaToJsonSchema(schema: unknown): unknown {
  if (schema === null || typeof schema !== "object") return schema;
  const s = schema as Record<string, unknown>;
  const typeMap: Record<string, string> = {
    [Type.OBJECT]: "object",
    [Type.ARRAY]: "array",
    [Type.STRING]: "string",
    [Type.NUMBER]: "number",
    [Type.INTEGER]: "integer",
    [Type.BOOLEAN]: "boolean",
  };
  const out: Record<string, unknown> = {};
  if (typeof s.type === "string") out.type = typeMap[s.type] ?? s.type;
  if (typeof s.description === "string") out.description = s.description;
  if (s.properties && typeof s.properties === "object") {
    out.properties = Object.fromEntries(
      Object.entries(s.properties as Record<string, unknown>).map(([key, value]) => [
        key,
        geminiSchemaToJsonSchema(value),
      ])
    );
  }
  if (s.items) out.items = geminiSchemaToJsonSchema(s.items);
  if (Array.isArray(s.required)) out.required = s.required;
  return out;
}

export async function generateStructuredText<T>({
  provider,
  model,
  contents,
  responseSchema,
  schemaName,
}: {
  provider: AiTextProvider;
  // Ignored on the Gemini path (always "gemini-3.6-flash", matching every
  // existing route); used as the OpenRouter model id when provider is
  // "openrouter".
  model?: string;
  contents: string;
  // Gemini's own Type.OBJECT-shaped schema -- the same object every
  // existing suggest-* route already builds for its `config.responseSchema`.
  responseSchema: SchemaUnion;
  // Required by OpenRouter's json_schema response_format; unused on Gemini.
  schemaName: string;
}): Promise<T> {
  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing -- see RUNBOOK.md.");
    }
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_OPENROUTER_TEXT_MODEL,
        messages: [{ role: "user", content: contents }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema: geminiSchemaToJsonSchema(responseSchema),
          },
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Same 429-detection regex every route already runs on the caught
      // error message (`/RESOURCE_EXHAUSTED|429|quota/i`) matches this
      // literal "429" too, so a rate limit here surfaces the same way
      // without any route needing separate OpenRouter-specific handling.
      throw new Error(`OpenRouter request failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") throw new Error("Empty response from model");
    return JSON.parse(raw) as T;
  }

  // Gemini path -- identical to what every existing suggest-* route did
  // inline before this abstraction existed.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing -- see RUNBOOK.md.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const targetModel = model || DEFAULT_GEMINI_TEXT_MODEL;

  const chain = [targetModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== targetModel)];
  let response;
  for (const [index, name] of chain.entries()) {
    try {
      response = await ai.models.generateContent({
        model: name,
        contents,
        config: { responseMimeType: "application/json", responseSchema },
      });
      break;
    } catch (error) {
      // Only Google-side capacity errors (503) move on to the next model;
      // quota (429) and everything else surface straight away.
      if (!isUnavailableError(error) || index === chain.length - 1) throw error;
      console.error(`[aiText] ${name} unavailable, trying ${chain[index + 1]}:`, error instanceof Error ? error.message.slice(0, 120) : error);
    }
  }
  if (!response) throw new Error("No response from model");

  const raw = response.text;
  if (!raw) throw new Error("Empty response from model");
  return JSON.parse(raw) as T;
}
