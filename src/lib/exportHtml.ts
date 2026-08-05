import {
  toHTML,
  escapeHTML,
  type PortableTextComponents,
  type PortableTextMarkComponent,
  type PortableTextTypeComponent,
} from "@portabletext/to-html";
import { urlFor } from "@/sanity/lib/image";
import type { ExportPost } from "./exportMarkdown";

export type GalleryImage = { asset?: { _ref: string }; alt?: string; caption?: string };

export function imageUrl(value: { asset?: { _ref: string } }): string {
  try {
    return value?.asset ? urlFor(value).width(1600).url() : "";
  } catch {
    return "";
  }
}

function renderImageFigure(img: GalleryImage): string {
  const url = imageUrl(img);
  if (!url) return "";
  const alt = escapeHTML(img.alt ?? "");
  const caption = img.caption ? `<figcaption>${escapeHTML(img.caption)}</figcaption>` : "";
  return `<figure><img src="${url}" alt="${alt}" loading="lazy" />${caption}</figure>`;
}

// youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/shorts/<id> -- the
// same three shapes autoEmbedPaste.ts already recognizes when auto-embedding
// a pasted link, kept in sync with that regex's set of accepted URL shapes.
function youtubeVideoId(url: string): string | null {
  const watch = url.match(/[?&]v=([\w-]+)/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([\w-]+)/);
  if (short) return short[1];
  const shorts = url.match(/\/shorts\/([\w-]+)/);
  if (shorts) return shorts[1];
  return null;
}

const CALLOUT_LABELS: Record<string, string> = { note: "Note", tip: "Tip", warning: "Warning" };

// Static, not theme-aware -- unlike the live site's --tc-<name> CSS
// variables (light/dark shades chosen per theme), an exported file has no
// site CSS to lean on. One legible shade per color, picked to read fine on
// the light background this export's own <body> uses. Exported so the PDF
// renderer (exportPdf.ts) can apply the same colors rather than defining
// its own separate mapping.
export const TEXT_COLOR_HEX: Record<string, string> = {
  red: "#dc2626",
  orange: "#ea580c",
  yellow: "#ca8a04",
  green: "#16a34a",
  teal: "#0d9488",
  blue: "#2563eb",
  purple: "#9333ea",
  pink: "#db2777",
};

const internalLinkMark: PortableTextMarkComponent<{ _type: string; slug?: string }> = ({ value, children }) =>
  value?.slug ? `<a href="/blog/${escapeHTML(value.slug)}">${children}</a>` : children;

const affiliateLinkMark: PortableTextMarkComponent<{ _type: string; href?: string }> = ({ value, children }) =>
  value?.href
    ? `<a href="${escapeHTML(value.href)}" rel="sponsored noopener" target="_blank">${children}</a>`
    : children;

const textColorMark: PortableTextMarkComponent<{ _type: string; color?: string }> = ({ value, children }) => {
  const hex = value?.color ? TEXT_COLOR_HEX[value.color] : undefined;
  return hex ? `<span style="color:${hex}">${children}</span>` : children;
};

const dividerType: PortableTextTypeComponent = () => "<hr />";

const codeBlockType: PortableTextTypeComponent<{ _type: string; language?: string; code?: string }> = ({
  value,
}) => `<pre><code class="language-${escapeHTML(value.language ?? "text")}">${escapeHTML(value.code ?? "")}</code></pre>`;

const calloutType: PortableTextTypeComponent<{ _type: string; style?: string; text?: string }> = ({ value }) => {
  const label = CALLOUT_LABELS[value.style ?? "note"] ?? "Note";
  return `<div class="callout callout-${escapeHTML(value.style ?? "note")}"><strong>${label}:</strong> ${escapeHTML(value.text ?? "")}</div>`;
};

const accordionType: PortableTextTypeComponent<{ _type: string; title?: string; content?: string }> = ({
  value,
}) => `<details><summary>${escapeHTML(value.title ?? "")}</summary><div>${escapeHTML(value.content ?? "")}</div></details>`;

const youtubeType: PortableTextTypeComponent<{ _type: string; url?: string }> = ({ value }) => {
  const id = value?.url ? youtubeVideoId(value.url) : null;
  if (id) {
    return `<div class="embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allowfullscreen loading="lazy"></iframe></div>`;
  }
  return value?.url ? `<p><a href="${escapeHTML(value.url)}">Watch on YouTube</a></p>` : "";
};

