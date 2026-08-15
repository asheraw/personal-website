// One-time backlog clearer for the Facebook-import drafts: for every draft
// post imported by import-facebook-posts.mjs that's still missing its
// featured image, SEO title, excerpt, and category, this generates all of
// it automatically and leaves the post as a draft for Asher's final skim
// before he publishes it himself. Nothing here ever publishes a post.
//
// Requires the Next dev server running locally (npm run dev) -- this calls
// the site's own /api/ai/generate-featured-image and /api/ai/suggest-seo
// routes over HTTP rather than duplicating their Gemini logic, so there's
// exactly one place either feature's behavior lives, whether triggered from
// Studio by hand or from this script.
//
// Usage:
//   npm run dev                                  (in another terminal/tab)
//   node scripts/process-facebook-backlog.mjs
//
// Safe to re-run: progress is checkpointed to
// scripts/local-facebook-backlog-progress.json (gitignored via the local-*
// pattern) after every post, so a run that stops partway -- a Gemini
// free-tier quota wall, a network blip, Ctrl+C -- picks up again from
// wherever it left off instead of redoing finished posts or regenerating
// images that already look fine.

import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "facebook-imports");
const progressFile = path.join(__dirname, "local-facebook-backlog-progress.json");

loadEnv({ path: path.join(repoRoot, ".env.local") });
loadEnv({ path: path.join(repoRoot, ".env") });

const SERVER = process.env.BACKLOG_SERVER_URL || "http://localhost:3000";
const DELAY_MS = 4000; // pacing between posts -- not a burst against Gemini's per-minute limit
const CATEGORY_TITLE = "Authenticity";
// Gemini's image models (Nano Banana and every variant tried) return a
// hard `limit: 0` free-tier quota on this project -- confirmed by testing
// every image-capable model this key can see, not a burst/rate issue.
// Image generation needs a billed Gemini API project; text generation
// (gemini-3.6-flash, used for SEO/excerpt/tags) already works fine on the
// free tier and isn't affected. Set SKIP_IMAGE=1 to run the SEO/excerpt/
// tags/category half of the pipeline on its own while that's sorted out --
// the image step for each post is picked up automatically on a later run
// once it's unblocked, since eligibility is re-checked against each post's
// actual current field state, not a one-shot flag.
const SKIP_IMAGE = process.env.SKIP_IMAGE === "1";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET / SANITY_API_WRITE_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2026-07-22", token, useCdn: false, perspective: "raw" });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadProgress() {
  if (!existsSync(progressFile)) return { done: [], failed: [] };
  try {
    return JSON.parse(readFileSync(progressFile, "utf8"));
  } catch {
    return { done: [], failed: [] };
  }
}

function saveProgress(progress) {
  writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

// Same frontmatter/comments-split shape as import-facebook-posts.mjs, kept
// deliberately minimal here -- this only needs readable plain text to feed
// the AI routes as `bodyText`, not a faithful re-derivation of the actual
// stored Portable Text (the routes already accept plain markdown-ish text
// fine, same as what the Studio actions send after their own PT-to-text
// conversion).
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter block found");
  return { body: match[2] };
}

function extractBodyText(raw) {
  const { body } = parseFrontmatter(raw);
  const lines = body.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^##\s+Comments/i.test(l.trim()));
  const mainLines = idx === -1 ? lines : lines.slice(0, idx);
  return mainLines.join("\n").trim();
}

// Checks the real HTTP status first (both AI routes now return a genuine
// 429 for a rate/quota wall, not the generic 500 they used to flatten
// everything into) -- the text match is just a fallback in case something
// upstream ever changes shape again.
function isRateLimitError(err) {
  if (err && err.status === 429) return true;
  const message = err instanceof Error ? err.message : String(err || "");
  return /429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(message);
}

