import { GoogleGenAI, Modality } from "@google/genai";

// The image-generation counterpart to aiText.ts -- one place every
// image-generating route calls through, so adding OpenRouter as a second
// provider never means touching how a route builds its prompt or handles
// the resulting bytes.
export type AiImageProvider = "gemini" | "openrouter";

// A reasonable starting default -- OpenRouter's actual live model catalog
// should be checked before relying on this in production; pick whatever
// currently gives the best quality/cost tradeoff via the "OpenRouter image
// model" Studio field rather than assuming this id stays accurate forever.
const DEFAULT_OPENROUTER_IMAGE_MODEL = "google/gemini-2.5-flash-image";

export async function generateImage({
  provider,
  model,
  prompt,
}: {
  provider: AiImageProvider;
  // Ignored on the Gemini path (always "gemini-2.5-flash-image", matching
  // the existing route); used as the OpenRouter model id when provider is
  // "openrouter".
  model?: string;
  prompt: string;
}): Promise<{ base64: string; mimeType: string }> {
  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing -- see RUNBOOK.md.");
    }
    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_OPENROUTER_IMAGE_MODEL,
        prompt,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Same 429-detection regex every route's catch block already runs
      // matches the literal "429" here too -- no route needs separate
      // OpenRouter-specific rate-limit handling.
      throw new Error(
        `OpenRouter image request failed with ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`
      );
    }
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item?.b64_json) throw new Error("The image model didn't return an image this time");
    return { base64: item.b64_json as string, mimeType: (item.media_type as string) || "image/png" };
  }

  // Gemini path -- identical to what generate-featured-image/route.ts did
  // inline before this abstraction existed. responseModalities must
  // include IMAGE (TEXT alone would just be a written description); the
  // image is read off whichever returned part carries inlineData, any
  // accompanying text part is discarded.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing -- see RUNBOOK.md.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: model || "gemini-2.5-flash-image",
    contents: prompt,
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error("The image model didn't return an image this time");
  }
  return { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/png" };
}
