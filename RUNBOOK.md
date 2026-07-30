# Runbook

What to do when something breaks. Written in plain English for a non-developer site owner, with enough
detail for a developer (human or AI) picking this up cold.

This file grows over time — every new feature should add its own troubleshooting entry here when it ships,
not after something has already gone wrong with it.

**Before making any non-trivial change, read `ACE_PRD.md` and `ACE_MASTER_SPEC.md`** — the project's actual
spec and roadmap, committed here so every session (desktop or remote) works from the same source instead of
relying on separate Claude project knowledge that can drift. This file (the runbook) stays the source of
truth for *current, as-built* behavior; the other two are the source of truth for *what ACE is supposed to
become*. Where they disagree with what's actually deployed, this file wins.

---

## How urgent is it? (severity levels)

- **P0 — Site down, or content lost.** Act immediately.
- **P1 — Publishing or a core flow is broken** (e.g. new posts don't appear, contact form silently fails). Act within the day.
- **P2 — Something's degraded but there's a workaround.** Fix soon, not urgent.
- **P3 — Cosmetic / doesn't affect visitors.** Fix whenever convenient.

---

## Writing posts: image upload / alt text issues in Studio

**"I click Image in the post body but can't upload a new file, only pick an existing one":** this is a known,
confirmed limitation in Sanity itself (not something specific to this site) — [tracked upstream as
sanity-io/sanity#12129](https://github.com/sanity-io/sanity/issues/12129), closed by Sanity as "not planned."
It only affects **drag-and-drop**: dragging an image file onto the body editor fails because the post body
mixes plain images with the custom block types added on 2026-07-28 (callouts, code blocks, accordions, etc.),
and Sanity's drag-and-drop handler can't resolve an upload target when an array mixes image blocks with
custom object blocks.
**Workaround (confirmed working 2026-07-29):** don't drag the file in — click the Image tool, then use the
**Browse/Upload button** inside the dialog instead. (Uploading via the post's separate Main Image field also
always works, as already discovered.)

**"Typing in the alt text field closes the dialog immediately":** matched a known class of Sanity Studio bug
(image inputs inside dialogs losing focus/closing unexpectedly). **Fixed by the Studio v5 → v6 upgrade on
2026-07-29** (confirmed working by Asher the same day) — likely the documented Portable Text typing/cursor
fix that shipped in v6.6.0. If this ever reappears after a future Sanity upgrade, it's worth checking that
upgrade's changelog for anything touching Portable Text input focus before assuming it's a new issue.

---

## Studio version: currently on Sanity v6

Upgraded from v5.31.1 (Sanity's own "maintenance" tag for the v5 line — no longer receiving fixes) to v6.7.0
on 2026-07-29. Breaking changes checked against this project's actual config (auth, search, document actions) —
none applied. One requirement worth knowing:

**Node.js 22.12+ is required to build Studio in v6.** If a deploy on Vercel starts failing after this
upgrade (or any future Sanity upgrade) with build errors mentioning Node version, unsupported syntax, or
engines — check **Vercel → Project → Settings → General → Node.js Version** and bump it to 22.x or newer.
A failed build does *not* take the live site down — Vercel keeps serving the last successful deploy — it just
means this specific update won't go live until the Node version is fixed.

---

## Prepare for Publish: checklist + AI-suggested SEO

**The pre-publish checklist** (shipped 2026-07-29) runs automatically every time Publish is clicked on a
post — no setup needed. If the post is missing a featured image, an excerpt, a category, or has an
overly-long title, a dialog lists what's missing with a choice to go fix it or publish anyway. If nothing's
flagged, publishing works exactly as before with no extra step.

**"Suggest SEO & Excerpt"** (in the "..." menu next to Publish) drafts 3 options each for SEO title and
excerpt from the post's own content using Google's Gemini API — shown for review, never applied
automatically; picking one just fills that field, still fully editable afterward. Uses `gemini-3.6-flash`,
which is on Gemini's free tier (1,500 requests/day, no credit card) — at personal-blog volume this should
never cost anything. (Originally built against Anthropic's Claude API, but Claude Pro subscription credit
doesn't cover API usage — that's billed completely separately and needs its own top-up. Switched to Gemini
on 2026-07-29 specifically because it has a genuine permanent free tier.) Requires a one-time setup:
1. Get an API key from [aistudio.google.com](https://aistudio.google.com) (Google AI Studio) → Get API key.
2. Add it to **Vercel** (Settings → Environment Variables) as `GEMINI_API_KEY` → redeploy.

**If "Suggest SEO & Excerpt" shows an error:** almost always the key above isn't set, or was only set for
the wrong Vercel environment. The dialog's error message says plainly if the key is missing.

**"Nothing to summarize" on a post that clearly has content:** happened once (2026-07-30) on a post with no
pending edits — the action was only reading the *draft* version of the document, and a published, untouched
post has no draft at all. Fixed by falling back to the published version when there's no draft. If this
exact symptom ever reappears, check `src/sanity/actions/suggestSeo.tsx` still reads
`props.draft ?? props.published`, not `props.draft` alone.

**Model name changes fast on Gemini's side:** this already broke once (2026-07-30) — `gemini-2.5-flash`
returned a 404 "no longer available to new users" despite being listed as a stable model in Google's own
docs at the time. If suggestions start failing after previously working, check
[ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) for the current model
name before assuming something else broke, and update the model string in
`src/app/api/ai/suggest-seo/route.ts`.

**Excerpt suggestions specifically follow two rules, on purpose:** the post's main point/keyword must land
within the first 120 characters (mobile search results often truncate before the full 160), and the copy
should create curiosity rather than give everything away flatly. The dialog visually shows the first-120
portion vs. the rest so this is easy to check at a glance before picking one.

**Suggestions also include 3-5 tags** (shipped 2026-07-29), shown as clickable chips — click any you want,
then "Add" merges them into the post's existing tags (doesn't replace them, unlike title/excerpt which do
replace). Tags already used elsewhere on the blog are passed to Gemini so it prefers reusing an existing
tag's exact spelling instead of inventing a near-duplicate like "coaching" vs "Coaching".

**The instructions given to the AI are editable** (shipped 2026-07-29) — in Studio's left sidebar, under
**AI Suggestion Settings**. Change tone, phrasing habits, things to always/never do, whatever's useful.
Nothing there is load-bearing for the feature to keep working: Gemini's response *shape* is enforced
separately by `responseSchema` in `src/app/api/ai/suggest-seo/route.ts`, and title/excerpt lengths are
hard-truncated in code regardless of what the instructions say — so editing freely can make suggestions
worse, but can't break the feature. Leave the field blank to fall back to the built-in default (kept as
`DEFAULT_AI_PROMPT_INSTRUCTIONS` in `src/lib/aiPromptDefaults.ts`, shared with the settings field's starting
value so the two can't quietly drift apart).

---

## Post metadata: reading time, categories, tags

**Reading time** ("X min read", shown in Studio's post list and on the live blog) is calculated
automatically from the post body — nothing to fill in, and it can't go stale since it's computed fresh each
time rather than stored. Lives in `src/lib/portableText.ts` (`estimateReadingTimeMinutes`), shared by Studio
and the frontend so both always agree.

**Categories** use a checkbox list in Studio (shipped 2026-07-29) instead of Sanity's default search-and-pick
popup — every existing category is visible at a glance, laid out in 2-3 columns depending on how many there
are. Custom input component: `src/sanity/components/CategoryCheckboxInput.tsx`.

**Tags autocomplete** (shipped 2026-07-29): typing suggests tags already used on other posts, to cut down on
near-duplicates. If nothing's suggested, that just means the tag you're typing hasn't been used before — not
a bug. Custom input component: `src/sanity/components/TagsAutocompleteInput.tsx`.

---

## Categories: viewing usage and safe deletion

**"Which posts use this category?"** — open the category in Studio; alongside the normal **Editor** tab
there's a **Posts** tab listing every post that references it. Read-only, just for reference before deciding
whether to edit or delete. Component: `src/sanity/components/CategoryPostsView.tsx`, wired up in
`src/sanity/structure.ts`.

**Deleting a category that's still in use** (shipped 2026-07-29) no longer just silently orphans the posts
using it. If nothing references the category, Delete works exactly as it always has — no extra step. If
posts do use it, a dialog lists them and asks whether to reassign them to another category or leave them
uncategorised; only after that choice is applied does the actual deletion run. Wrapped in
`src/sanity/actions/categoryDeleteGuard.tsx`, wired into `sanity.config.ts`'s `document.actions`.

**If a bulk category reassignment ever looks wrong** (posts not correctly moved off the deleted category,
or ending up with a duplicate category reference): the reassignment logic patches every affected post in one
Sanity transaction before the delete runs. This already caught one real bug during testing — calling
`.unset()` more than once on the same Sanity patch silently drops all but the last call's paths instead of
accumulating them, so every field being removed has to be collected into a single `.unset([...])` call, not
several chained ones. If this class of bug ever resurfaces (e.g. in a future bulk-edit feature), that's the
first thing to check.

---

## Publishing: "I published a post but it's not showing up"

**Symptoms:** A post is published in Sanity Studio (asheraw.com/studio) but doesn't appear on asheraw.com/blog.

**Checks, in order:**
1. **Wait a minute.** The blog re-checks Sanity for changes at most once every 60 seconds (not instantly). If it's been under a minute, just wait.
2. **Confirm it's actually published, not just saved as a draft.** In Studio, open the post — if there's a "Publish" button still showing, it's a draft. Click Publish.
3. **Confirm the post has a slug.** Every post needs its own URL slug (auto-generated from the title). If the title field was left blank at some point, the slug might never have generated. Open the post and check the Slug field has a value.
4. **Check the live site directly:** visit `asheraw.com/blog` and hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) to rule out your browser showing you an old cached copy.
5. **If none of that explains it,** the site's connection to Sanity itself may be misconfigured (this happened once — see "History" below). That needs a developer to check the Sanity project ID/dataset environment variables on Vercel.

**History:** On 2026-07-28, the live site was frozen on whatever content existed at the last deploy — new posts added in Sanity simply never appeared, because the blog pages had no instruction to ever re-check Sanity. Fixed by adding a 60-second revalidation window to `/blog` and `/blog/[slug]`. If this exact symptom reappears (posts genuinely never show, not even after minutes), check that `export const revalidate = 60` is still present near the top of `src/app/blog/page.tsx` and `src/app/blog/[slug]/page.tsx` — it may have been accidentally removed in a later edit.

---

## Live preview: one-time setup, and "Preview shows an error"

Studio has a "Preview" feature (look for it in the top navigation) that shows exactly how a draft will look on
the real site — including unpublished changes — with buttons to check desktop, tablet, and mobile sizes.

**One-time setup required before this works** -- two separate steps, both done as of 2026-07-28:

1. **A read token**, so the website is allowed to read draft content:
   - [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**.
   - Name it something like `Preview`. Permissions: **Viewer** (read-only, never write).
   - Copy the token, add it to **Vercel** (Settings → Environment Variables) as `SANITY_API_READ_TOKEN` → redeploy.

2. **A CORS origin**, so the browser is allowed to make the live preview connection at all:
   - [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **CORS Origins** → **Add CORS origin**.
   - Origin: `https://asheraw.com`. Check **"Allow credentials"** (required -- the preview connection is
     authenticated, not anonymous). Save. Takes effect immediately, no redeploy needed.

**If Preview shows an error or blank page:** almost always one of the two steps above wasn't done, or step 1
was only set for the wrong Vercel environment (Preview/Development vs Production).

**If Presentation crashes after sitting idle for a while** with `CorsOriginError` / "The current origin is
not allowed to connect to the Live Content API": this is step 2 above -- the CORS origin is missing or
doesn't have "Allow credentials" checked. The initial preview view still works even without this (confirmed
2026-07-28); it's specifically the ongoing real-time connection that fails without it.

---

## Backups: "The daily backup failed" / "Where's my content backed up?"

See **BACKUP_AND_RECOVERY_GUIDE.md** for the full explanation and the one-time setup steps. Quick reference:

- Backups run automatically every day via a GitHub Action (`.github/workflows/backup.yml`), and only actually save a new copy when content changed.
- **If a run shows a red X in GitHub's Actions tab:** click into the run, expand the failed step, and read the actual error text (don't just look at the red X — the summary line is often generic). Common causes seen so far:
  - `npm error ... Missing: <package> from lock file` — the project's dependency lock file drifted out of sync. A developer needs to run `npm install` locally and commit the updated `package-lock.json`. (This shouldn't recur for the backup job specifically anymore — it was changed to install only the one small tool it needs, instead of the whole website's dependencies, specifically to avoid this class of failure.)
  - `Error: Nonexistent flag: --token` — the Sanity CLI's export command takes the access token via the `SANITY_AUTH_TOKEN` environment variable, not a command-line flag. If this reappears, check `.github/workflows/backup.yml` still sets `SANITY_AUTH_TOKEN` under the export step's `env:`.
  - `SANITY_API_TOKEN secret is not set` — the one-time GitHub secret setup wasn't completed, or the token expired/was revoked in Sanity's dashboard. Redo the "One-time setup" steps in BACKUP_AND_RECOVERY_GUIDE.md.
- **To restore from a backup:** see the "How to restore" section of BACKUP_AND_RECOVERY_GUIDE.md.

---

## Contact form: "A visitor said the form didn't work" / "I'm not getting notification emails"

- The form saves every submission as a **Contact Submission** document in Sanity (visible in Studio's left
  sidebar) *and* tries to send you a notification email via Resend. If Resend isn't configured, the
  submission is still saved — you just don't get an email about it. So: if someone says they submitted the
  form but you got no email, check Studio → Contact Submissions before assuming it's lost.
- Required for the notification email to work: `RESEND_API_KEY` and `CONTACT_NOTIFICATION_EMAIL` environment
  variables must be set in Vercel's project settings (not just a local `.env` file, which never reaches
  production).
- As of 2026-07-28 the contact form was confirmed working in production (tested, notification email
  received) — if it breaks later, the first thing to check is whether those two environment variables are
  still correctly set in Vercel.

**One-time setup for saving submissions (do this once):** the form needs a Sanity token that can *write*
content, not just read it — different from every other token set up so far in this guide, which are all
read-only.
1. [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**.
2. Name it something like `Contact Form Writer`. Permissions: **Editor** (needs to create and update
   submission records — Viewer alone won't work here).
3. Copy the token, add it to **Vercel** (Settings → Environment Variables) as `SANITY_API_WRITE_TOKEN` →
   redeploy.

**If submissions stop saving:** almost always this token — expired, revoked, or never set for the right
Vercel environment. The error in Vercel's logs will say something like `Insufficient permissions; permission
"create" required`, which confirms it's this token, not something else.

**History:** originally used a separate Postgres database (via Supabase) for this. Migrated to Sanity on
2026-07-28 after Supabase's free tier auto-paused the project from inactivity (it pauses after ~1 week with
no activity, and needs a manual unpause). Storing submissions in Sanity instead means no second service that
can silently go to sleep, and submissions are automatically swept up by the same daily backup that covers
blog content.

---

## Database: "Something about Prisma/Post/database errors"

- The actual blog content lives entirely in **Sanity** — that's the one and only source of truth. A separate Postgres database (via Prisma) exists only for contact form submissions.
- A leftover, unused `Post` table used to exist in that Postgres database from the original site template. It was removed from the app's schema on 2026-07-28 because it was a second, disconnected place blog content *could* have been stored, which risks confusion later. Nothing in the app ever read from it. If you ever see a database error mentioning a `Post` table, that's a sign someone (or some AI-generated code) is trying to reintroduce it — don't; use Sanity instead.
- If you ever see `@prisma/client did not initialize yet`, the database client wasn't generated after installing dependencies. This should self-heal automatically now (`"postinstall": "prisma generate"` runs after every install), but if it reappears, running `npx prisma generate` fixes it immediately.

---

## Analytics / cookie consent

- Google Tag Manager (GTM) only loads after a visitor clicks "Accept" on the cookie banner — it does not load at all otherwise, by design (added 2026-07-28, previously it loaded unconditionally for every visitor with no opt-out).
- The visitor's choice is remembered in their browser (`localStorage`), not sent anywhere else. There's currently no way for *you* to see aggregate consent accept/decline rates — that would be a future addition if it becomes useful.
- If analytics numbers look unexpectedly low, the most likely explanation is simply that visitors are declining or not yet answering the consent banner (expected/normal), not a tracking bug.

---

## Before any schema change, bulk edit, or deploy

1. Check the daily backup ran successfully recently (GitHub → Actions → Daily Content Backup).
2. If you're about to do something to Sanity content that would be painful to redo by hand (bulk edits, restructuring fields), consider manually running the backup workflow first (Actions → Daily Content Backup → Run workflow) so you have a fresh copy from right before the change.
3. For code changes: this project now checks that things actually build (`npm run build`) before anything gets pushed live — but always worth a sanity check that the live site looks right shortly after a deploy.

---

## Contacts / where things live

- **Code:** github.com/asheraw/personal-website (public repo)
- **Content:** Sanity project `oj9eajjd`, dataset `production` — manage at sanity.io/manage, edit at asheraw.com/studio
- **Hosting:** Vercel, connected to the GitHub repo (pushes to `main` auto-deploy)
- **Email notifications:** Resend
- **Backups:** GitHub Actions artifacts (Actions tab → Daily Content Backup), 30-day retention

---

## First 24 hours for a new developer (or AI agent)

- **Never** write blog content anywhere except Sanity. If you're tempted to add a database table for content, stop — that's the exact mistake that was already cleaned up once.
- The site auto-deploys on every push to `main` via Vercel. There is no staging environment yet — treat `main` as production.
- Before touching `prisma/schema.prisma`, know that only `ContactSubmission` (and `User`, currently unused/dormant) exist there on purpose. Content does not belong here.
- Read `BACKUP_AND_RECOVERY_GUIDE.md` before doing anything with Sanity content structure.
- If unsure whether a change is safe to make without asking the site owner first, it probably needs asking — see the Decision Authority Matrix in `ACE_MASTER_SPEC.md` (Part VII).

---

## Incident log

Record every real incident here — what happened, why, how it was fixed. Future entries should follow this
format:

```
### YYYY-MM-DD — Short title
**Symptom:** what was observed
**Root cause:** what actually caused it
**Fix:** what was changed
**Follow-up:** anything still worth doing because of this
```

### 2026-07-28 — Blog frozen on stale content
**Symptom:** Only 1 of 7 published posts appeared on asheraw.com/blog.
**Root cause:** Blog pages fetched from Sanity once at deploy time and never rechecked afterward.
**Fix:** Added `export const revalidate = 60` to the blog list and post pages.
**Follow-up:** None currently — working as intended.

### 2026-07-29 — First restore drill (Phase 0 exit criteria)
**Symptom:** N/A — this was a planned drill, not an incident. The ACE PRD requires a tested monthly restore drill before Phase 0 (Audit & Protection) can be considered closed; one had never been run.
**What was done:** Exported the live `production` dataset (34 documents, 14 assets), imported it into a new throwaway dataset (`restore-drill`, kept set to Private — a full export includes contact form PII and unpublished drafts), then compared every real content document (posts, authors, categories, contact submissions, images) between `production` and `restore-drill`.
**Result:** Every document matched exactly, aside from differences that are expected and don't indicate any data loss:
- Image asset `path`/`url`/`_createdAt` naturally differ because they're scoped to the dataset name (`.../production/...` vs `.../restore-drill/...`) and re-stamped on import.
- One post and one draft showed real content differences — traced to production being actively edited in Studio in the ~4 minutes between the export snapshot and the later verification query, not a restore defect. Confirmed by checking the frozen export file directly: it already lacked the newer content, proving the import faithfully reproduced exactly what was exported.
**Timing:** export ~3s, import ~11s, verification a few seconds more — well inside the PRD's <2h RTO target.
**Follow-up:** Repeat monthly using `scripts/restore-drill.mjs` (see `BACKUP_AND_RECOVERY_GUIDE.md`). Since production is a live system, expect similar "drift" mismatches if a drill runs while someone is actively editing — check the frozen export file itself before assuming a real problem.

### 2026-07-28 — Backup workflow's first three runs failed
**Symptom:** GitHub Action for daily backups failed with, in order: a generic `npm ci` failure, an
out-of-sync-lockfile error, and a `--token` flag error.
**Root cause:** (1) The main project's `package-lock.json` had drifted out of sync with `package.json`.
(2) The backup job installed the *entire* website's dependencies just to get one CLI tool, tying its
reliability to an unrelated file. (3) Wrong method used to pass the Sanity access token to the export
command.
**Fix:** Regenerated the lockfile; changed the backup job to install only the Sanity CLI directly instead
of the whole project; switched to the `SANITY_AUTH_TOKEN` environment variable.
**Follow-up:** None — confirmed working end-to-end with a real successful backup afterward.

### 2026-07-30 — Light mode theme state going flaky across full page loads
**Symptom:** A visitor in light mode who fully navigated (not a same-tab Next.js `Link` transition) from one
page to another — e.g. clicking the header's Blog link from the homepage — would sometimes land back in dark
colours, only inconsistently fixed by toggling and refreshing. Separately, `/connect` had no theme toggle on
it at all, and the 404 page's toggle button was visible but did nothing when clicked.
**Root cause (main bug):** `ThemeProvider`'s `useState` initializer read `localStorage` directly
(`typeof window === "undefined" ? "dark" : ...`). That function runs twice — once on the server (always
"dark"), and again as React's first **client** render during hydration, where `window` already exists, so it
immediately resolved to the real saved theme. For any visitor with `"light"` saved, that's a genuine content
mismatch between what the server rendered and what the client's hydration pass produced (the toggle button's
icon, `aria-label`, and `title` all differ dark vs. light) — confirmed via a real React hydration error in
testing. React's recovery from a hydration mismatch is to discard and rebuild the entire mismatched subtree
client-side, which is exactly the kind of thing that shows up as "sometimes wrong, fixed by refreshing."
**Root cause (connect/404):** `/connect` never rendered `SiteHeader` (or any theme control) at all — it's a
deliberately header-less link-in-bio page. `/app/not-found.tsx` sits outside the `(site)` route group (so
Next.js's global 404 boundary can use it from the true root layout), which means it was never wrapped in
`ThemeProvider` — its `SiteHeader` toggle button called the default no-op `toggleTheme` from `ThemeContext`'s
fallback value instead of a real one.
**Fix:** `ThemeProvider` (`src/components/asher/ThemeProvider.tsx`) now always starts its React state at
`"dark"`, matching the server exactly on the first client render, and corrects to the real saved theme in a
`useLayoutEffect` gated by a `hasSyncedFromStorage` ref so it only reads `localStorage` back once (an earlier
version of this fix re-read `localStorage` on every effect run, which meant a user's own toggle click — where
`localStorage` hasn't been updated to match the new state yet — got read back and immediately reverted; worth
knowing if this class of bug ever needs revisiting). Since the correction happens inside a layout effect, it
still resolves before the browser paints, so there's no visible flash. Added `ConnectThemeToggle.tsx` — a
small standalone toggle (not the full `SiteHeader`) — to `/connect`, keeping its intentionally minimal design.
Wrapped `not-found.tsx`'s content in its own `ThemeProvider`, scoped to just that page.
**Follow-up:** None currently — verified with a scripted browser check across `/`, `/blog`, `/connect`, and a
404 route: no hydration errors, and a saved `"light"` theme now survives a fresh full-page load of every one
of them.
