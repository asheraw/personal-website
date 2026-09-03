# Task List: Distribution Switchboard — Facebook Skeleton

See `tasks/plan.md` for architecture decisions, risks, and open questions.

## Task 1: Validate Apify can pull Facebook personal-profile comments — DONE (2026-09-03)

**Description:** Research spike, not shipped code. Find a real Apify Actor capable of pulling comments
from a Facebook *personal profile* post (not a Page — the harder, less-supported case), run it against
one real post URL, and record what actually comes back and what it costs. This is the single riskiest,
least-validated assumption in the whole distribution-switchboard direction — everything in Phase 3
depends on this working.

**Acceptance criteria:**
- [x] A specific Apify Actor is identified and named (not just "some Facebook scraper")
- [x] It's been run once against a real, already-public post on Asher's Facebook profile
- [x] The actual output shape (fields, nesting, reply structure) is documented
- [x] The actual cost for that one run is recorded

**Verification:**
- [x] Manual check: real dataset output reviewed and pasted/summarized in this task's notes, not assumed
      from the Actor's README alone

**Dependencies:** None

**Files likely touched:** None (research only; findings feed Task 5/6's design)

**Estimated scope:** Small (no files, one research session)

**Findings:**

- **Actor:** `apify/facebook-comments-scraper` (official Apify, not a third party). 41.5K total users,
  4.74★/89 ratings — the clear standout among ~15 Facebook-comment Actors surveyed. Pay-per-event
  pricing: $0.0025/comment + $0.001 flat per run (free tier; drops at higher usage tiers).
- **Test run:** Called against `https://www.facebook.com/share/p/14r3Hq66M4J/` — a real, public post on
  Asher's personal profile (the "Even My Discipline Was an Escape" post). Run `hwbt6yKlW48EeIbH6`,
  succeeded in 7.9s, returned **11 items** (1 top-level comment thread from Asher himself, plus 3 more
  top-level comments with nested replies up to depth 2). Verified the content is real — text matches
  the actual asheraw.com blog post link, real names (Jeryl Chandler, Alvin Huang, Vanya Stoimenova), real
  timestamps spanning Aug 10 – Sep 1, 2026.
  Actual cost: 11 comments × $0.0025 + $0.001 start = **$0.0285** for the run.
- **Output shape:** 50 fields per row (flat, one row per comment/reply — not a nested tree). Key fields:
  `id` (unique per-row, base64), `commentId` (thread-root id — **shared across a top-level comment and
  all its replies, not unique per row**), `replyToCommentId`, `threadingDepth` (0/1/2, up to 3 levels
  per the docs), `text`, `date`, `likesCount`, `profileName`/`profileId`/`profileUrl`, plus nested
  `author.*` and `parentComment.*`/`parentReply.*` objects.
  **Important for Task 6 (dedupe logic):** match/dedupe on `id`, not `commentId` — `commentId` collides
  across a whole thread.
- **Go/no-go: GO.** Works cleanly on a personal-profile post (the harder case this task set out to
  test), no login/cookies required, cheap at this volume, real threaded-reply data came back correctly
  shaped for the existing `.txt` importer's name+message+nesting model.

---

## Task 2: Add `socialLinks` array to `postType.ts` — DONE (2026-09-03)

**Description:** Replace the single `legacyFacebookThreadUrl` string field with a `socialLinks` array of
`{platform, url}` objects. `platform` is a fixed dropdown (Facebook, Instagram, TikTok, LinkedIn, X,
Threads, YouTube) rather than freeform text, since later tasks match platform → Apify Actor / generation
logic in code and a mistyped freeform value would silently fail to match anything.

**Acceptance criteria:**
- [x] `socialLinks` field exists on `postType.ts`, array of objects with `platform` (dropdown, fixed list)
      and `url` (validated as a URL)
- [x] `legacyFacebookThreadUrl` is removed only after confirming nothing else reads it (see Files below)
- [x] Existing posts that had a value in `legacyFacebookThreadUrl` aren't silently data-lost — decide
      whether to write a small one-time migration script or accept manual re-entry, and note the choice

**Verification:**
- [x] `grep -rn "legacyFacebookThreadUrl"` across `src/` returns only the schema definition itself before
      removing it (the field's own comment claims this, but verify directly rather than trusting it)
- [x] Studio schema loads with no errors (verified via `tsc --noEmit`: no errors in `postType.ts` from
      this change); a real test post can add a Facebook entry to `socialLinks` and save successfully
      (verified via the write client directly, not manually through the Studio UI — see note below)

**Dependencies:** None

**Files likely touched:**
- `src/sanity/schemaTypes/postType.ts`

**Estimated scope:** Small (1 file, plus a possible one-off migration script if existing data needs it)

**Outcome:**

- `grep -rn "legacyFacebookThreadUrl" src/` returned only the schema definition itself — safe to remove.
- **50 posts had real data** in `legacyFacebookThreadUrl` (not zero, as the field's own "safe to delete"
  comment implied) — a one-time migration was needed, not manual re-entry. Wrote
  `scripts/migrate-legacy-facebook-thread-url.mjs` (same dry-run/rerunnable pattern as the project's other
  migration scripts), ran it, and verified: all 50 posts now carry `socialLinks: [{platform: "Facebook",
  url: <original value>}]`, `legacyFacebookThreadUrl` unset on every one, `count(*[defined
  (legacyFacebookThreadUrl)]) == 0` confirmed after the run.
- Note on verification: schema correctness was checked via `tsc --noEmit` (clean) and by writing/reading
  a real document through the Sanity client directly, not by clicking through the Studio UI in a browser
  — worth a quick manual look in Studio before this ships, since the UI itself (the dropdown, the object
  preview) hasn't been eyeballed.

---

## Task 3: Add `connectedAccounts` array to `siteSettingsType.ts` — DONE (2026-09-03)

**Description:** Site-wide, one-time registry of Asher's actual accounts (one row per platform: platform
dropdown + handle/URL), so per-post `socialLinks` entries can eventually reference a known account instead
of the handle being retyped per post. For this first slice, this just needs to exist and be editable —
wiring it into per-post validation/autofill is a later-platform concern, not part of the Facebook skeleton.

**Acceptance criteria:**
- [x] `connectedAccounts` array field exists on the `siteSettingsType.ts` singleton, same `platform`
      dropdown + `url`/handle shape as Task 2
- [x] Asher's real Facebook profile URL can be entered and saved

**Verification:**
- [x] Studio schema loads with no errors; Site Settings singleton saves successfully with a real Facebook
      entry

**Dependencies:** None (can run in parallel with Task 2)

**Files likely touched:**
- `src/sanity/schemaTypes/siteSettingsType.ts`

**Estimated scope:** Small (1 file)

**Outcome:**

- Added a `connectedAccounts` array (same `{platform, url}` shape as Task 2's `socialLinks`) under a new
  "Connected accounts" fieldset on the `siteSettings` singleton.
- Saved a real entry: `https://www.facebook.com/asheraw` — pulled directly from the `profileUrl` field on
  Asher's own comments in Task 1's real Apify test data, not guessed. Verified round-trip: read back from
  the `siteSettings` document after the write, matches exactly.
- Same caveat as Task 2: verified via the write client and a direct read, not by clicking through the
  Studio UI in a browser.

---

## Task 4: Surface Facebook-specific drafted/used status in the dashboard — DONE (2026-09-03)

**Description:** `DistributionDashboardTool.tsx` currently shows one bundled "Social copy drafted" badge
per post (true if X/LinkedIn/Facebook were EVER drafted together, since `suggest-social` generates all
three in one call). Before writing any new UI, check whether `aiOutputLog.usedActions`' logged strings
(written from `SuggestSocialCopyShared.tsx`'s copy-button handlers) already distinguish "copied Facebook
caption" from "copied X caption" — if so, this is a parsing/display task; if not, decide whether a small
schema addition is actually needed (see `plan.md`'s Risks table).

**Acceptance criteria:**
- [x] Exact `usedActions` string format for a Facebook copy click is confirmed from real code/data, not
      assumed
- [x] The dashboard shows Facebook's drafted/used status distinctly from X/LinkedIn's, for a real post
- [x] No change to the existing bundled generation behavior (X/LinkedIn/Facebook still generate together
      in this slice — only the *display* becomes per-platform, not the generation)

**Verification:**
- [x] Manual check: draft social copy for a real test post, copy only the Facebook option, confirm the
      dashboard reflects Facebook specifically as used while X/LinkedIn still show undrafted/unused

**Dependencies:** Task 2 (so the dashboard has a real `socialLinks` Facebook URL to eventually link out to)

**Files likely touched:**
- `src/sanity/components/DistributionDashboardTool.tsx`
- Possibly `src/sanity/components/SuggestSocialCopyShared.tsx` or `src/app/api/ai/log-usage/route.ts` if
  the existing logged strings turn out not to be granular enough

**Estimated scope:** Small–Medium (1-3 files, depending on the verification finding above)

**Outcome:**

- Confirmed from real code (`SuggestSocialCopyShared.tsx`'s `onCopy` handlers) that the logged strings
  are already granular per-platform: `"Copied Facebook caption (option N)"`, `"Copied X caption (option
  N)"`, `"Copied LinkedIn caption (option N)"`. **No schema change needed** — the good branch of the risk
  table. Pure parsing/display task, one file touched.
- `DistributionDashboardTool.tsx`: added `usedActions[]{action}` to the existing `aiOutputLog` query,
  computed a `facebookCopiedSlugs` set (posts with a logged action starting `"Copied Facebook caption"`),
  and added a second badge next to the existing bundled "Social copy drafted" one — "Facebook copied"
  (positive) / "Facebook not copied yet" (caution) — shown only once a post is drafted. Generation
  behavior (`socialDraftedSlugs`, the actual `suggest-social` call) is completely untouched.
- Verified against real, already-live data (not a fresh manual test): post `even-my-discipline-was-an-
  escape` has a real `"Copied Facebook caption (option 1)"` entry in its log → correctly resolves to
  "Facebook copied". Post `christmas-2015-the-quest-a-christmas-adventure` is drafted (`used: false`,
  empty `usedActions`) → correctly resolves to "Facebook not copied yet". Both pulled directly from the
  live dataset, not fabricated test data.
- `tsc --noEmit` clean on this file.

---

## Task 5: API route to pull Facebook comments via Apify — DONE (2026-09-03)

**Description:** New server-side route that takes a post's `socialLinks` Facebook URL, calls the Actor
validated in Task 1 via Apify's REST API (server-side token, never exposed client-side), and normalizes
the raw Actor output into the same shape the existing `.txt`-based Facebook importer already parses into
(name, message, nesting level, timestamp where available) — adapting the shape if Task 1 found it differs.

**Acceptance criteria:**
- [x] Route accepts a post identifier, looks up its Facebook `socialLinks` entry, triggers the Apify Actor
- [x] Output is normalized to the existing importer's comment shape
- [x] Apify API token is read from a server-side env var, never returned to the client
- [x] Clear, honest error response if the post has no Facebook link saved yet, or the Actor run fails

**Verification:**
- [x] Manual check: called the real route logic for `even-my-discipline-was-an-escape` (the same post Task
      1 tested against, Facebook URL now saved to its `socialLinks`) once `APIFY_API_TOKEN` was set —
      normalized comments came back correctly shaped, see Task 7's Outcome for the full run details
- [x] Build succeeds: `tsc --noEmit` clean (full `npm run build` avoided — see the Turbopack incident in
      RUNBOOK.md; `tsc` alone confirms no type errors from this work)

**Dependencies:** Task 1 (Actor choice + output shape), Task 2 (`socialLinks` field to read from)

**Files likely touched:**
- `src/app/api/ai/pull-facebook-comments/route.ts` (new)

**Estimated scope:** Medium (1-2 files, real external API integration)

**Outcome:**

- Built `POST /api/ai/pull-facebook-comments`: looks up the post's Facebook `socialLinks` URL, calls
  `POST https://api.apify.com/v2/actors/apify~facebook-comments-scraper/run-sync-get-dataset-items`
  (confirmed exact endpoint, auth header, and the 408-on-300s-timeout behavior directly from Apify's docs,
  not assumed), normalizes the result, and imports it via `src/lib/facebookCommentImport.ts` (Task 6).
- `APIFY_API_TOKEN` added as an empty placeholder in `.env.local`, alongside the existing
  `GEMINI_API_KEY`/`GIPHY_API_KEY` server-side keys. **This session's own Apify MCP access (used for Task
  1) cannot supply this token** — it's a separate, connector-based auth, not a raw token string. **Asher
  needs to paste his real Apify API token (Console → Settings → Integrations) into `.env.local` before
  this route will actually work.**
- Without that token, the route couldn't be called end-to-end at first. What *was* verified instead: the
  normalize/dedupe logic (Task 6) run offline against the real dataset from Task 1's test.
- **Update (2026-09-03, later the same day):** Asher pasted a real `APIFY_API_TOKEN` into `.env.local`
  himself (per this task's own instructions, manually, not shared in chat). The session that had been
  working on this stopped unexpectedly before it could run the real end-to-end test it had planned next --
  picked back up in a later session. Ran the actual route logic (not a re-derivation of it -- imported and
  called the real `normalizeApifyComments`/`importFacebookComments` from `facebookCommentImport.ts`
  directly) against `even-my-discipline-was-an-escape`, the same post Task 1 tested against. Full real run,
  full real result -- see Task 7's Outcome for the details, since that's where the actual acceptance
  criteria for "does a real pull work end to end" lived.

---

## Task 6: Extract shared comment dedupe/import logic — DONE, WITH A CAVEAT (2026-09-03)

**Description:** The historical `.txt`-based Facebook importer already solved matching-by-name+message,
preserving `approved` status on already-live comments, and avoiding duplicate imports (RUNBOOK.md,
"Facebook comment re-extraction" and its follow-up entries). Pull that matching/dedupe logic out of the
one-off import script into a shared function both the old script and the new route can call, rather than
writing a second, slightly-different copy of the same logic.

**Acceptance criteria:**
- [x] Dedupe/match/preserve-approved-status logic lives in one shared, importable function
- [x] The new route (Task 5's output) can call it directly
- [x] The existing one-off import script still works after the extraction (not broken by the refactor)

**Verification:**
- [x] Manual check: run the shared function against a small known test case (a post with some already-
      `approved` comments plus new ones from Task 5's output) and confirm approved status is preserved and
      no duplicates are created — see Outcome below (note: no comments were actually `approved` in the
      real test case used; see caveat)

**Dependencies:** Task 5 (needs real normalized output to test against)

**Files likely touched:**
- The existing Facebook import script (wherever the matching logic currently lives)
- `src/app/api/ai/pull-facebook-comments/route.ts`

**Estimated scope:** Medium (2-3 files — this is a refactor-under-test, not new logic)

**Caveat — read before trusting "extracted" above:** the actual historical `.txt`-importer script RUNBOOK.md
describes (the one with the real matching/preserve-approved logic, from the "Facebook comment
re-extraction" entries) **does not exist anywhere in this repo or its git history** — confirmed by
grepping `scripts/` and searching deleted files across all of git history, both came back empty. It was
almost certainly a one-off script from an earlier session, run directly and never committed — the same
way I've been running my own throwaway verification scripts this session. So `src/lib/
facebookCommentImport.ts` is **freshly written**, not literally extracted, built from RUNBOOK.md's
*documented description* of that logic (exact name+message match, then one containing the other, then
name-only for top-level comments only, matching-comment left untouched so `approved` status survives).
The behavior should be equivalent, but it hasn't been checked line-by-line against a script that no
longer exists to compare against — worth knowing if a real Facebook comment pull ever behaves
unexpectedly.

**Outcome:**

- `src/lib/facebookCommentImport.ts`: `normalizeApifyComments`, `findExistingMatch`, and
  `importFacebookComments` (imports + creates only what doesn't already match — never touches or
  overwrites a matched existing comment, which is what makes `approved` status survive automatically:
  the function simply never patches a matched document).
- Verified offline (no dev server, no live Apify call needed) against real data: Task 1's actual 11-item
  Apify dataset, normalized, matched against `even-my-discipline-was-an-escape`'s real (but *unrelated*)
  existing comments in Sanity. Result: correctly found **zero false matches** (the unrelated existing
  comments, including one also named "Asher Aw," correctly did not match the Facebook thread's
  content), and correctly caught an exact-duplicate case in a separate check. Full details/output kept in
  this session's transcript, not committed as a file.
- **Update (2026-09-03, real run)**: ran once `APIFY_API_TOKEN` was actually set -- see Task 7's Outcome
  for the full real numbers. The post used (`even-my-discipline-was-an-escape`) has 2 pre-existing
  `approved` comments, both genuinely unrelated to the Facebook thread's content (confirmed already, above)
  -- so this run again didn't touch either of them (0 of the 2 approved comments matched, exactly as
  intended: `approved` status survives because an unrelated comment correctly never matches at all, not
  because a real overlap was tested and handled). A true "approved comment overlaps a real Facebook
  reply" case still hasn't happened on real data -- would need a post where someone's Facebook reply was
  manually approved here first, then re-pulled. Left as a known remaining gap, not urgent: the matching
  logic that would handle it (exact/containing match, comment left untouched) is unit-testable and was
  exercised by this same run against 11 real comments with zero false positives or negatives, just not by
  that one specific "already-approved-then-re-pulled" scenario.
- One real match *did* happen in this run, worth explaining rather than leaving as a mystery number: the
  first pull reported "10 created, 1 matched" even though only the 2 unrelated pre-existing comments were
  in Sanity beforehand (both confirmed not to match, above). The 11th Apify row matched one of the *other
  10* Facebook comments from the same batch -- `importFacebookComments` adds each newly-created comment to
  its own in-memory `existing` list as it goes (so a later item in the same batch can match an earlier one
  from that same batch), and Apify's own dataset apparently contained one genuine duplicate row. Confirmed
  by row count, not just assumed: 11 raw items in, 10 real distinct comments in Sanity after the run.

---

## Task 7: "Pull comments" button in the dashboard — DONE (2026-09-03)

**Description:** Wire Task 5's route into `DistributionDashboardTool.tsx` as a per-post button (Facebook
column), showing last-pulled timestamp and comment count, matching the existing "Share this post" panel's
UI pattern (loading state, error handling) rather than inventing a new interaction style.

**Acceptance criteria:**
- [x] Button visible only when a post has a Facebook `socialLinks` entry
- [x] Clicking it calls Task 5's route, shows a loading state, then success (count pulled) or a clear error
- [x] Last-pulled timestamp persists and displays on next dashboard load

**Verification:**
- [x] Manual check, with an honest caveat on scope: ran the real shared logic (`normalizeApifyComments` +
      `importFacebookComments` from `facebookCommentImport.ts`, the same functions the route calls,
      imported directly and called with the exact same Apify request shape the route sends) against
      `even-my-discipline-was-an-escape` twice in a row. **First run**: 11 real comments pulled from
      Apify, 10 created as `pending` (correctly threaded — Jeryl Chandler/Alvin Huang/Vanya Stoimenova plus
      Asher's own replies, matching Task 1's documented shape), 1 matched (a genuine within-batch
      duplicate, see Task 6's update). **Second run, immediately after**: same 11 comments pulled again,
      0 created / 11 matched — confirms re-pulling doesn't duplicate. Both runs verified by reading the
      actual resulting comment documents back from Sanity directly, not just trusting the reported counts.
      **Not verified by this same check**: the actual `POST /api/ai/pull-facebook-comments` HTTP route
      itself (env var reading, request/response shape) and the `PullFacebookCommentsButton.tsx` UI's own
      click/loading/error states and dashboard refresh — Studio's browser UI remains unreachable for
      automated testing (documented, longstanding limitation — Google blocks automated OAuth login even via
      a real browser). The route is a thin, direct wrapper around exactly the functions that were tested
      (confirmed by reading its source), so this is a reasonable proxy for "does a real pull work end to
      end," but the button click itself and the live post page haven't been visually confirmed by anyone
      other than Asher checking Studio himself.
- [x] Build succeeds: `tsc --noEmit` clean

**Dependencies:** Task 4 (dashboard layout), Task 5, Task 6

**Files likely touched:**
- `src/sanity/components/DistributionDashboardTool.tsx`

**Estimated scope:** Small (1 file — UI only, logic already lives in Task 5/6)

**Outcome:**

- New `src/sanity/components/PullFacebookCommentsButton.tsx` (same loading/error pattern as
  `SharePanel.tsx`), rendered next to the existing "Share this post" button — only when
  `post.facebookUrl` (from `socialLinks`) is set.
- Added `facebookCommentsLastPulledAt`/`facebookCommentsLastPulledCount` to `shareLogType.ts` — the API
  route itself writes these after a successful pull (not the client), so a pull that saves comments but
  fails to record its own timestamp can't happen as two separate failure points.
- `DistributionDashboardTool.tsx`: post query now also fetches each post's Facebook `socialLinks` URL;
  `shareLog` query fetches the two new fields; button wired with `onPulled={load}` so a successful pull
  refreshes the whole dashboard (badges, counts, timestamp) in one pass, consistent with how `saveNote`
  already does `await load()` after writing.
- **Update (2026-09-03, real run)**: the shared logic behind this button was run for real against
  `even-my-discipline-was-an-escape` -- see this task's own Verification section above for the full
  numbers (10 comments created as `pending`, second run 0 created / 11 matched). What's specifically *not*
  yet confirmed: clicking the actual button in Studio, and visually confirming the pending comments show up
  correctly on Studio's Comments moderation queue and (once approved) on the live post page. Asher's own
  next step to close this out for real.

---

## Task 8: Second platform — Instagram comment pull — DONE (2026-09-03)

**Description:** Asher picked Instagram as the second platform (over the plan's original Threads
suggestion), specifically because engagement on X/Threads/YouTube has been near-zero for him — Instagram
is where real comments actually happen. Repeat the Facebook pattern: validate a real Apify Actor against
a real post, then wire it into the dashboard.

**Outcome:**

- **Validated `apify/instagram-comment-scraper`** (official Apify, 51.6K users, 4.38★/56 ratings) against
  a real post (`https://www.instagram.com/p/Db3TQcwj57p/`, linked to `even-my-discipline-was-an-escape`).
  Cross-checked with a second, independent Actor (`apidojo/instagram-comments-scraper-api`) — both
  returned the exact same single result (Asher's own comment, `replyCount: 0`), confirming this post
  genuinely has one comment, not a scraper gap.
- **Real limitation found, not assumed**: on a free-tier Apify account, this Actor only returns
  top-level comments — replies are gated behind a paid Apify plan (`includeNestedComments` silently does
  nothing on free tier) — and caps at the newest ~15 comments per post. Fine for Asher's actual comment
  volumes seen so far; worth re-checking if a busier post ever seems to be missing replies.
- **Generalized the pipeline** rather than copy-pasting a second near-identical implementation: extracted
  the platform-agnostic dedupe/match/create core out of `facebookCommentImport.ts` into a new
  `src/lib/socialCommentImport.ts` (`importSocialComments`, `findExistingMatch`, `isAuthorName`) — Facebook
  and Instagram now share one implementation, each keeping only its own small raw-shape normalizer
  (`normalizeFacebookComments` / `normalizeInstagramComments`). `AUTHOR_NAME_ALIASES` extended with
  `itsasheraw` (Asher's real Instagram handle, confirmed against the real test comment).
  `PullFacebookCommentsButton.tsx` → `PullSocialCommentsButton.tsx`, parameterized by `platform`.
  `shareLogType.ts` gained `instagramCommentsLastPulledAt`/`Count`, mirroring Facebook's fields.
- **Verified end-to-end for real**, same standard as Facebook: ran the actual `normalizeInstagramComments`
  + `importSocialComments` against the real Apify output twice. First run: 1 created (pending,
  `isAuthorReply: true` — correctly recognized `itsasheraw` as Asher himself). Second run: 0 created, 1
  matched — confirms no duplication on re-pull. Same honest gap as Facebook: this verified the shared
  logic and the real Apify data directly, not a literal click on the Studio button — Studio's browser
  login remains untestable by automation.

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
