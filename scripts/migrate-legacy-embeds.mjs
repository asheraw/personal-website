// One-off/rerunnable migration: rewrites old "YouTube embed (legacy)" and
// "Instagram embed (legacy)" blocks (schema types `youtube` /
// `instagramEmbed`, see src/sanity/schemaTypes/blockContentType.ts) into
// the newer unified `embed` type that auto-detects the platform from the
// URL. Purely a `_type` rename on each matching block -- both legacy types
// already store the exact same single `url` field the new type does, so
// nothing about the embed itself (which video/post it shows) changes.
//
// Why this exists: the legacy types are still registered in the schema
// *only* so posts that already used them keep rendering and stay editable.
// Once every post has been migrated to the new `embed` type, those two
// legacy types can be deleted from blockContentType.ts for good (removing
// a type while content still references it turns those blocks into
// "Unknown type" in the Studio editor).
//
// Usage:
//   node scripts/migrate-legacy-embeds.mjs --dry-run   -- report what would change, write nothing
//                                                          (no token needed for this mode)
//   node scripts/migrate-legacy-embeds.mjs              -- actually patch every matching post
//
// Requires SANITY_API_WRITE_TOKEN in .env.local (same token used by
// src/sanity/lib/write-client.ts) for the real run. Reading/reporting
// doesn't need a token -- same as the site's own read client
// (src/sanity/lib/client.ts), the dataset is public-read.
//
// Safe to re-run: each patch only touches the specific block(s) by their
// existing `_key`, via body[_key=="..."]._type -- never rewrites the whole
// body array, so it can't race with or clobber unrelated edits made to the
// same post between the query and the patch. Draft and published versions
// of a post are separate Sanity documents and are migrated independently,
// since they can genuinely differ (e.g. a post being actively edited).

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

// Read access doesn't need a token -- the production dataset is public-read
// (same as src/sanity/lib/client.ts). Only committing patches needs one.
const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-22",
  token: DRY_RUN ? undefined : token,
  useCdn: false,
});

const LEGACY_TYPES = ["youtube", "instagramEmbed"];

// Sanity's own generated _key values are always plain alphanumeric --
// this is just a defensive check before interpolating one into a GROQ-style
// patch path, so a malformed/unexpected key can never do anything other
// than get skipped and reported.
const SAFE_KEY = /^[a-zA-Z0-9]+$/;

const QUERY = `
  *[_type == "post" && count(body[_type in $legacyTypes]) > 0]{
    _id,
    title,
    "slug": slug.current,
    "legacyBlocks": body[_type in $legacyTypes]{_key, _type, url}
  }
`;

async function main() {
  const posts = await client.fetch(QUERY, { legacyTypes: LEGACY_TYPES });

  if (posts.length === 0) {
    console.log(
      "No posts found with legacy youtube/instagramEmbed blocks -- nothing to migrate.\n" +
        "Safe to delete the `youtube` and `instagramEmbed` array members from\n" +
        "src/sanity/schemaTypes/blockContentType.ts now, if that hasn't been done yet."
    );
    return;
  }

  console.log(
    `${DRY_RUN ? "[dry run] " : ""}Found ${posts.length} post document(s) with legacy embed blocks:\n`
  );

  let totalBlocks = 0;
  let skippedBlocks = 0;

  for (const post of posts) {
    console.log(`- ${post.title || "(untitled)"}  (${post._id})`);
    if (post.slug) console.log(`  /blog/${post.slug}`);

    const patch = DRY_RUN ? null : client.patch(post._id);
    let patchedHere = 0;

    for (const block of post.legacyBlocks) {
      const platform = block._type === "youtube" ? "YouTube" : "Instagram";
      if (!SAFE_KEY.test(block._key || "")) {
        console.log(`  ⚠ skipping a ${platform} block with an unexpected _key (${JSON.stringify(block._key)}) -- needs a manual look`);
        skippedBlocks++;
        continue;
      }
      console.log(`  ${platform} embed -> embed  (${block.url || "(no url set)"})`);
      if (patch) patch.set({ [`body[_key=="${block._key}"]._type`]: "embed" });
      patchedHere++;
      totalBlocks++;
    }

    if (patch && patchedHere > 0) await patch.commit();
    console.log("");
  }

  console.log(
    `${DRY_RUN ? "[dry run] Would migrate" : "Migrated"} ${totalBlocks} block(s) across ${posts.length} post(s).` +
      (skippedBlocks ? `  (${skippedBlocks} block(s) skipped -- see ⚠ above)` : "")
  );

  if (DRY_RUN) {
    console.log("\nNothing was written. Re-run without --dry-run to actually apply these changes.");
    return;
  }

  const remaining = await client.fetch(`count(*[_type == "post" && count(body[_type in $legacyTypes]) > 0])`, {
    legacyTypes: LEGACY_TYPES,
  });
  if (remaining === 0) {
    console.log(
      "\nVerified: no posts reference the legacy embed types anymore.\n" +
        "Safe to delete the `youtube` and `instagramEmbed` array members from\n" +
        "src/sanity/schemaTypes/blockContentType.ts now."
    );
  } else {
    console.log(
      `\n⚠ ${remaining} post(s) still reference a legacy embed type after this run -- ` +
        "check the ⚠ skip warnings above before deleting anything from the schema."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
