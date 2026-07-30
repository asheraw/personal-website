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

**For what's actually shipped and when, read `CHANGELOG.md`** — one running log, newest entry on top. When
a session finishes real work, it adds a dated entry there instead of leaving the only record in a chat-only
summary that other sessions can't see.

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
whether to edit or delete. Component: `src/sanity/components/ReferencedByPostsView.tsx` (generalized
2026-07-30 to also power the same tab on Reusable Snippets — see below), wired up in `src/sanity/structure.tsx`.

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

## Site Settings: the default author

**Studio -> Site Settings** (singleton, left sidebar) now holds the default author every new post starts
assigned to — shipped 2026-07-30, replacing a hardcoded GROQ lookup for an author with slug `asher-aw`.
Change it any time; it only affects posts created *after* the change, never retroactively touches existing
ones. Schema: `src/sanity/schemaTypes/siteSettingsType.ts`. `postType.ts`'s `author` field still falls back
to the old slug-based lookup if the Site Settings document has no default set (shouldn't happen in practice —
the document was created directly with a default already set — but keeps a fresh/corrupted dataset from
leaving new posts with no author at all).

**If a new post's author field comes up empty:** check Studio -> Site Settings has a default author actually
selected. If it does and posts still come up empty, check the singleton document itself exists — query
`*[_type == "siteSettings"][0]` in the Vision tool; if it returns `null`, the document was deleted or never
created and needs recreating (any document with `_id: "siteSettings"` and a `defaultAuthor` reference works,
Studio's own "create new" won't offer it since it's a fixed-ID singleton, not a listed type).

---

## Media library: which posts use an image

**Studio -> Media** (top nav, next to Structure/Vision) shows every uploaded image in a grid, each with a
"Used in N posts" badge (or an amber "Not used" badge if nothing currently references it) — shipped
2026-07-30. Read-only, for reference before deleting an asset. Same underlying technique as the category/
snippet "Posts" tabs — a GROQ `references()` query — just applied at the image-asset level instead of a
specific document. Component: `src/sanity/components/MediaLibraryTool.tsx`, registered as a Studio tool in
`sanity.config.ts`.

**If the "Used in" counts look wrong:** the query only checks the `post` document type. If a future feature
lets other document types (e.g. author bios) hold images too, this tool's query needs `_type == "post"`
widened to match — currently by design, since posts are the only place images live today.

---

## Reusable snippets

**Studio -> Reusable Snippets** (left sidebar) — shipped 2026-07-30. A snippet (pull quote, callout, call to
action, author bio, or disclaimer) lives as its own document; inserting it into a post's body via the editor's
block-insert menu ("Reusable snippet") stores only a *reference*, not a copy. Editing the snippet afterward
updates every post that uses it, automatically, without touching those posts. Each snippet also has a **Used
in** tab (same `ReferencedByPostsView` component as categories) showing which posts currently insert it,
before you edit or delete one.

**How it works, for troubleshooting:** the post body's Portable Text array can contain a `snippetRef` array
member (`src/sanity/schemaTypes/blockContentType.ts`) — a plain Sanity `reference` type used directly as an
array item, so Sanity stores it as `{_type: "snippetRef", _ref: "<snippet id>"}` inside `body[]`. The
frontend query (`POST_BY_SLUG_QUERY` in `src/sanity/lib/queries.ts`) dereferences it specifically:
`body[]{..., _type == "snippetRef" => {"snippetData": @->{title, snippetType, content}}}` — the `...` keeps
`_key`/`_type`/`_ref`, and the conditional branch adds the resolved snippet content as `snippetData`. The
renderer is in `src/components/asher/blog/portableTextComponents.tsx` (`types.snippetRef`), which picks a
visual treatment based on the snippet's `snippetType`.

**If a snippet shows up blank on the live post:** almost always the query wasn't updated to include the
`snippetData` projection (check `POST_BY_SLUG_QUERY` still has the `_type == "snippetRef" =>` branch shown
above) — without it, the block renders with only `_ref`, no actual content to show, and the renderer returns
`null` since it has nothing to display. Verified end-to-end 2026-07-30 with a throwaway test snippet/post
(created and deleted via script, never touched real content) before trusting it.

---

## Internal links: linking to another post without a raw URL

In the rich-text toolbar, alongside the existing **URL** link, there's now **Internal link (post)** — search
and pick a post (Sanity's own built-in reference search, type to filter by title) instead of typing or
pasting its URL. The link stores a reference to the post's stable `_id`, not its slug, so if you rename that
post's slug later, every internal link to it keeps working automatically — the current slug is resolved
fresh every time the linking post is rendered (`POST_BY_SLUG_QUERY`), never baked in at write time.

**How it works, for troubleshooting:** the annotation lives in `blockContentType.ts`'s `marks.annotations`
as `internalLink` (an object field wrapping a `reference` to `post`). The query dereferences it inside
`markDefs`: `markDefs[]{..., _type == "internalLink" => {"slug": reference->slug.current}}`. Renderer:
`src/components/asher/blog/portableTextComponents.tsx`'s `marks.internalLink`.

**If an internal link shows as plain text instead of a link:** the referenced post was deleted, or the query
projection above got removed/changed — `value?.slug` comes back `undefined` and the renderer falls back to
plain `<span>` text rather than a link to nowhere. Verified end-to-end 2026-07-30 with a throwaway test post
linking to a real post, confirming the resolved slug matched exactly.

---

## Distraction-free writing: what's actually there

The body field (Studio) now shows a small stats bar above the editor: live word count, estimated reading
time, and a session timer (time since the document was opened — resets on page reload, it's not a persistent
streak counter). Below that, a collapsible **Outline** lists every heading in the post with a best-effort
click-to-jump (scrolls the editor to that heading if found).

**Scope decision, on purpose:** the PRD also describes a fade-non-active-paragraph focus mode and a
cursor-centering typewriter scroll. Neither is built. Both require patching the Portable Text editor's own
rendering internals, which isn't a stable, documented customization surface in Sanity Studio — the "clever
and fragile" pattern Rule #4 warns against, and a real risk of breaking on a future Sanity upgrade for
comparatively little value. Full-screen writing itself is already covered by Studio's own built-in expand
button on this field (top-right of the editor toolbar) — nothing new was needed there.

**If the outline's click-to-jump doesn't scroll to the right place:** this relies on Sanity's Portable Text
editor rendering each block with a `data-key` attribute matching its `_key` — a reasonable but unverified
assumption (no Studio login available to visually confirm interactively this session). It's implemented
defensively (does nothing if the element isn't found, never errors) — if it's not working, the outline
listing itself (which headings exist, in order) is still accurate and useful on its own.

---

## Comments: how the moderation queue works

Every comment submitted on a post starts as **pending** and shows nowhere on the live site until approved.
**Studio → Comments** (top nav) is a dedicated moderation queue — not a plain document list — showing every
comment with one-click **Approve**/**Reject** buttons, and a count of comments awaiting review at the top of
the tool. Component: `src/sanity/components/CommentsTool.tsx`.

**Spam protection:** a honeypot field (a hidden `website` input — real visitors never see or fill it; if it's
filled, the request is silently accepted but nothing is actually saved) plus a simple math challenge (e.g.
"4 + 6 = ?"). Unlike the equivalent-looking check on the contact form, which is only validated in the
browser, this one is also re-checked server-side in `/api/comments`'s `POST` handler — a bot posting directly
to the endpoint, skipping the visible form entirely, can't bypass it the way it currently could on
`/api/contact`. Worth applying the same server-side check to `/api/contact` at some point for consistency,
though the contact form is lower-risk (not publicly crawlable/spammable the way an open comment section is).

**Two real bugs caught during testing, before this went live:**
1. The comment-fetching route originally used the normal CDN-cached read client (`src/sanity/lib/client.ts`).
   Sanity's CDN can take up to ~30-60 seconds to reflect a recent write — meaning approving a comment in
   Studio wouldn't actually make it appear live right away. Fixed by using the non-cached `writeClient` for
   reads in this route specifically (`src/app/api/comments/route.ts`), accepting a slightly higher read cost
   for comments in exchange for approvals feeling close to instant.
2. `createdAt` came back `null` on comments created via the API. The schema's `initialValue` for this field
   (`() => new Date().toISOString()`) only fires when a document is created through Studio's own UI, not via
   `client.create()` — the same gotcha already documented for the AI Suggestion Settings singleton earlier in
   this file. Fixed by setting `createdAt` explicitly in the API route rather than relying on the schema.
   **If any future feature creates documents via the API for a schema type with an `initialValue`, don't
   assume it fires — set required fields explicitly in the API code.**

**If a submitted comment never shows up, even as "pending":** check Studio → Comments directly first — the
submitter never sees whether their comment was flagged as spam or is just awaiting review (deliberately, to
avoid telling spammers which submissions got through). If it's not there at all, check the honeypot wasn't
accidentally triggered (an autofill browser extension filling every input on the page, for example) or the
math captcha wasn't miskeyed.

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

## Standalone pages: /connect and the 404 page

**Both now share the same global `SiteHeader`/`SiteFooter` as every other page** (fixed 2026-07-30) — see
the theme incident below for why they didn't before. `/connect` also now embeds the same `ContactForm` used
on the homepage (`src/components/asher/ContactForm.tsx`) instead of just a plain `mailto:` link, so a visitor
landing there directly (e.g. from an Instagram bio) can send a real message without navigating elsewhere.

**Contact email:** `CONTACT_INFO.email` in `src/components/asher/data.ts` is the one place this is defined —
`SiteFooter.tsx` reads from it too instead of its own hardcoded copy (fixed 2026-07-30, after the two had
drifted to different addresses). Currently `hello@asheraw.com`. The contact *form's* Resend notification
email is separate and lives in Vercel's `CONTACT_NOTIFICATION_EMAIL` environment variable — changing
`CONTACT_INFO.email` does not change where form submissions get emailed; that needs updating directly in
Vercel if it should also change.

**404 page tab title:** `not-found.tsx` is a known, longstanding Next.js App Router bug (metadata exported
from it — including `title` — frequently fails to render, especially for a genuinely unmatched URL rather
than a matched route calling `notFound()` itself; see vercel/next.js#61236, #49030, #46619). Worked around by
also setting `document.title` directly in `src/components/asher/NotFoundContent.tsx`'s mount effect — this is
what actually reflects in the browser tab; the `metadata` export in `src/app/not-found.tsx` is kept too since
it does still apply to some fields (confirmed `robots: noindex` renders correctly) but shouldn't be trusted
alone for `title` in this specific file. If a future Next.js upgrade fixes this upstream, the manual
`document.title` line is harmless to leave in place either way.

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
**Follow-up:** Superseded same day — `ConnectThemeToggle.tsx` was replaced by making `SiteHeader`/`SiteFooter`
global (see the 2026-07-30 "Global header/footer" entry below), and Asher reported the home→blog flash still
happening even after this fix shipped — see the next entry.

### 2026-07-30 — Global header/footer, and the home→blog flash reported as still happening
**What changed:** `SiteHeader`/`SiteFooter` now render once from `(site)/layout.tsx` instead of every page
placing its own copy (`ConnectThemeToggle.tsx` from the entry above removed, no longer needed). Pages that
need something different register it via `<ConfigureSiteChrome />` (`src/components/asher/SiteChromeConfig.tsx`)
instead of prop drilling — e.g. the homepage's Story/Play switch, `/connect` opting into (later, the full
footer instead of opting out).
**Symptom, still reported after this shipped:** Asher's exact repro — home, toggle to light, click the header
Blog link (full page reload), land on `/blog` still showing the old dark-flash colours; toggling once more
switches correctly to dark, but toggling back to light stays wrong; only toggling to dark + a hard refresh +
toggling again produces correct colours from then on.
**Investigated, not reproduced:** scripted browser checks — real clicks (not just `localStorage` injection),
heavy CPU throttling (6×) plus artificial per-chunk network delay, sampling computed background colour and
`<html>` class every ~80ms through the entire navigation — against both `localhost` (production build) and
the live site. Every run showed the correct class/colour at every sampled point, on both environments, both
before and after the ThemeProvider hydration fix above. Ruled out: a global CSS `transition` on
`background-color` that could visually blend dark/light during a real (non-instant) switch (checked
`globals.css` directly — no such transition exists, only `color`/`opacity`/`transform` transitions elsewhere).
Ruled out: stale CDN/ISR caching of pre-fix HTML (checked via curl that the live `/blog` HTML already
contains the current theme-init script).
**Status: open.** Real, reported twice independently (by Asher, in his own browser, after two different
attempted fixes) but not reproducible via any automated test tried so far. Needs Asher's specific browser and
device to continue — this exact combination (real device, real network conditions, real click timing) has
never been tested, only simulated.
**Follow-up:** Get browser/device details and, ideally, a screen recording of the actual repro next time this
comes up, before attempting another blind fix — two fixes have already shipped for this exact symptom without
confirming it's actually resolved from Asher's side. **Update, same day:** narrowed — Chrome confirmed working
correctly; the bug reproduces specifically on Comet (Perplexity's AI-agentic browser). Given how niche that
browser is, likely not worth further investigation unless Asher decides Comet-user support specifically
matters — his own assessment: "probably a rare case."

### 2026-07-30 — `not-found.tsx` metadata doesn't render (Next.js bug), 404 tab showed the raw URL
**Symptom:** the browser tab for a 404 page showed the raw URL (e.g. "asheraw.com/this-page-does-not-exist")
instead of any page title.
**Root cause:** confirmed via web search as a known, longstanding Next.js App Router limitation — metadata
exported from `not-found.tsx` (this project's is at the app root, required by Next.js for the global 404
boundary) frequently fails to render, `title` especially, for a genuinely unmatched URL. Verified directly:
added a `metadata` export with `title`/`description`/`robots`, rebuilt, and checked the raw server HTML — no
`<title>` tag rendered at all (confirmed via `curl`, ruling out a client-side-only quirk), while the `robots`
field from that same object *did* render correctly (`<meta name="robots" content="noindex">`). Related, open
Next.js issues: vercel/next.js#61236, #76923, #49030, #46619.
**Fix:** kept the `metadata` export (still correct for the fields that do work) and added a
`document.title = "..."` assignment in `NotFoundContent.tsx`'s mount effect as the actual, reliable fix for
the tab title specifically — confirmed working via a real browser check (`page.title()` returned the correct
string after the fix, empty string before it).
**Follow-up:** if a future Next.js upgrade resolves the underlying bug, the manual `document.title` line is
harmless to leave in place regardless — safe to leave as-is rather than needing to revisit.

### 2026-07-30 — Blog post OG image not showing on WhatsApp shares
**Symptom:** sharing a real, published post link on WhatsApp showed the title/description text but no
preview image, despite the post having a Main Image set and the code already falling back to it correctly.
**Root cause:** the OG/Twitter image URL requested a crop (`width(1200).height(630).fit("crop")`) but no
format or quality, so Sanity's image CDN served the source file as-is. For this post's source image (a PNG),
that came out to roughly 2MB at this crop size — confirmed directly via `curl` on the exact URL from the
live page's actual `og:image` meta tag. WhatsApp's link-preview crawler is known to silently drop the image
rather than show one that's slow or large to fetch, rather than erroring visibly.
**Fix:** added `.format("jpg").quality(75)` to the OG/Twitter/structured-data image URL builders in
`src/app/(site)/blog/[slug]/page.tsx`, and the same fix to `PostCard.tsx`'s blog-list thumbnails (identical
unbounded-size pattern, page-load-weight issue rather than an OG-specific one). Confirmed the exact same
source image at the new URL: ~224KB (9x smaller), and downloaded + visually inspected it — no visible quality
loss for a photo/illustration-style crop.
**Follow-up:** WhatsApp (via Facebook's crawler) caches a link's preview aggressively. Once this fix is live,
any post URL already shared/tested before the fix may keep showing the old (imageless) cached preview until
force-refreshed via [Facebook's Sharing Debugger](https://developers.facebook.com/tools/debug/) — paste the
post URL in and click "Scrape Again." New shares of any post should show the image correctly without needing
this step.
