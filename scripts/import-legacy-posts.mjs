// One-off/rerunnable importer for old blog posts extracted into .md files
// (see scripts/legacy-posts/). Creates each post as a Sanity DRAFT only --
// nothing is published. Asher reviews and publishes from Studio himself.
//
// Usage:
//   node scripts/import-legacy-posts.mjs                  -- import every .md in scripts/legacy-posts/
//   node scripts/import-legacy-posts.mjs some-file.md ...  -- import specific files only
//   node scripts/import-legacy-posts.mjs --dry-run          -- parse everything and print the
//                                                              summary, but write nothing to Sanity
//                                                              (no token needed for this mode)
//
// Requires SANITY_API_WRITE_TOKEN in .env.local (same token used by
// src/sanity/lib/write-client.ts). Get it from sanity.io/manage or copy the
// one already set in Vercel.
//
// Re-running is safe: each post gets a deterministic draft ID
// (drafts.legacy-<slug>), so importing the same file twice updates the same
// draft instead of creating a duplicate.

import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const legacyDir = path.join(__dirname, "legacy-posts");

loadEnv({ path: path.join(repoRoot, ".env.local") });
loadEnv({ path: path.join(repoRoot, ".env") });

const DRY_RUN = process.argv.includes("--dry-run");

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
      "Add it to .env.local (same token your Vercel deployment uses for SANITY_API_WRITE_TOKEN),\n" +
      "then run this script again. Or pass --dry-run to preview without writing anything."
  );
  process.exit(1);
}

const client = DRY_RUN
  ? null
  : createClient({
      projectId,
      dataset,
      apiVersion: "2026-07-22",
      token,
      useCdn: false,
    });

// ---- mojibake cleanup -------------------------------------------------
// These .md files were copy-pasted from an old export where multi-byte
// UTF-8 punctuation (em dashes, ellipses) got mangled into "â" + stray
// bytes. "â¦" is always an ellipsis; a lone " â " between words is always
// an em dash -- confirmed by cross-checking against spots in the same
// files where the author's em dashes survived intact.
function cleanMojibake(text) {
  return text.replace(/â¦/g, "…").replace(/ â /g, " — ");
}

function detectResidualMojibake(text) {
  // Flags anything left that our two known substitutions didn't catch:
  // either a run of 2+ non-ASCII chars (usually mangled multi-byte text,
  // e.g. old Chinese text that can't be auto-recovered), or a lone
  // leftover â/ð (the two telltale mojibake lead-bytes -- never legitimate
  // on their own once the known ellipsis/dash cases are already cleaned).
  const matches = text.match(/.{0,15}(?:[^\x00-\x7F]{2,}|[âð]).{0,15}/g);
  return matches || [];
}

// ---- frontmatter parsing -----------------------------------------------
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

// ---- markdown -> portable text ------------------------------------------
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
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paraBuffer = [];

  function flushParagraph() {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ").trim();
    paraBuffer = [];
    if (!text) return;
    blocks.push(makeBlock("normal", parseInline(text)));
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = Math.min(headingMatch[1].length, 4);
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

// ---- date handling -------------------------------------------------------
function toPublishedAt(dateStr) {
  // Some old posts only recorded a year-month (no day) -- default to the
  // 1st. Flagged in the summary so Asher can correct it if he knows the
  // real day.
  let assumedDay = false;
  let iso = dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    iso = `${dateStr}-01`;
    assumedDay = true;
  }
  return { publishedAt: `${iso}T09:00:00.000Z`, assumedDay };
}

// ---- category / author lookups -------------------------------------------
const categoryCache = new Map();
async function getOrCreateCategory(title) {
  if (DRY_RUN) return `dry-run-category-${title}`;
  if (categoryCache.has(title)) return categoryCache.get(title);
  const existing = await client.fetch(`*[_type == "category" && title == $title][0]._id`, { title });
  if (existing) {
    categoryCache.set(title, existing);
    return existing;
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const created = await client.create({
    _type: "category",
    title,
    slug: { _type: "slug", current: slug },
  });
  categoryCache.set(title, created._id);
  return created._id;
}

async function getAuthorId() {
  if (DRY_RUN) return "dry-run-author";
  const id = await client.fetch(`*[_type == "author" && slug.current == "asher-aw"][0]._id`);
  if (!id) {
    throw new Error(
      'No author found with slug "asher-aw". Create that Author document in Studio first, then re-run this script.'
    );
  }
  return id;
}

// ---- main -----------------------------------------------------------------
async function main() {
  const requested = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const files =
    requested.length > 0
      ? requested
      : readdirSync(legacyDir).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.log("No .md files found in scripts/legacy-posts/");
    return;
  }

  const authorId = await getAuthorId();
  const summary = [];

  for (const file of files) {
    const filePath = path.isAbsolute(file) ? file : path.join(legacyDir, file);
    const raw = readFileSync(filePath, "utf8");
    const { data, body } = parseFrontmatter(raw);

    const title = cleanMojibake(data.title || "");
    const cleanedBody = cleanMojibake(body);
    const { publishedAt, assumedDay } = toPublishedAt(data.date);
    const slug = path.basename(file, ".md").replace(/^\d{4}-\d{2}(-\d{2})?-/, "");
    const categoryId = data.category ? await getOrCreateCategory(data.category) : undefined;
    const blocks = markdownToBlocks(cleanedBody);
    const residual = detectResidualMojibake(cleanedBody);

    const doc = {
      _id: `drafts.legacy-${slug}`,
      _type: "post",
      title,
      slug: { _type: "slug", current: slug },
      author: { _type: "reference", _ref: authorId },
      publishedAt,
      body: blocks,
      ...(categoryId
        ? { categories: [{ _type: "reference", _ref: categoryId, _key: key() }] }
        : {}),
    };

    if (process.argv.includes("--inspect") && requested.includes(file)) {
      console.log(JSON.stringify(blocks, null, 2));
    }

    if (!DRY_RUN) await client.createOrReplace(doc);

    summary.push({
      file,
      title,
      slug,
      publishedAt,
      assumedDay,
      category: data.category || "(none)",
      blocks: blocks.length,
      residual,
      note: data.note || data.original_url_note || "",
    });
  }

  console.log("\nImported as drafts:\n");
  for (const s of summary) {
    console.log(`- ${s.title}`);
    console.log(`  slug: /blog/${s.slug}`);
    console.log(`  publishedAt: ${s.publishedAt}${s.assumedDay ? "  (day assumed -- only year/month was recorded)" : ""}`);
    console.log(`  category: ${s.category}  |  blocks: ${s.blocks}`);
    if (s.note) console.log(`  ⚠ note from source file: ${s.note}`);
    if (s.residual.length) {
      console.log(`  ⚠ possible unrecovered encoding issues:`);
      for (const r of s.residual) console.log(`      "${r}"`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
