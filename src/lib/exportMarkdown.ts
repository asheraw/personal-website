import {
  portableTextToMarkdown,
  DefaultCodeBlockRenderer,
  type PortableTextMarkRenderer,
  type PortableTextTypeRenderer,
} from "@portabletext/markdown";
import { urlFor } from "@/sanity/lib/image";

// The shape a post needs to be resolved into *before* calling
// buildMarkdownFile() -- every reference (author, categories, internalLink
// targets, snippetRef content) already dereferenced to plain values. Where
// that resolution happens differs by caller (a single already-fetched
// document action vs. one big query for the bulk export), but the
// conversion itself is identical either way -- kept here as the one
// canonical place, so a single-post export and the full-archive export can
// never quietly drift into rendering the same content differently.
export type ExportPost = {
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  mainImage?: { asset?: { _ref: string } };
  mainImageAlt?: string;
  body: unknown[];
};

type GalleryImage = { asset?: { _ref: string }; alt?: string; caption?: string };

function imageUrl(value: { asset?: { _ref: string } }): string {
  try {
    return value?.asset ? urlFor(value).width(1600).url() : "";
  } catch {
    return "";
  }
}

function renderImage(img: GalleryImage): string {
  const url = imageUrl(img);
  if (!url) return "";
  const alt = (img.alt ?? "").replace(/[[\]]/g, "");
  const line = `![${alt}](${url})`;
  return img.caption ? `${line}\n*${img.caption}*` : line;
}

const CALLOUT_LABELS: Record<string, string> = { note: "Note", tip: "Tip", warning: "Warning" };

const internalLinkRenderer: PortableTextMarkRenderer<{ _type: string; slug?: string }> = ({ value, children }) =>
  value?.slug ? `[${children}](/blog/${value.slug})` : children;

const affiliateLinkRenderer: PortableTextMarkRenderer<{ _type: string; href?: string }> = ({ value, children }) =>
  value?.href ? `[${children}](${value.href})` : children;

const dividerRenderer: PortableTextTypeRenderer = () => "---";

const calloutRenderer: PortableTextTypeRenderer<{ _type: string; style?: string; text?: string }> = ({ value }) => {
  const label = CALLOUT_LABELS[value.style ?? "note"] ?? "Note";
  return `> **${label}:** ${value.text ?? ""}`;
};

// `content` used to be a plain string; it's now an array of simple-
// rich-text blocks (see blockContentType.ts) -- rendered through the same
// portableTextToMarkdown/markdownOptions used for the post body and for a
// resolved snippet's content below, so formatting inside an accordion
// matches the same formatting anywhere else in the export. The plain
// string case is kept as a fallback for any post whose accordions haven't
// been migrated to the new shape yet.
const accordionRenderer: PortableTextTypeRenderer<{ _type: string; title?: string; content?: string | unknown[] }> = ({
  value,
}) => {
  const inner = Array.isArray(value.content)
    ? portableTextToMarkdown(value.content as never, markdownOptions)
    : String(value.content ?? "");
  return `<details>\n<summary>${value.title ?? ""}</summary>\n\n${inner}\n\n</details>`;
};

const youtubeRenderer: PortableTextTypeRenderer<{ _type: string; url?: string }> = ({ value }) =>
  value?.url ? `[▶ Watch on YouTube](${value.url})` : "";

const instagramEmbedRenderer: PortableTextTypeRenderer<{ _type: string; url?: string }> = ({ value }) =>
  value?.url ? `[View this post on Instagram](${value.url})` : "";

const imageRenderer: PortableTextTypeRenderer<
  { _type: string } & GalleryImage & { additionalImages?: GalleryImage[]; displayStyle?: string }
> = ({ value }) => {
  const main = renderImage(value);
  const extra = value.additionalImages ?? [];
  if (extra.length === 0) return main;
  const styleLabel =
    value.displayStyle === "slideshow" ? "slideshow" : value.displayStyle === "scroll-strip" ? "scrolling strip" : "carousel";
  const rest = extra.map(renderImage).filter(Boolean).join("\n\n");
  return `${main}\n\n<!-- gallery (${styleLabel}), continued -->\n\n${rest}`;
};

const snippetRefRenderer: PortableTextTypeRenderer<{
  _type: string;
  snippetData?: { snippetType?: string; content?: unknown[] };
}> = ({ value }) => {
  const snippet = value.snippetData;
  if (!snippet?.content) return "";
  const inner = portableTextToMarkdown(snippet.content as never, markdownOptions);
  return snippet.snippetType === "pullquote" ? inner.replace(/^/gm, "> ") : inner;
};

// Passed to every portableTextToMarkdown call, including the recursive one
// above for a resolved snippet's own content -- one shared config so a
// link inside a snippet renders the same way a link in the post body does.
const markdownOptions = {
  marks: {
    // 'link' isn't listed here -- the library's own default renderer
    // already handles it correctly from value.href. internalLink and
    // affiliateLink are custom annotation types this schema adds on top
    // of that, so without an explicit entry here they'd fall through to
    // unknownMark and silently lose their href.
    internalLink: internalLinkRenderer,
    affiliateLink: affiliateLinkRenderer,
  },
  types: {
    divider: dividerRenderer,
    codeBlock: DefaultCodeBlockRenderer,
    callout: calloutRenderer,
    accordion: accordionRenderer,
    youtube: youtubeRenderer,
    instagramEmbed: instagramEmbedRenderer,
    image: imageRenderer,
    snippetRef: snippetRefRenderer,
  },
};

function frontmatterValue(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function yamlList(items: string[]): string {
  return `[${items.map(frontmatterValue).join(", ")}]`;
}

/** Filesystem-safe filename from a post's own slug -- matches its live URL, not a re-derived one. */
export function markdownFilename(slug: string): string {
  return `${slug}.md`;
}

export function buildMarkdownFile(post: ExportPost): { filename: string; content: string } {
  const frontmatterLines = [
    "---",
    `title: ${frontmatterValue(post.title)}`,
    `slug: ${frontmatterValue(post.slug)}`,
    post.publishedAt ? `date: ${post.publishedAt.slice(0, 10)}` : null,
    post.author ? `author: ${frontmatterValue(post.author)}` : null,
    post.excerpt ? `excerpt: ${frontmatterValue(post.excerpt)}` : null,
    post.categories?.length ? `categories: ${yamlList(post.categories)}` : null,
    post.tags?.length ? `tags: ${yamlList(post.tags)}` : null,
    "---",
  ].filter((line): line is string => line !== null);

  const heroUrl = post.mainImage ? imageUrl(post.mainImage) : "";
  const heroImage = heroUrl ? `![${post.mainImageAlt ?? post.title}](${heroUrl})\n\n` : "";
  const body = portableTextToMarkdown(post.body as never, markdownOptions);

  return {
    filename: markdownFilename(post.slug),
    content: `${frontmatterLines.join("\n")}\n\n# ${post.title}\n\n${heroImage}${body}\n`,
  };
}
