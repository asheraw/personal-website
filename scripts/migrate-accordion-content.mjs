// One-off/rerunnable migration: rewrites an accordion block's `content`
// field (schema type `accordion`, see src/sanity/schemaTypes/blockContentType.ts)
// from its old shape (a plain multi-line string) into the new one (an
// array of simple-rich-text blocks -- paragraphs, bold/italic/underline,
// lists, plain links), so the field actually supports the rich text it's
// now meant to. Splits the old string on blank lines into one paragraph
// block per paragraph; a single line break inside a paragraph collapses
// to a space, matching how a plain <p> renders anyway (the old rendering
// used `white-space: pre-wrap` specifically because it had no other way
// to show line breaks -- the new renderer doesn't need that crutch since
// paragraph breaks now carry real structure instead of raw whitespace).
//
// Why this exists: src/lib/portableText.ts, exportHtml.ts, exportMarkdown.ts,
// and exportPdf.ts all handle *both* shapes defensively (old string OR new
// array), so nothing breaks for an unmigrated post in the meantime -- but
// Accordion.tsx (the actual live renderer) only renders the new array
// shape, so any post with an un-migrated accordion would show an empty
// accordion body on the live site until this runs.
//
// Usage:
//   node scripts/migrate-accordion-content.mjs --dry-run   -- report what would change, write nothing
//                                                               (no token needed for this mode)
//   node scripts/migrate-accordion-content.mjs              -- actually patch every matching post
//
// Requires SANITY_API_WRITE_TOKEN in .env.local for the real run. Reading/
// reporting doesn't need a token -- the dataset is public-read.
//
// Safe to re-run: only ever matches accordion blocks whose `content` is
// still a string (`defined(content) && string::split(...)` isn't needed --
// GROQ's own `content` type check via the query below filters to string
// values only), patched by their existing `_key` via body[_key=="..."],
// never rewriting the whole body array -- so a block already migrated to
// an array is simply skipped on a second run, and unrelated edits made to
// the same post between the query and the patch can't be clobbered.

import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

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

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-22",
  token: DRY_RUN ? undefined : token,
  useCdn: false,
});

const SAFE_KEY = /^[a-zA-Z0-9]+$/;

function randomKey() {
  return Math.random().toString(36).slice(2, 10);
}

/** Old plain string -> new array-of-blocks shape, one paragraph block per blank-line-separated paragraph. */
function stringToBlocks(content) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  // An accordion with only whitespace as its content becomes a single
  // empty paragraph rather than zero blocks -- Sanity's editor expects at
  // least one block for an array field to open cleanly, and the field
  // will otherwise look identical to before (a heading with no visible body).
  const effective = paragraphs.length > 0 ? paragraphs : [""];
  return effective.map((text) => ({
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: randomKey(), text, marks: [] }],
  }));
}

const QUERY = `
  *[_type == "post" && count(body[_type == "accordion" && defined(content) && content match "*"]) > 0]{
    _id,
    title,
    "slug": slug.current,
    "accordionBlocks": body[_type == "accordion"]{_key, title, content}
  }
`;

async function main() {
  const posts = await client.fetch(QUERY);

  // The query's `content match "*"` only matches string fields (GROQ's
  // `match` operator only ever tests strings) -- posts whose accordion
  // `content` is already an array pass through here with an empty-looking
  // match, so double-check per-block below rather than trusting the query
  // filter alone to have excluded every already-migrated block.
  const toMigrate = [];
  for (const post of posts) {
    const blocks = post.accordionBlocks.filter((b) => typeof b.content === "string");
    if (blocks.length > 0) toMigrate.push({ ...post, accordionBlocks: blocks });
  }

  if (toMigrate.length === 0) {
    console.log(
      "No posts found with an accordion still using the old plain-text content shape -- nothing to migrate.\n" +
        "Every accordion is already using the new rich-text array shape."
    );
    return;
  }

  console.log(
    `${DRY_RUN ? "[dry run] " : ""}Found ${toMigrate.length} post document(s) with an old-style accordion:\n`
  );

  let totalBlocks = 0;
  let skippedBlocks = 0;

  for (const post of toMigrate) {
    console.log(`- ${post.title || "(untitled)"}  (${post._id})`);
    if (post.slug) console.log(`  /blog/${post.slug}`);

    const patch = DRY_RUN ? null : client.patch(post._id);
    let patchedHere = 0;

    for (const block of post.accordionBlocks) {
      if (!SAFE_KEY.test(block._key || "")) {
        console.log(`  ⚠ skipping accordion "${block.title || "(untitled)"}" -- unexpected _key (${JSON.stringify(block._key)}), needs a manual look`);
        skippedBlocks++;
        continue;
      }
      const newContent = stringToBlocks(block.content);
      console.log(`  "${block.title || "(untitled)"}": ${block.content.length} chars -> ${newContent.length} paragraph block(s)`);
      if (patch) patch.set({ [`body[_key=="${block._key}"].content`]: newContent });
      patchedHere++;
      totalBlocks++;
    }

    if (patch && patchedHere > 0) await patch.commit();
    console.log("");
  }

  console.log(
    `${DRY_RUN ? "[dry run] Would migrate" : "Migrated"} ${totalBlocks} accordion block(s) across ${toMigrate.length} post(s).` +
      (skippedBlocks ? `  (${skippedBlocks} block(s) skipped -- see ⚠ above)` : "")
  );

  if (DRY_RUN) {
    console.log("\nNothing was written. Re-run without --dry-run to actually apply these changes.");
    return;
  }

  const remainingPosts = await client.fetch(QUERY);
  const stillStringShaped = remainingPosts.flatMap((p) => p.accordionBlocks.filter((b) => typeof b.content === "string"));
  if (stillStringShaped.length === 0) {
    console.log("\nVerified: every accordion block now uses the new rich-text array content shape.");
  } else {
    console.log(
      `\n⚠ ${stillStringShaped.length} accordion block(s) still have plain-string content after this run -- ` +
        "check the ⚠ skip warnings above."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
