/**
 * Shared between the Sanity Studio (post preview, custom inputs) and the
 * Next.js frontend (blog listing/post pages) -- both need to turn a post's
 * Portable Text body into plain text or a reading-time estimate, and doing
 * it once here keeps the two from silently drifting apart.
 */

export type PortableTextBlock = {
  _type?: string;
  children?: { text?: string }[];
  text?: string;
  content?: string;
  entries?: { name?: string; quote?: string }[];
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
      // A Quote Grid's actual content is entirely inside its entries, not
      // on the block itself -- missed the first time this was written,
      // which meant a post built mostly out of Quote Grids (real prose,
      // just structured) undercounted its reading time down toward the
      // 1-minute floor.
      if (block._type === "quoteGrid" && Array.isArray(block.entries)) {
        return block.entries.map((entry) => entry.quote || "").join(" ");
      }
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

type MarkDefsBlock = { markDefs?: { _type?: string }[] };

/** True if any block in the body has an affiliateLink annotation -- drives whether AffiliateDisclosure shows. */
export function bodyHasAffiliateLinks(body: unknown): boolean {
  if (!Array.isArray(body)) return false;
  return (body as MarkDefsBlock[]).some((block) =>
    (block?.markDefs ?? []).some((mark) => mark?._type === "affiliateLink")
  );
}

export type HeadingCheckpoint = { id: string; text: string; key: string };

type HeadingBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { text?: string }[];
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Pulls every h2 heading out of a post's Portable Text body, in document
 * order, and assigns each a stable, human-readable anchor id -- falling
 * back to the block's own _key if the heading text slugifies to nothing
 * (e.g. an emoji-only heading), and de-duplicating with a numeric suffix
 * if two headings in the same post happen to slugify to the same thing.
 * Computed once, here, so the heading's actual rendered id
 * (postBodyComponents) and the reading progress bar's checkpoints can
 * never drift apart from each other.
 */
export function extractH2Checkpoints(body: unknown): HeadingCheckpoint[] {
  if (!Array.isArray(body)) return [];
  const seen = new Map<string, number>();
  const checkpoints: HeadingCheckpoint[] = [];
  for (const block of body as HeadingBlock[]) {
    if (!block || block._type !== "block" || block.style !== "h2") continue;
    const text = (block.children ?? []).map((c) => c.text ?? "").join("").trim();
    if (!text) continue;
    const base = slugify(text) || block._key || `heading-${checkpoints.length}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    checkpoints.push({ id, text, key: block._key ?? id });
  }
  return checkpoints;
}
