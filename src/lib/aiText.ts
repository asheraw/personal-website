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
  const response = await ai.models.generateContent({
    model: model || "gemini-3.6-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });
  const raw = response.text;
  if (!raw) throw new Error("Empty response from model");
  return JSON.parse(raw) as T;
}