const instagramEmbedType: PortableTextTypeComponent<{ _type: string; url?: string }> = ({ value }) =>
  value?.url ? `<p><a href="${escapeHTML(value.url)}">View this post on Instagram</a></p>` : "";

const imageType: PortableTextTypeComponent<
  { _type: string } & GalleryImage & { additionalImages?: GalleryImage[] }
> = ({ value }) => {
  const main = renderImageFigure(value);
  const extra = value.additionalImages ?? [];
  if (extra.length === 0) return main;
  const rest = extra.map(renderImageFigure).filter(Boolean).join("");
  return `<div class="gallery">${main}${rest}</div>`;
};

const snippetRefType: PortableTextTypeComponent<{
  _type: string;
  snippetData?: { snippetType?: string; content?: unknown[] };
}> = ({ value }) => {
  const snippet = value.snippetData;
  if (!snippet?.content) return "";
  const inner = toHTML(snippet.content as never, { components: htmlComponents });
  return snippet.snippetType === "pullquote" ? `<blockquote>${inner}</blockquote>` : inner;
};

// Passed to every toHTML call, including the recursive one above for a
// resolved snippet's own content -- one shared config so a link inside a
// snippet renders identically to a link in the post body. 'link' isn't
// listed -- the package's own default already produces a safe <a href>
// from value.href; internalLink/affiliateLink/textColor are custom
// annotation types this schema adds on top of that.
export const htmlComponents: Partial<PortableTextComponents> = {
  marks: {
    internalLink: internalLinkMark,
    affiliateLink: affiliateLinkMark,
    textColor: textColorMark,
  },
  types: {
    divider: dividerType,
    codeBlock: codeBlockType,
    callout: calloutType,
    accordion: accordionType,
    youtube: youtubeType,
    instagramEmbed: instagramEmbedType,
    image: imageType,
    snippetRef: snippetRefType,
  },
};

/** Filesystem-safe filename from a post's own slug -- matches its live URL. */
export function htmlFilename(slug: string): string {
  return `${slug}.html`;
}

const PAGE_STYLE = `
  :root { color-scheme: light dark; }
  body { max-width: 42rem; margin: 2rem auto; padding: 0 1.25rem 4rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { color: #e5e5e5; background: #14141a; } a { color: #7fb2ff; } }
  h1 { font-size: 2rem; line-height: 1.25; margin-bottom: 0.25rem; }
  h2, h3, h4 { line-height: 1.3; margin-top: 2rem; }
  .meta { color: #767676; font-size: 0.9rem; margin-bottom: 1.5rem; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  figure { margin: 1.5rem 0; }
  figcaption { font-size: 0.85rem; color: #767676; margin-top: 0.35rem; }
  .gallery { display: flex; flex-direction: column; gap: 1rem; }
  blockquote { border-left: 3px solid #767676; margin: 1.5rem 0; padding-left: 1rem; color: #555; }
  @media (prefers-color-scheme: dark) { blockquote { color: #aaa; } }
  pre { background: #1e1e1e; color: #eee; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .callout { border-radius: 6px; padding: 0.85rem 1rem; margin: 1.5rem 0; background: #f2f2f2; }
  @media (prefers-color-scheme: dark) { .callout { background: #22222c; } }
  .embed { position: relative; padding-bottom: 56.25%; height: 0; margin: 1.5rem 0; }
  .embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 6px; }
  hr { border: none; border-top: 1px solid #d9d9d9; margin: 2rem 0; }
`.trim();

export function buildHtmlFile(post: ExportPost): { filename: string; content: string } {
  const metaParts = [
    post.author,
    post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : null,
    post.categories?.length ? post.categories.join(", ") : null,
  ].filter((part): part is string => part !== null && part !== undefined);

  const heroUrl = post.mainImage ? imageUrl(post.mainImage) : "";
  const hero = heroUrl
    ? `<figure><img src="${heroUrl}" alt="${escapeHTML(post.mainImageAlt ?? post.title)}" /></figure>`
    : "";

  const body = toHTML(post.body as never, { components: htmlComponents });

  const content = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(post.title)}</title>
${post.excerpt ? `<meta name="description" content="${escapeHTML(post.excerpt)}" />` : ""}
<style>${PAGE_STYLE}</style>
</head>
<body>
<article>
<h1>${escapeHTML(post.title)}</h1>
${metaParts.length ? `<p class="meta">${metaParts.map(escapeHTML).join(" · ")}</p>` : ""}
${hero}
${body}
</article>
</body>
</html>
`;

  return { filename: htmlFilename(post.slug), content };
}
