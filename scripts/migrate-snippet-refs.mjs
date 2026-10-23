// One-off, rerunnable: converts Reusable Snippet blocks in post/page bodies from the old
// shape  {_type:'snippetRef', _ref:'<id>'}  (a bare reference block) to the new object shape
//  {_type:'snippetRef', snippet:{_type:'reference', _ref:'<id>'}}.
//
// Why: two bare-reference blocks in the same body were linked in Studio (changing one changed
// the other). See the comment on `snippetRef` in src/sanity/schemaTypes/blockContentType.ts.
//
// The site's queries read BOTH shapes, so running this late is safe; Studio just shows an
// old-shape block as invalid until it is converted.
//
//   node scripts/migrate-snippet-refs.mjs            dry run: lists what would change
//   node scripts/migrate-snippet-refs.mjs --drafts   convert draft documents only
//   node scripts/migrate-snippet-refs.mjs --all      convert drafts and published documents
//
// Converting PUBLISHED documents before the new site code is deployed would hide those snippets
// on the live site (old code only understands the old shape) -- use --drafts until then.
import { createClient } from "@sanity/client";
import { config } from "dotenv";

config({ path: ".env.local" });
const mode = process.argv.includes("--all") ? "all" : process.argv.includes("--drafts") ? "drafts" : "dry";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const docs = await client.fetch(
  `*[_type in ["post","page"] && count(body[_type == "snippetRef" && defined(_ref)]) > 0]{_id, title, "blocks": body[_type == "snippetRef" && defined(_ref)]{_key, _ref}}`,
);

for (const doc of docs) {
  const isDraft = doc._id.startsWith("drafts.");
  const willChange = mode === "all" || (mode === "drafts" && isDraft);
  console.log(`${willChange ? "CONVERT" : "skip   "} ${doc._id.slice(0, 26)} ${isDraft ? "(draft)    " : "(published)"} ${doc.title} -- ${doc.blocks.length} block(s)`);
  if (!willChange) continue;
  let patch = client.patch(doc._id);
  for (const b of doc.blocks) {
    patch = patch.set({ [`body[_key=="${b._key}"]`]: { _type: "snippetRef", _key: b._key, snippet: { _type: "reference", _ref: b._ref } } });
  }
  await patch.commit();
}
if (mode === "dry") console.log("\nDry run. Add --drafts or --all to apply.");
