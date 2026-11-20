// Loads a static Page (Studio > Pages, lives at asheraw.com/<slug>) from a
// markdown file in scripts/pages/ into Sanity as a DRAFT. Nothing is
// published -- Asher reviews and edits it in Studio, then hits Publish.
//
// Usage:
//   node scripts/import-pages.mjs                      -- every .md in scripts/pages/
//   node scripts/import-pages.mjs contenttoclients.md  -- one file
//   node scripts/import-pages.mjs --dry-run            -- parse and print, write nothing
//                                                         (no token needed)
//   node scripts/import-pages.mjs --force              -- overwrite a page that already exists
//
// Requires SANITY_API_WRITE_TOKEN in .env.local (the same token as
// scripts/import-legacy-posts.mjs).
//
// raw perspective below so an existing DRAFT is seen too (the default perspective hides drafts.*).
// Safe to re-run: if a Page with the same slug already exists (draft or
// published) the script skips it, so it can never wipe edits made in Studio.
// Pass --force only when you really want the markdown file to win.
//
// Frontmatter: title, slug, excerpt (all plain `key: "value"` lines);
// optional seoTitle and noIndex (true/false). Body is simple markdown:
// ## headings, **bold**, *italic*, - bullets, 1. numbered, > quotes, ---.

import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pagesDir = path.join(__dirname, "pages");

loadEnv({ path: path.join(repoRoot, ".env.local") });
loadEnv({ path: path.join(repoRoot, ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

// Mirrors RESERVED_PAGE_SLUGS in src/sanity/schemaTypes/pageType.ts -- these
// already exist as real routes and would quietly shadow a Page.
const RESERVED = ["blog", "connect", "link", "privacy", "studio", "api"];

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET in .env.local");
  process.exit(1);
}
if (!token && !DRY_RUN) {
  console.error(
    "Missing SANITY_API_WRITE_TOKEN.\n" +
      "Add it to .env.local (same token your Vercel deployment uses), then run this again.\n" +
      "Or pass --dry-run to preview without writing anything."
  );
  process.exit(1);
}

const client = DRY_RUN
  ? null
  : createClient({ projectId, dataset, apiVersion: "2026-07-22", token, useCdn: false });

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter block found");
  const [, fmBlock, body] = match;
  const data = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    data[m[1]] = value;
  }
  return { data, body };
}

function key() {
  return crypto.randomBytes(6).toString("hex");
}

function makeSpan(text, marks) {
  return { _type: "span", _key: key(), text, marks };
}

function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter((p) => p !== "");
  if (parts.length === 0) return [makeSpan("", [])];
  return parts.map((part) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return makeSpan(part.slice(2, -2), ["strong"]);
    if (/^\*[^*]+\*$/.test(part)) return makeSpan(part.slice(1, -1), ["em"]);
    return makeSpan(part, []);
  });
}

function makeBlock(style, children, extra = {}) {
  return { _type: "block", _key: key(), style, markDefs: [], children, ...extra };
}

function markdownToBlocks(markdown) {
  const blocks = [];
  let paraBuffer = [];

  function flushParagraph() {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ").trim();
    paraBuffer = [];
    if (text) blocks.push(makeBlock("normal", parseInline(text)));
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const trimmed = rawLine.trim();

    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      // The page title is already the h1, and Studio only offers h2-h4.
      const level = Math.min(Math.max(headingMatch[1].length, 2), 4);
      blocks.push(makeBlock(`h${level}`, parseInline(headingMatch[2].trim())));
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ _type: "divider", _key: key(), style: "divider" });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push(makeBlock("normal", parseInline(bulletMatch[1]), { listItem: "bullet", level: 1 }));
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      blocks.push(makeBlock("normal", parseInline(numberedMatch[1]), { listItem: "number", level: 1 }));
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      blocks.push(makeBlock("blockquote", parseInline(quoteMatch[1])));
      continue;
    }

    paraBuffer.push(trimmed);
  }
  flushParagraph();
  return blocks;
}

async function main() {
  const requested = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const files = requested.length > 0 ? requested : readdirSync(pagesDir).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.log("No .md files found in scripts/pages/");
    return;
  }

  for (const file of files) {
    const filePath = path.isAbsolute(file) ? file : path.join(pagesDir, file);
    const { data, body } = parseFrontmatter(readFileSync(filePath, "utf8"));
    const slug = data.slug || path.basename(file, ".md");

    if (!data.title) throw new Error(`${file}: frontmatter is missing a title`);
    if (RESERVED.includes(slug)) throw new Error(`${file}: "${slug}" is already a real route on the site`);
    if (data.excerpt && data.excerpt.length > 160) {
      console.warn(`  ⚠ ${file}: excerpt is ${data.excerpt.length} characters -- Google cuts it off past ~160.`);
    }

    const blocks = markdownToBlocks(body);
    const doc = {
      _id: `drafts.page-${slug}`,
      _type: "page",
      title: data.title,
      slug: { _type: "slug", current: slug },
      ...(data.excerpt ? { excerpt: data.excerpt } : {}),
      ...(data.seoTitle ? { seoTitle: data.seoTitle } : {}),
      noIndex: data.noIndex === "true",
      body: blocks,
    };

    if (!DRY_RUN && !FORCE) {
      const existing = await client.fetch(`*[_type == "page" && slug.current == $slug]._id`, { slug }, { perspective: "raw" });
      if (existing.length > 0) {
        console.log(`- ${file}: SKIPPED. A Page at /${slug} already exists (${existing.join(", ")}). Use --force to overwrite.`);
        continue;
      }
    }

    if (!DRY_RUN) await client.createOrReplace(doc);

    const placeholders = (body.match(/\[[^\]]+\]/g) || []).length;
    console.log(`- ${data.title}`);
    console.log(`  ${DRY_RUN ? "would create" : "created"} draft -> asheraw.com/${slug}  |  ${blocks.length} blocks`);
    console.log(`  ${placeholders} [bracketed] placeholders still to fill in Studio`);
  }
  if (!DRY_RUN) console.log("\nOpen Studio > Pages, review the draft, then Publish.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
