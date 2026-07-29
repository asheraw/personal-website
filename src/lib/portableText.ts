/**
 * Shared between the Sanity Studio (post preview, custom inputs) and the
 * Next.js frontend (blog listing/post pages) -- both need to turn a post's
 * Portable Text body into plain text or a reading-time estimate, and doing
 * it once here keeps the two from silently drifting apart.
 */

type PortableTextBlock = {
  _type?: string;
  children?: { text?: string }[];
  text?: string;
  content?: string;
};

export function portableTextToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return (blocks as PortableTextBlock[])
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      if (block._type === "block" && Array.isArray(block.children)) {
        return block.children.map((c) => c.text || "").join("");
      }
      // Callouts and accordions carry real prose too -- worth counting
      // toward reading time even though they're not "block" type.
      if (block._type === "callout") return block.text || "";
      if (block._type === "accordion") return block.content || "";
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

const WORDS_PER_MINUTE = 225;

/** Whole minutes, rounded up, minimum 1 -- matches how "X min read" is normally shown. */
export function estimateReadingTimeFromText(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/** Same as estimateReadingTimeFromText, but takes the raw Portable Text body array. */
export function estimateReadingTimeMinutes(body: unknown): number {
  return estimateReadingTimeFromText(portableTextToPlainText(body));
}
