// One-off/rerunnable migration: rewrites a callout block's `text` field
// (schema type `callout`, see src/sanity/schemaTypes/blockContentType.ts)
// from its old shape (a plain multi-line string) into the new one (an
// array of simple-rich-text blocks -- paragraphs, bold/italic/underline,
// lists, plain links), so the field actually supports the rich text it's
// now meant to. Splits the old string on blank lines into one paragraph
// block per paragraph; a single line break inside a paragraph collapses to
// a space -- identical approach to migrate-accordion-content.mjs, which
// this script is a straight adaptation of (same field-shape upgrade,
// different block type).
//
// Why this exists: src/lib/portableText.ts, exportHtml.ts, exportMarkdown.ts,
// and exportPdf.ts all handle *both* shapes defensively (old string OR new
// array), so nothing breaks for an unmigrated post in the meantime -- but
// portableTextComponents.tsx (the actual live renderer) only renders the
// new array shape through PortableText, falling back to a plain <p> for a
// string -- so an unmigrated callout still shows its text today, just
// without any formatting. Run this to actually get the rich-text upgrade
// onto existing posts.
//
// Usage:
//   node scripts/migrate-callout-text.mjs --dry-run   -- report what would change, write nothing
//                                                          (no token needed for this mode)
//   node scripts/migrate-callout-text.mjs              -- actually patch every matching post
//
// Requires SANITY_API_WRITE_TOKEN in .env.local for the real run. Reading/
// reporting doesn't need a token -- the dataset is public-read.
//
// Safe to re-run: only ever matches callout blocks whose `text` is still a
// string, patched by their existing `_key` via body[_key=="..."], never
// rewriting the whole body array -- so a block already migrated to an
// array is simply skipped on a second run, and unrelated edits made to the
// same post between the query and the patch can't be clobbered.

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
function stringToBlocks(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  // A callout with only whitespace as its text becomes a single empty
  // paragraph rather than zero blocks -- Sanity's editor expects at least
  // one block for an array field to open cleanly.
  const effective = paragraphs.length > 0 ? paragraphs : [""];
  return effective.map((paragraphText) => ({
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: randomKey(), text: paragraphText, marks: [] }],
  }));
}

const QUERY = `
  *[_type == "post" && count(body[_type == "callout" && defined(text) && text match "*"]) > 0]{
    _id,
    title,
    "slug": slug.current,
    "calloutBlocks": body[_type == "callout"]{_key, style, text}
  }
`;

async function main() {
  const posts = await client.fetch(QUERY);

  // The query's `text match "*"` only matches string fields (GROQ's
  // `match` operator only ever tests strings) -- posts whose callout
  // `text` is already an array pass through here with an empty-looking
  // match, so double-check per-block below rather than trusting the query
  // filter alone to have excluded every already-migrated block.
  const toMigrate = [];
  for (const post of posts) {
    const blocks = post.calloutBlocks.filter((b) => typeof b.text === "string");
    if (blocks.length > 0) toMigrate.push({ ...post, calloutBlocks: blocks });
  }

  if (toMigrate.length === 0) {
    console.log(
      "No posts found with a callout still using the old plain-text shape -- nothing to migrate.\n" +
        "Every callout is already using the new rich-text array shape."
    );
    return;
  }

  console.log(
    `${DRY_RUN ? "[dry run] " : ""}Found ${toMigrate.length} post document(s) with an old-style callout:\n`
  );

  let totalBlocks = 0;
  let skippedBlocks = 0;

  for (const post of toMigrate) {
    console.log(`- ${post.title || "(untitled)"}  (${post._id})`);
    if (post.slug) console.log(`  /blog/${post.slug}`);

    const patch = DRY_RUN ? null : client.patch(post._id);
    let patchedHere = 0;

    for (const block of post.calloutBlocks) {
      if (!SAFE_KEY.test(block._key || "")) {
        console.log(`  ⚠ skipping ${block.style || "note"} callout -- unexpected _key (${JSON.stringify(block._key)}), needs a manual look`);
        skippedBlocks++;
        continue;
      }
      const newText = stringToBlocks(block.text);
      console.log(`  [${block.style || "note"}]: ${block.text.length} chars -> ${newText.length} paragraph block(s)`);
      if (patch) patch.set({ [`body[_key=="${block._key}"].text`]: newText });
      patchedHere++;
      totalBlocks++;
    }

    if (patch && patchedHere > 0) await patch.commit();
    console.log("");
  }

  console.log(
    `${DRY_RUN ? "[dry run] Would migrate" : "Migrated"} ${totalBlocks} callout block(s) across ${toMigrate.length} post(s).` +
      (skippedBlocks ? `  (${skippedBlocks} block(s) skipped -- see ⚠ above)` : "")
  );

  if (DRY_RUN) {
    console.log("\nNothing was written. Re-run without --dry-run to actually apply these changes.");
    return;
  }

  const remainingPosts = await client.fetch(QUERY);
  const stillStringShaped = remainingPosts.flatMap((p) => p.calloutBlocks.filter((b) => typeof b.text === "string"));
  if (stillStringShaped.length === 0) {
    console.log("\nVerified: every callout block now uses the new rich-text array text shape.");
  } else {
    console.log(
      `\n⚠ ${stillStringShaped.length} callout block(s) still have plain-string text after this run -- ` +
        "check the ⚠ skip warnings above."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
