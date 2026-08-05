import JSZip from "jszip";
import {
  toHTML,
  escapeHTML,
  type PortableTextComponents,
  type PortableTextMarkComponent,
  type PortableTextTypeComponent,
} from "@portabletext/to-html";
import { htmlComponents, imageUrl } from "./exportHtml";
import type { ExportPost } from "./exportMarkdown";

const SITE_URL = "https://asheraw.com";

// EPUB readers render offline, inside the package's own sandbox -- an
// <iframe> pointing at YouTube, or a relative /blog/<slug> link with no
// domain to resolve against, both just don't work the way they do in a
// live browser tab. This is why EPUB can't reuse exportHtml.ts's component
// config unmodified: youtube/instagramEmbed fall back to a plain absolute
// link (no embed), and internalLink points at the full site URL instead of
// a relative path.
const youtubeLinkOnly: PortableTextTypeComponent<{ _type: string; url?: string }> = ({ value }) =>
  value?.url ? `<p><a href="${escapeHTML(value.url)}">Watch on YouTube</a></p>` : "";

const internalLinkAbsolute: PortableTextMarkComponent<{ _type: string; slug?: string }> = ({ value, children }) =>
  value?.slug ? `<a href="${SITE_URL}/blog/${escapeHTML(value.slug)}">${children}</a>` : children;

const epubComponents: Partial<PortableTextComponents> = {
  ...htmlComponents,
  types: { ...htmlComponents.types, youtube: youtubeLinkOnly },
  marks: { ...htmlComponents.marks, internalLink: internalLinkAbsolute },
};

function xmlEscapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slugForZip(post: ExportPost, index: number): string {
  return post.slug || `post-${index + 1}`;
}

// Sanity CDN URLs always encode the real extension in the path itself
// (before the query string) -- reading it from there is simpler and more
// reliable than trusting a fetch response's content-type header.
function extensionFromUrl(url: string): string {
  const match = url.match(/\.(jpe?g|png|gif|webp)(?:\?|$)/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

// EPUB readers render offline -- a remote <img src="https://..."> mostly
// just shows as broken, unlike Markdown/HTML export where the reader is
// assumed to have a live connection when they open the file. So images get
// actually downloaded and bundled into the package (unlike every other
// export format here), with each remote URL swapped for a path relative to
// the chapter file that references it. Scoped to one images/<chapterId>/
// subfolder per chapter so two posts' images can never collide on the same
// filename inside a multi-post archive.
async function bundleImages(zip: JSZip, chapterHtml: string, chapterId: string): Promise<string> {
  const urls = [...new Set([...chapterHtml.matchAll(/src="(https:\/\/cdn\.sanity\.io\/[^"]+)"/g)].map((m) => m[1]))];
  let html = chapterHtml;
  let n = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const bytes = await res.arrayBuffer();
      const filename = `img-${++n}.${extensionFromUrl(url)}`;
      zip.file(`OEBPS/images/${chapterId}/${filename}`, bytes);
      // Chapters live in OEBPS/chapters/, images in OEBPS/images/<id>/ --
      // sibling folders, so the reference from a chapter back to its own
      // images climbs out one level first.
      html = html.split(url).join(`../images/${chapterId}/${filename}`);
    } catch {
      // A single image failing to download shouldn't sink the whole
      // export -- the <img> tag just points at a path that doesn't
      // resolve inside the package, same as a genuinely dead image link.
    }
  }
  return html;
}

function chapterXhtml(title: string, bodyHtml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${xmlEscapeAttr(title)}</title><meta charset="utf-8" /></head>
<body>
<h1>${xmlEscapeAttr(title)}</h1>
${bodyHtml}
</body>
</html>`;
}

function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function contentOpf(ids: string[], bookTitle: string, bookAuthor: string, identifier: string): string {
  const manifestItems = ids
    .map((id) => `<item id="chap-${id}" href="chapters/${id}.xhtml" media-type="application/xhtml+xml"/>`)
    .join("\n    ");
  const spineItems = ids.map((id) => `<itemref idref="chap-${id}"/>`).join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${xmlEscapeAttr(bookTitle)}</dc:title>
    <dc:creator>${xmlEscapeAttr(bookAuthor)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">${xmlEscapeAttr(identifier)}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`;
}

function tocNcx(posts: ExportPost[], ids: string[], bookTitle: string, identifier: string): string {
  const navPoints = posts
    .map(
      (post, i) => `<navPoint id="nav-${ids[i]}" playOrder="${i + 1}">
      <navLabel><text>${xmlEscapeAttr(post.title)}</text></navLabel>
      <content src="chapters/${ids[i]}.xhtml"/>
    </navPoint>`,
    )
    .join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${xmlEscapeAttr(identifier)}"/>
  </head>
  <docTitle><text>${xmlEscapeAttr(bookTitle)}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;
}

/** Filesystem-safe filename for a single-post EPUB, matching its live URL. */
export function epubFilename(slug: string): string {
  return `${slug}.epub`;
}

// Builds a valid EPUB 2.0.1 package -- mimetype, container.xml, an OPF
// manifest/spine, an NCX table of contents, one XHTML chapter per post.
// Works the same for a single post (a valid one-chapter EPUB) and the full
// archive (every post as its own chapter, in the order passed in).
export async function buildEpubBlob(
  posts: ExportPost[],
  options: { title: string; author: string; identifier: string },
): Promise<Blob> {
  const zip = new JSZip();
  // Must be the first entry in the archive, stored uncompressed -- part of
  // the EPUB spec itself, not a JSZip quirk.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", containerXml());

  const ids = posts.map((post, i) => slugForZip(post, i));

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const id = ids[i];
    const hero = post.mainImage
      ? `<img src="${escapeHTML(imageUrl(post.mainImage))}" alt="${escapeHTML(post.mainImageAlt ?? post.title)}" />`
      : "";
    const rawHtml = hero + toHTML(post.body as never, { components: epubComponents });
    const bundledHtml = await bundleImages(zip, rawHtml, id);
    zip.file(`OEBPS/chapters/${id}.xhtml`, chapterXhtml(post.title, bundledHtml));
  }

  zip.file("OEBPS/content.opf", contentOpf(ids, options.title, options.author, options.identifier));
  zip.file("OEBPS/toc.ncx", tocNcx(posts, ids, options.title, options.identifier));

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}
