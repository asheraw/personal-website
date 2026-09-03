// One-off/rerunnable migration: carries the old `legacyFacebookThreadUrl`
// string field (schema type `post`, see src/sanity/schemaTypes/postType.ts)
// over into the new `socialLinks` array as a single Facebook entry, then
// unsets the old field. Part of the Distribution Switchboard's Facebook
// skeleton (see tasks/todo.md Task 2) -- `socialLinks` replaces
// `legacyFacebookThreadUrl` with a `{platform, url}` shape that supports
// more than just Facebook.
//
// Usage:
//   node scripts/migrate-legacy-facebook-thread-url.mjs --dry-run   -- report what would change, write nothing
//   node scripts/migrate-legacy-facebook-thread-url.mjs              -- actually patch every matching post
//
// Requires SANITY_API_WRITE_TOKEN in .env.local for the real run. Reading/
// reporting doesn't need a token -- the dataset is public-read.
//
// Safe to re-run: only matches posts that still have legacyFacebookThreadUrl
// set AND don't already have a Facebook entry in socialLinks -- so a post
// already migrated (or one where a Facebook link was added by hand) is
// skipped on a second run, never duplicated.

import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

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

const QUERY = `
  *[_type == "post" && defined(legacyFacebookThreadUrl) && !defined(socialLinks[platform == "Facebook"][0])]{
    _id,
    title,
    "slug": slug.current,
    legacyFacebookThreadUrl
  }
`;

async function main() {
  const posts = await client.fetch(QUERY);

  if (posts.length === 0) {
    console.log(
      "No posts found with a legacyFacebookThreadUrl still needing migration -- nothing to do.\n" +
        "Safe to confirm the `legacyFacebookThreadUrl` field is unused now."
    );
    return;
  }

  console.log(`${DRY_RUN ? "[dry run] " : ""}Found ${posts.length} post(s) to migrate:\n`);

  for (const post of posts) {
    console.log(`- ${post.title || "(untitled)"}  (${post._id})`);
    if (post.slug) console.log(`  /blog/${post.slug}`);
    console.log(`  ${post.legacyFacebookThreadUrl} -> socialLinks[Facebook]`);

    if (!DRY_RUN) {
      await client
        .patch(post._id)
        .setIfMissing({ socialLinks: [] })
        .append("socialLinks", [
          { _type: "socialLink", _key: crypto.randomUUID(), platform: "Facebook", url: post.legacyFacebookThreadUrl },
        ])
        .unset(["legacyFacebookThreadUrl"])
        .commit();
    }
    console.log("");
  }

  console.log(`${DRY_RUN ? "[dry run] Would migrate" : "Migrated"} ${posts.length} post(s).`);

  if (DRY_RUN) {
    console.log("\nNothing was written. Re-run without --dry-run to actually apply these changes.");
    return;
  }

  const remaining = await client.fetch(`count(*[_type == "post" && defined(legacyFacebookThreadUrl)])`);
  if (remaining === 0) {
    console.log("\nVerified: no posts reference legacyFacebookThreadUrl anymore.");
  } else {
    console.log(`\n⚠ ${remaining} post(s) still have legacyFacebookThreadUrl set -- check above before assuming this is done.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
