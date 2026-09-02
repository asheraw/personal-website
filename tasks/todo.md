# Task List: Distribution Switchboard — Facebook Skeleton

See `tasks/plan.md` for architecture decisions, risks, and open questions.

## Task 1: Validate Apify can pull Facebook personal-profile comments

**Description:** Research spike, not shipped code. Find a real Apify Actor capable of pulling comments
from a Facebook *personal profile* post (not a Page — the harder, less-supported case), run it against
one real post URL, and record what actually comes back and what it costs. This is the single riskiest,
least-validated assumption in the whole distribution-switchboard direction — everything in Phase 3
depends on this working.

**Acceptance criteria:**
- [ ] A specific Apify Actor is identified and named (not just "some Facebook scraper")
- [ ] It's been run once against a real, already-public post on Asher's Facebook profile
- [ ] The actual output shape (fields, nesting, reply structure) is documented
- [ ] The actual cost for that one run is recorded

**Verification:**
- [ ] Manual check: real dataset output reviewed and pasted/summarized in this task's notes, not assumed
      from the Actor's README alone

**Dependencies:** None

**Files likely touched:** None (research only; findings feed Task 5/6's design)

**Estimated scope:** Small (no files, one research session)

---

## Task 2: Add `socialLinks` array to `postType.ts`

**Description:** Replace the single `legacyFacebookThreadUrl` string field with a `socialLinks` array of
`{platform, url}` objects. `platform` is a fixed dropdown (Facebook, Instagram, TikTok, LinkedIn, X,
Threads, YouTube) rather than freeform text, since later tasks match platform → Apify Actor / generation
logic in code and a mistyped freeform value would silently fail to match anything.

**Acceptance criteria:**
- [ ] `socialLinks` field exists on `postType.ts`, array of objects with `platform` (dropdown, fixed list)
      and `url` (validated as a URL)
- [ ] `legacyFacebookThreadUrl` is removed only after confirming nothing else reads it (see Files below)
- [ ] Existing posts that had a value in `legacyFacebookThreadUrl` aren't silently data-lost — decide
      whether to write a small one-time migration script or accept manual re-entry, and note the choice

**Verification:**
- [ ] `grep -rn "legacyFacebookThreadUrl"` across `src/` returns only the schema definition itself before
      removing it (the field's own comment claims this, but verify directly rather than trusting it)
- [ ] Studio schema loads with no errors; a real test post can add a Facebook entry to `socialLinks` and
      save successfully

**Dependencies:** None

**Files likely touched:**
- `src/sanity/schemaTypes/postType.ts`

**Estimated scope:** Small (1 file, plus a possible one-off migration script if existing data needs it)

---

## Task 3: Add `connectedAccounts` array to `siteSettingsType.ts`

**Description:** Site-wide, one-time registry of Asher's actual accounts (one row per platform: platform
dropdown + handle/URL), so per-post `socialLinks` entries can eventually reference a known account instead
of the handle being retyped per post. For this first slice, this just needs to exist and be editable —
wiring it into per-post validation/autofill is a later-platform concern, not part of the Facebook skeleton.

**Acceptance criteria:**
- [ ] `connectedAccounts` array field exists on the `siteSettingsType.ts` singleton, same `platform`
      dropdown + `url`/handle shape as Task 2
- [ ] Asher's real Facebook profile URL can be entered and saved

**Verification:**
- [ ] Studio schema loads with no errors; Site Settings singleton saves successfully with a real Facebook
      entry

**Dependencies:** None (can run in parallel with Task 2)

**Files likely touched:**
- `src/sanity/schemaTypes/siteSettingsType.ts`

**Estimated scope:** Small (1 file)

---

## Task 4: Surface Facebook-specific drafted/used status in the dashboard

**Description:** `DistributionDashboardTool.tsx` currently shows one bundled "Social copy drafted" badge
per post (true if X/LinkedIn/Facebook were EVER drafted together, since `suggest-social` generates all
three in one call). Before writing any new UI, check whether `aiOutputLog.usedActions`' logged strings
(written from `SuggestSocialCopyShared.tsx`'s copy-button handlers) already distinguish "copied Facebook
caption" from "copied X caption" — if so, this is a parsing/display task; if not, decide whether a small
schema addition is actually needed (see `plan.md`'s Risks table).

**Acceptance criteria:**
- [ ] Exact `usedActions` string format for a Facebook copy click is confirmed from real code/data, not
      assumed
- [ ] The dashboard shows Facebook's drafted/used status distinctly from X/LinkedIn's, for a real post
- [ ] No change to the existing bundled generation behavior (X/LinkedIn/Facebook still generate together
      in this slice — only the *display* becomes per-platform, not the generation)

**Verification:**
- [ ] Manual check: draft social copy for a real test post, copy only the Facebook option, confirm the
      dashboard reflects Facebook specifically as used while X/LinkedIn still show undrafted/unused

**Dependencies:** Task 2 (so the dashboard has a real `socialLinks` Facebook URL to eventually link out to)

**Files likely touched:**
- `src/sanity/components/DistributionDashboardTool.tsx`
- Possibly `src/sanity/components/SuggestSocialCopyShared.tsx` or `src/app/api/ai/log-usage/route.ts` if
  the existing logged strings turn out not to be granular enough

**Estimated scope:** Small–Medium (1-3 files, depending on the verification finding above)

---

## Task 5: API route to pull Facebook comments via Apify

**Description:** New server-side route that takes a post's `socialLinks` Facebook URL, calls the Actor
validated in Task 1 via Apify's REST API (server-side token, never exposed client-side), and normalizes
the raw Actor output into the same shape the existing `.txt`-based Facebook importer already parses into
(name, message, nesting level, timestamp where available) — adapting the shape if Task 1 found it differs.

**Acceptance criteria:**
- [ ] Route accepts a post identifier, looks up its Facebook `socialLinks` entry, triggers the Apify Actor
- [ ] Output is normalized to the existing importer's comment shape
- [ ] Apify API token is read from a server-side env var, never returned to the client
- [ ] Clear, honest error response if the post has no Facebook link saved yet, or the Actor run fails

**Verification:**
- [ ] Manual check: call the route for one real post with a known Facebook URL, confirm normalized
      comments come back correctly shaped
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1 (Actor choice + output shape), Task 2 (`socialLinks` field to read from)

**Files likely touched:**
- `src/app/api/ai/pull-facebook-comments/route.ts` (new)

**Estimated scope:** Medium (1-2 files, real external API integration)

---

## Task 6: Extract shared comment dedupe/import logic

**Description:** The historical `.txt`-based Facebook importer already solved matching-by-name+message,
preserving `approved` status on already-live comments, and avoiding duplicate imports (RUNBOOK.md,
"Facebook comment re-extraction" and its follow-up entries). Pull that matching/dedupe logic out of the
one-off import script into a shared function both the old script and the new route can call, rather than
writing a second, slightly-different copy of the same logic.

**Acceptance criteria:**
- [ ] Dedupe/match/preserve-approved-status logic lives in one shared, importable function
- [ ] The new route (Task 5's output) can call it directly
- [ ] The existing one-off import script still works after the extraction (not broken by the refactor)

**Verification:**
- [ ] Manual check: run the shared function against a small known test case (a post with some already-
      `approved` comments plus new ones from Task 5's output) and confirm approved status is preserved and
      no duplicates are created

**Dependencies:** Task 5 (needs real normalized output to test against)

**Files likely touched:**
- The existing Facebook import script (wherever the matching logic currently lives)
- `src/app/api/ai/pull-facebook-comments/route.ts`

**Estimated scope:** Medium (2-3 files — this is a refactor-under-test, not new logic)

---

## Task 7: "Pull comments" button in the dashboard

**Description:** Wire Task 5's route into `DistributionDashboardTool.tsx` as a per-post button (Facebook
column), showing last-pulled timestamp and comment count, matching the existing "Share this post" panel's
UI pattern (loading state, error handling) rather than inventing a new interaction style.

**Acceptance criteria:**
- [ ] Button visible only when a post has a Facebook `socialLinks` entry
- [ ] Clicking it calls Task 5's route, shows a loading state, then success (count pulled) or a clear error
- [ ] Last-pulled timestamp persists and displays on next dashboard load

**Verification:**
- [ ] Manual check: full end-to-end click-through against one real post; confirm new comments are visible
      on the live post page afterward, confirm re-clicking doesn't duplicate them
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 4 (dashboard layout), Task 5, Task 6

**Files likely touched:**
- `src/sanity/components/DistributionDashboardTool.tsx`

**Estimated scope:** Small (1 file — UI only, logic already lives in Task 5/6)

---

## Checkpoint: After Task 3
- [ ] Studio schema deploys cleanly
- [ ] `socialLinks` and `connectedAccounts` both editable against real documents
- [ ] Apify spike (Task 1) result reviewed — go/no-go before continuing to Phase 3

## Checkpoint: Complete
- [ ] Full click-through works on one real post: draft Facebook caption, pull Facebook comments, both
      statuses visible correctly in the dashboard
- [ ] `npm run build` succeeds
- [ ] Review with Asher before starting a second platform (Threads is the next-cheapest repeat of this
      pattern, per `plan.md`)
