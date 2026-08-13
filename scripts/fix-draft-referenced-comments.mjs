// One-off/rerunnable repair: finds `comment` documents whose `post`
// reference points at a post's *draft* ID (`drafts.<slug>`) instead of its
// published one, and repoints them at the published ID.
//
// Why this exists: Asher hit "cannot be deleted as there are references to
// it from ..." trying to publish "wrote-these-in-2009" -- four legacy
// Facebook-comment imports (`facebook-comment-wrote-these-in-2009-0..3`)
// held a strong reference to `drafts.wrote-these-in-2009`, which blocks
// Sanity's publish mutation from deleting that draft document as part of
// the publish. Confirmed by reading commentType.ts directly: `post` is a
// plain (strong, not `weak: true`) reference, and `comment` documents are
// never meant to exist in draft state themselves -- moderation is done via
// the `status` field, not Sanity's draft/publish mechanism (see that
// file's own header comment) -- so a comment sitting at `drafts.<id>` at
// all, and referencing a post by its `drafts.<id>` too, both point at the
// same import having run while the target post was still unpublished and
// literally used whatever `_id` the query returned at the time, drafts
// prefix included.
//
// Scoped to whatever's actually broken, not just this one post -- the
// "578 comments need review" backlog suggests a bulk historical import,
// and there's no reason to assume only this post's comments got the
// drafts-prefixed reference.
//
// This only repoints the reference. It does NOT publish the comment
// documents themselves or change their moderation `status` -- that stays
// Asher's own call from the Comments tool, same as any other comment.
//
// Usage:
//   node scripts/fix-draft-referenced-comments.mjs --dry-run   -- report only, write nothing
//   node scripts/fix-draft-referenced-comments.mjs              -- actually patch every match
//
// Requires SANITY_API_WRITE_TOKEN in .env.local for BOTH modes, unlike this
// repo's other migration scripts -- draft documents aren't visible on the
// public-read perspective, so even the dry-run report needs an
// authenticated, raw-perspective client to see them at all.

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
if (!token) {
  console.error(
    "Missing SANITY_API_WRITE_TOKEN.\n" +
      "Needed even for --dry-run here: draft documents aren't on the public-read perspective.\n" +
      "Add it to .env.local (same token your Vercel deployment uses for SANITY_API_WRITE_TOKEN), then run again."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-22",
  token,
  useCdn: false,
  perspective: "raw",
});

const DRAFTS_PREFIX = "drafts.";

const QUERY = `
  *[_type == "comment" && defined(post._ref) && string::startsWith(post._ref, "${DRAFTS_PREFIX}")]{
    _id, name, createdAt, "postRef": post._ref
  }
`;

async function main() {
  const broken = await client.fetch(QUERY);

  if (broken.length === 0) {
    console.log("No comment documents referencing a post by its draft ID -- nothing to fix.");
    return;
  }

  console.log(`${DRY_RUN ? "[dry run] " : ""}Found ${broken.length} comment(s) referencing a post's draft ID:\n`);

  for (const comment of broken) {
    const fixedRef = comment.postRef.slice(DRAFTS_PREFIX.length);
    console.log(`- "${comment.name || "(no name)"}" (${comment._id}), submitted ${comment.createdAt || "unknown date"}`);
    console.log(`  post: ${comment.postRef}  ->  ${fixedRef}`);
    if (!DRY_RUN) {
      await client.patch(comment._id).set({ "post._ref": fixedRef }).commit();
    }
  }

  console.log(`\n${DRY_RUN ? "[dry run] Would fix" : "Fixed"} ${broken.length} comment(s).`);

  if (DRY_RUN) {
    console.log("\nNothing was written. Re-run without --dry-run to actually apply these changes.");
    return;
  }

  const remaining = await client.fetch(QUERY);
  if (remaining.length === 0) {
    console.log("\nVerified: no comment documents still reference a post by its draft ID.");
  } else {
    console.log(`\n⚠ ${remaining.length} comment(s) still reference a draft post ID after this run -- needs a manual look.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