async function callRoute(pathName, body) {
  const res = await fetch(`${SERVER}${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `${pathName} failed with ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function main() {
  try {
    await fetch(SERVER, { method: "GET" });
  } catch {
    console.error(`Can't reach ${SERVER} -- start the dev server first with "npm run dev" in another terminal, then re-run this script.`);
    process.exit(1);
  }

  const categoryId = await client.fetch(`*[_type == "category" && title == $t][0]._id`, { t: CATEGORY_TITLE });
  if (!categoryId) {
    console.error(`Couldn't find a "${CATEGORY_TITLE}" category in Sanity -- create it first.`);
    process.exit(1);
  }

  const allTargets = await client.fetch(
    `*[_type == "post" && _id in path("drafts.**") && _id match "*facebook-*" && (!defined(mainImage) || !defined(seoTitle))]{_id, title, "slug": slug.current, "hasImage": defined(mainImage), "hasSeo": defined(seoTitle)} | order(title asc)`
  );

  // Eligibility is re-derived from each post's actual current fields, not
  // a one-shot flag -- so a post that already got its SEO half applied in
  // an earlier SKIP_IMAGE=1 run, or that the parallel Studio session
  // already touched by hand, is picked up correctly either way: skip
  // whichever half it already has, do whichever half it's still missing.
  const remaining = allTargets.filter((t) => (SKIP_IMAGE ? !t.hasSeo : !t.hasImage || !t.hasSeo));

  if (remaining.length === 0) {
    console.log(SKIP_IMAGE ? "Nothing to do -- every draft already has SEO title/excerpt/tags." : "Nothing to do -- every draft already has both an image and SEO fields.");
    return;
  }

  const progress = loadProgress();
  console.log(`${remaining.length} drafts still need ${SKIP_IMAGE ? "SEO title/excerpt/tags/category" : "the image and/or SEO treatment"}.`);

  let processed = 0;
  for (const post of remaining) {
    const fileSlug = post.slug || post._id.replace(/^drafts\./, "").replace(/^facebook-/, "");
    const filePath = path.join(sourceDir, `${fileSlug}.md`);
    let bodyText;
    try {
      bodyText = extractBodyText(readFileSync(filePath, "utf8"));
    } catch {
      console.error(`SKIP "${post.title}" -- couldn't find/read facebook-imports/${fileSlug}.md`);
      progress.failed.push({ id: post._id, title: post.title, error: "source .md file not found" });
      saveProgress(progress);
      continue;
    }

    try {
      console.log(`[${processed + 1}/${remaining.length}] ${post.title}`);

      if (!SKIP_IMAGE && !post.hasImage) {
        await callRoute("/api/ai/generate-featured-image", {
          title: post.title,
          bodyText,
          slug: fileSlug,
          postId: post._id,
        });
        console.log("  image attached");
      }

      if (!post.hasSeo) {
        const seo = await callRoute("/api/ai/suggest-seo", { title: post.title, bodyText, slug: fileSlug });
        await client
          .patch(post._id)
          .set({
            seoTitle: seo.seoTitles?.[0],
            excerpt: seo.excerpts?.[0],
            tags: seo.tags || [],
            categories: [{ _type: "reference", _ref: categoryId, _key: Math.random().toString(36).slice(2, 10) }],
            primaryCategory: { _type: "reference", _ref: categoryId },
          })
          .commit();
        console.log("  SEO title/excerpt/tags/category applied");
      }

      progress.done.push(post._id);
      saveProgress(progress);
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isRateLimitError(err)) {
        console.log(`\nHit a Gemini rate limit / quota wall on "${post.title}": ${message}`);
        console.log("Stopping here rather than burning through failures. Free-tier daily quotas reset at midnight Pacific Time --");
        console.log("just re-run this script after that; it'll pick up exactly where it left off.");
        break;
      }
      console.error(`  FAILED: ${message}`);
      progress.failed = progress.failed.filter((f) => f.id !== post._id);
      progress.failed.push({ id: post._id, title: post.title, error: message });
      saveProgress(progress);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone this run: ${processed}/${remaining.length}.`);
  if (progress.failed.length > 0) {
    console.log(`Failed (not rate-limit related, needs a manual look): ${progress.failed.map((f) => f.title).join(", ")}`);
  }
}

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION -- exiting:", err);
  process.exit(1);
});

main().catch((err) => {
  console.error("main() FAILED:", err);
  process.exit(1);
});
