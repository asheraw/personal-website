import type {ExportPost} from "./exportMarkdown";

/** Filesystem-safe filename from a post's own slug -- matches its live URL. */
export function jsonFilename(slug: string): string {
  return `${slug}.json`;
}

// The plainest possible export -- the same already-dereferenced ExportPost
// shape every other format converts from, serialized as-is. No conversion
// logic to drift from the other formats, since there's nothing to convert:
// this *is* the canonical shape.
export function buildJsonFile(post: ExportPost): { filename: string; content: string } {
  return {
    filename: jsonFilename(post.slug),
    content: JSON.stringify(post, null, 2),
  };
}
