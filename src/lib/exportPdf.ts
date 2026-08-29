import PDFDocument from "pdfkit";
import { urlFor } from "@/sanity/lib/image";
import { TEXT_COLOR_HEX } from "./exportHtml";
import type { ExportPost } from "./exportMarkdown";

// Node-only -- pdfkit uses Node's stream/Buffer internals and doesn't run
// in a browser bundle. This is why PDF export goes through a Next.js API
// route (src/app/api/export/pdf/route.ts) instead of running directly in
// the Studio tool/action the way Markdown/JSON/HTML/EPUB all do -- the
// same "needs real server-side work" pattern already established by the
// Link Checker's "Check now" button hitting /api/check-links.

const SITE_URL = "https://asheraw.com";

type Span = { _type?: string; text?: string; marks?: string[] };
type MarkDef = { _key?: string; _type?: string; [key: string]: unknown };
type Block = {
  _type: string;
  style?: string;
  listItem?: string;
  children?: Span[];
  markDefs?: MarkDef[];
  [key: string]: unknown;
};
type GalleryImage = { asset?: { _ref: string }; alt?: string; caption?: string };

// Sanity's image pipeline can serve WebP -- pdfkit only decodes JPEG and
// PNG, so PDF-bound images are forced to jpg regardless of source format.
function pdfImageUrl(value: { asset?: { _ref: string } }): string {
  try {
    return value?.asset ? urlFor(value).width(1200).format("jpg").url() : "";
  } catch {
    return "";
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function fontForSpan(marks: string[], boldDefault: boolean, italicDefault: boolean): string {
  if (marks.includes("code")) return "Courier";
  const bold = boldDefault || marks.includes("strong");
  const italic = italicDefault || marks.includes("em");
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold) return "Helvetica-Bold";
  if (italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function markDef(markKey: string, markDefs: MarkDef[]): MarkDef | undefined {
  return markDefs.find((d) => d._key === markKey);
}

function linkForMarks(marks: string[], markDefs: MarkDef[]): string | undefined {
  for (const key of marks) {
    const def = markDef(key, markDefs);
    if (!def) continue;
    if (def._type === "link" && typeof def.href === "string") return def.href;
    if (def._type === "affiliateLink" && typeof def.href === "string") return def.href;
    if (def._type === "internalLink" && typeof def.slug === "string") return `${SITE_URL}/blog/${def.slug}`;
  }
  return undefined;
}

function colorForMarks(marks: string[], markDefs: MarkDef[]): string | undefined {
  for (const key of marks) {
    const def = markDef(key, markDefs);
    if (def?._type === "textColor" && typeof def.color === "string") return TEXT_COLOR_HEX[def.color];
  }
  return undefined;
}

// Renders one block's span array as a single flowing, mixed-style run of
// text -- bold/italic/underline/strike-through/color/links all apply
// per-span via pdfkit's `continued` chaining, rather than flattening to
// plain text. `boldDefault`/`italicDefault` cover block-level styling
// (headings, blockquotes) that should apply regardless of the span's own
// marks.
function renderSpans(
  doc: PDFKit.PDFDocument,
  spans: Span[],
  markDefs: MarkDef[],
  options: { size: number; boldDefault?: boolean; italicDefault?: boolean },
) {
  if (spans.length === 0) {
    doc.text("");
    return;
  }
  spans.forEach((span, i) => {
    const marks = span.marks ?? [];
    const font = fontForSpan(marks, !!options.boldDefault, !!options.italicDefault);
    const link = linkForMarks(marks, markDefs);
    const color = colorForMarks(marks, markDefs);
    doc.font(font).fontSize(options.size);
    if (color) doc.fillColor(color);
    doc.text(span.text ?? "", {
      continued: i < spans.length - 1,
      link,
      underline: marks.includes("underline") || !!link,
      strike: marks.includes("strike-through"),
    });
    if (color) doc.fillColor("black");
  });
}

const CALLOUT_LABELS: Record<string, string> = { note: "Note", tip: "Tip", warning: "Warning" };

// `text` used to be a plain string; it's now an array of simple-rich-text
// blocks (see blockContentType.ts). Unlike Markdown/HTML/the accordion
// case below, the callout box's background rect needs its full height
// known before anything is drawn (see the "callout" case), which isn't
// compatible with recursively rendering rich blocks one at a time -- so
// this deliberately flattens to plain text (no bold/italic) inside the
// PDF export specifically, rather than the fully-formatted rendering
// Markdown/HTML get. A documented scope cut, not an oversight.
function flattenCalloutText(text: string | unknown[] | undefined): string {
  if (!Array.isArray(text)) return String(text ?? "");
  return (text as Block[])
    .map((block) => (block.children ?? []).map((c) => c.text ?? "").join(""))
    .join("\n\n");
}

async function drawImage(doc: PDFKit.PDFDocument, img: GalleryImage) {
  const url = pdfImageUrl(img);
  if (!url) return;
  const buffer = await fetchImageBuffer(url);
  if (!buffer) return;
  const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  try {
    doc.image(buffer, { fit: [maxWidth, 360], align: "center" });
  } catch {
    return; // A corrupt/unsupported image shouldn't sink the whole export.
  }
  if (img.caption) {
    doc.moveDown(0.15);
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#666666").text(img.caption, { align: "center" });
    doc.fillColor("black");
  }
  doc.moveDown(0.6);
}

// Tracks a numbered list's running count across consecutive `number`
// listItem blocks -- resets the moment a non-numbered-list block breaks
// the run, same as any normal ordered list.
let numberedListCounter = 0;

async function renderNode(doc: PDFKit.PDFDocument, node: Block) {
  if (node._type === "block") {
    const spans = node.children ?? [];
    const markDefs = node.markDefs ?? [];
    const isNumbered = node.listItem === "number";
    if (!isNumbered) numberedListCounter = 0;

    if (node.listItem === "bullet" || node.listItem === "number") {
      numberedListCounter = isNumbered ? numberedListCounter + 1 : numberedListCounter;
      const prefix = isNumbered ? `${numberedListCounter}. ` : "•  ";
      doc.text(prefix, { continued: true, indent: 18 });
      renderSpans(doc, spans, markDefs, { size: 11 });
      doc.moveDown(0.3);
      return;
    }

    switch (node.style) {
      case "h2":
        doc.moveDown(0.6);
        renderSpans(doc, spans, markDefs, { size: 17, boldDefault: true });
        doc.moveDown(0.4);
        return;
      case "h3":
        doc.moveDown(0.5);
        renderSpans(doc, spans, markDefs, { size: 14.5, boldDefault: true });
        doc.moveDown(0.35);
        return;
      case "h4":
        doc.moveDown(0.4);
        renderSpans(doc, spans, markDefs, { size: 12.5, boldDefault: true });
        doc.moveDown(0.3);
        return;
      case "blockquote": {
        const startY = doc.y;
        const left = doc.page.margins.left;
        renderSpans(doc, spans, markDefs, { size: 11, italicDefault: true });
        const endY = doc.y;
        doc.rect(left, startY, 2.5, endY - startY).fill("#999999");
        doc.fillColor("black");
        doc.moveDown(0.3);
        return;
      }
      default:
        renderSpans(doc, spans, markDefs, { size: 11 });
        doc.moveDown(0.5);
        return;
    }
  }

  numberedListCounter = 0;

  switch (node._type) {
    case "divider": {
      doc.moveDown(0.3);
      const y = doc.y;
      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.width - doc.page.margins.right, y)
        .strokeColor("#d9d9d9")
        .stroke();
      doc.moveDown(0.6);
      return;
    }
    case "codeBlock": {
      const code = String(node.code ?? "");
      doc.font("Courier").fontSize(9);
      const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const height = doc.heightOfString(code, { width: width - 16 }) + 16;
      const top = doc.y;
      doc.rect(doc.page.margins.left, top, width, height).fill("#1e1e1e");
      doc.fillColor("#eeeeee").text(code, doc.page.margins.left + 8, top + 8, { width: width - 16 });
      doc.fillColor("black");
      doc.y = top + height;
      doc.moveDown(0.6);
      return;
    }
    case "callout": {
      const style = String(node.style ?? "note");
      const label = String(node.label ?? "") || CALLOUT_LABELS[style] || "Note";
      const text = flattenCalloutText(node.text as string | unknown[] | undefined);
      const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.font("Helvetica").fontSize(11);
      const height = doc.heightOfString(`${label}: ${text}`, { width: width - 24 }) + 20;
      const top = doc.y;
      doc.rect(doc.page.margins.left, top, width, height).fill("#f2f2f2");
      doc.fillColor("black");
      doc.font("Helvetica-Bold").fontSize(11).text(`${label}: `, doc.page.margins.left + 12, top + 10, { continued: true, width: width - 24 });
      doc.font("Helvetica").text(text);
      doc.y = top + height;
      doc.moveDown(0.6);
      return;
    }
    case "accordion": {
      // No fold/unfold in a static document -- always shown expanded,
      // the only sensible behavior for something meant to be printed/read
      // linearly. `content` used to be a plain string; it's now an array
      // of simple-rich-text blocks (see blockContentType.ts) -- rendered
      // through the same renderNode used for the post body itself, one
      // block at a time, so bold/italic/underline/links inside an
      // accordion get the same treatment as anywhere else in the export.
      // The plain string case is kept as a fallback for any post whose
      // accordions haven't been migrated to the new shape yet.
      doc.font("Helvetica-Bold").fontSize(11).text(String(node.title ?? ""));
      doc.moveDown(0.2);
      if (Array.isArray(node.content)) {
        for (const child of node.content as Block[]) {
          await renderNode(doc, child);
        }
      } else {
        doc.font("Helvetica").fontSize(11).text(String(node.content ?? ""));
      }
      doc.moveDown(0.5);
      return;
    }
    case "accordionGroup": {
      // Same per-item rendering as the "accordion" case above, just looped
      // -- an Accordion Group is several of those stacked, not a
      // different shape.
      const items = Array.isArray(node.items) ? (node.items as Block[]) : [];
      for (const item of items) {
        doc.font("Helvetica-Bold").fontSize(11).text(String(item.title ?? ""));
        doc.moveDown(0.2);
        if (Array.isArray(item.content)) {
          for (const child of item.content as Block[]) {
            await renderNode(doc, child);
          }
        } else {
          doc.font("Helvetica").fontSize(11).text(String(item.content ?? ""));
        }
        doc.moveDown(0.5);
      }
      return;
    }
    case "youtube": {
      const url = typeof node.url === "string" ? node.url : "";
      // No "▶ " prefix here unlike the Markdown/HTML renderers -- pdfkit's
      // built-in standard fonts only support WinAnsi-range characters, and
      // that glyph silently renders as garbage ("%¶") rather than an
      // error, so this was caught by actually rendering a real PDF to an
      // image and looking at it, not by a type or build check.
      if (url) doc.font("Helvetica-Bold").fillColor("#2563eb").text("Watch on YouTube", { link: url, underline: true });
      doc.fillColor("black");
      doc.moveDown(0.5);
      return;
    }
    case "instagramEmbed": {
      const url = typeof node.url === "string" ? node.url : "";
      if (url) doc.font("Helvetica-Bold").fillColor("#2563eb").text("View this post on Instagram", { link: url, underline: true });
      doc.fillColor("black");
      doc.moveDown(0.5);
      return;
    }
    case "externalGif": {
      // Same link-only treatment as youtube/instagramEmbed above, not a
      // real embed like the "image" case below -- pdfkit's doc.image()
      // only decodes JPEG/PNG (see drawImage's own comment), and this is
      // always an animated GIF hotlinked straight from Giphy, not a real
      // Sanity asset drawImage's urlFor()-based pipeline could convert.
      const url = typeof node.url === "string" ? node.url : "";
      if (url) doc.font("Helvetica-Bold").fillColor("#2563eb").text("View this GIF on Giphy", { link: url, underline: true });
      doc.fillColor("black");
      doc.moveDown(0.5);
      return;
    }
    case "image": {
      await drawImage(doc, node as GalleryImage);
      const extra = (node.additionalImages as GalleryImage[] | undefined) ?? [];
      for (const img of extra) await drawImage(doc, img);
      return;
    }
    case "snippetRef": {
      const snippet = node.snippetData as { snippetType?: string; content?: Block[] } | undefined;
      if (!snippet?.content) return;
      const isPullquote = snippet.snippetType === "pullquote";
      if (isPullquote) {
        const startY = doc.y;
        const left = doc.page.margins.left;
        for (const child of snippet.content) await renderNode(doc, child);
        doc.rect(left, startY, 2.5, doc.y - startY).fill("#999999");
        doc.fillColor("black");
      } else {
        for (const child of snippet.content) await renderNode(doc, child);
      }
      return;
    }
    default:
      return; // Unknown block type -- skip rather than guess at a rendering.
  }
}

async function renderPost(doc: PDFKit.PDFDocument, post: ExportPost, isFirst: boolean) {
  if (!isFirst) doc.addPage();
  numberedListCounter = 0;

  doc.font("Helvetica-Bold").fontSize(22).text(post.title);
  const metaParts = [
    post.author,
    post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : null,
    post.categories?.length ? post.categories.join(", ") : null,
  ].filter((part): part is string => !!part);
  if (metaParts.length) {
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text(metaParts.join("  ·  "));
    doc.fillColor("black");
  }
  doc.moveDown(0.8);

  if (post.mainImage) await drawImage(doc, { ...post.mainImage, alt: post.mainImageAlt });

  const body = (post.body as Block[] | undefined) ?? [];
  for (const node of body) await renderNode(doc, node);
}

// Builds a PDF for one post, or the full archive with every post starting
// on its own page, in the order passed in. Block-level structure
// (headings, paragraphs, lists, blockquotes, images, code blocks,
// callouts, dividers, galleries) is fully rendered; inline styling within
// a paragraph (bold/italic/underline/strike-through/links/text color) is
// too -- the one deliberate scope cut from Markdown/HTML/EPUB is that
// there's no fold/unfold for accordions in a static, linearly-read
// document, so they're always shown expanded.
export async function buildPdfBuffer(posts: ExportPost[]): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  for (let i = 0; i < posts.length; i++) {
    await renderPost(doc, posts[i], i === 0);
  }

  doc.end();
  return done;
}
