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

**For ideas that came up and were deliberately deferred, read `IDEAS.md`** — a running "good to have, not
now" list, separate from the actual phase roadmap. Check there before re-proposing something from scratch.

---

## How urgent is it? (severity levels)

- **P0 — Site down, or content lost.** Act immediately.
- **P1 — Publishing or a core flow is broken** (e.g. new posts don't appear, contact form silently fails). Act within the day.
- **P2 — Something's degraded but there's a workaround.** Fix soon, not urgent.
- **P3 — Cosmetic / doesn't affect visitors.** Fix whenever convenient.

---

## Starting a new post: one click, not three (shipped 2026-08-06)

**Studio sidebar → "New Post"** (top of the list, above "Posts") opens straight into a blank post editor in
one click, instead of "Posts → + → New Post." Asher's own ask, mid-build on an unrelated task — his single
most frequent action was two clicks longer than it needed to be.

**Not the old WordPress "auto-draft on page load" pattern**, which Asher specifically flagged wanting to
avoid (WordPress silently creates a real database row the instant you open the new-post screen, even if you
never type anything, leaving abandoned drafts behind). This doesn't do that: opening the pane doesn't write
anything. Sanity's own document model already works this way for every "+ New" button in Studio — nothing is
created in the dataset until the first real edit happens (the first patch triggers the first mutation). This
shortcut inherits that for free; it isn't a new mechanism, just a new entry point into the same one.

**Implementation note for future changes here:** the child resolver (`structure.tsx`) generates a fresh
`crypto.randomUUID()` **inside the function body**, called fresh on every navigation into the item — not a
module-level constant computed once per Studio load. That distinction matters: a static id would mean a
second click within the same Studio session reopens whatever got typed and abandoned on the first click,
instead of a genuinely blank one. If this ever needs the SEO Preview tab or any other per-post view added,
mirror it from the "Posts" list item's own `.child()` just below it in the same file — they're meant to stay
in sync.

---

## Post editor: fieldsets (shipped 2026-08-08)

`postType.ts`'s 17 fields (excluding body/title/slug/main image, at the very top) are grouped into five
named `fieldsets` -- **Organize** (categories, primary category, tags), **Publishing** (author, published
date, scheduled date), **Search & Sharing** (excerpt, SEO title, social image, branded card toggle,
hide-from-search toggle), **Discussion** (lock comments), and **PLAY mode** (collapsed by default, since
it's off for most posts). Came from a direct UX audit Asher asked for ("analyse the editor page... suggest
if any of them should be grouped together").

**Field order is unchanged on purpose.** There's a long-standing comment at the top of the file explaining
that the order already matches how Asher actually writes (body first, then title, then everything
downstream). The fieldsets just add a visible divider + heading at seams that were already implicit in
that ordering logic -- nothing was moved to make this work, which is also why every fieldset's fields are
already contiguous in the array (Sanity groups a fieldset's fields together regardless of array position,
but keeping them contiguous is far easier to read in the schema file itself).

**If a new field gets added to the post schema later**, decide which existing fieldset it belongs to (or
whether it genuinely needs a new one) rather than leaving it ungrouped by default -- an ungrouped field
still renders fine, it just quietly falls back to the old flat-list problem this change was meant to fix.

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

**Bumped to v6.9.0 on 2026-08-06** — fixes a Structure pane display bug Asher hit: the left-hand navigation
list (Posts, Categories, Site Admin, etc.) would show everything correctly on first load, then go mostly
blank — leaving only the last item or two visible — the moment the pane collapsed and was re-expanded (e.g.
from a browser resize narrow enough to auto-collapse it). Confirmed this wasn't coming from this project's
own `structure.tsx` (it's a fully static, synchronous list — no async loading or collapse-handling logic that
could produce that symptom), which points to it being a bug in Sanity Studio's own structure-pane list
virtualization, fixed upstream between v6.7.0 and v6.9.0. `@sanity/vision` bumped alongside it to keep
versions in lockstep. Verified after the bump: `tsc --noEmit` (unchanged error count), `eslint`, and a full
`next build` all still succeed — but the actual pane behavior couldn't be re-tested live in this sandbox (no
network access to Sanity's API here, same limitation noted throughout "Publishing" below), so this is
worth a quick visual check in Studio after deploy: collapse the pane (or resize the browser narrow enough to
trigger it), re-expand, and confirm the full list still shows. If it still reproduces, the bug likely wasn't
fully fixed upstream yet, or a different trigger is involved — worth filing with Sanity directly at that point
rather than guessing further at a fix in this codebase.

---

## Date display format across Studio (shipped 2026-08-05)

Every `datetime` field in Studio shows as `YYYY-MMM-DD HH:mm` (e.g. `2026-Aug-05 14:30`), not Sanity's own
default `YYYY-MM-DD HH:mm`. Set per-field via the schema, not a custom input component — Sanity's built-in
datetime input reads an `options.dateFormat` string (Moment-style tokens: `YYYY`/`MMM`/`DD`), defaulting to
the literal string `"YYYY-MM-DD"` if the option isn't set (confirmed by reading `@sanity/util`'s
`legacyDateFormat.js` directly, not assumed).

**To add a new `datetime` field**, include `options: {dateFormat: 'YYYY-MMM-DD'}` so it matches every other
date in Studio — easy to forget since the field still works perfectly well without it, just in the old
numeric-month format. All 17 existing `datetime` fields have it (`postType`, `commentType`,
`bulkOperationLogType`, `linkCheckType`, `notFoundHitType`, `shareLogType`, `aiOutputLogType`,
`consentLogType`) — grep for `type: 'datetime'` across `src/sanity/schemaTypes/` to find any that don't.
Time format (`HH:mm`) is untouched — only the date portion changed, since that's what was actually asked
for.

---

## Studio's top nav: kept short on purpose (reorganized 2026-08-05)

Every tool built this session got its own top-nav slot as it shipped, one at a time, with nobody stepping
back to look at the growing bar as a whole — it reached 14 items before Asher flagged it directly. Fixed
with three different moves, not just a repaint:

**Removed entirely**: `visionTool()` (the GROQ query console plugin) and `releases: {enabled: false}`
(Sanity's own content-scheduling feature — never explicitly configured in this project, just a Studio v6
default that appears on its own). Both in `sanity.config.ts`. Neither is something a non-technical site
owner would reach for directly; Releases specifically duplicates what the Editorial Calendar tool already
does.

**Merged**: Content Audit + Link Checker → **Content Health** (`ContentHealthTool.tsx`), a tabbed wrapper
around the same two unchanged components — see their own sections above/below for what each tab actually
does. The merge only touched page-level chrome: both `ContentAuditTool.tsx` and `LinkCheckerTool.tsx` no
longer render their own outer `Box padding`/title, since `ContentHealthTool.tsx` provides that once for
both tabs now.

**Double-checked afterward, not just assumed correct**: diffed both components against their pre-merge
commits — confirmed the only change in each really was the outer chrome, nothing functional dropped. Along
the way, found (pre-existing, not caused by the merge) that Content Audit's query fetched every post's
`slug` without ever using it, and that the "open this post in its own Studio editor" deep link
was duplicated verbatim in both Content Audit and `DistributionDashboardTool.tsx`. Fixed both: dropped the
unused field, extracted the deep link into `src/sanity/lib/openPostInStudio.ts`
(`openPostInStudio(postId)`) — reuse this for any future tool that needs an "open this post" button rather
than re-writing the URL by hand. **The extracted URL itself was wrong at the time** (used a guessed
structure-tool pane path, `/studio/structure/post;<id>`) — see the "Open post" links section further below
for the real fix, added the same day once Asher clicked one and it didn't work.

**Moved into the Structure sidebar**: 404 Hits, Contact Submissions, Export, and Bulk Operations — occasional
admin tools, not daily-use — now live under a **Site Admin** entry in `structure.tsx` instead of the top
bar, via Structure Builder's `S.component(MyToolComponent)`. This is a real, first-class Structure Builder
API (confirmed directly in the installed `sanity` package's own type definitions —
`component(component: UserComponent): ComponentBuilder`, distinct from the already-used
`S.view.component(...)` for document-view tabs) for embedding any custom React component as a structure
pane, the same family of builder as `S.document()`/`S.list()`. The components themselves are completely
unchanged — only where they're mounted moved, from `sanity.config.ts`'s `tools` array to a
`S.listItem().child(S.component(Component).title('...'))` entry.

**To add a new occasional-use admin tool going forward**: prefer `S.component()` in `structure.tsx`'s
"Site Admin" list over a new top-nav entry in `sanity.config.ts`, unless it's something Asher will actually
open daily (that's the bar Comments/Distribution/Calendar/Media clear, which is why they stayed in the top
bar). Keeps the top nav from slowly regrowing the same way it did this session.

**Final top nav**: Structure, Presentation, Media, Comments, Distribution, Calendar, Content Health — down
from 14.

---

## Prepare for Publish: checklist + AI-suggested SEO

**The pre-publish checklist** (shipped 2026-07-29) runs automatically every time Publish is clicked on a
post — no setup needed. If the post is missing a featured image, an excerpt, a category, or has an
overly-long title, a dialog lists what's missing with a choice to go fix it or publish anyway. If nothing's
flagged, publishing works exactly as before with no extra step.

**"Suggest SEO & Excerpt"** (in the "..." menu next to Publish, **and** as its own button on the SEO
Preview tab below since 2026-08-08) drafts 3 options each for SEO title and
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

**One dialog, two entry points (shipped 2026-08-08).** The whole "Suggest SEO & Excerpt" experience -- the
fetch to `/api/ai/suggest-seo`, every result card (title/excerpt/tags/headlines/pull quotes/FAQs), the
"Use this" patch logic -- lives in `src/sanity/components/SuggestSeoShared.tsx`. Both
`suggestSeo.tsx` (the document action next to Publish) and `SuggestSeoButton.tsx` (the button on the SEO
Preview tab) import from it rather than each having their own copy; only the surrounding chrome differs --
the document action returns Sanity's own action-framework `dialog` shape, the tab button renders a plain
`@sanity/ui` `Dialog` itself. **If a suggestion result ever looks wrong or a patch doesn't apply, the fix
belongs in `SuggestSeoShared.tsx`** -- fixing it in only one of the two callers would silently leave the
other one still broken.

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

**"SEO Preview" tab** (shipped 2026-07-31): every post's document pane has a second tab next to the normal
Editor form (`src/sanity/components/SeoPreviewView.tsx`, wired in `structure.tsx`) — an approximate Google
search-result preview and social-share-card mockup, live character counts against the same 70/160 limits the
schema fields and "Suggest SEO & Excerpt" already use, and the same "worth a look" checklist the pre-publish
dialog shows (now also flags a featured image with no alt text, not just a missing image). Updates as the
draft autosaves via Sanity's own `useEditState` hook — not a fixed snapshot, no separate "refresh" step.
Complements, doesn't replace, the pre-publish dialog: that one's a last-chance popup right before Publish,
this one's visible the whole time you're actually writing. Both share one function
(`getChecklistIssues`, exported from `prepareForPublish.tsx`) for what counts as "worth a look," so the two
can't quietly disagree with each other. **Also has its own "Suggest SEO & Excerpt" button right above the
checklist since 2026-08-08** — Asher pointed out the action that fixes what the checklist flags shouldn't
live in a different menu entirely; see the "One dialog, two entry points" note above.

---

## Redirects: old URL → new URL (shipped 2026-07-31)

**Studio → Redirects** (`src/sanity/schemaTypes/redirectType.ts`): add a "From path" (e.g. `/blog/old-slug`)
and a "To path or URL" (an internal path or a full URL), and every visitor hitting the old path gets sent to
the new one automatically — no rebuild, no redeploy. Toggle "Permanent (301)" off for a temporary (302)
redirect; on (the default) is right for almost every real case here, like a renamed post's old slug or a page
that's gone for good. A duplicate "From path" is blocked at save time (checked against every other redirect,
draft or published).

**How it actually works:** `src/middleware.ts` runs on every request, checks the path against the current
redirect list, and — if there's a match — redirects before Next.js even tries to match a route. The list
itself is fetched from Sanity's CDN API directly (a plain `fetch`, not the `@sanity/client` SDK, to stay
definitely compatible with the Edge runtime middleware runs on) and cached in memory for **60 seconds per edge
instance** — same tradeoff as this site's other `revalidate = 60` pages: a brand-new or just-edited redirect
can take up to a minute to actually start working, in exchange for not hitting Sanity on every single page
view. `/studio/**`, `/_next/**`, and `/favicon.ico` are excluded from ever being redirected (`config.matcher`
in `middleware.ts`) — a redirect should never be able to break access to Studio itself or static assets.

**If a redirect isn't working:** check it's actually saved as *published* in Studio, not just a draft (an
unpublished redirect document is invisible to `middleware.ts`, which queries the published dataset). If it
was just added or edited, wait up to a minute for the cache to catch up before assuming it's broken. Also
double-check "From path" starts with `/` and has no query string — validation should catch this at save time,
but it's the first thing to check if a redirect that looks right still isn't firing.

**Creating one from a 404 (shipped 2026-08-04):** the faster path for most real redirects — go to **Studio →
404 Hits** instead, click **Create redirect** on the broken path, and search for the right destination
(`src/sanity/components/CreateRedirectForm.tsx`) rather than adding a document by hand and typing both sides
of it. Same underlying `redirect` document either way, and the 404 hit gets marked Actioned automatically
once it's created.

**Legacy `.html` URLs (shipped 2026-08-04):** handled separately from the Sanity-managed redirect list above
— `middleware.ts` unconditionally strips a trailing `.html` from any path and 301s to the same path without
it, *before* falling through to normal routing. This app has no `.html` routes, so it's always safe: the
trimmed path either resolves to a real page or 404s exactly like the `.html` version would have. Fixes every
old `.html` link from the pre-migration site at once (e.g. `/blog/some-post.html` → `/blog/some-post`) without
needing a Redirect document per post. No Studio setup involved — nothing to check here if a `.html` link isn't
redirecting except that the deployed `middleware.ts` actually includes this rule.

---

## Link Checker: broken links, monitoring, and affiliate registry (shipped 2026-08-04, moved into Content Health 2026-08-05)

**Studio → Content Health → Link Checker tab** (moved out of its own top-nav slot the same day Content
Audit shipped — merged into one tool, see the top-nav cleanup entry below) scans every post and reusable
snippet's own rich text for links — both
the plain URL annotation and the Affiliate link one (below) — and checks each URL live: HEAD first, falling
back to GET for hosts that reject HEAD outright. Results group into four sections: **Broken**, **Possibly
Blocked**, **Affiliate links**, **Everything else**. Component: `src/sanity/components/LinkCheckerTool.tsx`.
Shared checking logic: `src/lib/linkChecker.ts`.

**Results persist, not just report.** Each checked URL is its own `linkCheck` document (deterministic id
hashed from the URL, so re-checking upserts rather than duplicating), storing which post(s)/snippet(s) use it,
last status, and `brokenSince` (set the first time a URL fails, left untouched on every subsequent failed
check, cleared automatically the moment it passes again). A URL that's been removed from every post/snippet
it used to appear in has its `linkCheck` document deleted on the next run — the registry only ever reflects
what's actually in current content, never stale history.

**Monitoring, not just an on-demand audit.** `vercel.json` runs `/api/cron/check-links` **daily** (bumped
from weekly 2026-08-08 — see below; same `CRON_SECRET` auth as `/api/cron/purge-trash` — already
configured, nothing new to set up). **Check now** in the tool itself calls `/api/check-links` (no cron
secret needed — same no-extra-auth pattern as the AI suggestion routes, since reaching Studio is the access
control on this solo-owner site) to run the identical check on demand.

**"A link I removed/changed still shows up" almost always means cadence, not a bug (confirmed 2026-08-08).**
The cleanup logic above (deleting a `linkCheck` doc once its URL no longer appears anywhere) only runs
*during* a check — it can't retroactively notice an edit that happened after the last one. If this ever
comes up again: check `lastCheckedAt` on the affected row (or the tool's own "Last checked" line) before
assuming the cleanup itself is broken — if it predates the edit, click **Check now** rather than waiting
for tomorrow's automatic run.

**A failed check retries once before being recorded as broken at all (shipped 2026-08-08).** Confirmed on a
real case: `webmd.com` was recorded as a 500, but came back a clean 200 moments later — a check run
shouldn't permanently flag something broken over one bad second. `checkUrl()` in `linkChecker.ts` now waits
`RETRY_DELAY_MS` (3s) and tries again once before giving up. Verified this doesn't mask real breakage — a
genuinely 404'd URL stays broken through the retry in a direct test.

**"Possibly Blocked" is a real, separate classification, not just a caveat in the copy (fixed 2026-08-05,
extended 2026-08-08).** Some sites — Instagram most aggressively, but also Vercel's own bot protection
occasionally blocking this checker's distinctive User-Agent on `asheraw.com`'s own pages — return
`401`/`403`/`429` to automated-looking requests specifically, regardless of whether the page is actually
fine for a real visitor. **`500` joined this set 2026-08-08**, on the same kind of direct evidence as the
original three, not a guess: `webmd.com` consistently returned `500` from Vercel's own serverless IPs
specifically (even after the retry above), while the identical URL came back a clean `200` from a
different network every single time — a persistent IP-reputation block (common for CDNs/WAFs against
datacenter/cloud IP ranges), not a real broken link. All four status codes get a `blocked: true` flag
computed once at check time (`BOT_BLOCK_STATUS_CODES` in `linkChecker.ts`) and persisted on the document,
so they show under their own amber **Possibly Blocked** section instead of being lumped in with genuine
`404`s/dead domains under **Broken**. **A "Possibly Blocked" result is still worth a quick manual click
before assuming it's fine** — the classification is a strong signal, not a guarantee, since a small number
of sites could plausibly return one of these codes for a genuinely-gone page too.

**Hover a status badge to see what it means.** `STATUS_MEANINGS` in `LinkCheckerTool.tsx` is a plain-English,
one-line explanation per HTTP code this checker actually encounters (400/401/403/404/410/429/500/502/503/504)
— shown as a `Tooltip` on the badge. Added directly because Asher said he doesn't always remember what each
code means; codes outside this list still show their raw number with a generic fallback explanation.

**Each source is individually clickable, straight into its own Studio editor.** Previously plain text
("Post: Title · Post: Other Title"); each post/snippet reference under a checked link now opens that exact
document via `openDocumentInStudio(schemaType, id)` (`src/sanity/lib/openPostInStudio.ts`, generalized the
same day from the post-only `openPostInStudio()` helper to also cover snippets). Needed threading each
source's real document `_id` through `linkChecker.ts`'s `Source` type and `collectLinks()` queries — it
previously only tracked `type`/`title`/`slug`, none of which alone is enough to build a Studio deep link.
**The URL this built was wrong at first** — see "Open post" links: the real fix below for what actually
makes these work, fixed the same day once Asher clicked one and it didn't load.

**Affiliate links.** A separate "Affiliate link" annotation next to the plain URL one in the post editor
(`blockContentType.ts`) — picking it instead of a plain link does two things automatically: the rendered link
gets `rel="sponsored"` (Google's recommended rel attribute for paid/affiliate links, distinct from a plain
`nofollow`), and the post gets a disclosure banner (`AffiliateDisclosure.tsx`) rendered automatically above
the body — driven by `bodyHasAffiliateLinks()` scanning the post's own markDefs (`src/lib/portableText.ts`),
not a separate toggle a writer has to remember to flip. Not a US-specific/FTC thing — Asher is Singapore-based,
where FTC rules don't apply directly, but disclosure is still the right call: Singapore's own ad standards
body (ASAS/SCAP) expects sponsored content to be identifiable as such, and merchant affiliate programs
(Amazon Associates being the obvious one, given the two books on the roadmap) contractually require a
disclosure statement from every affiliate regardless of where they're based, as a term of the program itself.
No disclosure banner showing on a post that should have one almost always means the link was added via the
plain "External URL"
annotation instead of "Affiliate link" by mistake — check which one was actually picked.

---

## "Open post" links: the real fix (shipped 2026-08-05)

Every "open this in Studio" button (Content Audit, Distribution, Link Checker's clickable sources) shares
`src/sanity/lib/openPostInStudio.ts`'s `openDocumentInStudio(schemaType, id)`. The first version constructed
a structure-tool pane path by hand — `/studio/structure/<paneId>;<id>`, guessing `<paneId>` equals the
schema type name based on how `S.documentTypeList()`'s default id assignment works. It typechecked, it
matched that convention correctly on paper — and it still didn't work. Asher clicked one: new tab opened,
editor never loaded. A pane path depends on the exact shape of the pane stack `structure.tsx` builds, which
isn't something to reliably guess from a helper function that lives entirely outside the structure tree —
the assumption was reasonable but wrong, and this sandbox has no Studio login to have caught that by
actually clicking it before shipping.

**The actual fix**: Sanity's own **intent** URL scheme —
`/studio/intent/edit/id=<id>;type=<schemaType>/` — a documented, stable route built specifically for
deep-linking to a document from *outside* the structure tool, resolved dynamically at runtime rather than
depending on pane topology at all. Confirmed this is real and not another guess by reading the actual
matching function in Sanity's own compiled source (`defaultIntentChecker`, `sanity/structure`): for an
`edit` intent, it checks `params.id` is set and `params.type` is included in the pane's own
`schemaTypeName` list — which `S.documentTypeList('post')`/`S.documentTypeList('snippet')` in
`structure.tsx` already set correctly, unchanged, with zero further edits needed there. One fix in one
shared helper covers all three buttons.

**Verification limit, stated plainly**: still no way to click-test this directly in this sandbox — Studio
requires a real login, and even the plain `/studio` route hits a "Connect this Studio to your project"
CORS gate here regardless of any code change, confirmed by checking that the *unmodified* route hits the
same screen. What changed this time versus the first (wrong) attempt: the fix is grounded in tracing the
exact runtime matching logic that will process the URL, not an assumed convention that merely looked
plausible.

---

## Studio landing dashboard (shipped 2026-08-11)

**`src/sanity/components/DashboardTool.tsx`**, wired in via `sanity.config.ts`'s `tools: (prev) => [...]`
callback — prepended *before* `...prev`, not appended after like every other custom tool. Studio renders
whichever tool is first in the final array as the default view at the bare `/studio` root, so this one
line is the entire mechanism that makes it the landing screen; nothing else about tool routing changed,
every other tool keeps its exact existing `/studio/<name>` path.

**Every number on it is a re-query of data an existing tool already shows** — pending comments
(`usePendingCommentCount`), unread contact submissions (`usePendingContactCount`), Content Health issues
(same `linkCheck`/audit logic as `ContentHealthTool.tsx`, computed the same way, not cached differently),
404/error-log pending counts, cookie consent totals, scheduled-post count. Deliberately not a second source
of truth — if a tool's own count and the dashboard's count ever disagree, that's a bug, not two systems
that are allowed to drift.

**Deep-linking required real research, not another guess** — this project already shipped one broken
Studio URL once (see "Open post links: the real fix" above). Two genuinely different link mechanisms are
used here, and they're not interchangeable:
- **Top-level tools** (Comments, Distribution, Editorial Calendar, Content Health) → plain `/studio/<name>`,
  matching each tool's registered `name` in `sanity.config.ts`. This is Studio's top-level router matching
  a name directly — stable regardless of how `structure.tsx`'s pane tree is shaped.
- **Nested Structure items** (Site Admin's own sub-items — 404 Hits, Contact Submissions, Error Log, Search
  Queries, Cookie Consent Log) → `/studio/structure/siteAdmin;<childId>`. Confirmed by reading Sanity's own
  router source (`encodePanesSegment` in the installed `sanity` package) rather than assumed: nested pane
  groups are joined by `;` in the URL, one segment per depth. The part that's *not* guessable from outside
  is the actual id string each pane resolves to — unset, a list item's id defaults to `camelCase(title)`
  (verified in `ListItemBuilder`'s source), which is fine for "Contact Submissions" but genuinely ambiguous
  for a title starting with a digit like "404 Hits". Fixed at the source: every item the dashboard links to
  now has an explicit `.id(...)` set in `structure.tsx` itself, so the dashboard's links are built from
  strings this codebase controls directly, not Sanity's slugifier.
- **"New post"** uses neither — it's the existing `openDocumentInStudio('post', crypto.randomUUID())`
  helper (`src/sanity/lib/openPostInStudio.ts`), Sanity's documented intent-URL scheme, same mechanism the
  "Open post" fix above already established for opening a specific document from outside the structure tree.

**Same verification limit as that earlier fix, stated the same way**: no real Studio login exists in this
sandbox to click every link and confirm it lands exactly right — the CORS gate on `/studio` blocks that
regardless of any code change. What's different from a plain guess: the URL *format* is confirmed from
Sanity's own source, and the *ids* are no longer inferred at all, they're set explicitly by this same
commit. Worth an actual click-through after deploying to catch anything this couldn't verify statically.

**Google Analytics traffic is a plain text note, not a stat** — Asher asked for it "if it can't be pulled in
automatically, skip it." Checked first: no `@google-analytics/data` or `googleapis` dependency, no
service-account env vars, nothing server-side beyond the client-side `gtag()` event calls in
`src/lib/analytics.ts`. Wiring up real GA4 Data API access is a genuine new integration (a Google Cloud
service account, new credentials Asher would need to create and hand over) — out of scope for a dashboard
layout decision, left as an honest placeholder rather than invented.

---

## Social Images: focal-point crops, branded cards, DreamLab prompts (shipped 2026-08-04)

**Focal point actually matters now.** Every image field (`mainImage`, `socialImage`, author photo) has had
hotspot/focal-point controls in Studio's own image editor from the start — click into the image, drag the
circle to mark what matters. Until this shipped, that data was collected but never actually *used*: every
crop site-wide called `.fit("crop")` without `.crop("focalpoint")`, so Sanity silently fell back to plain
center-cropping everywhere. Fixed at every call site (`src/sanity/lib/image.ts` usages in `[slug]/page.tsx`,
`layout.tsx`, `PostCard.tsx`, `RelatedPosts.tsx`, `author/[slug]/page.tsx`, `SeoPreviewView.tsx`). If a crop
still looks off after setting a focal point, check the specific `.fit("crop")` call in question actually has
`.crop("focalpoint")` chained after it — a new call site added later that forgets it will silently regress to
center-cropping again.

**Crop previews.** The existing SEO Preview tab (per-post, alongside the normal Editor form) now shows Square
(1:1) and Vertical (4:5) previews in addition to the landscape OG-style one — purely a manual reference for
pasting into another platform's own composer by hand; nothing auto-publishes to Instagram/TikTok/etc.

**Branded social card.** `useBrandedSocialCard` boolean on `postType.ts`, off by default. When on,
`generateMetadata()` in `[slug]/page.tsx` points `openGraph.images`/`twitter.images`/JSON-LD's `image` at
`/api/og/[slug]` instead of the real photo. That route (`src/app/api/og/[slug]/route.tsx`, edge runtime) uses
Next.js's `ImageResponse` to render a title/category/author card in the site's own brand colors, fetching a
real Playfair Display webfont at request time (Google Fonts CSS2 API, scoped to just the characters needed).
If the branded card ever renders with a fallback serif instead of Playfair Display, the font fetch failed
silently (the route degrades gracefully rather than erroring) — check Google Fonts is actually reachable from
wherever this is deployed.

**DreamLab image prompts.** "Suggest Image Prompt" action on posts (`src/sanity/actions/suggestImagePrompt.tsx`
+ `/api/ai/suggest-image-prompt`) — same "AI proposes, human copies" shape as Draft Social Copy. Drafts two
visual concepts from the post's own content; Asher copies one into Canva DreamLab (or any image generator) by
hand, then uploads the result back into the post's Featured Image or Social Sharing Image field himself. Not
an automated Canva integration on purpose — the ACE spec explicitly says not to automate a workflow that
takes well under a minute manually unless a stable official API exists with clear long-term value.

**A caching note for anyone testing content changes locally:** raw Sanity writes made outside of Studio's own
editing session (e.g. a script using `@sanity/client` directly, the way this feature's own verification was
done) don't reliably show up through the dev server's `sanityFetch` (`next-sanity/live`) within the same
session — even across a full server restart with the cache cleared. This isn't specific to any one field; it
reproduces identically with long-standing fields too. Editing through Studio itself doesn't have this problem
(Studio maintains a live connection that revalidates properly) — it only bites raw-script testing.

---

## Skip-to-content link (shipped 2026-07-31)

An invisible-until-focused "Skip to content" link (`src/components/asher/SkipToContentLink.tsx`), the very
first focusable element on every page — Tab once, and a keyboard or screen-reader user can jump straight past
the header (logo, every nav link, the theme toggle) instead of tabbing through all of it on every single page
load. Mouse/touch visitors never see it; nothing about the page's normal appearance changed. Wired in twice,
matching the two places `SiteHeader` itself gets mounted independently: `(site)/layout.tsx` (covers the
homepage, blog, and connect) and `NotFoundContent.tsx` (the 404 page lives outside the `(site)` route group
entirely, so it needed its own copy). Targets `id="main-content"`, present on every page's main content
wrapper — if a new top-level page is ever added outside `BlogChrome`, give its own content wrapper that same
id or the skip link will silently do nothing on that one page.

---

## Post metadata: reading time, categories, tags

**Reading time** ("X min read", shown in Studio's post list and on the live blog) is calculated
automatically from the post body — nothing to fill in, and it can't go stale since it's computed fresh each
time rather than stored. Lives in `src/lib/portableText.ts` (`estimateReadingTimeMinutes`), shared by Studio
and the frontend so both always agree.

**Didn't count Quote Grid text until 2026-08-06 (real bug, caught by Asher on "The J Factor").** The word
count this is based on (`portableTextToPlainText()`, same file) only ever read `block`/`callout`/`accordion`
content -- a post built mostly out of Quote Grid blocks (real prose, just structured as name+quote entries
instead of plain paragraphs) had almost nothing left to count, floored at "1 min read" regardless of how much
was actually there to read. Fixed by adding a `quoteGrid` case that pulls every entry's `quote` text in, same
as callout/accordion already did. Since this function is shared everywhere reading time (or general body
plain-text) gets computed -- the live post page, Studio's own post list, the writing panel's word count, and
the AI Workspace's SEO/social-copy/image-prompt tools (they read the body as plain text for their prompts) --
this one fix corrects all of them at once, immediately, for every post that already has Quote Grid content
in it. No data migration needed; it's a pure computation fix, nothing stored changed.

**Confirmed actually showing up in practice, not just theoretical:** this is exactly why `/blog`'s card for
"The J Factor" showed "1 min read" during the stale-post incident (see "Publishing" further below) -- the
listing genuinely *was* seeing the new Quote Grid content (unlike the post's own page, separately stuck for
an unrelated reason), just via this still-undercounting computation. At the time, the blog listing card's own
reading time was computed through a different code path (see below) and still had the bug.

**Blog listing card also fixed, 2026-08-06 (same day, follow-up).** The post-page fix above didn't reach the
listing card (`PostCard.tsx`), category/tag/author pages, or pagination, because those all read reading time
from a *separate* GROQ-computed field (`POST_SUMMARY_PROJECTION`'s old `bodyPlainText`, built with Sanity's
own built-in `pt::text()` function) instead of the shared JS function -- and `pt::text()` has the exact same
blind spot `portableTextToPlainText()` used to have: it only pulls text from `block`-type spans, nothing from
`quoteGrid`/`callout`/`accordion`. Rather than trying to replicate the JS fix a second time in GROQ (risky to
get right blind, with no live query access to test against), `POST_SUMMARY_PROJECTION` now fetches a
lightweight `bodyBlocks` array (`_type`, `children[].text`, `text`, `content`, `entries[].quote` -- exactly
the fields `portableTextToPlainText()` reads, nothing more) and `PostCard.tsx` runs the same shared function
over it. One fewer parallel implementation to keep in sync, and the listing card's reading time (and its
auto-excerpt fallback, which reuses the same plain-text pass) now always matches the post page's own count.
Since `POST_SUMMARY_PROJECTION` is shared by the blog listing, category pages, tag pages, and author pages,
this one change covers all of them at once.

**Still not fixed, deliberately out of scope: Related Posts and site search.** `RELATED_POSTS_QUERY`'s
`autoExcerpt` (used by `RelatedPosts.tsx`, shown under a post) and `SEARCH_INDEX_QUERY`'s `blurb` (used by
`BlogSearch.tsx`) still use `pt::text()` and have the same blind spot -- left alone this round since neither
shows a reading time (blurb-undercounting is a much smaller cosmetic gap than the reading-time floor), and
`BlogSearch.tsx` in particular is deliberately kept to a lightweight per-post fetch (no full body) so search
stays fast even as the post count grows -- fetching `bodyBlocks` there would work against that. Worth
revisiting the same way if Quote-Grid-heavy posts turn up thin/empty related-post blurbs in practice.

**Categories** use a checkbox list in Studio (shipped 2026-07-29) instead of Sanity's default search-and-pick
popup — every existing category is visible at a glance, laid out in 2-3 columns depending on how many there
are. Custom input component: `src/sanity/components/CategoryCheckboxInput.tsx`.

**Tags autocomplete** (shipped 2026-07-29): typing suggests tags already used on other posts, to cut down on
near-duplicates. If nothing's suggested, that just means the tag you're typing hasn't been used before — not
a bug. Custom input component: `src/sanity/components/TagsAutocompleteInput.tsx`.

**Heading styles in the body editor** (changed 2026-07-31, `src/sanity/schemaTypes/blockContentType.ts`): "H1"
is no longer offered as a style choice — the post title itself (typed in its own field, not the body) is the
page's one real `<h1>`, so this stops multiple-H1 pages from happening by accident. The remaining choices are
labeled for what they're for rather than raw HTML tag names: **Header** (was "H2"), **Subhead** (was "H3"),
**Minor Heading** (was "H4"). Only the *labels* changed — the underlying style values are still literally
`h2`/`h3`/`h4`, so this didn't touch a single already-written post, and nothing else that keys off those
values (the reading progress bar's checkpoints and each `h2`'s anchor id, both in
`src/lib/portableText.ts`/`portableTextComponents.tsx`) needed to change either. Any post written before this
change that already used the old "H1" style still renders exactly as it always did — the choice was removed
from the editor going forward, not retroactively stripped from existing content.

---

## Blog post extras: related posts, print, search, the reading bar (shipped 2026-07-31)

**Page order after the post body:** tags/categories → comments → **Related Reading** → back-to-blog link.
Related Reading deliberately sits after the comment thread, not before it (moved there 2026-07-31 per Asher's
feedback after testing) — comments come right after the post itself.

**Related Reading**, shown after the comments, is any *other* published post sharing at least one
category or tag with the one being read, ranked by how much overlap there is (shared categories + shared
tags counted together), up to 3. `RELATED_POSTS_QUERY` in `src/sanity/lib/queries.ts`,
`src/components/asher/blog/RelatedPosts.tsx`. A post with no categories and no tags has nothing to relate on
— the section just doesn't render for it, rather than falling back to "recent posts," which would stop
meaning "related." Nothing to configure; it's automatic from whatever categories/tags a post already has.
The GROQ query itself only filters candidates and orders by `publishedAt desc`; the actual overlap-ranking
(picking the top 3) happens in JavaScript in `getRelatedPosts()` (`src/app/(site)/blog/[slug]/page.tsx`) --
deliberately kept out of GROQ's own `order()` after an early version put the ranking expression there and
briefly broke every post page in production (see the 2026-07-31 hotfix entry in `CHANGELOG.md`). The fetch is
also wrapped in a try/catch: a Related Reading failure now just means the section doesn't show, not that the
whole post fails to load. If a post page ever throws for any *other* reason, `src/app/(site)/error.tsx`
(added the same day) catches it with a proper in-theme error page instead of a blank crash screen.

**Printing a post** now comes out as a clean article — no header, footer, comments, related reading, or
"back to blog" link, forced to black-on-white regardless of the site's current dark/light theme, and an
external link's actual URL gets printed after the link text since "click here" means nothing on paper.
Structural chrome is hidden per-element with Tailwind's `print:hidden` utility; the color/link rules live in
one `@media print` block at the bottom of `src/app/globals.css`.

**Search** lives at the top of `/blog`, right under the intro paragraph (`BlogSearch.tsx`). Reworked
2026-07-31 (originally opened Google in a new tab; Asher asked for something that keeps readers on-site) into
an instant client-side search: `/blog/page.tsx` already fetches every post for the listing, so a lean
searchable subset (title, summary, tags, category titles -- no images, no comment counts, no full body text)
gets passed straight into `BlogSearch` as a prop, no extra fetch or index to host. Typing filters that list
live (title matches first, then summary/tag/category matches) and shows up to 6 results in a dropdown;
clicking one is a normal in-site `Link` navigation. Doesn't reach into full post bodies -- a "search the wider
web" link stays at the bottom of the dropdown, still the old `site:asheraw.com`-restricted Google search, as
a fallback for anything buried in body text this shallow index can't see. Nothing to maintain: a new post is
automatically searchable the moment it's in the fetched list, and the payload stays small regardless of post
count since each post's summary text is already capped short in its own GROQ projection.

**The reading progress bar** moved from a thin line under the header to a bottom bar
(`src/components/asher/blog/BlogReadingBar.tsx`), matching the homepage's own `ProgressionBar.tsx` in style
— same walking-character mascot (pulled into a shared `src/components/asher/WalkingCharacter.tsx` so the two
never visually drift apart), same amber track with a spotlight fill, same slide-up-from-the-bottom entrance.
It also stays hidden until the reader has scrolled down about 220px (`VISIBLE_AFTER_SCROLL_PX`), so it's not
sitting over the title before there's any progress to show. Two things it adds beyond a plain progress line:
- **Checkpoints from the post's own `h2` headings**, clickable, jumping straight to that section — no manual
  setup, every `h2` gets a stable anchor id automatically (`extractH2Checkpoints` in
  `src/lib/portableText.ts`, slugified from the heading's own text, de-duplicated if two headings in the same
  post happen to produce the same slug). A post with no `h2` headings just shows a plain bar with no
  checkpoints — not an error.
- **A rotating line of encouragement** above the bar, changing as you actually progress through the post
  ("Hope you're enjoying the read" → "You're halfway..." → "Almost to the end..." → a "You've finished it!"
  message that's a clickable link straight to the comments). If you scroll suspiciously fast, this swaps
  briefly for a playful "slow down" nudge instead — tuned to *not* fire from clicking an anchor link (this
  bar's own checkpoints, or the "finished" message linking to comments): any click on an on-page `#` link, or
  any `hashchange`, buys a short grace window where the fast-scroll check is switched off, since
  `scroll-behavior: smooth` (site-wide, `globals.css`) makes a deliberate anchor jump look identical to fast
  scrolling by speed alone. The exact speed threshold is a first guess, not rigorously tuned — worth
  revisiting if it ever feels like it fires too eagerly (or not at all) once there's real reader behavior to
  check it against.

Hidden entirely while previewing a draft (same reasoning as before: no version of "percent through the
article" to trust while Presentation can rewrite the body underneath it).

**The mascot itself became Asher's real avatar (shipped 2026-07-31, later the same day).**
`WalkingCharacter.tsx` no longer draws a generic stick figure — it renders `public/asher/avatar-8bit.png`,
Asher's own 8-bit pixel-art self-portrait (originally an NFT-era piece, pulled from opensea.io/asheraw),
cropped tighter to just the head per his request, as a small circular "medallion" with an amber border,
still riding along the bar with the same bounce animation as before. `image-rendering: pixelated` in the
component's inline style keeps the pixel art crisp rather than letting the browser smooth it at this small
display size — if the avatar ever looks blurry, that's the first thing to check.

**If the avatar needs updating later** (a new portrait, a different crop, etc.): the source crop was made
with `sharp` — extract a square region tight around the head, resize down with `kernel: 'nearest'` (not the
default smooth interpolation, which would blur pixel-art edges), save as PNG to `public/asher/avatar-8bit.png`
at the same ~176x176 size. No code change needed if the replacement file keeps the same filename/dimensions.

**The avatar faces the direction of travel** (shipped 2026-07-31, same day) — right while scrolling down
(the default), left while scrolling back up, via a `scaleX` flip in `WalkingCharacter.tsx`. This is tracked
inside `WalkingCharacter` itself, not by either parent bar, so both the homepage `ProgressionBar` and the
blog's `BlogReadingBar` get it automatically with no per-page wiring. Small scroll deltas (≤2px) are ignored
so it doesn't flicker between facings from sub-pixel jitter while scrolling is nearly stationary.

**The blog reading bar now hides once the reader scrolls past Related Reading** (shipped 2026-07-31, same
day) — a fixed progress bar stuck at 100% while browsing unrelated links below the post was clutter, per
Asher's feedback. Works via a marker element, `<div id="reading-bar-boundary" />` in
`src/app/(site)/blog/[slug]/page.tsx`, placed right after the comment section and always rendered — even
when `RelatedPosts` itself renders nothing (no shared category/tag with any other post) — so
`BlogReadingBar` always has a reliable anchor to check regardless of whether that post actually has related
reading to show. **If the bar stops hiding correctly:** confirm that marker element is still present in the
page and its `id` still matches `BlogReadingBar`'s `hideAtId` prop (defaults to `"reading-bar-boundary"`,
overridable if ever needed) — if the div gets removed or renamed by a future edit, the bar silently falls
back to never hiding (visible for the rest of the page) rather than erroring.

---

## Image block: single photo, or a carousel/slideshow/scrolling strip (merged into one 2026-08-04)

One block type in the post body editor covers both cases now — `image` in
`src/sanity/schemaTypes/blockContentType.ts`. Add a photo and nothing else: it's a plain single image, exactly
as it's always rendered. Also add one or more photos under **More photos (optional -- turns this into a
carousel)**: the block becomes a multi-photo gallery, and a **Display style** field appears (hidden until
there's at least one additional photo) with three choices:

- **Carousel** — sits still until the reader clicks the arrow buttons, clicks a dot, or swipes on mobile.
- **Slideshow** — the same controls, plus a 5-second auto-advance timer that pauses the instant a reader
  hovers (mouse) or touches it (mobile), and stays paused until they move away.
- **Scrolling strip** — every photo shown at once, each at its own natural aspect ratio (not locked to a
  uniform box), continuously auto-scrolling on its own, pausing on hover/touch. The style from
  [Embla's own predefined examples](https://www.embla-carousel.com/docs/examples/predefined/) Asher pointed at
  directly. Built on the `embla-carousel-auto-scroll` plugin (`speed`, `stopOnMouseEnter`,
  `stopOnInteraction` options) — a separate plugin from `embla-carousel-autoplay`, which only powers the
  discrete one-at-a-time Slideshow timer.

Carousel/Slideshow are rendered by `SlideCarousel` and Scrolling strip by `ScrollStrip`, both in
`src/components/asher/blog/ImageCarousel.tsx` (exported together as `ImageCarousel`), invoked from the single
`types.image` renderer in `portableTextComponents.tsx` whenever `additionalImages` is non-empty — a block with
no additional photos never touches this path at all. No GROQ query changes were needed — `POST_BY_SLUG_QUERY`
already fetches the whole `body[]` array as a spread.

**This used to be two separate block types** (a plain Image, and a standalone `imageGallery` requiring 2+
photos) until Asher asked whether they could become one field instead of two. The merge is additive and fully
backward compatible — `additionalImages`/`displayStyle` are optional fields on the *same* `image` type that's
always existed, so every other post's plain single-image blocks needed zero changes. The one post that *did*
use the old `imageGallery` type ("Christmas 2015: The Quest") got a one-time migration script rewriting its
one gallery block into the new shape (same 6 photos, same order, same Slideshow setting) — after that, the old
`imageGallery` type was deleted from the schema outright. That migration script wrote directly to production
content, so it ran only after Asher explicitly said yes (the auto-mode safety classifier blocked the first,
unattended attempt, correctly).

**Divider still opens an empty edit dialog on insert, even though it has nothing to configure.** Looked for a
documented, reliable way to make a zero-content Portable Text object block skip that dialog — found nothing in
Sanity's own docs or changelog, and wasn't willing to ship a guessed custom-component fix for Studio's editor
chrome unverified (this is exactly the category of change that broke Studio outright earlier the same day —
see the `imageAssetAlt` incident above). Left as a known, minor annoyance; worth a proper look if Asher wants
it enough to accept the "I can't fully verify this without you checking Studio live" risk.

**Gotcha, found the hard way: a stale `.next` build cache can outlive a content change.** Right after the
migration script ran, the live post kept rendering the *old* gallery shape for several minutes, even though
the API confirmed the write went through immediately (checked directly, bypassing the CDN). Cause: an earlier
`npm run build` in the same session had already cached that exact page's fetch result on disk; `next dev`
reads the same on-disk cache `npm run build` writes to, so it kept serving the pre-migration result regardless
of restarting the dev server process. Deleting just `.next/cache` didn't clear it — only removing the whole
`.next` directory and restarting did. If a content change looks like it "isn't taking" locally right after a
build ran in the same session, this is the first thing to check.

**Display size + lightbox (2026-08-04).** Every Image block also has a **Display size** field: Small, Medium,
or Original (fills the column, the default — matches every pre-existing post exactly). This is purely
cosmetic on the page; clicking or tapping *any* image, in every display style, opens
`ImageLightbox.tsx` — a full-size, untouched view of the original, dismissible via Escape, clicking outside, or
its close button. `SizedImage.tsx` handles the plain-image case; `ImageCarousel.tsx`'s own slide/thumbnail
buttons handle the gallery cases. One thing worth knowing if a carousel's click-to-lightbox ever seems to
misfire after this: the click handler checks `emblaApi.internalEngine().dragHandler.pointerDown()` and bails
out if a drag is still in progress — without that guard, dragging to the next slide also pops the lightbox
open, since a drag ends in a pointerup that looks just like a click.

**Small/Medium changed from fixed pixel caps to percentages of the column width (2026-08-06), per Asher's
question about whether hardcoded sizing had a real reason behind it.** It didn't, and the specific values
chosen had a live bug: the article column (`max-w-3xl` minus padding) works out to ~704px wide on desktop, so
the old "Medium: max 720px" cap never actually bound — Medium and Original rendered pixel-identical at every
screen size. Now `SizedImage.tsx`'s `WIDTH_CLASSES` and `ImageCarousel.tsx`'s `SLIDE_WIDTH_CLASSES` use
Tailwind fraction classes (`sm:w-1/2`, `sm:w-3/4`) instead of `max-w-[Npx]` — stays correct if the column's
own width class ever changes later, and scales proportionally rather than targeting one specific viewport.
Deliberately **not** applied below the `sm:` breakpoint — on a phone the column is already narrower than
either cap would meaningfully shrink it to, so forcing a percentage there would just make an already-small
photo pointlessly smaller for no readability benefit; Small/Medium/Original render identically on mobile,
same as before. `ImageCarousel.tsx`'s `SCROLL_STRIP_HEIGHT` (a fixed row *height* for the scrolling-strip
style, not a column-width share) was deliberately left in pixels — a different kind of "size" than the other
two styles, where an absolute value is the right unit.

**Missed spot, closed same day: the Featured Image.** All of the above only ever covered Portable Text *body*
images. The separate `mainImage` field rendered at the top of every post (`src/app/(site)/blog/[slug]/page.tsx`)
went through plain `next/image` with no lightbox at all until Asher noticed. Fixed with a small dedicated
wrapper, `FeaturedImage.tsx` — always full width (it's the hero, not a Display-size-able body block, so it has
no size options), but opens the same `ImageLightbox.tsx` on click. Worth remembering if another image spot
turns up outside the post body later (an author photo, a category card image, etc.) — none of those go through
`portableTextComponents.tsx` either, so none of them automatically inherited this for free.

---

## Quote Grid: names/photos/quotes together, three layouts (shipped 2026-08-06)

A new block type in the post body editor: **Quote Grid** (`quoteGrid` in
`src/sanity/schemaTypes/blockContentType.ts`), built for exactly the "J Factor Afterthoughts" case Asher
raised -- a post with several people's names, photos, and comments that had no good way to lay out besides a
plain list. Each entry has a **Photo** (optional -- a plain initial circle stands in when there isn't one), a
**Name**, an optional **Role / context** line (e.g. "Workshop attendee"), and the **Quote** text itself.

**Three genuinely different visual treatments, picked via the block's own Layout field, not one fixed look** --
Asher specifically wanted room to try a few designs rather than commit to a single "photo, line, text" layout:

- **Cards** -- a responsive grid of bordered cards, each with a large faint decorative quotation mark in the
  corner. Reads as a testimonial wall.
- **Spotlight** -- full-width rows that alternate left/right, larger avatar, the quote set in bigger italic
  display type. More editorial and dynamic; best for a handful of quotes rather than a long list, since each
  row takes real vertical space.
- **Minimal** -- a clean divided list, closer to a pull-quote than a card. Big quotation marks carry the
  visual weight instead of borders; the avatar shrinks to a small inline byline under each quote.

All three are rendered by `src/components/asher/blog/QuoteGrid.tsx` (`CardsLayout`/`SpotlightLayout`/
`MinimalLayout`, dispatched by the `layout` prop), wired into `portableTextComponents.tsx`'s `quoteGrid` type.
Switching Layout on an already-written Quote Grid re-renders the *same* entries in the new style immediately
-- nothing about the data changes, only which of the three components renders it, so trying different designs
on the same content is just picking a different dropdown value, not re-entering anything.

**Not a spreadsheet-style table.** Explicitly scoped this way after discussing it directly: a true
rows-and-columns table with merged cells and per-cell backgrounds/borders is a much bigger, more fragile
build, and tables are genuinely poor on mobile (either shrink unreadably or force horizontal scroll). Quote
Grid solves the actual case in front of Asher; a general-purpose table stays a separate, larger, not-yet-built
idea if a real rows/columns need shows up later (not logged in `IDEAS.md` as its own entry, since it wasn't
asked for on its own merits -- only came up as one option while scoping Quote Grid).

**Quote text is sans-serif, not the site's serif display face (fixed same day, Asher's feedback right after
shipping).** Spotlight and Minimal originally set the actual quote in `font-display` (Playfair Display) *and*
italic -- genuinely harder to read than sans-serif italic, since Playfair's italic cut narrows the letterforms
further right where the point is reading a sentence, not admiring a character. Both now use the site's default
sans-serif instead (with `font-medium` added to keep some visual weight, since Playfair's own character isn't
carrying that anymore), italic kept. **The decorative serif accents were left alone on purpose** -- the large
faint quotation marks (Cards layout) and the avatar-initial fallback circles are single glyphs, not body copy
a reader has to parse, so serif still reads fine there. If a future layout adds more actual quote-length text
in serif, apply the same reasoning: serif italic for a whole sentence is a real readability cost, not a
stylistic-preference toss-up.

**Text weight is now a per-block field, not fixed (added same day, again from Asher's feedback).** The
`font-medium` bump from the fix above reads fine for a single Quote Grid, but Asher ran into it specifically
using several Quote Grids back to back on one post -- at that volume, bold quote text throughout got tiring to
read, even though the exact same weight was fine as an accent for just one or two. New **Text weight** field
on the block (`textWeight` in `blockContentType.ts`, radio: Regular/Bold) controls the quote text's own
font-weight, independent of Layout -- `QuoteGrid.tsx`'s `weight` prop, threaded through all three layout
components (`quoteWeightClass = weight === 'bold' ? 'font-medium' : 'font-normal'`). **Regular is the new
default** (`initialValue: 'regular'`) precisely because Bold is the one that causes fatigue at volume, and the
"why weren't more consecutive Quote Grids the common case" framing turned out backwards from actual use --
default to what's comfortable in bulk, let Bold be the deliberate opt-in for a single grid that wants more
visual punch, not the other way around. Only affects the quote paragraph itself -- names, roles, and the
decorative quotation marks/avatar initials are unaffected either way.

---

## Embed block: YouTube + Instagram merged into one, with YouTube anti-distraction params (shipped 2026-08-06)

**The two separate "YouTube embed" / "Instagram embed" buttons in the post editor's insert menu are now one:
`embed`** (`src/sanity/schemaTypes/blockContentType.ts`). Paste either kind of URL into its one `url` field
and `portableTextComponents.tsx`'s `embed` renderer figures out which platform it is
(`isInstagramUrl()`/`getYouTubeId()`) and dispatches to the right embed automatically -- one thing to reach
for instead of two, per Asher's ask to streamline the editor further.

**The old `youtube`/`instagramEmbed` types are gone from the schema (removed 2026-08-06).** They existed only
so already-published posts using them wouldn't turn into "Unknown type" blocks in Studio's editor — once every
post was migrated off them (see below), that reason no longer applied, so both array members (and the
now-unused `HeartFilledIcon` import) were deleted from `blockContentType.ts` outright. **The insert menu now
shows exactly one embed-related button, "Embed."** `src/sanity/lib/autoEmbedPaste.ts` (paste a bare URL onto
an empty line) already inserted the new `embed` type, not the old ones, so that path never needed a change.

**Migration script (`scripts/migrate-legacy-embeds.mjs`) written 2026-08-06, run for real the same day.**
Finds every post with a `youtube`/`instagramEmbed` block and rewrites just that block's `_type` to `embed`
(both legacy types already store the same single `url` field the new type does, so nothing about the embed
itself changes — same shape-migration pattern as the Image/imageGallery merge on 2026-08-04). Patches each
matching block individually by its `_key` rather than replacing the whole `body` array, so it can't clobber
unrelated edits, and migrates draft/published versions of a post independently since they're separate
documents that can genuinely differ. `--dry-run` previewed 38 blocks across 11 posts with no warnings; the
real run patched all 38 and its own built-in re-check confirmed zero legacy blocks remained afterward — that
verification is what cleared the way to delete the two types from the schema in the same session. Safe to
re-run anytime in the future if a legacy block ever reappears (e.g. via a content import) — it's a no-op
("nothing to migrate") when there's nothing left to do.

**YouTube embeds (both the new `embed` type and the legacy `youtube` type) now carry anti-distraction
parameters, per Asher's question about how much control exists over what YouTube shows around an embedded
video** — this is a pure rendering change (`YouTubeEmbed()` in `portableTextComponents.tsx`), so it applies
to every already-published post's existing embeds too, with no data migration needed:
- `rel=0` -- scopes the end-of-video "suggested next" overlay to videos from the *same* channel instead of an
  arbitrary other creator's. Real, but imperfect: YouTube has narrowed what `rel` actually restricts over the
  years, and it's their product surface, not something this site fully controls.
- `loop=1` (paired with `playlist=<id>`, YouTube's required way to loop one single video) -- the more
  reliable lever. A looping video never reaches the true "ended" state that triggers the full-screen
  suggestion overlay in the first place, rather than just curating what that overlay would show.
- Already on `youtube-nocookie.com` (privacy-enhanced mode, unchanged) and `modestbranding=1` (minimizes the
  YouTube logo -- cosmetic only).
- **What this can't fully prevent:** the player itself always has a visible "Watch on YouTube" affordance and
  YouTube's own on-screen controls, since it's YouTube's iframe UI, not something rendered by this site.
  There's no parameter that removes that.

**Instagram's embed, by contrast, was already comparatively low-risk here and needed no changes** — Instagram's
official oEmbed widget (`InstagramEmbed.tsx`) shows one specific post only, with a single explicit "View this
post on Instagram" link/caption-click as the only way out. Unlike YouTube, there's no autoplay-into-a-feed-of-
other-content mechanism built into the widget itself.

---

## Accordion block: simple rich text instead of a plain text box (shipped 2026-08-10)

**The accordion's hidden content field (`content` in the `accordion` array member,
`src/sanity/schemaTypes/blockContentType.ts`) used to be a plain `type: 'text'` string** — no bold, italic,
or links at all, rendered with `white-space: pre-wrap` (`Accordion.tsx`) purely as a way to at least show
line breaks, since that was the only structure a plain string could carry. Asher asked directly whether it
could support "simple rich text" instead.

**Now a restricted Portable Text array, not the full block config.** `content` is `type: 'array', of:
[{type: 'block', ...}]` with a deliberately smaller toolbar than the main post body: `styles: [Normal]` only
(no h2/h3/h4/blockquote — an accordion is a short aside, not a sub-article), `lists: [Bullet, Numbered]`,
`marks.decorators: [Strong, Emphasis, Underline]` (no strike-through, no inline code), and exactly one
annotation — a plain external URL link (`title`/`href`/`openInSameTab`, same shape as the main body's own
"External URL" annotation) — none of the main body's custom `internalLink`/`affiliateLink`/`textColor`
annotation types. **Mirrors the same "smaller, self-contained block config for a specific field" approach
already used for Reusable Snippets' own content** (see `snippetBodyComponents` in
`portableTextComponents.tsx`), not a new pattern invented for this.

**`Accordion.tsx` renders it with its own local `@portabletext/react` components config**
(`accordionBodyComponents`), not one imported from `portableTextComponents.tsx` — that file already imports
`Accordion` itself, so importing a components config back from there would be a two-way circular import for
a config that isn't reused anywhere else anyway. If a future field ever needs this exact same restricted
rich-text shape, extract it into its own small shared file rather than copy-pasting `accordionBodyComponents`
a second time.

**Every other place that reads `accordion.content` needed updating to match, each handling both shapes
defensively** (an old string *or* the new block array) rather than assuming a hard cutover the moment this
shipped:
- **`src/lib/portableText.ts`** (`portableTextToPlainText`, feeds both reading-time estimation and word
  count) — walks the nested blocks with the same span-joining logic already used for the top-level body,
  extracted into a small shared `blockText()` helper so both walks can't drift apart from each other.
- **`src/lib/exportHtml.ts`** / **`src/lib/exportMarkdown.ts`** — `accordionType`/`accordionRenderer` now
  recursively call the *exact same* `toHTML(..., {components: htmlComponents})` /
  `portableTextToMarkdown(..., markdownOptions)` already used for the post body and for a resolved snippet's
  own content (`snippetRefType`/`snippetRefRenderer` — the established recursive-render pattern this file
  already had, just not yet applied to accordions). A link or bold word inside an accordion now produces
  identical HTML/Markdown to the same formatting anywhere else in an exported file, rather than a second,
  differently-behaved mini-renderer.
- **`src/lib/exportPdf.ts`** — the `"accordion"` case in `renderNode()` now loops `node.content` and calls
  `await renderNode(doc, child)` per nested block, reusing the exact same span/list/heading rendering the
  main body uses, instead of flattening straight to `String(node.content)`.
- **`src/lib/bulkOperations.ts`** — already explicitly excludes accordion content from bulk search & replace
  (a deliberate prior scope decision, documented in that file's own comment: walking every custom block
  type's own text fields would be a lot of special-casing for a feature meant to fix a typo across many
  posts). Confirmed still correct as-is; no change needed.

**`scripts/migrate-accordion-content.mjs`** (new, same `--dry-run`-first / patch-by-`_key` / draft-and-
published-migrate-independently pattern as `migrate-legacy-embeds.mjs`) converts an old plain-string
`content` into the new block-array shape — splits on blank lines (`\n\s*\n`) into one `normal`-style
paragraph block per paragraph, collapsing any single line break inside a paragraph to a space (matching how
a plain `<p>` renders anyway, now that paragraph breaks carry real structure instead of raw whitespace being
the only signal). **Run for real 2026-08-10**: found 6 accordion blocks with the old string shape across 3
already-published posts; before running for real, pulled two of the real strings directly and inspected
their actual newline structure (one had zero line breaks at all — correctly became a single paragraph block;
one had exactly 18 blank-line separators — correctly became 19 paragraph blocks with nothing collapsed or
lost) to confirm the split logic wouldn't silently mangle real content before trusting it against production
data. The real run's own built-in re-check confirmed zero accordion blocks still had string-shaped content
afterward. Safe to re-run anytime — a no-op ("nothing to migrate") once nothing is left in the old shape.

**Verified against real data end-to-end, not just typechecked**: rendered the actual migrated post live and
clicked the accordion open to confirm paragraphs display correctly with real spacing; ran the real
`buildHtmlFile`/`buildMarkdownFile`/`buildPdfBuffer` functions against the migrated post and confirmed each
produced genuine formatted output (an HTML `<p>`, clean Markdown prose, a 685KB PDF) rather than
`[object Object]` or a thrown error; confirmed `portableTextToPlainText` still picks up the migrated
accordion's text for reading-time purposes; and confirmed Studio's own schema/config bootstrap still loads
with zero errors after the schema change.

---

## Instagram embed block (shipped 2026-08-04, its own insert-menu button retired 2026-08-06)

**Superseded as an insert-menu option by the merged `embed` type** (see "Embed block" above) — everything
below about how the actual embed renders (`InstagramEmbed.tsx`, the official `embed.js` widget) is still
accurate and unchanged; only how a *new* Instagram embed gets created has moved.

A new block type in the post body editor: **Instagram embed** (`instagramEmbed` in
`src/sanity/schemaTypes/blockContentType.ts`). Paste a post URL (e.g.
`https://www.instagram.com/p/XXXXXXXXXXX/`) and it renders as a real embedded card on the post page — photo,
caption, account name, like count, and a link back to the post — not just a bare link.

Uses Instagram's own official, free `embed.js` script (`src/components/asher/blog/InstagramEmbed.tsx`): the
component renders a `<blockquote class="instagram-media" data-instgrm-permalink="...">`, and Instagram's own
script (loaded once per page, regardless of how many embeds appear) scans for and hydrates every one of these
into the real embed. No API token, no app registration.

**What this does *not* show: an actual comment thread.** Instagram's free client-side embed doesn't expose a
scrollable list of comments — that's only available through Meta's Graph API, which is token-gated and
requires app review. If a real comment thread ever becomes a firm requirement, that's the path, but it's a
meaningfully bigger lift than this block.

**Pasting a bare URL onto an empty line auto-embeds it (shipped 2026-08-05; inserts the merged `embed` type
since 2026-08-06 -- see "Embed block" above).** Paste a YouTube or Instagram post URL onto its own blank line
and the real embed block is inserted immediately, no need to open the block-insert menu first.
`src/sanity/lib/autoEmbedPaste.ts` exports `onPasteAutoEmbed`, wired
via Sanity's documented `onPaste` prop on `PortableTextInput`
(https://www.sanity.io/docs/studio/customizing-block-content, "Custom paste handler"). It's threaded through
`DistractionFreeWritingPanel.tsx`'s existing `renderDefault({...props, onPaste: onPasteAutoEmbed})` call rather
than a second `components.input` override on the field — Sanity only supports one input override per field, and
that file already owns the slot.

**Deliberately does *not* fire when pasting over highlighted/selected text** — that's Asher's existing,
relied-on "select some text, paste a URL over it, it becomes a link" flow (Sanity's own built-in
`pasteLink` behavior), and the very first version of this feature shipped without that distinction, which
would have hijacked it. Fixed same day, before it caused a real problem: `PasteData` (the object `onPaste`
receives) has no direct "is there a selection" flag — confirmed by reading the actual
`@portabletext/editor` source, not assumed — only a `value` (the field's full block array) and a `path` that's
always just the selection's *focus* path, present whether the selection is collapsed or wide. So this checks
whether the block being pasted into (found by walking `path[0]`'s `_key` back into `value`) already has real
text in it instead: highlighted text always means a non-empty block, and an embed only ever belongs on its own
blank line anyway. **If the target block can't be identified at all, it falls through to normal paste
handling rather than guessing** — a missed auto-embed is a minor inconvenience; wrongly overriding a real
paste-to-link never should be.

The two regexes (`YOUTUBE_URL`/`INSTAGRAM_URL`) are anchored start-to-end — they check whether the *whole*
pasted clipboard string is just the URL, not whether a URL appears somewhere inside a longer paste. Pasting a
sentence that happens to contain a YouTube link leaves it as plain text, unchanged; only a bare link on an
empty line gets converted. Returning `{insert: [{_type: 'embed', url: text}]}` inserts the block directly
rather than wrapping it as `{_type: 'block', children: [...]}`, because `embed` is registered as a top-level
block member in `blockContentType.ts`'s `of` array (a sibling of `{type: 'block'}`), not an inline object —
an easy mistake to make copying Sanity's own doc example, which demonstrates an *inline* object instead.

**Known limit:** this only fires on an actual clipboard paste event. Typing a URL by hand and pressing space
or Enter does not trigger it. That would need Sanity's newer, still-`@beta`/undocumented-for-this-exact-use
"Editor Behaviors" API (shipped Studio v3.92.0, June 2025) reacting to `insert.text`/`insert.break` events —
deliberately not attempted, since it means building on internals Sanity hasn't published a public recipe for.

**Verification note:** the URL-matching and empty-vs-non-empty-block logic were both verified directly —
realistic YouTube/Instagram URL variants (query strings, trailing slashes) on an empty block correctly embed;
the same URL against a non-empty block (simulating text selected for a paste-to-link) correctly falls through
untouched; an unidentifiable target path also falls through safely; a URL sitting inside a normal sentence is
correctly left alone regardless of block state. The actual in-Studio paste interaction itself could not be
click-tested end-to-end — that needs a real, authenticated Studio session, which automated testing in this
project's sandbox doesn't have. Worth a real check next time you're writing a post, on both fronts: that a
bare link on an empty line embeds, and that highlighting text and pasting a link still just makes a link.

---

## Share bar: resharing a post to other platforms (shipped 2026-08-02, Threads added 2026-08-10)

Every post page has a **Share this post** row (`src/components/asher/blog/ShareBar.tsx`), placed after the
post body/tags and before the comment section. Buttons for X, Facebook, LinkedIn, WhatsApp, Threads, and
Email each open that platform's own public share-intent URL with the post's title and URL prefilled — no
SDK, no third-party embed, nothing that loads or phones home before a reader actually clicks one. A **Copy
Link** button copies the URL to the clipboard and shows a checkmark for 2 seconds as confirmation. On a
device that supports the browser's native Web Share API (most mobile browsers, essentially no desktop
browsers), an extra **Share** button appears first and opens the OS's own share sheet — feature-detected
client-side *after mount* specifically (not during the initial render) so server-rendered HTML and the
client's first render always agree; checking `"share" in navigator` directly during render would make
Next.js's hydration pass disagree with the server output, since `navigator` doesn't exist during server
rendering at all. Every button fires a `share_click` analytics event (`src/lib/analytics.ts`, same `track()`
helper used elsewhere on the site) labeled with which platform was used.

**Instagram is deliberately not in this row, and can't be added the same way the others were.** Every
platform above has a public URL that opens a prefilled share dialog (`twitter.com/intent/tweet?...`,
`threads.net/intent/post?...`, etc.) — Instagram has never offered an equivalent for sharing an arbitrary
link. The native **Share** button already covers it indirectly: on mobile, Instagram shows up as one of the
OS's own share-sheet options if the app is installed. There's no way to give it a dedicated one-click button
the way the rest of the row works.

**Threads' icon isn't from lucide-react** (the icon set every other button in this row uses) — lucide has no
Threads glyph, so `ThreadsIcon` in `ShareBar.tsx` renders the real mark from the `simple-icons` package
(`siThreads.path`, solid-fill, `viewBox 0 0 24 24`) instead of standing in some unrelated outline icon.
Because that component's props don't structurally match lucide's exact `LucideIcon` export type, `LinkTarget.icon`
is typed as the looser `ComponentType<{ size?: number }>` rather than `typeof Twitter` — both lucide icons and
the custom SVG component satisfy that shape, so the same `<t.icon size={16} />` call site works for every
button in the row without a special case.

---

## Link-in-bio page: /link (shipped 2026-08-10, rebuilt same day)

**`src/sanity/schemaTypes/linkPageType.ts`** — a singleton document (`linkPage`, registered in Studio's
sidebar next to Site Settings, same `S.document().schemaType(...).documentId(...)` pattern) holding a
manually-ordered `items` array. Each `linkItem` has its own `image` (any asset from Media, hotspot enabled),
a `linkType` (`'post'` or `'external'`), and either a `post` reference or an `externalUrl` — whichever field
is relevant shows in Studio via `hidden: ({parent}) => parent.linkType !== '...'`, same conditional-field
pattern `blockContentType.ts`'s `displayStyle` already uses. No manual title/caption fields — deliberately:
an internal card's headline comes straight from `post->title` at render time, so there's nothing to
duplicate or let drift out of sync with the post's real title.

**Superseded its own first version, shipped a few hours earlier the same day**, which auto-built the page
from a `showOnLinkPage` boolean toggle on `postType.ts` (reusing whatever a post's Main Image happened to
be). Reasonable as a first guess, but not what Asher actually wanted once he saw it — he asked for real
per-card control and an Instagram-grid layout instead of a stacked list. That boolean field has been removed
from `postType.ts` entirely; any post that still carries the old `showOnLinkPage: true` property in the
dataset has an inert, unused field on it (harmless, just orphaned data, safe to ignore).

**`src/app/(site)/link/page.tsx`** — fetches `LINK_PAGE_QUERY` (`src/sanity/lib/queries.ts`) plus a small
`siteSettings` projection for the profile header, both via `client.fetch` directly (same `next-sanity` client
every other page route uses). Inherits the site-wide `revalidate = 60` from `(site)/layout.tsx` — a newly
added or reordered card shows up within a minute of publishing, no extra revalidation wiring needed. Sanity's
CDN (`useCdn: true` on the shared client) can lag a write by up to roughly a minute too — worth knowing if a
just-published change doesn't appear instantly on a hard refresh; it's cache catch-up, not a bug.

**Layout deliberately mirrors Instagram's own profile grid**, not `/connect`'s stacked-card style the first
version used: `grid-cols-3 gap-0.5`, each tile a plain `aspect-[3/4]` `<a>` (portrait, matching how
Instagram itself crops grid tiles -- not square, fixed after Asher compared it directly) with the image as
a `fill` background (`urlFor(...).width(600).height(800).fit('crop').crop('focalpoint')`, respecting
whatever hotspot Asher sets on the image) and the resolved headline overlaid at the bottom via a
`bg-gradient-to-t` scrim. `resolveCard()` in the page component decides per-card whether to link internally
(same tab, no `target`) or externally (`target="_blank"`) and skips rendering a tile entirely if its
destination can't resolve (a deleted post reference, a blank external URL mid-edit) rather than showing a
dead link.

**No border/background wraps the grid as a group** -- it did in the first version, and that was a real bug:
CSS grid always reserves all `grid-template-columns` tracks for a row regardless of how many children
actually exist in it, so a border drawn around the whole `grid-cols-3` container visibly framed the *empty*
tracks whenever the item count wasn't a multiple of 3 (looked like broken/blank tiles). Fixed by moving the
background (`bg-stage/60`, shown briefly while an image loads) onto each individual tile instead of the
group -- an incomplete row now just shows real tiles against the plain page background, same as Instagram's
own grid.

**No third-party embed.** Every tile is this site's own data (an image from Sanity + a resolved link) —
not an embedded Instagram widget, not a live screenshot of the actual Instagram post, and not a redirect
through an external link-in-bio service. Matches the same "no SDK, no third-party embed" stance already
established for `ShareBar.tsx`.

**`robots: { index: false }`** in the page's metadata — it's a bio-link utility page for people already
coming from Instagram, not something meant to independently rank in search.

---

## RSS feeds: site-wide and per-channel (shipped 2026-07-31)

The site-wide feed at `/rss.xml` (`src/app/rss.xml/route.ts`) already existed. Added three more, same shape,
scoped to one category/tag/author each:
- `/blog/category/[slug]/rss.xml`
- `/blog/tag/[tag]/rss.xml`
- `/blog/author/[slug]/rss.xml`

All four now share one XML-building function, `buildRssFeed()` in `src/lib/rss.ts`, so the item/channel shape
can't drift between them. A category or author feed 404s for an unknown slug, same as the page it sits next
to; a tag feed doesn't (an unknown/typo'd tag just gets an empty feed), also matching its page's own
behavior of showing "no posts tagged X yet" instead of a 404.

Each channel page (`/blog`, a post, a category, a tag, an author) declares its own
`alternates.types["application/rss+xml"]` in `generateMetadata` so the right feed is auto-discoverable by
feed readers/browsers — worth knowing if adding a new blog-adjacent page: Next.js metadata does *not*
deep-merge `alternates` across nested layouts, so defining `alternates` on a page without re-declaring
`types` will silently drop whatever feed link the layout above it declared. Every page under `/blog` that
sets its own `alternates` re-declares `types` explicitly for exactly this reason.

**The site-wide feed lives at the bare root (`/rss.xml`), not `/blog/rss.xml`** — worth remembering, since the
other three all live under `/blog/...` and it's an easy guess that the site-wide one does too. `/blog/rss` and
`/blog/rss.xml` both redirect to `/rss.xml` (Studio → Redirects, added 2026-08-05) rather than the real feed
being moved — an existing subscriber's URL should never change under them.

---

## Sitemap and breadcrumb structured data (shipped 2026-07-31)

**Sitemap** (`src/app/sitemap.ts`) covers the homepage sections, `/blog`, every post, and every category —
**tag pages were missing** (they're indexable, no `noindex`, but had no way for a crawler to discover them
without following every post's tag links first). Fixed by deriving the distinct tag list from the same
`posts` array the sitemap already fetches (tags are free-text strings on each post, not their own document
type, so there's no separate query for "all tags"). Author pages are deliberately still left out — they're
set `noindex` (see `AuthorPage`'s `generateMetadata`) since they'd otherwise duplicate `/blog` for a
single-author site.

**Breadcrumb structured data** used to be one hardcoded, site-wide `BreadcrumbList` in
`StructuredData.tsx` that only ever said "Home" — wrong on every page except the homepage itself. Replaced
with `buildBreadcrumbSchema()` (`src/lib/structuredData.ts`), called per-page with that page's real trail:
`/blog` → Home/Blog, a post → Home/Blog/Category/Post title, and the same pattern for category/tag/author
pages. `StructuredData.tsx` (mounted once, site-wide, in `(site)/layout.tsx`) now only carries the Person and
WebSite schema, which really are the same on every page — the breadcrumb never belonged there.

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

## Site Settings: default author, and site-wide title/description/social image

**Studio -> Site Settings** (singleton, left sidebar) started 2026-07-30 as just the default author every
new post gets assigned to, then grew the same day (Asher asked directly) to also cover the site's identity/
SEO fields, grouped into two labeled sections in the form:

- **Site identity & SEO** — Site title, Meta description, Default social share image. These drive the
  browser tab title, search-result snippet, and link-preview card for the homepage and any other `(site)`
  page that doesn't set its own (blog posts always use their own title/excerpt/main image instead — this is
  specifically the site-wide fallback). Previously hardcoded consts in `src/app/(site)/layout.tsx`.
- **Publishing** — Default author, as before.

**Not an error, by design (clarified 2026-07-31):** Site Settings only ever controls *metadata* (tab title,
meta description, share-preview image) — never actual page *content*. It looks like it's "controlling the
homepage" because the homepage is the one page that has nothing else overriding those fields; every blog page
sets its own specific title/description instead, so Site Settings only ever shows up there as an unused
fallback. The homepage's real content (hero copy, the "stage"/"coaching"/"faith" sections, etc.) is hardcoded
in React components, not a Sanity document at all, and stays that way on purpose — it's a highly bespoke,
art-directed one-page site, not the kind of frequently-changing, structurally-repeatable content a CMS
earns its keep on. The blog is exactly the opposite of that (frequent, text-heavy, benefits from Studio's
editing/preview/versioning), which is the actual reason the two are built so differently rather than both
going through Sanity or both being hardcoded.

Schema: `src/sanity/schemaTypes/siteSettingsType.ts`. Wired into `src/app/(site)/layout.tsx`, which changed
from a static `export const metadata` to `export async function generateMetadata()` fetching this document,
with the old hardcoded values kept as fallback constants (so a fresh/corrupted dataset with no Site Settings
document never renders broken/empty metadata). `postType.ts`'s `author` field similarly falls back to the old
slug-based lookup if Site Settings has no default author set.

**A change in Site Settings can take up to a couple of minutes to show up live** — two separate delays stack:
Sanity's CDN can take up to ~30-60 seconds to reflect a recent write (confirmed by testing — a title change
didn't show up in a rebuild done immediately after saving, but did after waiting), and the site itself only
re-checks Sanity once a minute (`export const revalidate = 60` on the layout). Not worth chasing further for
something this infrequent to change — if this delay is ever a real problem, the fix is switching the
`generateMetadata` fetch from the CDN-cached `client` to the non-cached `writeClient` (same fix already
applied to comments, see below), trading a small ongoing cost for near-instant freshness.

**If a new post's author field comes up empty, or the site title/description look wrong or missing:** check
Studio -> Site Settings has values actually filled in. If it does and something still looks off, check the
singleton document itself exists — query `*[_type == "siteSettings"][0]` in the Vision tool; if it returns
`null`, the document was deleted or never created and needs recreating (any document with `_id: "siteSettings"`
and the required fields works, Studio's own "create new" won't offer it since it's a fixed-ID singleton, not
a listed type).

---

## Media library: which posts use an image

**Studio -> Media** (top nav, next to Structure/Vision) shows every uploaded image in a grid, each with a
"Used in N posts" badge (or an amber "Not used" badge if nothing currently references it) — shipped
2026-07-30. Read-only, for reference before deleting an asset. Same underlying technique as the category/
snippet "Posts" tabs — a GROQ `references()` query — just applied at the image-asset level instead of a
specific document. Component: `src/sanity/components/MediaLibraryTool.tsx`, registered as a Studio tool in
`sanity.config.ts`.

**If the "Used in" counts look wrong:** the displayed badge only counts the `post` document type by design
— it's meant as a quick "is this safe to delete from a post's perspective" signal, not an exhaustive index.
The safety-critical checks are broader, though (see "Replace image" below): both `deleteForever` and the
purge cron check `references($id)` across *every* document type, not just posts, since an author avatar or
site settings image can hold a reference too and a narrower check there could let a still-used asset get
deleted.

**Default alt text per image (shipped 2026-08-04):** each image tile now has an editable "Default alt text"
field, saved to a companion `imageAssetAlt` document (`src/sanity/schemaTypes/imageAssetAltType.ts`) —
Sanity's own `sanity.imageAsset` system type can't be extended with custom fields directly, hence the separate
document rather than a field on the asset itself. This is a *fallback*, not an override: `mainImageAlt` in
`POST_SUMMARY_PROJECTION`/`POST_BY_SLUG_QUERY`/`RELATED_POSTS_QUERY` uses `coalesce(mainImage.alt, ...)`, so a
post's own written alt text always wins — the library default only fills in when a post's Featured Image alt
text was left blank. Deliberately scoped to the Featured Image specifically, not every image inserted into a
post's body — covering every image-consuming field with the same fallback would be a much larger change than
this one. Clearing the field back to blank deletes the companion document entirely rather than leaving an
empty-string override behind.

**Fixed same day — a real broken-Studio bug:** the document links to its asset via a plain string field,
`assetId` (the asset's own `_id`), not a `reference` field. The first version used `type: 'reference', to:
[{type: 'sanity.imageAsset'}]`, which failed Studio's schema compilation entirely (`sanity.imageAsset` is a
system type, not a valid reference target) and took the whole live Studio down until fixed. If a future field
ever needs to point at an image asset directly (not via the normal `image` field type, which most things
should just use), don't reference `sanity.imageAsset` by name — use a plain string ID instead, the way this
field does.

**"Saving alt text crashed the page" (fixed 2026-08-08):** `saveAlt()` had no `catch` block at all — only a
bare `try {} finally {}`. Any write failure (a permissions hiccup, a dropped connection) became an unhandled
promise rejection instead of a message Asher could see, which is the most likely explanation for a single
failed save looking like the whole tool had crashed. Confirmed the write itself works fine against real data
(tested directly with `createOrReplace` against a real asset) — the bug was the missing error handling, not
the mutation itself. Now catches and shows the actual error inline via the shared `ErrorMessage` component,
same pattern used everywhere else in Studio. **If this exact symptom ever reappears with a visible error
message this time**, the message itself should say why (e.g. a permissions or network issue) rather than
needing to guess again.

**Search, pagination, and lazy-loading (shipped 2026-08-08).** The library query used to fetch every
`sanity.imageAsset` unconditionally — fine at 44 images, a real problem once it grows into the hundreds.
Now paginates 60 at a time via GROQ's own slice syntax (`[offset...offset+PAGE_SIZE+1]`, fetching one extra
to know whether a "Load more" button should show, rather than a separate `count()` query), with a
debounced filename search (`originalFilename match $term`) that bypasses pagination entirely and just
returns up to 100 matches — a real search narrows results enough that a second page is never realistically
needed. Thumbnails got `loading="lazy"` added, which they never had before.

**Mass upload (shipped 2026-08-08).** A button (native file input, `multiple accept="image/*"`) and a
whole-tool drag-and-drop zone, both funneling into the same `uploadFiles()` — uploads each file via
`client.assets.upload('image', file, {filename})`, one at a time in sequence (not `Promise.all` in
parallel) specifically so a progress count (`"Uploading 3/10…"`) means something real, and so one failed
file doesn't take the rest down with it in an unhandled Promise.all rejection. Non-image files dropped into
the zone are silently filtered out (`file.type.startsWith('image/')`) rather than attempted and failed.

**Automatic compression on upload (shipped 2026-08-08).** Asher asked whether something like tinypng.com
or imagecompressor.com could be built in. Most of that turned out to already be true on the *serving* side:
every image the site displays already gets resized and re-compressed per usage context by Sanity's own CDN
(`urlFor(...).width().quality()`, see "Media library: which posts use an image" above and
`src/sanity/lib/image.ts`) — actually more thorough than a one-time tinypng pass, since each display size
gets its own appropriately-sized file rather than one fixed compressed original. The real gap was the
*original* file sitting in storage, which stayed at full size — never affected what a visitor saw, but did
mean slower uploads (especially the mass-upload flow above) and needless storage growth over time.

`src/lib/imageCompress.ts` closes that gap, client-side, automatically, at upload time. **Can't be tested
with `npx tsx`** the way this repo's other pure-logic modules (`bulkOperations.ts`, `imageReplace.ts`) are
— it needs real browser APIs (`Image`, `<canvas>`) that don't exist in Node — so it was verified instead
with a standalone Playwright script that transcribes the exact same algorithm into a real browser page and
runs it against real generated test images, including a deliberately worst-case one (pure random noise —
much less compressible than any real photo) to make sure the numbers held up under harder conditions than
anything real would ever produce.

- **Resize**: caps the longest dimension at 2560px — comfortably above the widest `.width()` call anywhere
  on the site (`portableTextComponents.tsx`'s lightbox `fullSrc` at 2400px) — via `<canvas>`, preserving
  aspect ratio. Anything already smaller is left at its original dimensions.
- **Re-encode**: JPEG at quality 0.85 for anything that's safe to flatten — JPEG/WebP sources, and PNGs
  that turn out to have no real transparency (a screenshot, a flattened export) — since that's where the
  actual size win comes from. **A PNG that genuinely uses transparency stays PNG** (checked by scanning the
  decoded pixel data's alpha channel for any value under 255) rather than being flattened onto a solid
  background, which would be a real visible bug, not just a missed optimization.
- **Skipped entirely**: files under 300KB (small enough that re-encoding risks costing more in visible
  quality than it saves in bytes), and any file type other than JPEG/PNG/WebP — specifically GIFs (canvas
  would flatten an animation to a single frame) and SVGs (vector; rasterizing one defeats the point).
- **Never makes things worse**: if the recompressed blob ends up the same size or larger than the original
  (can happen with an already-well-optimized small-ish file just above the threshold), the original file is
  used untouched instead.

Wired into both `uploadFiles()` (mass upload) and `handleReplaceFileSelected()` (the "Replace image" flow
below) — same function, same behavior, called right before the actual `client.assets.upload()` call in
each. Shows the actual before/after size when a file was compressed (a `compressionResults` summary card
after mass upload; inline in the confirm step for a single replace) rather than compressing silently, per
Asher's own preference when this was scoped.

**Only covers uploads made through Media library's own upload/replace flows** — a photo uploaded directly
inside a post's own image field (clicking "Upload" on the Featured Image, an inline body image, an author
avatar) goes through Sanity Studio's default image input widget instead, which this doesn't touch, so it
stays uncompressed by default. Asher asked about this directly. See "Upload (compressed)" below for what
shipped in response — a deliberately additive option, not a silent global override.

**"Upload (compressed)" — the same squeeze available on every image field, opt-in (shipped 2026-08-08).**
Closing the gap above outright — overriding Studio's default upload mechanism for every image field
site-wide — was ruled out specifically because it can't be safely verified in an environment without a real,
authenticated Studio login: this sandbox has none, so the actual picker UI could never be clicked through
before shipping, and a subtle mistake there risks breaking the exact tool Asher writes every post with. Went
with the lower-risk route instead: `src/sanity/components/CompressedUploadSource.tsx` defines a genuinely
*additional* `AssetSource` — Sanity's public, non-beta contract for a custom "add image" entry — registered
via `form.image.assetSources: (prev) => [...prev, compressedUploadSource]` in `sanity.config.ts`, which
appends to whatever sources already exist rather than replacing them. Every image field on the site (post
images, author avatar, site settings) now shows **both** the original, completely untouched "Upload" and a
new "Upload (compressed)" sitting beside it — pick the compressed one when it's wanted, or ignore it and
nothing about the existing flow changes at all.

The component itself is a small drag-drop-or-choose UI (same shape as Media library's own upload zone),
running the file through the same `compressImageFile` and `client.assets.upload()` already proven elsewhere
in this feature, then handing the result back via `onSelect([{kind: 'assetDocumentId', value: uploaded._id}])`
— note this uses the *stable* `AssetFromSource`/`onSelect` contract (marked `@public` in `@sanity/types`),
not the newer `AssetSourceUploader`/picker-mode API (marked `@beta`), specifically to build against the
surface least likely to shift under a future Sanity upgrade.

**Verification ceiling, stated plainly**: typechecked against Sanity's real `AssetSource`/
`AssetSourceComponentProps` types (not guessed from memory), a full production build, and confirming
Studio's own config/schema bootstrap still loads with zero errors after adding the `assetSources` resolver.
**Could not click through the actual picker and see "Upload (compressed)" appear next to "Upload" on a real
field** — that specific, final check needs an actual login this sandbox doesn't have. If it doesn't show up
as expected, the resolver in `sanity.config.ts`'s `form.image.assetSources` is the first place to look.

**"Compress Library" — a one-time pass for photos already there (shipped 2026-08-08).** Automatic
compression above only ever applied going forward. Asher asked whether the photos already in the library
before that shipped were compressed too — checked against real data: 28 of 49 images were 300KB or larger,
together 20.6 of the library's 22.8 MB total, none of them touched by the new-upload-only feature — and
whether a one-time catch-up pass could compress those, skipping ones already small. Built as a new "Compress
Library" button (`MediaLibraryTool.tsx`, next to Upload Photos), in three phases:

1. **Scan** (`scanLibraryForCompression`): fetches every non-trashed asset `size >= MIN_SIZE_TO_COMPRESS`
   directly in the GROQ filter — cheap, since it's Sanity's own already-known metadata, no point downloading
   a photo's bytes just to learn it was always going to be skipped. For each candidate, downloads the real
   bytes (`fetch(asset.url)` — works fine from Studio specifically because `/studio/*` carries no CSP at
   all, unlike the public site's deliberately restrictive one; confirmed by comparing the two routes' actual
   response headers, not assumed) and runs it through the exact same `compressImageFile` used for new
   uploads. Anything that doesn't end up meaningfully smaller is silently left out of the results.
2. **Preview**: shows every candidate with its real before/after size and a total, before anything commits
   — same "show what will happen, then confirm" shape as Replace image and Bulk Operations.
3. **Compress**: uploads every compressed photo as its own new asset first, then does ONE combined
   reference-repoint pass across the whole batch (not one Replace-image cycle per photo run sequentially) —
   see `computeBatchReplaceChanges` below for why that distinction matters — followed by one transaction
   (new-reference patches + alt-text carryover + trashing every original) and one `bulkOperationLog` entry
   covering the whole run, so History shows "Compressed N photos" once with one Undo, not N separate lines.

**`computeBatchReplaceChanges(docs, swaps)`** (`src/lib/imageReplace.ts`) is the one genuinely new piece of
logic this needed, versus just calling the single-image `computeImageReplaceChanges` once per photo. A
single document can easily be affected by more than one swap in the same batch run — a post with two
different oversized photos, both getting compressed in the same pass, is a completely ordinary case, not an
edge case. Computing each swap independently against the same stale document snapshot would silently lose
whichever swap got computed last, since only one final value ever gets written per field. This instead
layers each swap onto the *previous* swap's result for that document (a working copy updated step by step),
while `previousValue` on the returned change always stays pinned to the true pre-batch original — not
whatever the document looked like mid-batch — so Undo still restores the actual starting point in one step.
Uses `references($ids)` with an array argument (matches a document referencing *any* of the ids) to fetch
every affected document in one query rather than once per swap.

**Verified in three separate layers before shipping**, each catching something the others couldn't: the
merge logic in isolation via `npx tsx` (a document hit by two swaps on two different fields, and the
trickier case of two swaps landing on the *same* array field — confirming neither swap gets lost); that the
cross-origin fetch of real CDN bytes genuinely works from Studio's own page context (not assumed from the
public site's more restrictive CSP); and the full orchestration end-to-end against real Sanity data — two
real posts, one sharing a photo with the other, one with two different photos each getting swapped in the
same run — confirming the shared-photo fan-out, the same-document merge, alt-text carryover, trashing, and
Undo all landed correctly on real documents, not just synthetic ones.

**Mass select + Trash (shipped 2026-08-08).** A "Select" button toggles checkbox mode on every tile
(overlaid on the thumbnail, top-left) and reveals a floating action bar; "Move to Trash" on a selection
that includes an image still used by a post shows an explicit confirm step first (trashing doesn't break
anything immediately, but flags what happens later). **Same system-type constraint as default alt
text**: `sanity.imageAsset` can't hold a custom field, so "trashed" is a companion document
(`imageAssetTrashType.ts`, one per trashed asset, `assetId` + `trashedAt`) rather than a field on the asset
itself — the library query's own `NOT_TRASHED_FILTER` excludes any asset with such a companion doc via a
GROQ subquery-in-filter (`!(_id in *[_type == "imageAssetTrash"].assetId)`), so a just-trashed image
disappears from both the paginated view and search immediately.

**Trash view** (toggled the same way Comments' own Trash view works) lists every trashed asset with a
"Restore" (deletes the companion doc) or "Delete Forever" (behind its own confirm step) per item, each
showing the same 30-day auto-delete date `TrashedCommentCard` already shows for comments.

**The daily purge cron (`/api/cron/purge-trash`) now sweeps images too, not just comments** — extended in
the same request rather than a second cron entry, since it already runs daily. **The one thing images need
that comments don't**: before actually deleting a 30-day-old trashed image, it re-checks
`count(*[references($assetId)])` (any document type, since 2026-08-08 — see "Replace image" below) and
skips deletion (leaving it trashed, not un-trashing it) if that count is anything but zero. Comments can't
be "re-referenced" after being trashed, but an image genuinely can — a post could start using a trashed
image again (restored elsewhere, re-inserted from an old export, or repointed there by "Replace image")
before the 30 days are up, and deleting the real asset out from under something that still points at it
would leave a permanently broken image on the live site. **If a trashed image ever seems stuck in Trash
past 30 days**, this check is almost certainly why — it's still referenced somewhere; check the Trash row's
own "Still used in N posts" note before assuming the cron is broken.

**Masonry grid — a fourth image-block display style (shipped 2026-08-08).** Alongside Carousel/Slideshow/
Scrolling strip, for a post with a genuinely large batch of photos shown all at once rather than
one-at-a-time. `MasonryGrid` in `ImageCarousel.tsx` — pure CSS multi-column layout (Tailwind's
`columns-2 sm:columns-3` + `break-inside-avoid` per item), not a JS masonry library: the browser handles
the Pinterest-style staggered flow on its own, which is both the simplest correct implementation and the
lightest one (no layout-measurement JS running on scroll/resize). Each photo keeps its own natural aspect
ratio rather than being cropped into a uniform grid — same "show the photo as taken" spirit as every other
display mode on this block. Opens the same single-image `ImageLightbox` as every other mode on click; no
next/prev navigation was added inside the lightbox itself, consistent with how Carousel/Slideshow/
Scrolling strip already only ever show one enlarged photo at a time too.

**Replace image (shipped 2026-08-08).** Asher asked whether a photo could be swapped out without
re-uploading and manually re-placing it in every post. Sanity's assets are immutable and content-addressed
— there's no "overwrite this file's bytes" API call — so "replace" is really: upload the new file as its
own new asset, then find and repoint every reference to the old one. Pure logic lives in
`src/lib/imageReplace.ts`, deliberately separate from the React/Sanity-client wiring the same way
`bulkOperations.ts` is, so it can be (and was) exercised directly with `npx tsx` against real data before
ever touching the UI.

**`computeImageReplaceChanges(doc, oldAssetId, newAssetId)`** walks a whole fetched document generically —
not a hardcoded field list like `mainImage`/`body`/`socialImage` — recursively replacing any `_ref` that
matches the old asset id, anywhere in the tree (a body portable-text image, a gallery array member, an
author's avatar, a site settings image), and returns one whole-field change per top-level field that
actually changed. **Why generic instead of a field list**: a hardcoded list would silently miss whichever
field isn't on it yet — a Masonry gallery block, say — and this is exactly the kind of bug that's invisible
until someone notices a photo didn't actually get swapped everywhere it should have.

**The Media tile's "Replace" button** (`MediaLibraryTool.tsx`) opens a small dialog: pick a new file, it
uploads immediately, then every document referencing the old asset (`*[references($id)]`, any type) gets
fetched and diffed, and a confirm step shows exactly which documents will change before anything commits —
same "show what will happen, then confirm" shape as Bulk Operations' own edit flow. On confirm: changes are
grouped **by document first** (a post could have the same photo in both its main image and a body gallery
— two separate field changes on the *same* document — and a transaction patch can only call `.set()` once
per document, not once per field, the same gotcha `categoryDeleteGuard.tsx` and `BulkOperationsTool.tsx`
already document), one `.set({field1: ..., field2: ...})` per affected document, all in a single
transaction alongside carrying the old image's alt text over to the new asset and sending the old asset to
Trash (the existing 30-day-recovery mechanism, not an outright delete).

**Logs into the existing `bulkOperationLog`/History mechanism** (`BulkOperationsTool.tsx`'s History tab)
as `operationType: "replaceImage"` — same whole-field-snapshot shape the tag/category/author/search-replace
operations already use (`postId`/`postTitle`/`fieldPath`/`previousValue` per change), so Undo works for
free with no new mechanism: replaying `previousValue` back onto `fieldPath` for each change restores the
original references. (The log's `postId`/`postTitle` field names predate this feature and now hold *any*
document id, not just a post's — noted directly in the schema's own field description.)

**Verified against real Sanity data, not just typechecked**: created a real test post with the same test
image in both its main image and a body gallery block, set a real alt text on it, ran the actual
`computeImageReplaceChanges` + transaction-commit + log-creation logic used by the UI, then re-fetched the
post fresh from the API and confirmed both fields were repointed to the new asset, the alt text carried
over, the old asset was trashed, the "still referenced" safety check was correctly scoped, and replaying
the log's `previousValue`s (the same thing History's Undo button does) correctly restored the original
references — then cleaned up every test document and asset afterward. **Couldn't verify through Studio's
own browser UI in this sandbox**: it requires an authenticated login session that a fresh headless
Playwright context doesn't have, so this exercises the real shipped logic directly against the live API
instead — the same approach already used for this repo's other Studio-side write operations.

---

## Export: Markdown, JSON, HTML, EPUB, PDF — per-post and full-archive (shipped 2026-08-05)

The spec's export tooling (`ACE_MASTER_SPEC.md` Phase 10) — Markdown shipped first, scoped down deliberately
from the full five-import/five-export list after asking Asher directly rather than guessing where to start;
the other four export formats followed the same day. Import tooling stayed out of scope entirely — asked
directly and there's no real content left on WordPress/Medium/Substack/Ghost to migrate in, so building
parsers with nothing real to validate them against wasn't worth doing.

Every format shares the same already-dereferenced `ExportPost` shape (`src/lib/exportMarkdown.ts`) and the
same `POST_EXPORT_PROJECTION`/`POST_EXPORT_BY_ID_QUERY`/`ALL_POSTS_EXPORT_QUERY` (`queries.ts`) — one
canonical post shape every converter reads from, not five slightly different ones.

**"Export…"** — a document action (`src/sanity/actions/exportPost.tsx`, registered in `sanity.config.ts`'s
`document.actions`) right in a post's own editor, next to Suggest SEO/Social/Image Prompt. Opens a small
dialog (the same dialog pattern `categoryDeleteGuard.tsx` already established) listing all five formats;
Markdown/JSON/HTML/EPUB build and download immediately in the browser, PDF posts to `/api/export/pdf` and
downloads the response. Refetches the current document by its own `_id` via `POST_EXPORT_BY_ID_QUERY` (not
from `props.draft` directly — see below on why). Works on an unpublished draft.

**Studio → Export** (top nav, `src/sanity/components/ExportTool.tsx`) — the "full collection" half. A format
selector (defaulting to Markdown, so the original one-click flow is unchanged) above a single "Download all
posts" button. Fetches every *published* post via `ALL_POSTS_EXPORT_QUERY` — drafts are deliberately excluded
here, an archive meant to leave the building shouldn't include work still mid-draft, unlike the single-post
action above. Markdown/JSON/HTML each produce one file per post, zipped together (`jszip`); EPUB and PDF each
produce a single combined file instead (a book with every post as its own chapter, or a document with every
post concatenated) since neither format is naturally "many small files."

**`POST_EXPORT_PROJECTION` (in `queries.ts`) reuses `POST_BY_SLUG_QUERY`'s exact reference-resolution shape**
— `internalLink` marks get a `slug` field resolved server-side, `snippetRef` blocks get their `snippetData`
dereferenced — specifically so export can never drift from how the real post page resolves the same
references. This is also why the document action refetches by `_id` rather than converting `props.draft`
directly: the raw document only has bare `_ref`s, not the resolved shape the converter needs. **Requires
`{perspective: 'raw'}`** on that refetch specifically because it can run on an unpublished draft — the same
gotcha as the Editorial Calendar's cron (this API version's default query perspective silently excludes
`drafts.*` documents).

**Every custom block type has its own renderer**, via the official `@portabletext/markdown` package's `types`/
`marks` config (all in `exportMarkdown.ts`): `divider` → `---`, `codeBlock` → a fenced block (reuses the
library's own `DefaultCodeBlockRenderer`, since the field names already match), `callout` → a labeled
blockquote, `accordion` → a GFM `<details><summary>` block, `youtube`/`instagramEmbed` → a plain link, `image`
→ a real `![alt](url)` pointing at the existing Sanity CDN URL (images are linked, never bundled into the
zip — keeps it small), with `additionalImages` (a gallery) listed as further images under an HTML comment
noting the display style. `internalLink`/`affiliateLink` marks need explicit renderers since the library's own
default only knows about its own `'link'` type by name; without one, they'd fall through to `unknownMark` and
silently lose their `href`. `textColor` marks get no custom renderer at all — the default `unknownMark`
fallback already does exactly the right thing for it (pass through the text, drop the color, since Markdown
has no color concept).

**`snippetRef` recurses**: a resolved snippet's own `content` gets run back through `portableTextToMarkdown()`
with the same options object, so a link inside a snippet renders identically to a link in the post body.

**Verified against real content before shipping, not fixtures** — ran `buildMarkdownFile()` directly against
real fetched posts via `npx tsx` (no dev server needed for this kind of check): confirmed a post with internal
links and a YouTube embed, a 6-photo gallery (including the additional-images branch), and a post with an
accordion all converted correctly by reading the actual generated Markdown output.

**JSON** (`src/lib/exportJson.ts`) — no conversion logic at all, just `JSON.stringify(post, null, 2)` on the
same `ExportPost` shape. The one format with genuinely nothing that could drift from the others.

**HTML** (`src/lib/exportHtml.ts`) — a real, self-contained `.html` file per post via the official
`@portabletext/to-html` package (`toHTML()`, mirroring `@portabletext/markdown`'s `types`/`marks` config
pattern). Inline `<style>`, no external font/stylesheet links — nothing to break once downloaded, same
"portable, no vendor lock-in" spirit as Markdown. `youtube` renders a real `<iframe>` (extracts the video ID
from watch/youtu.be/shorts URL shapes), `image`/gallery renders real `<figure>`/`<figcaption>` elements,
`textColor` gets an actual `<span style="color:...">` (a real improvement over Markdown, which has no color
concept) using a small static hex map (`TEXT_COLOR_HEX`, exported from this file) — not theme-aware like the
live site's `--tc-<name>` CSS variables, since an exported file has no site CSS to lean on.

**EPUB** (`src/lib/exportEpub.ts`) — a genuine, hand-rolled EPUB 2.0.1 package: `mimetype` (must be the first
entry in the zip, stored uncompressed — part of the EPUB spec itself, not a `jszip` quirk), `META-INF/
container.xml`, an OPF manifest/spine, an NCX table of contents, one XHTML chapter per post. Reuses
`exportHtml.ts`'s `htmlComponents` as a base but **cannot reuse it unmodified** — EPUB readers render
offline, inside the package's own sandbox: `youtube` falls back to a plain link (no `<iframe>`, since
e-readers don't execute remote content) and `internalLink` points at the full `https://asheraw.com/blog/
<slug>` URL instead of a relative path (nothing to resolve a relative path against inside an offline
package). **The one format that actually downloads and bundles images** (`bundleImages()`) rather than
linking to Sanity's CDN — a remote `<img src="https://...">` mostly just shows broken in an offline e-reader,
unlike Markdown/HTML where a live connection is assumed. Each chapter gets its own `OEBPS/images/<chapterId>/`
subfolder so two posts' images can never collide on the same filename inside a multi-post archive — a real
bug caught and fixed during review, before it ever shipped: the first draft used one shared folder across
every chapter, along with an image path that was relative to the *wrong* directory. Verified by inspecting
the actual generated archive's structure and a real chapter's XHTML content, not just that it produced a
file of nonzero size.

**PDF** (`src/lib/exportPdf.ts`, via `pdfkit`) — walks Portable Text directly rather than converting through
HTML/Markdown first, since `pdfkit`'s API is imperative (draw commands), not string-based. Real inline
styling, not just block-level structure: bold/italic/underline/strike-through/text-color/links all apply
per-span via `pdfkit`'s `continued: true` chaining, matching what a span's own `marks` say, layered with
block-level defaults (headings always bold, blockquotes always italic, with a drawn left bar). Images are
forced to `.format('jpg')` via Sanity's own image URL builder — `pdfkit` only decodes JPEG and PNG natively,
and Sanity can serve WebP. **No fold/unfold for accordions** — always shown expanded, the only sensible
behavior for something meant to be read linearly, not clicked through.

**PDF runs through a new `/api/export/pdf` route (Node runtime), not directly in the Studio browser bundle**
— `pdfkit` uses Node's `Buffer`/stream internals and doesn't run in a browser SPA, unlike every other format
here. Same "needs real server-side work" pattern already established by the Link Checker's "Check now" button
hitting `/api/check-links`. The Studio UI (`exportPost.tsx`'s dialog, `ExportTool.tsx`'s format selector)
POSTs `{postId}` or `{all: true}` and downloads the binary response.

**A real, non-obvious deploy gotcha, caught and fixed the same day it shipped**: bundling `pdfkit` into the
Next.js server build breaks it — `pdfkit` reads its own bundled font-metric files (`Helvetica.afm` etc.) from
disk at runtime via a `__dirname`-relative path, and bundling rewrites that path, failing with `ENOENT` on a
path that made no sense (`D:\ROOT\node_modules\...`, not the real project directory). Fixed by adding
`pdfkit` to `serverExternalPackages` in `next.config.ts`, which tells Next.js to `require()` it straight from
`node_modules` at runtime instead of bundling it. **Verified twice, not just once**: locally after the fix,
then again directly against the live `asheraw.com/api/export/pdf` endpoint after deploying — Vercel's own
serverless file-tracing is a different mechanism than local `next dev`, so a local pass alone wouldn't have
proven the font files actually made it into the deployed function's file set.

**Caught two real rendering bugs by actually rendering real PDFs and looking at them** (`PyMuPDF`, converting
generated pages to images), not just by running the code or checking file size: (1) the callout and code-block
background boxes had their text drawing *above* the box instead of inside it — a `y`-coordinate math error a
type check or successful build has no way to catch, since the code was valid TypeScript that just computed
the wrong number. (2) a "▶ Watch on YouTube" label rendered as garbled characters ("%¶") — `pdfkit`'s built-in
standard fonts (Helvetica, Times, Courier) only support a Latin-1/WinAnsi-range character set, and the ▶
arrow glyph (U+25B6) silently fails rather than erroring. Fixed by dropping the arrow for PDF specifically
("Watch on YouTube" alone) rather than chasing down a custom embedded font for one symbol — the same
Unicode limit likely applies to emoji or other exotic characters anywhere in a post's own body text too, a
known, accepted limitation rather than something solved here.

---

## Content Audit: missing-metadata check, not stale-by-age (shipped 2026-08-05, moved into Content Health same day)

**Studio → Content Health → Missing Metadata tab** (`src/sanity/components/ContentAuditTool.tsx`, rendered
inside `ContentHealthTool.tsx` alongside Link Checker — merged the same day it shipped, see the top-nav
cleanup entry below) flags every published post
missing a featured image, image alt text, an excerpt, or a category. **Deliberately not age-based** —
the ACE spec's original wording was "stale flags (configurable 6/12/24 month threshold)," but asked Asher
directly before building it and old posts aging isn't something he wants flagged on a personal blog with
no expiring content; he also wasn't sure what the use case would even be. Rescoped to genuinely useful
checks instead, confirmed with him rather than guessed.

**No schema change** — every check reads a field that already exists on `post`. The alt-text check reuses
the exact `coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText)`
fallback pattern already proven in `POST_SUMMARY_PROJECTION` (`queries.ts`), so "does this post have alt
text" means the same thing here as it does everywhere else on the site.

**Simpler than Link Checker on purpose**: no "Check now" button, no API route, no persisted results
document — the four checks are cheap enough to compute live on every load, so it's just a query and a
`.map()`, not a scan-and-store pattern. A post with nothing wrong doesn't appear in the list at all,
keeping it short and actionable rather than a wall of green checkmarks.

**"Open post"** per row opens straight into that post's editor via `openPostInStudio()`
(`src/sanity/lib/openPostInStudio.ts`), since the point is fixing it, not just knowing about it — see
"Open post" links: the real fix further below for the actual URL scheme this uses (an earlier version
guessed wrong and didn't work).

**Verified against real content before shipping**: ran the exact GROQ query via `npx tsx` against the live
dataset (19 published posts at the time) — flagged exactly one real post (missing a featured image and an
excerpt), everything else correctly showed as clean.

**Per-check dismissal added 2026-08-11** — the actual reason this tool went unused: it had no way to say
"this one's fine, stop flagging it," unlike 404 Hits/Error Log/Search Queries, which all support marking
something ignored. Asked whether dismissal should work at the post level or the individual-check level;
Asher chose **per-check** specifically because a blanket per-post dismiss risked hiding a real issue
alongside whatever was actually being waived ("might catch too many issues and swipe them under the
carpet," his words). New hidden field `postType.contentAuditDismissed` (string array of check keys —
`'hasImage' | 'hasAltText' | 'hasExcerpt' | 'hasCategory'`), `hidden: true` so it never clutters the main
17-field post editor — the only way to set it is the tool's own Dismiss/Restore buttons, which have the
actual context (what's missing, why) that deciding this needs. `issuesFor()` in `ContentAuditTool.tsx`
filters a post's raw issues against its `contentAuditDismissed` set before rendering; a dismissed check
stays visible in a collapsible "Dismissed" section with a one-click Restore, never silently gone. Patches
via the same `client.patch(id).set({...}).commit()` pattern `NotFoundHitsTool.tsx`'s status toggle already
uses — Studio's own `useClient()` carries the logged-in user's write permissions, no separate token needed.

**`DashboardTool.tsx`'s own audit-issue count applies the identical dismissal logic** (`activeIssueCount()`,
a deliberate near-duplicate of `issuesFor()`) rather than the old "any of the four fields missing" check —
without this, the Dashboard's number and the tool's own number would silently disagree the first time
anything got dismissed, which is exactly the kind of drift that made the original count feel untrustworthy
in the first place.

---

## Bulk Operations: tag/category/author edits, search-replace, undo (shipped 2026-08-05)

**Studio → Bulk Operations** (`src/sanity/components/BulkOperationsTool.tsx`), three tabs: **Bulk Edit**,
**Search & Replace**, **History**. Scoped down from the ACE spec's fuller list, on purpose: no bulk
publish/unpublish (this schema has no "archived" lifecycle state to move posts into or out of — only
Sanity's own draft/published), no "reassign to series" (no series field exists on `post` — building one
would be inventing a requirement, not implementing one), no link/URL-migration tool (a genuinely separate
feature). What's here: field edits across a selected set of posts, a real find-and-replace, and an undo
log that covers both.

**Core logic lives in `src/lib/bulkOperations.ts`, deliberately separated from the Studio component** —
same reasoning as `src/lib/exportMarkdown.ts` etc.: every `compute*Changes` function is pure (given
currently-loaded post data and an intended edit, returns exactly what would change and what it would
revert to), so it can be run directly via `npx tsx` against real fetched data before the UI ever touches
it. This is what actually got exercised for verification, not fixtures.

**Bulk Edit**: fetches every post (`title`, `tags`, `categories[]{_ref}`, `author{_ref}`) plus the full
category and author lists, alongside a filterable checkbox list. Add/remove tag, add/remove category,
change author each compute a `FieldChange[]` — **the whole new field value, not an incremental patch
operator** (e.g. `computeAddTagChanges` returns `newValue: [...currentTags, tag]`, not an `append`
instruction). Deliberate: `client.patch().set()` can only be called once per patch (see the
`categoryDeleteGuard.tsx` gotcha noted elsewhere in this file — calling `.set()`/`.unset()` more than once
silently drops all but the last call), so computing the complete final value client-side and setting it in
one call sidesteps that footgun entirely rather than working around it.

**Search & Replace**: the candidate-post query uses GROQ's `pt::text(body) match $term` — flattens a
Portable Text field to plain text for text search, confirmed working directly against the live dataset
before relying on it (not previously used anywhere else in this codebase). **Scoped to plain block text
only** — `title`, `excerpt`, and `block`-type children spans in the body (paragraphs, headings,
blockquotes, list items) — explicitly **not** image captions, callout text, code blocks, or accordion
content. Walking every custom block type's own text fields for a feature meant to fix a typo across many
posts, not rewrite arbitrary structured content, wasn't worth the complexity — stated in the tool's own UI
text, not left silent. Replacement is scoped per-post (every occurrence in an included post changes
together, not selectable occurrence-by-occurrence) and preserves marks/annotations automatically, since
only `span.text` itself is mutated, never a span's `marks` array.

**History & Undo**: every commit — bulk edit or search-replace — writes one `bulkOperationLog` document
(`bulkOperationLogType.ts`, system-created only, same "never hand-authored" convention as `linkCheckType`)
recording, per affected post, which `fieldPath` changed and its `previousValue` (`JSON.stringify`d, whole
field, not a diff). **Undo granularity is deliberately coarse — whole-field snapshots, not
per-character diffing** — one mechanism covers every operation type uniformly, since undoing an add-tag,
a category swap, and a search-replace are all really the same "put this field back to what it was"
operation regardless of what changed it. Undo replays `JSON.parse(previousValue)` back via one
`client.transaction()`, then patches the log's own `undoneAt`. **If Undo fails outright** (shown as an
error rather than silently), the most likely cause is a post in that batch having been deleted since the
original operation — a transaction is atomic, so one missing document fails the whole undo; not handled
with per-post partial recovery, since it's a genuinely rare edge case and the failure is at least loud
rather than silent.

**Verified with real writes, not just reads — the one part of this session's work where a read-only check
wouldn't have been enough.** Whether Undo actually restores content is a claim about mutation, not just
computation, so it needed a real commit-and-revert cycle to actually prove: created a throwaway draft post
(deleted immediately after, never real content), ran a bulk tag-add through the *exact* transaction code
path the UI uses, confirmed it applied, ran Undo through the *exact* replay logic the UI uses, confirmed
the field matched its real pre-edit state exactly. Repeated for search-replace across title/excerpt/body
together. Both restored correctly. (First pass on the search-replace body check looked like a failure —
turned out to be the *test's* own bug, comparing the restored value against the literal JS object used to
create the post rather than what Sanity had actually stored and returned for it; comparing against the
real fetched pre-edit state confirmed the undo logic itself was correct the whole time.)

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

**Undoing a bad edit (confirmed 2026-08-04):** every document in this project — snippets included — has full
version history retained back to the project's earliest documents (confirmed directly via Sanity's
history/transactions API). Open the snippet, use Studio's own history/timeline panel (the clock icon in the
document header) to see every past version and restore one — this is a built-in Sanity Studio feature, not
something specific to this codebase, and needs no custom code to work.

---

## Internal links: linking to another post without a raw URL

In the rich-text toolbar, alongside **External URL**, there's **Internal link (post)** — search and pick a
post (Sanity's own built-in reference search, type to filter by title) instead of typing or pasting its URL.
The link stores a reference to the post's stable `_id`, not its slug, so if you rename that post's slug
later, every internal link to it keeps working automatically — the current slug is resolved fresh every time
the linking post is rendered (`POST_BY_SLUG_QUERY`), never baked in at write time.

**Fixed 2026-08-04 — it was there but invisible:** neither annotation had an `icon` set, so Sanity's editor
fell back to the same generic link icon for both, making the two toolbar buttons look like one. Asher had
been using the tool for days without ever noticing the second button. Both now have distinct icons
(`LinkIcon` / `DocumentIcon`) — if a future annotation is ever added here, give it its own icon too, or it'll
disappear into the same trap.

**How it works, for troubleshooting:** the annotation lives in `blockContentType.ts`'s `marks.annotations`
as `internalLink` (an object field wrapping a `reference` to `post`). The query dereferences it inside
`markDefs`: `markDefs[]{..., _type == "internalLink" => {"slug": reference->slug.current}}`. Renderer:
`src/components/asher/blog/portableTextComponents.tsx`'s `marks.internalLink`.

**If an internal link shows as plain text instead of a link:** the referenced post was deleted, or the query
projection above got removed/changed — `value?.slug` comes back `undefined` and the renderer falls back to
plain `<span>` text rather than a link to nowhere. Verified end-to-end 2026-07-30 with a throwaway test post
linking to a real post, confirming the resolved slug matched exactly.

**Same-tab override (shipped 2026-08-04):** External URL links open in a new tab by default (unchanged,
already the behavior) — the annotation now also has an "Open in the same tab instead" checkbox for the rare
case a writer wants one specific link to replace the current page. `link` mark's `openInSameTab` field on
`blockContentType.ts`; the renderer's `openInNewTab` check in `portableTextComponents.tsx` is `isExternal &&
!value?.openInSameTab`, so leaving it off preserves the existing default exactly.

---

## Distraction-free writing: what's actually there

The body field (Studio) now shows a small stats bar above the editor: live word count, estimated reading
time, and a session timer (resets on page reload, it's not a persistent streak counter). Below that, a
collapsible **Outline** lists every heading in the post with a best-effort click-to-jump (scrolls the editor
to that heading if found).

**The session timer starts on the first real edit, not the moment the field mounts (fixed 2026-08-08).**
Originally it started counting from `Date.now()` at mount, so just opening a post to reread it, or clicking
into the body field and back out, already showed time elapsed on a "writing session" nothing was actually
written in -- Asher's own complaint. `DistractionFreeWritingPanel.tsx` now takes a plain-text snapshot of
whatever's in the field the moment it mounts, and only starts the clock once the current plain text differs
from that snapshot. Deliberately compares **plain text**, not the raw Portable Text `value` array directly --
Sanity's own editor can re-key or otherwise normalize that array on mount with no real edit involved, which
would have started the clock on a false positive. Also deliberately one-way: once started, it keeps running
even if everything typed gets deleted again, since a session quietly un-starting mid-rewrite would be more
surprising than it simply continuing.

**Scope decision, on purpose:** the PRD also describes a fade-non-active-paragraph focus mode and a
cursor-centering typewriter scroll. Neither is built. Both require patching the Portable Text editor's own
rendering internals, which isn't a stable, documented customization surface in Sanity Studio — the "clever
and fragile" pattern Rule #4 warns against, and a real risk of breaking on a future Sanity upgrade for
comparatively little value. Full-screen writing itself is already covered by Studio's own built-in expand
button on this field (top-right of the editor toolbar).

**Focus mode auto-expands the body editor (shipped 2026-08-05, fixed same day):** Asher's actual writing setup
is the document pane's Focus mode (top-right toolbar icon, hides the left Structure/post-list panes) *plus* the
body field's own Expand editor fullscreen state — previously two separate clicks. Entering Focus mode now
automatically triggers Expand editor too; title, slug, and every other field stay in the normal view, since
only the body field needs the extra room.

The first version of this read the document pane's `maximized` flag off Sanity's `DocumentPaneContext` and, on
it flipping true, wrote directly to `FullscreenPTEContext`'s `setFullscreenPath(path, true)` — both imported
from `sanity/_singletons`. It shipped, and didn't work: Asher reported Focus mode still wasn't expanding the
editor. Reading Sanity's actual `PortableTextInput` source (not just its type definitions) explained why —
that component only reads `FullscreenPTEContext` **once, at mount** (or when its own `path` prop's identity
changes); its real expanded/collapsed state is separate local React state seeded from the context at that one
moment and never re-synced afterwards. A write from outside, after mount, lands in the context but nothing
tells the already-mounted field to look at it again — a real gap between "the shared state changed" and "the
component that renders the UI noticed."

**The actual fix** doesn't try to fake that internal state at all. The field's real expand/collapse button
carries a stable `data-testid` (`fullscreen-button-expand` when collapsed, `fullscreen-button-collapse` when
expanded) — confirmed directly in Sanity's compiled source, and in `@sanity/ui`'s own `Button` source, that
`data-testid` and the button's `onClick` land on the same native `<button>` element. So instead of writing to
context, Focus mode now finds that real button inside the field's own DOM subtree and calls `.click()` on it
directly — the exact same effect a manual click has, since a native `click()` on an element with a React
`onClick` reliably fires that handler. `DocumentPaneContext` is still read the same way (with `?.`, since it
can genuinely be `null` outside a document pane) purely to know *when* to click; `FullscreenPTEContext` is no
longer touched. **Still relies on one `@internal` Sanity context plus two test-id strings, none part of the
stable public API** — if a future Studio version renames a test id, this quietly stops finding the button
rather than erroring, and Studio reverts to today's manual-click behavior with no crash or data risk.

**Confirmed working, then made symmetric (same day):** Asher confirmed entering Focus mode correctly expands
the editor. He then asked for leaving Focus mode to collapse it back too, since that's exactly when he's back
to working on title, slug, images, and SEO fields, which live outside the expanded editor. The single effect
now picks whichever test id matches the direction (`fullscreen-button-expand` entering, `-collapse` leaving)
instead of only ever looking for "expand" — both directions run through the same click-simulation mechanism
described above.

**Verification limit, stated plainly:** this sandbox has no Sanity Studio login, so the actual click-and-toggle
interaction couldn't be exercised end-to-end in a browser during development — Asher's own confirmation in
Studio is what verified the entering direction; the exiting direction added the same day follows the identical,
now-proven mechanism, just for the opposite test id.

**Stats bar "disappearing" in the expanded editor (shipped 2026-08-05):** Asher noticed the word count/reading
time/session timer bar was gone once the editor expanded. It was never actually removed — it's covered up.
Sanity's own expanded-editor state (`isFullscreen` on `PortableTextInput`) renders the editor into a
full-viewport `Portal` (see `ExpandedLayer` in Sanity's source), which visually sits on top of the entire normal
document layout, including this panel's own `Card`. There's no supported way to inject content into that
overlay from `renderDefault`'s caller, so the fix floats a *duplicate* of just the three stat badges via
`createPortal(..., document.body)`, `position: fixed; top: 12px; right: 12px`, with a maximal (`2147483647`)
z-index, rendered only while `maximized` is true. The original in-flow `Card` is untouched and keeps working
exactly as before in the normal (non-expanded) view — there's no visible duplicate there, only when the overlay
is actually covering it.

**If the outline's click-to-jump doesn't scroll to the right place:** this relies on Sanity's Portable Text
editor rendering each block with a `data-key` attribute matching its `_key` — a reasonable but unverified
assumption (no Studio login available to visually confirm interactively this session). It's implemented
defensively (does nothing if the element isn't found, never errors) — if it's not working, the outline
listing itself (which headings exist, in order) is still accurate and useful on its own.

---

## Comments: how the moderation queue works

Every comment submitted on a post starts as **pending** and shows nowhere on the live site until approved.
**Studio → Comments** (top nav) is a dedicated moderation queue — not a plain document list — showing every
comment with one-click **Approve** / **Reject** / **Mark as Spam** / **Edit** / **Trash** buttons, and a count
of comments awaiting review at the top of the tool. Component: `src/sanity/components/CommentsTool.tsx`.

**Top-level comments sort newest-first within each post's group (changed 2026-08-05)** — the point of opening
a group is "what's new since I last looked," so the newest sits right at the top rather than needing a scroll
to the bottom. Replies within a thread still sort oldest-first (`allTopLevel` in `visibleGroups` flipped to
descending; the `replies`/`replies3` sorts further down in the render stayed ascending on purpose — a
conversation should still read the way it happened).

**A pending count is also always visible, without opening the Comments tool at all** — a floating "N comments
need review" badge in the corner of every Studio screen (fixed 2026-07-31 after an earlier attempt, a badge
on the Comments tool's own nav icon, turned out to never actually render at normal window widths; see "Studio
→ Comments layout" further below for the full story and why). Still, a badge only helps if you're already
looking at Studio in the first place — the email notification below is the actual fix for "I didn't know to
look."

**Email notification (shipped 2026-07-31):** every new comment or reply — from anyone, not just the first
one on a post — sends a notification to the same inbox the contact form already notifies
(`RESEND_API_KEY` + `CONTACT_NOTIFICATION_EMAIL`, no new setup needed if the contact form already works),
with the commenter's name, their message, which post, and a direct link to Studio → Comments. Best-effort:
if Resend isn't configured or the send fails, the comment is still saved and waiting in the moderation queue
exactly as before — a visitor never sees a failure just because the notification didn't go out.

**Settled groups collapse by default (shipped 2026-08-04).** As more old comments get restored (see the
Wayback-restoration section further below), the tool started feeling heavy — every post's full thread stayed
expanded forever, whether it needed a look or not. Now a group with nothing pending shows collapsed, one line
("On 'X' · N comments"), expandable with a Show/Hide button whose state is kept in `expandOverrides` (in-memory,
resets on reload — deliberately not persisted, since what needs attention changes every visit anyway). A group
with anything pending still auto-expands. The **search box** above the list (name/message text) always forces
full expansion of whatever matches, since collapsing during a search would defeat the purpose — it also pulls
in a matched comment's *whole thread*, not just the single card containing the term, via `threadFamily()`, so
a matching reply never shows divorced from the comment it's replying to.

**A group could auto-collapse itself the instant its last pending comment got approved (real bug, fixed same
day it shipped).** `isExpanded` for a group falls back to "does it have anything pending" only when the user
hasn't explicitly toggled it (`expandOverrides[key] ?? groupPending`). Approving, rejecting, or spam-marking a
group's *last* pending comment flips `groupPending` to `false` the instant that patch lands — with no explicit
override set yet, the whole group collapsed away right as the action completed. Asher described this as the
tool "closing the entire tab" on him mid-review, disruptive specifically because approving a comment and then
immediately replying to it is a normal part of his workflow — the group vanishing mid-action lost his place.
Fixed in `setStatus()`: any status change now also pins that comment's group open in `expandOverrides`, the
same as an explicit manual expand, so a group only ever collapses from the user's own toggle — never as a side
effect of the very action that just settled it.

**Post titles link to the live post,** in both the main view's group header and the Trash view's per-card
reference — `https://asheraw.com/blog/<slug>` in a new tab, using each row's already-fetched `postSlug`.

**Group headers use a fixed-column `Grid`, not a `Flex`** (`GROUP_HEADER_COLUMNS`) — Asher flagged that longer
post titles and the "Unlock comments" vs "Lock comments" label length were shoving the count badge and buttons
to a different spot on every row. Since each group is its own separate `Grid` instance (one per post, not one
shared table), the fix is the same one `ContactSubmissionsTool.tsx` already uses: fixed `fr`/`rem` column
widths, never `auto` — a variable-width column only stays aligned across independent Grid instances if every
instance is handed the exact same fixed template, since `auto` sizes to that row's own content alone. The
title column absorbs whatever's left via `minmax(0, 1fr)` and truncates with `textOverflow="ellipsis"` rather
than pushing later columns out of line.

**The per-comment info line was rebuilt as one joined string** (`metaLine` in `CommentCard`) instead of
several separate `Flex` children with hand-glued `"· "` prefixes — those looked fine until something long
(a restored comment's placeholder `name@restored.invalid` email, in particular) forced a wrap, at which point
the manual separators misaligned. `[...].filter(Boolean).join(' · ')` into a single `<Text>` always wraps as
plain prose, so the spacing holds regardless of width. If another per-comment detail ever needs adding, put it
in this array rather than reaching for another separate `Flex` row.

**Restoring old comments from the Wayback Machine (an established pattern as of 2026-08-04):** Asher sends
screenshots of an archived post's comment thread; comment documents get created directly via a throwaway
script using `SANITY_API_WRITE_TOKEN` (not through `/api/comments`, since these are already-public historical
comments, not new pending submissions) — `status: 'approved'`, `isAuthorReply: true` on Asher's own replies,
a placeholder `name@restored.invalid` email (real ones are never visible in a public comment view, WordPress
included, so there's nothing to actually recover), and `createdAt` set to the real original timestamp
converted from the screenshot's local time (Asher is in Singapore, UTC+8) to UTC. Threading uses the exact
same 3-level flatten rule `resolveReplyParentId` already applies to real replies today — worked out by hand
per thread rather than trusting the screenshot's visual nesting alone, since a theme's own display cap can
visually flatten a deeper reply in a way that doesn't tell you where the *data* should actually point.
**If a screenshot has no visible timestamps at all** (happens with some archived recap/widget views, as
opposed to the full dated thread view) — ask Asher directly how to date those rather than guessing silently;
his call so far has been to estimate from the list's own apparent order, clearly flagged as estimated in the
commit rather than presented as exact. Fixable later per-comment via the date-edit field covered above.
`src/app/api/comments/route.ts`.

**The byline comment-count badge can lag briefly right after a script-restored comment lands.** The post page's
`commentCount` (the small speech-bubble badge near the title, `src/components/asher/blog/CommentCountBadge.tsx`)
comes from a cached, tag-invalidated `sanityFetch()` call — normally invalidated the instant a comment changes,
but that invalidation is relayed through an active browser connection to Sanity's Live Content API. Approving a
comment through Studio has that connection open already; a direct write-token script (as above) doesn't, so the
cache can take a short while longer to catch up. The comments section itself is unaffected either way — it's a
separate, always-live client fetch (`CommentSection.tsx` → `/api/comments`), never cached. Confirmed 2026-08-05
by checking every post on the site with real comments live in production: all matched immediately by the time
of checking. Not worth "fixing" — it's normal cache eventual-consistency, not a defect, and it self-resolves
without intervention.

**Spam protection:** a honeypot field (a hidden `website` input — real visitors never see or fill it; if it's
filled, the request is silently accepted but nothing is actually saved) plus a simple math challenge (e.g.
"4 + 6 = ?"). Unlike the equivalent-looking check on the contact form, which is only validated in the
browser, this one is also re-checked server-side in `/api/comments`'s `POST` handler — a bot posting directly
to the endpoint, skipping the visible form entirely, can't bypass it the way it currently could on
`/api/contact`. Worth applying the same server-side check to `/api/contact` at some point for consistency,
though the contact form is lower-risk (not publicly crawlable/spammable the way an open comment section is).

**Trash (reworked into a real soft-delete same day, from Asher's feedback) and Mark as Spam vs. Reject
(shipped 2026-07-31, Asher asked directly).** Several things came up together:
1. There was previously no way to actually remove a comment, only Reject (keeps it hidden but keeps the
   record). A first pass added a permanent **Delete**; Asher asked for it to work like an actual trash can
   instead — recoverable for a while, not gone the instant you click it. **Trash** (`CommentsTool.tsx`) is the
   result: sets `trashedAt` on the comment (a soft delete, `client.patch`, not `client.delete`) — it
   disappears from the live site and the normal Comments view immediately, but the document itself still
   exists. A **Trash (N)** button in the tool's header switches to a dedicated view listing everything
   trashed, each with **Restore** (clears `trashedAt`, comment goes right back to normal) and **Delete
   Forever** (an actual, permanent `client.delete`, behind its own separate confirm step). Anything sitting in
   Trash for 30+ days gets permanently deleted automatically — see the cron job below. Trashing a top-level
   comment doesn't cascade-trash its replies; they just stop rendering on the live site too (the frontend only
   ever nests a reply under a top-level comment that's still visible), not crash or show broken. The confirm
   step says so explicitly when a comment being trashed has replies.

   **Every query that decides what counts as "visible" was updated to also exclude trashed comments**, not
   just the obvious one — a comment can technically still have `status: "approved"` while trashed (trashing
   doesn't change status, it's an orthogonal flag), so anywhere that only checked `status == "approved"`
   needed `&& !defined(trashedAt)` added too: the public comment fetch (`/api/comments` `GET`), both
   `commentCount` computations (`src/sanity/lib/queries.ts`), and the reply-notification subscriber
   eligibility check (`/api/comments/notify-subscribers`). Easy spot to introduce a bug if a new "is this
   comment live" check gets added anywhere else later without remembering this.

   **Auto-purge after 30 days** runs as a Vercel Cron Job (`vercel.json`'s `crons` entry) hitting
   `/api/cron/purge-trash` once daily, which deletes anything with `trashedAt` older than 30 days
   (`THIRTY_DAYS_MS` there, matching `TRASH_RETENTION_DAYS` shown to Asher in `CommentsTool.tsx` — if one ever
   changes, change the other too). **Requires a one-time setup step**, same shape as `GEMINI_API_KEY`'s: add a
   `CRON_SECRET` environment variable in Vercel (any long random string) and redeploy. Vercel automatically
   sends it back as `Authorization: Bearer <CRON_SECRET>` on its own scheduled calls to the endpoint; the
   route fails closed (rejects every request with 401) if that variable isn't set at all, since a
   permanent-delete endpoint should never be reachable by just guessing the URL. Until that env var is set,
   trashed comments stay in Trash indefinitely — not wrong, just not yet auto-cleaning itself.

2. **Edit** (`CommentsTool.tsx`) lets a message be corrected in place — same inline-form pattern as Reply,
   Save patches `message` and sets `editedAt`, which then shows as a small "edited &lt;date&gt;" next to the
   timestamp *in Studio only*. Not shown on the live site — worth a conscious decision later if public
   edit-transparency ever matters, but wasn't asked for and wasn't added unprompted.

   **The same Edit form also has a "Submitted" date field (added 2026-08-04)**, for backdating a comment
   that's being manually restored (e.g. one recovered from the Wayback Machine while bringing an old
   pre-migration post back). `createdAt` on the `comment` schema type is `readOnly: true` — that only gates
   Sanity's own generic document form, which comments never go through (there's no comment entry in
   Structure's document list at all), so it doesn't block this tool's own direct `client.patch()` calls, same
   as `editedAt`/`isAuthorReply` already being set the same way. If a future feature ever needs `createdAt`
   editable somewhere else, remember this readOnly flag is cosmetic here, not a real guard.

3. **The paragraph-break display bug Asher spotted via screenshot was real, and now fixed.** A commenter's
   line breaks were always being *saved* correctly (proof: the live site rendered them fine, since
   `CommentSection.tsx`'s `CommentCard` already used `whiteSpace: pre-wrap`) — Studio's Comments tool just
   never displayed them, because `@sanity/ui`'s `Text` component collapses whitespace by default and nothing
   told it not to. One-line fix: the same `whiteSpace: 'pre-wrap'` style, now also applied to the message
   `Text` in `CommentsTool.tsx`. Nothing was ever actually lost; it only ever looked that way in the
   moderation view.

4. Asher also asked about reporting spam "to Google or something" to get it blocked more broadly — that's not
   a real capability for a personal blog; there's no self-service API for this, and building a fake button
   that doesn't actually do anything wouldn't be honest. What's real and actually built instead: **Mark as
   Spam** is a separate status from Reject, and once anything is marked Spam, matching future submissions
   (same email, or same IP if it's a real one — both compared case-insensitively / exactly against every past
   `status == "spam"` comment) get auto-set to `status: "spam"` at creation instead of `"pending"`, in
   `/api/comments`'s `POST` handler. Auto-flagged comments are still saved (nothing silently vanishes, so
   there's always a record) but never show on the site, never count toward "needs review," and don't trigger
   the notification email either — the point is keeping repeat spam out of both Studio's queue *and* Asher's
   inbox, not just moving the burden from one to the other. Comment IP addresses are now captured at
   submission (`ip` field, same `x-forwarded-for` header the contact form already reads) specifically to make
   this matching more resilient than email alone, which is trivially rotated. Not perfect — a determined
   spammer can rotate IPs too — but a real deterrent against the common case (the same script or person
   retrying right after a rejection). This is intentionally forward-looking only: marking one comment as Spam
   does *not* retroactively touch any other existing comment from that email/IP. The **Mark as Spam** button
   itself is hidden once a comment is Approved (Asher's request) — flagging something as spam
   after already accepting it doesn't make sense.

**Getting the math check wrong doesn't lose the comment** (double-checked 2026-07-31, Asher asked directly).
`CommentForm` (`CommentSection.tsx`) only calls `form.reset()` on a *successful* submit — every field is a
plain uncontrolled input, and the form never unmounts on a failed attempt, so a wrong answer (or any other
validation error) just re-renders the same form with everything the visitor already typed still sitting
there. The one gap was that nothing in the UI actually said so — fixed by adding "your comment hasn't been
lost" directly to the math-check error message itself (`/api/comments/route.ts`), so a visitor doesn't have
to just trust that nothing disappeared.

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

**Replies (shipped 2026-07-31, opened up to everyone the same day; extended to 3 levels deep later that day
per reader feedback):** any comment — on the live site, not just in Studio — has a **Reply** link. Nesting
goes 3 levels deep: a comment, a reply to it, and a reply to that reply. The 3rd level still shows a Reply
link, but posting from there doesn't create a 4th level — it **flattens**, landing as another comment at the
same 3rd depth (a sibling of the one just replied to), still attached to the same 2nd-level parent. This is
derived on the fly rather than stored: whichever comment Reply was clicked on gets looked up along with its
own parent, and if *that* parent itself has a parent too (i.e. the clicked comment is already 3 levels deep),
the new comment attaches to the clicked comment's parent instead of the comment itself. Enforced **server-side**
in `/api/comments`'s `POST` handler (`src/app/api/comments/route.ts`) — not just the UI always sending "the
comment Reply was clicked on," since a hand-crafted request could otherwise target any comment ID directly —
and duplicated the same way in `CommentsTool.tsx`'s `submitReply` (`resolveReplyParentId`), since a
Studio-initiated reply creates the document directly with `client.create()` rather than going through that
API route. No schema field tracks depth explicitly; both places derive it from the existing self-referencing
`parentComment` reference. A visitor's reply goes through the same moderation queue as any other comment.
**Asher's own replies are different only in one way:** the **Reply** button inside Studio → Comments creates a
comment with `isAuthorReply: true` and `status: "approved"` set immediately, skipping moderation since it's
Asher's own words, not visitor content — and rendering in a spotlight-accented card with an "Author" badge on
the site (`src/components/asher/blog/CommentSection.tsx`'s `CommentCard`), instead of the neutral style every
other comment (including a visitor's own reply) gets. The reply's display name from Studio is a constant
(`REPLY_AUTHOR_NAME` in `CommentsTool.tsx`) — cosmetic only, change that one line if it's ever wrong; the
actual styling logic keys off `isAuthorReply`, not the name string.

**Replying to a comment that isn't approved yet** works (the reply itself still gets created and approved),
but the moderation tool shows a note that it won't display in proper context on the live site until the
original comment is approved too — the two aren't force-linked, so it's a manual step if you want both
visible together.

**Locking comments on a post (shipped 2026-07-31):** a `commentsLocked` boolean on the post document
(`src/sanity/schemaTypes/postType.ts`, same shape as the existing "Hide from search engines" checkbox) stops
new comments and replies on that post. Existing comments are completely unaffected — locking only blocks new
ones, it doesn't hide or change anything already there. Two ways to toggle it: directly on the post document,
or with one click from Studio → Comments itself — a **Lock/Unlock comments** button next to each post's
heading in the moderation view (`CommentsTool.tsx`), which patches the post document the same way the field
would from its own editor, then updates every comment row from that post in local state so the UI reflects it
immediately without a reload. **Enforced server-side**, not just hidden in the UI: `/api/comments`'s `POST`
handler fetches the post's `commentsLocked` flag (along with its title, replacing what used to be a second,
separate fetch just for the email subject) and rejects with "Comments are closed for this post" if it's on —
a hand-crafted request posting directly to the endpoint can't bypass a locked post any more than the visible
form can. On the live site, a locked post's comment section drops the "leave a comment" form and every Reply
button (`CommentSection.tsx`), replacing the form with a plain "Comments are closed for this post" line while
still showing every comment and reply exactly as before. **Deliberately not locked out: Asher's own replies
from Studio.** `CommentsTool.tsx`'s `submitReply` still works on a locked post — locking is meant to stop new
outside activity, not prevent Asher from adding a final word of his own after closing a thread.

**Comment counts:** the same small speech-bubble icon + count (`CommentCountBadge.tsx`, shared component)
shows on any post with at least one approved comment, in two places — the blog listing page (`/blog`,
`PostCard.tsx`) and, since 2026-07-31, the post page itself, right next to "X min read"
(`src/app/(site)/blog/[slug]/page.tsx`). Both link to `/blog/[slug]#comments`. The count is computed fresh in
the GROQ query (`"commentCount": count(*[_type == "comment" && status == "approved" && references(^._id)])`,
present in both `POST_SUMMARY_PROJECTION` and `POST_BY_SLUG_QUERY` in `src/sanity/lib/queries.ts`) and
already includes replies, not just top-level comments — matches the count shown in the post page's own
comment section header. If a count looks low right after a reply comes in, the almost-always reason is that
the reply is still sitting in Studio's moderation queue: this badge, like the comment section itself, only
counts *approved* comments, matching exactly what a visitor would see if they clicked through.

**Studio → Comments layout (redesigned 2026-07-31):** grouped by post instead of one long mixed list, posts
with anything pending sorted first, replies nested directly under the comment they answer instead of a muted
text reference. A **"New"** tag marks anything created since the last time this tool was open *in that same
browser* — tracked via `localStorage`, so it deliberately doesn't sync across devices; opening Studio on a
different computer/browser won't show what's already been seen elsewhere. That's a real limitation, not a
bug, and the email notification above is the actual cross-device fix.

**Pending-comments badge, fixed (2026-07-31).** The Comments tool's nav icon (`CommentsToolIcon.tsx`) polls
the pending count every 30s and was meant to show it as a small badge right in Studio's persistent top nav —
except it didn't actually show up there: Sanity's navbar renders tool *names* as plain text at normal window
widths, not the custom icon component at all, so that badge was only ever visible in narrow-viewport/overflow
contexts most people never see. Asher flagged this directly after testing (still had to click into Comments
to find out there was anything new). Fixed with a second, independent signal that doesn't depend on how
Studio chooses to render a tool tab: `CommentsNavbarBadge.tsx`, a floating "N comments need review" pill fixed
to the bottom-right corner of the screen, visible on *every* Studio page regardless of which tool is open —
wired in via Studio's own navbar extension point (`studio.components.navbar` in `sanity.config.ts` ->
`StudioNavbar.tsx`, which renders the default navbar untouched and adds the badge alongside it). Both the tool
icon and the new badge now share one polling hook (`usePendingCommentCount.ts`) instead of running two
separate timers against the same query. The tool icon badge is left in place as a belt-and-suspenders extra,
not removed — but the floating badge is the one actually doing the job now.

**One thing considered and deliberately not built here** — Figma-style inline highlight comments — is logged
with full reasoning in `IDEAS.md`, the running list of "good to have, not now" ideas.

## Comments: emoji picker and GIF comments via Giphy (shipped 2026-08-12)

Asher asked about fun media in comments — emoji and GIFs (Tenor/Giphy) — with one hard constraint: no
clickable URLs, to avoid inviting spam. Assessed both before building either. Emoji shipped same message
("Go ahead with the easy emoji upgrade"); GIFs shipped the next day once Asher created a free Giphy API
key and handed it over.

**Emoji, `src/components/asher/blog/CommentSection.tsx`** — a smiley button next to the Comment/Reply
label opens a `Popover` (shadcn/Radix, already a dependency, no new package) showing a curated grid of
~48 common/fun emoji (`COMMENT_EMOJIS`), not a full searchable emoji database — this is a quick-reaction
picker for blog comments, not a chat app, and most visitors already have a native OS emoji shortcut
(Win+. / Cmd+Ctrl+Space) this just makes more discoverable. Clicking one inserts it **at the cursor
position**, not appended to the end — the message field is an uncontrolled `<textarea>` (read via
`FormData` on submit, the same pattern every other field in this form already uses), so insertion works by
mutating the DOM node directly through a `ref` (`el.value = before + emoji + after`, then restoring
`selectionStart`/`selectionEnd` and refocusing) rather than adding React state just to track message text.
Same component used for both the main comment form and the compact reply form — each `CommentForm`
instance gets its own `messageRef`, so replying to one comment never touches another's textarea.

No schema or API change at all: emoji are just unicode characters, and `commentType.message` already
accepts any string up to 3000 characters. Verified with a real Playwright run against the dev server
(typed text, opened the picker, clicked an emoji, confirmed it landed at the end; moved the cursor to the
start and clicked another, confirmed *that* one landed at the very front, not appended) before shipping.

**GIFs, shipped 2026-08-12.** The design that satisfies "no clickable URLs": a GIF renders as a plain
`<img>`, never wrapped in an `<a>` — nothing to click through to anywhere, so it doesn't reopen the
spam-link concern at all.

- **`commentType.ts`**: new optional `gifUrl` field (`readOnly: true` — set only via the picker/API, never
  typed by hand in Studio) alongside the existing `message`, which is no longer required on its own. Not
  folding GIFs into a richer message format — one optional sibling field is much simpler than inventing a
  mini markup language for a single media type.
- **A comment that's just a GIF, no text, is explicitly allowed** — Asher's own call: "it is also a
  response," same as a wordless reaction. `/api/comments/route.ts`'s required-fields check is
  `!postId || !name || !email || (!message && !gifUrl)` — at least one of the two, not both.
- **`src/app/api/gif-search/route.ts`** (new) — proxies Giphy's `search` endpoint (or `trending`, when the
  query is empty, so the picker isn't blank the moment it opens) server-side, keeping `GIPHY_API_KEY` out
  of the browser and forcing every request into Giphy's own `rating=g` filter — worth doing even though
  Asher still reviews every comment before it goes live, since comments aren't pre-moderated *at
  submission time*. Has its own lightweight in-memory per-IP rate limit (20 req/min, resets on cold start,
  same "good enough for this traffic level" tradeoff already accepted for `middleware.ts`'s redirect
  cache) — guards Giphy's free-tier hourly quota against a scripted flood, separate from `/api/comments`'s
  own Sanity-backed rate limit, since this is a GET route with nothing to count against in Sanity.
- **The one real abuse-surface gap, closed**: the picker UI is a convention, not an enforcement — a request
  crafted by hand and posted straight to `/api/comments` could otherwise carry any image URL, not just a
  real Giphy result. `isGiphyUrl()` in `comments/route.ts` rejects any `gifUrl` whose hostname isn't
  `giphy.com` or a `*.giphy.com` subdomain before it's ever stored. Verified directly: a hand-crafted
  request with `gifUrl: "https://evil.example.com/tracker.gif"` gets a 400 with `"That GIF didn't come
  from a recognized source."`
- **`CommentSection.tsx`**: `GifPickerButton` next to the existing `EmojiPickerButton` — a "GIF" pill button
  opens a `Popover` with a debounced (350ms) search box and a 3-column thumbnail grid. Selecting one sets
  `selectedGif` state (lifted to `CommentForm`, unlike the emoji picker's ref-based insert, since the GIF
  needs to render as a visible preview *and* ride along in the submit payload) and shows a removable
  preview above the Send button. `message`'s `required` attribute was removed from the `<Textarea>`; a
  client-side check (`!data.message?.trim() && !selectedGif`) fails fast with a clear error before the
  network round trip, mirroring the server-side check.
- **Public render (`CommentCard`)**: a new `CommentGif` component — plain `<img>`, `max-h-64`,
  `loading="lazy"`, explicitly never inside an `<a>`. `next/image` skipped on purpose: it re-encodes
  through Next's image optimizer, which isn't guaranteed to preserve GIF animation.
- **Moderation render (`CommentsTool.tsx`)**: a matching `CommentGifPreview` (plain `<img>`, capped at
  160px tall) in both the live queue and the Trash view, so Asher is never approving a GIF blind. Also
  updated: the document-list preview (`commentType.ts`) shows `[GIF]` for a GIF-only comment instead of a
  blank title.
- **Real bug caught by testing locally before shipping, not assumed**: the first pass showed broken-image
  icons instead of actual GIF thumbnails, in both the picker grid and the selected preview. The site's own
  CSP (`next.config.ts`) blocks `img-src` by allowlist, and `*.giphy.com` wasn't on it — the exact same
  class of gap as the `*.apicdn.sanity.io` CSP miss documented above for the cookie banner's client-side
  fetch. Added `https://*.giphy.com`; confirmed fixed with a second local run before deploying.

**Setup**: `GIPHY_API_KEY` — Asher created a free Giphy developer account (developers.giphy.com), copied the
"Beta" key (no credit card, no approval wait; already sufficient at this site's comment volume), and handed
it over directly. Stored in `.env.local` for local dev and added to Vercel's Production and Preview
environments via `vercel env add`. Chose Giphy over Tenor specifically because Tenor's API now lives behind
a Google Cloud project (more setup friction) where Giphy's own developer portal is self-contained.

**Verified against the real Giphy API and real Sanity data, not just a local logic check**: searched,
selected, and submitted a real GIF-only comment through an actual browser (Playwright) against the dev
server; confirmed the stored Sanity document had `gifUrl` set to a real `media*.giphy.com` URL and
`message: null`; confirmed the hostname guard and the missing-both-fields validation both fire correctly
via direct requests; confirmed `/api/gif-search` returns real results against the deployed production
domain after shipping. Every test comment was deleted afterward, same "clean up what a real test run writes
to production" convention used throughout this project.

## "Cannot be deleted as there are references to it" publishing an old post (found 2026-08-13)

Asher hit this trying to publish the post whose **slug** is "wrote-these-in-2009": `Document
"drafts.facebook-wrote-these-in-2009" cannot be deleted as there are references to it from
"drafts.facebook-comment-wrote-these-in-2009-0"` (and `-1`, `-2`, `-3`). Publishing a document is, under the
hood, delete-the-draft-and-write-the-published-version — Sanity refuses that delete when anything still
strongly references the draft's exact ID, which is what these four did. **Note the mismatch**: the post's
`_id` is `facebook-wrote-these-in-2009`, not the same as its `slug` (`wrote-these-in-2009`) — a document's
`_id` is set once at creation and never changes, but its `slug` field can be edited freely afterward, and
this post's slug was apparently changed at some point after import. Earlier drafts of this very entry
wrongly assumed `_id` and slug matched and named the post "wrote-these-in-2009" throughout — harmless in
practice since nothing in the actual fix ever hardcoded that string, but worth flagging so a future reader
isn't confused by the discrepancy.

**Root cause, confirmed by reading `commentType.ts` directly, not assumed**: `comment.post` is a plain
(strong) reference, and `comment` documents are never meant to sit in draft state themselves — moderation
is the `status` field, not Sanity's draft/publish mechanism (that file's own header comment says so). These
four legacy Facebook-comment imports are both sitting as `drafts.facebook-comment-wrote-these-in-2009-N`
*and* pointing their `post` reference at `drafts.facebook-wrote-these-in-2009` specifically — both symptoms
of the same thing: whatever imported them ran while the post was still unpublished, and used the literal
`_id` a draft-perspective query handed back, `drafts.` prefix included.

**Not written anywhere in this repo** — no `facebookComment` schema type, no import script for it exists in
version control, so this was created directly against the dataset at some point (Vision, the CLI, or an
ad-hoc script that was never committed), outside anything trackable here.

**Three attempts to actually fix it, each one taught something real:**

1. **A script** (`scripts/fix-draft-referenced-comments.mjs`, still in the repo). Wrong shape of fix —
   Asher doesn't work in a terminal, and even `--dry-run` needed `SANITY_API_WRITE_TOKEN` since draft
   documents aren't on the public-read perspective.

2. **A button in the Comments tool**, using its already-loaded `post._ref` per comment. First version
   flagged every comment whose `postId` started with `drafts.` — 578 of them, almost the entire pending
   backlog, not just the 4 actually blocking this post. Clicking "Fix them now" tried to strip `drafts.`
   from all 578 in one `try`/`catch` around the whole loop — the first one that threw for any reason
   silently killed everything after it, so Asher's "not sure if it did anything" was exactly right: nothing
   had changed.

3. **An "only fix it if a published counterpart already exists" guard**, added on the theory that a comment
   referencing a *never-published* post's draft ID isn't really broken yet (nothing to repoint it to) and
   that Sanity would reject a reference written to a nonexistent document anyway. **Both halves of that
   theory turned out to matter, but the fix was still wrong**: it correctly dropped the flagged count to
   zero, but that included the real four blocking this exact post — which, it turned out, had *never
   successfully published even once*, so no published counterpart could exist yet by definition. The guard
   made the tool unable to ever break that deadlock: nothing could get fixed until a published copy
   existed, and a published copy couldn't exist until the fix ran. Also: Sanity does **not** actually reject
   writing a reference to a not-yet-existing document at the mutation level (that only shows up as a
   Studio-side broken-reference warning) — so the guard was solving a problem that likely wasn't the real
   cause of the original silent failure in the first place.

**Removed the existence-check gate the same day, still didn't fix it — Asher retried and got the identical
error, same four document IDs, completely unchanged.** That was the real signal: if the fix had actually
reached and repointed those four, the error would have named different (or zero) blockers. It never did,
across three separate attempts. The working theory that had been sitting in this entry — a different,
undocumented `_type` the Comments tool's own `_type == "comment"`-scoped query would never see in the first
place — was the actual answer, confirmed by finally checking rather than assuming: this repo defines no
`facebookComment` schema (or anything matching this import) anywhere, so there was never a guarantee these
four were really `comment` documents at all. The Comments tool had been trying to fix things it could never
even see.

**Rebuilt around what Sanity's own error is actually about (shipped 2026-08-13, same day): not "comments,"
references.** The banner and fix no longer scope to `_type == "comment"` at all. `loadStuckPosts()` runs one
query — `*[_type == "post" && _id in path("drafts.**")]{ _id, title, "blockers": *[references(^._id)] }[
count(blockers) > 0]` — a server-side correlated subquery, one round trip, not one query per draft post.
GROQ's `references()` finds *anything* pointing at a given document regardless of type, which is exactly
what Sanity's own delete-blocked check is actually testing — matching the real constraint instead of a
guess about what kind of document usually causes it.

Each returned blocker comes back as a full raw document (no projection) specifically so `loadStuckPosts` can
scan its own top-level keys in JS for whichever one holds a reference pointing at the stuck post — since
there's no schema to look this field up in for an unknown `_type`, it's found by inspection, not assumed to
be `post` the way the comment-scoped version did. A blocker whose reference field can't be found this way
(most likely one nested more than one level deep) is shown separately as "needs a manual look" rather than
guessed at and risking a wrong field getting written.

The banner now reads per-post ("N document(s) are blocking '\<title\>' from ever publishing") instead of a
flat comment count across the whole site, and "Fix them now" repoints every blocker with a known field at
the post's published ID — each one its own `try`/`catch`, same lesson kept from the false start two versions
back, so one real failure surfaces as a specific message instead of silently killing the rest.

**Deployed, then failed again with a real, specific error for the first time** (the `try`/`catch` fix above
finally earned its keep): `Document "drafts.facebook-comment-wrote-these-in-2009-0" references non-existent
document "facebook-wrote-these-in-2009"`. This is the actual root cause, and it's a genuine deadlock in
Sanity's own reference model, not a bug in any version of this fix: `comment.post` is a normal (strong)
reference. A strong reference (1) blocks its target from being deleted while anything still points at it
(the original publish failure), **and separately (2) can't be written pointing at a document that doesn't
exist yet at all** — confirmed here by the error text, not assumed this time. This post has never
successfully published, so its published-ID document (`facebook-wrote-these-in-2009`, no `drafts.` prefix)
genuinely does not exist yet — nothing can repoint a strong reference there until it does, and it can't come
into existence until the reference blocking publish is gone. Every previous version of this fix tried to
write a plain strong reference to that not-yet-existing ID and got silently or (once the per-item
`try`/`catch` landed) visibly rejected for exactly this reason.

**Real fix (shipped 2026-08-13): `comment.post` is now a weak reference** (`weak: true` in
`commentType.ts`). A weak reference does neither of the two things above — it doesn't block its target from
being deleted, and Sanity allows writing one pointing at a document that doesn't exist yet (confirmed by
`@sanity/types`' own type comments, which document a dedicated broken-weak-reference UI state specifically
for this case — dangling is an expected, supported state for a weak reference, not an edge case). The one
real trade-off, worth having made deliberately rather than by accident: if a *published* post is ever
deleted while comments still reference it, Sanity no longer protects against that — those comments are left
pointing at nothing (a broken-reference warning in Studio, `post->title` resolving to null) instead of the
delete being blocked. Accepted here since posts on this site are essentially never deleted once real
comments exist on them.

**The schema change alone doesn't fix already-stored data** — whether a stored reference is weak is a flag
on the value itself (`_weak: true`), not something Sanity retroactively applies to existing documents just
because the schema changed; it only affects how Studio's own form creates *new* references going forward.
`fixStuckPost` in the Comments tool now sets `_weak: true` alongside the repointed `_ref` in the same patch
— writing both together succeeds even though the target doesn't exist yet (weak references tolerate that),
and once Asher actually publishes the post, the now-existing published document is exactly what that
reference already points at — nothing further to fix.

**The script stays in the repo** (`scripts/fix-draft-referenced-comments.mjs`) but is now doubly out of
date: still the old `comment`-scoped approach (not the type-agnostic `references()` query above), and
doesn't set `_weak: true` either. A real gap if it's ever reached for from a terminal — needs both fixes
applied before relying on it again.

## Reply-notification subscriptions (shipped 2026-07-31)

The other IDEAS.md entry — emailing a commenter when there's a reply — is now built, but not as originally
floated (emailing *every* commenter automatically, which was deferred over real spam-deliverability risk to
a stranger's inbox). Built instead as **opt-in, per-comment, self-expiring**:

- **Opt-in, unchecked by default.** Every comment form (top-level and reply) has a small "Email me if
  there's a reply to this" checkbox (`CommentForm` in `CommentSection.tsx`). Checking it sets `notifyOnReply`
  and starts a 30-day `notifyExpiresAt` clock on that specific comment document
  (`src/sanity/schemaTypes/commentType.ts`) — even while the comment itself is still pending moderation, since
  the subscription runs on the commenter's own timeline, not the queue.
- **"Reply" means anywhere in the same thread**, not just a direct reply to that exact comment. Subscribing on
  a top-level comment gets you notified about *any* new reply under it, from Asher or another visitor; a
  reply itself can also subscribe, to hear about later replies from other people in the same thread.
- **Only fires once a reply is actually visible.** The trigger is `POST /api/comments/notify-subscribers`
  (`{replyId}`), called from two places only: `CommentsTool.tsx`'s `submitReply` (an author reply, always
  auto-approved) and `setStatus()` when a *reply* (has `parentComment`) gets manually approved in the
  moderation queue. A still-pending reply notifies nobody — nothing to see yet.
- **Rolling 30-day expiry, not a flat one-time window.** Every time a notification actually goes out, every
  subscriber just notified gets their own `notifyExpiresAt` pushed forward another 30 days. An active
  conversation keeps its subscribers subscribed; one that goes quiet for a month lapses on its own, with
  nothing for anyone to manage.
- **One-click unsubscribe**, no login: `GET /api/comments/unsubscribe?id=<commentId>` (linked from every
  notification email) sets that comment's `notifyOnReply` back to false. The comment's own `_id` *is* the
  token — Sanity ids are long and never shown anywhere public, so a second signed token wasn't worth adding.
- **The email itself** (`src/lib/emails.ts`, `buildReplyNotificationEmail`) is a small styled HTML card (with
  a plain-text fallback) built to push the reader back to the site — a "View & Reply on the Blog" button, not
  an invitation to just hit reply in their email client. The quoted message preview truncates at 120
  characters with an ellipsis (`truncate()` in `emails.ts`), and the post title in the HTML version is a
  clickable link straight to the post, not plain text.
- **Sender and reply handling (updated 2026-07-31, per Asher):** sent from `AsherAw.com/blog Notifications
  <blogcomment@asheraw.com>` (both here and on the new-comment alert in `/api/comments/route.ts` — previously
  `AsherAw.com Comments <hello@asheraw.com>` on both). `blogcomment@asheraw.com` itself still isn't a mailbox
  anyone reads, and the email still says so and points back to the site link instead — but the send now also
  sets `replyTo: CONTACT_NOTIFICATION_EMAIL` (`/api/comments/notify-subscribers/route.ts`, same pattern
  `/api/contact` already used), so if a recipient replies anyway, Resend routes it to Asher's real inbox
  instead of into an address nobody checks.

This reuses the same already-verified Resend setup as every other email this site sends — no new domain
authentication needed. What actually changed the deliverability calculus from the original "email everyone
automatically" idea is the opt-in itself: this only ever emails someone who explicitly asked, about a thread
they're already a real part of, with a working one-click way out.

---

## Publishing: "I published a post but it's not showing up" / "I edited a published post and the change isn't showing"

**Symptoms:** A post is published (or a published post is edited) in Sanity Studio (asheraw.com/studio) but
asheraw.com doesn't reflect it — either a brand-new post never appears on `/blog`, or an existing post's own
page keeps showing the old content.

**These two pages currently use two different freshness mechanisms, which matters for how you troubleshoot:**
- **`/blog` (the listing)** still has a fixed `export const revalidate = 60` — it re-checks Sanity at most
  once a minute, no matter what. Self-heals on its own within a minute if it's ever behind.
- **`/blog/[slug]` (an individual post page)** has **no time-based revalidate at all** — it relies entirely
  on `sanityFetch()` (Sanity's Live Content API, `src/sanity/lib/live.ts`) to push updates on its own. This
  was a deliberate choice (see the comment at the top of `src/app/(site)/blog/[slug]/page.tsx`): running a
  fixed revalidate timer *alongside* the Live Content API's own tag-based updates was found to make every
  keystroke in Presentation/live-preview force a full page reload instead of a smooth in-place update, so the
  timer was removed. **The tradeoff:** if the Live Content API's own update path ever fails silently for any
  reason, an individual post page has nothing else to fall back on — it can stay stale indefinitely instead
  of self-correcting within a bounded time the way `/blog` does.

**What's actually caching this, confirmed by reading `next-sanity`'s own source
(`node_modules/next-sanity/dist/live/conditions/next-js/index.js`), not guessed:** `defineLive` reconfigures
its internal Sanity client with `useCdn: true` unconditionally for the published perspective — every
`sanityFetch()` call on a normal (non-preview) page visit reads through **Sanity's own CDN**, and the result
is cached in **Next.js's Data Cache** (a persistent layer, separate from the page's own HTTP response caching
and separate from Vercel's Build Cache). Confirmed directly on the stuck "J Factor" post via the browser's
Network tab: `x-vercel-cache: MISS`, `age: 0`, `cache-control: no-store` on the page response itself — the
*page* has zero HTTP caching and runs fresh on every request, but the *Sanity data fetched inside that fresh
render* can still come from a stale Data Cache entry regardless. That entry is only meant to clear the instant
something's published, via Sanity's Live Content API pushing a "sync tag changed" event that a Server Action
(`revalidateSyncTagsAction`, wired up by `<SanityLive/>`) turns into a `revalidateTag()` call. **If that chain
doesn't fire or doesn't reach this deployment for one specific publish, the cached data has nothing else
forcing it to refresh** — and critically, **a redeploy does not fix this**, confirmed directly (redeployed
twice on the J Factor incident below, no change) — Vercel's Data Cache is deliberately designed to survive
redeploys, the same way ISR output would.

**Fixed automatically now — nothing for Asher to do (shipped 2026-08-06, second pass).** Every time the
**Publish** button is clicked on a post, `src/sanity/actions/revalidateOnPublish.ts`
(`withRevalidateOnPublish`, composed onto the publish action in `sanity.config.ts` alongside
`withAutoPublishDate`/`withPrePublishChecklist`) waits ~4 seconds — giving Sanity's own systems a moment to
settle — then calls `GET /api/revalidate` in the background, clearing the Data Cache for the whole blog
section directly. This doesn't replace the Live Content API's own automatic update path from the section
above; it's a second, independent path to the same result, so whichever one actually fires first wins and
nothing conflicts by having both running. Best-effort, same as this project's other background side effects
(comment/contact notification emails, etc.) — a failed or skipped call here never blocks Publish or shows an
error; worst case the site just takes as long to catch up as it did before this existed. **The first version
of this fix required a manual step (visiting a URL with a secret) — reworked same day into this fully
automatic version after Asher's feedback that the manual version was too much friction for something that
should just work when he clicks the button he already clicks.** `/api/revalidate` itself is intentionally
unauthenticated (no secret) — same low-stakes-public-route pattern as `/api/track-404`/`/api/track-search`;
worst-case misuse is a few extra Sanity reads, never data exposure or a content change, so a secret Asher
would have to set up and remember wasn't worth the friction for what it actually protects.

**Checks, if a post ever still looks stale despite the above (should be rare now):**
1. **Confirm it's actually published, not just saved as a draft.** In Studio, open the post — a green
   "Published" badge (not a "Publish" button still showing) confirms it went through.
2. **Rule out your own browser/device before assuming it's the site:** hard-refresh
   (Ctrl+Shift+R / Cmd+Shift+R), and ideally check from a second device on a different network entirely. If a
   completely different device/network shows the same stale content, it's not your browser or local network
   caching — it's server-side.
3. **For `/blog` specifically:** wait a minute; it re-checks on its own timer regardless of anything else.
4. **As a manual fallback**, visiting `asheraw.com/api/revalidate` directly in a browser (no secret needed)
   forces the same clear the auto-trigger above does — useful if the auto-trigger's background call happened
   to fail (best-effort, not guaranteed) or for content edited somewhere other than a post's own Publish
   button. Optional `?path=` query param targets something more specific than the whole blog section (e.g.
   `?path=/blog/some-other-slug`) — always additionally clears `/blog` itself too either way. **Do not rely on
   redeploying instead** — confirmed directly that a redeploy alone does not touch this cache layer (Vercel's
   Data Cache is deliberately designed to survive redeploys).
5. **If this keeps happening, not just a rare one-off:** worth checking whether `SANITY_API_READ_TOKEN` is
   still correctly set in Vercel's environment variables (`src/sanity/lib/live.ts`'s
   `browserToken`/`serverToken`) — an invalid or missing token could plausibly degrade the Live Content API's
   own update path silently, though the auto-trigger on Publish should catch it regardless of that.

**Incident, 2026-08-06:** Asher edited an already-published post ("Easter 2019: The J Factor Afterthoughts")
in Studio — confirmed green "Published" status, "Last published 38 min. ago." The live post page kept showing
the old content, confirmed stale on a second device on a completely different network (ruling out
browser/local-network caching), **and confirmed still stale after two separate redeploys** — the detail that
disproved the original hypothesis (that a redeploy alone would fix it) and pointed at the Data Cache
specifically once the actual response headers were checked. Root cause of *why* the Live Content API's own
update chain didn't fire for this one publish is still not confirmed (would need live Vercel function logs,
not available this session) — but the mechanism is confirmed, not guessed.

**Real bug found in the fix itself, same incident, third pass:** even after the automatic on-publish trigger
shipped, the post page *still* stayed stale — confirmed by Asher directly (added a line, published, hard
refreshed, no change), which ruled out both the Cloudflare layer (purged directly, no effect) and a
Studio/Sanity project mismatch (checked: Studio and the live site share the exact same
`NEXT_PUBLIC_SANITY_PROJECT_ID`/`NEXT_PUBLIC_SANITY_DATASET` config, no code path for them to diverge). The
actual bug: `/api/revalidate` called `revalidatePath('/blog', 'layout')`, which only cascades to other pages
when a real `layout.tsx` exists at that path — it doesn't (`/blog` and `/blog/[slug]` are separate `page.tsx`
files with no shared layout between them) — so that call was silently only ever revalidating the listing
page, never a specific post's own page, no matter how many times Publish was clicked or the URL was visited
directly. This exactly explains the reported symptom: `/blog` reflected the new Quote Grid content (visible
via its own separate, already-documented reading-time gap — see "Post metadata: reading time" — showing "1
min" precisely because it *was* seeing the new content, just via a computation that undercounts Quote Grid
text), while the post's own page stayed on the old ~14-minute pre-Quote-Grid version indefinitely, completely
unaffected by redeploys, Cloudflare purges, or repeated Publish clicks. Fixed by revalidating the actual
`/blog/[slug]` route pattern with `'page'` type (which does correctly reach every post page, route-group
folders like `(site)` included, since `revalidatePath` operates on the real URL not the file-system path) —
`revalidateOnPublish.ts` also now passes the specific post's own resolved URL (`?path=/blog/<slug>`, read off
the draft's `slug.current`) as a direct, guaranteed-correct hit on top of the pattern-based call.

**History:** On 2026-07-28, the live site was frozen on whatever content existed at the last deploy — new
posts added in Sanity simply never appeared at all, because at the time neither blog page had any instruction
to re-check Sanity. Fixed then by adding a 60-second revalidation window to both `/blog` and `/blog/[slug]`.
The individual post page's timer was later removed (see above) once it moved to `sanityFetch`, which is why
the current failure mode looks different from this original incident — `/blog` still self-heals within a
minute; `/blog/[slug]` currently does not.

---

## Deploys failing with "resource provisioning failed" (real incident, 2026-08-04)

**Symptoms:** Every deploy in Vercel's dashboard shows a red **Error** status, even for a commit that builds
and typechecks fine locally. The Vercel dashboard shows a **suspended** integration (look for a teal-clock
icon, or any third-party name you don't recognize) attached to the project.

**This is almost never a code problem.** Check the failing deployment's actual build step before assuming the
new commit broke something: `npx vercel inspect <deployment-url> --json` and look at `builds[0].readyState` —
if that says `READY`, the code compiled fine and the failure happened *after*, during Vercel's own resource
provisioning. A generic `errorMessage: "Resource provisioning failed"` alongside a successful build almost
always means a connected marketplace integration (Supabase, a database, etc.) is unreachable or paused, and
Vercel is refusing to deploy until it can provision/verify that resource — regardless of whether the app's code
actually uses it anymore.

**What actually happened this time:** this project ran on Supabase/Postgres for the contact form long before
migrating to Sanity. The code stopped using it months ago, but the Vercel **integration** itself was never
disconnected, and it was marked *required for every deployment* on the project. Supabase's free tier had
auto-paused the underlying project from inactivity ("suspended"). Every deploy from that point tried to
provision the dead resource and failed before the app's own code ever ran.

**Fix:**
```
npx vercel login                                                    # if not already authenticated
npx vercel link --yes --project personal-website
npx vercel integration resource disconnect <resource-name> personal-website --yes
npx vercel deploy --prod --yes                                      # confirms the fix immediately
```
Find `<resource-name>` from `npx vercel ls` on the failing deployment's dashboard, or via
`GET https://api.vercel.com/v1/storage/stores?teamId=...` — it's the `name` field of the store with
`"status": "suspended"`. `disconnect` unlinks it from this project without touching the underlying resource;
follow up with `npx vercel integration resource remove <resource-name> --yes` only once you're sure nothing
else needs it (this one genuinely deletes it).

**Both of those specific commands touch live infrastructure, not just code** — confirmed with Asher directly
before running either, same as any other action with real, hard-to-reverse consequences.

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

**"I keep seeing 'Previewing a draft' on the live site, even on posts I'm not editing":** draft mode is a
cookie (`__prerender_bypass`), set once when Preview is entered in Studio, and it applies to your *browser*,
not to any specific post -- once it's on, every blog page you visit in that same browser shows the preview
banner, published-with-no-pending-edits or not, until you click **Exit preview** on the banner. Reported
2026-07-31 as showing up "constantly" with no obvious pending draft in Studio to explain it -- that's exactly
this: draft mode had been enabled at some point (testing Presentation, or a shared preview link) and, because
the cookie had no expiry, just never turned itself off. **Fixed the same day:** the cookie now expires after
4 hours (`src/app/api/draft-mode/enable/route.ts`) -- long enough for one real editing session, short enough
that it can't linger for days. If the banner ever reappears unexpectedly again, it means Preview was entered
again in the last 4 hours in that browser; click **Exit preview** to clear it immediately rather than waiting
it out.

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

- The form saves every submission as a **Contact Submission** document in Sanity, visible as a table in
  Studio's top nav under **Contact Submissions** (its own tool, not a document list — click a row to expand
  the full message) *and* tries to send you a notification email via Resend. If Resend isn't configured, the
  submission is still saved — you just don't get an email about it. So: if someone says they submitted the
  form but you got no email, check Studio → Contact Submissions before assuming it's lost.
- Submissions have no draft/publish step (the schema uses `liveEdit`) — ticking the **Handled** checkbox in
  that table saves immediately, and **Delete** is permanent (two-step confirm, no trash/recovery).
- **Truncating text next to a Sanity UI `<Text>` component:** don't put `overflow`/`text-overflow`/
  `white-space` directly on `<Text>`, or on a `<div>` that wraps it — both were tried here and both clipped a
  few pixels off the top and bottom of the glyphs (missing dots on i's, cut-off descenders on g's) rather than
  truncating sideways, since `Text` renders its own children inside a nested box that a parent's
  `overflow:hidden` doesn't reliably ellipsize. The only reliable fix: skip `Text` for that specific piece of
  content and use a plain native element that owns the text node and the overflow style on the *same*
  element — see `TruncatedCell` in `ContactSubmissionsTool.tsx` for the pattern to copy if this comes up
  again in another tool.
- **Fixed 2026-08-04:** an email-notification failure (or Resend simply not being configured) used to make
  the *visitor* see "Message failed to send," even though their message was already safely saved in Sanity —
  clicking the form's "Try again" button in that state resubmitted it, creating a real duplicate document.
  The form now only tells a visitor it failed if the message genuinely wasn't captured at all; a
  notification-email gap is something you catch here in Contact Submissions (`emailSent`/`emailError` on that
  row), not something a visitor is asked to work around by resubmitting.
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

## Security headers: CSP and friends (shipped 2026-08-06)

`next.config.ts`'s `headers()` sets a real Content-Security-Policy plus X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy, and HSTS on the public site — added after a direct audit found none of
this was in place at all. **Deliberately excludes `/studio`** (the `source` pattern is
`/((?!studio).*)`, same negative-match idiom `middleware.ts`'s own matcher already used) — Sanity Studio is a
complex authenticated SPA that needs far broader script/style/connect permissions than the public site's CSP
allows (dynamic imports, its own realtime connection to Sanity, etc.), and a wrong guess there risks breaking
Asher's own daily editing tool, not a visitor's page.

**The CSP's allowlist is host-specific, not wildcard-everything** — every external script/image/frame/connect
domain the public site actually needs, gathered by grepping this codebase's own components first, then
corrected **twice** against what a real browser actually tried to reach, because grepping alone missed real
things:
1. Against a local **production build** (`next build && next start`, not `next dev` — dev mode's own Fast
   Refresh uses `eval()`, which would have shown as a false-positive CSP violation that doesn't exist in what
   actually ships): caught `<SanityLive/>`'s (`next-sanity/live`, mounted in `(site)/layout.tsx`) own real-time
   connection to `*.api.sanity.io` — a library-internal component, not something grepping this repo's own
   source would ever find.
2. Against the **actual live site** (asheraw.com): caught `static.cloudflareinsights.com`, a beacon script
   Vercel's own hosting infrastructure injects automatically on every page — not from this repo, any of its
   dependencies, or anything readable by grepping source at all. Only found by loading the real deployed page
   with a headless browser and watching the console.

If a CSP violation ever shows up in a real visitor's console for a legitimate resource, the fix is always the
same shape: find the exact domain in the browser's console error, add it to the relevant directive in
`PUBLIC_SITE_CSP` in `next.config.ts`, redeploy, and re-verify against the live site the same way (not just a
local build — see point 2 above for why that's not sufficient on its own).

**`'unsafe-inline'` on `script-src` and `style-src` is a deliberate, stated tradeoff, not an oversight.**
Google Tag Manager's bootstrap snippet and Microsoft Clarity's loader (`Analytics.tsx`) and the JSON-LD
structured data (`StructuredData.tsx`) are all inline `<script>` tags with no nonce wiring anywhere in this
codebase — a strict `script-src` without `'unsafe-inline'` would have broken all three outright. A real
nonce-based setup (Next.js has a documented pattern for this: a per-request nonce generated in middleware,
threaded through every inline script via `headers()`) would close this gap, but it's a genuinely bigger,
riskier change (touches `middleware.ts`, `Analytics.tsx`, `StructuredData.tsx`, and every layout in between) —
not attempted here. What this CSP **does** still meaningfully block: loading a script/resource from an
attacker-controlled domain, which is the most common real-world XSS vector. What it **doesn't** fully close:
an inline-script-injection XSS payload would still execute, since `'unsafe-inline'` permits it.

**If GTM, Clarity, YouTube, or Instagram embeds ever stop working after this**, check the browser console for
a CSP violation first before assuming a code regression — the fix is almost always adding one missing domain
to the allowlist above, not a deeper bug.

---

## Error monitoring: JS errors from real visitors (shipped 2026-08-06)

**Studio → Site Admin → Error Log** — same overview-page, Pending/Ignored/Fixed triage pattern as 404 Hits
(`ErrorLogTool.tsx`, mirrors `NotFoundHitsTool.tsx` closely on purpose). Added after a direct audit: "if
something throws on a real visitor's browser, you'd never know" was a real, confirmed gap — everything else
on this site (404s, broken links, search misses) gets tracked, but JS runtime errors didn't.

**Chose first-party (a new `errorLog` Sanity document type) over a third-party service like Sentry**,
consistent with every other tracking feature already in this codebase (404 hits, search queries, shares) —
no new external account for Asher to sign up for, configure, and remember to check; it shows up in the one
place he already looks. The real tradeoff against Sentry: no stack-trace symbolication against source maps,
no breadcrumbs, no session replay, no alerting. If error volume ever grows enough that those matter, Sentry
(or similar) is the natural upgrade path — this isn't meant to be the permanent ceiling, just the thing that
closes the "currently nothing at all" gap cheaply.

**Three sources, covering different categories of JS error** (React's error-boundary mechanism only catches
render-phase errors — it can't see an error thrown inside a click handler, or an unhandled promise rejection):
- `error` — uncaught script errors (`window.addEventListener('error', ...)`), e.g. a bug inside an `onClick`
  handler. Captured by `ErrorMonitor.tsx`, mounted site-wide in `(site)/layout.tsx`, consent-independent (same
  reasoning as 404/search-query tracking — this reports bugs in the site's own code, never anything about the
  visitor, and never logs an IP address).
- `unhandledrejection` — an async function that threw without a `.catch()`. Same `ErrorMonitor.tsx`.
- `render` — a React render-phase error. `(site)/error.tsx` (the existing route-segment error boundary, live
  since before this session, already showing a friendly "Something went wrong" page and firing a GTM
  `page_error` event) now **also** POSTs to `/api/track-error` in the same `useEffect` — the GTM event only
  ever reaches Asher if he goes digging through a GA4 report, and only for consenting visitors; the new POST
  is the reliable half, unconditional and visible in Studio.

**Grouped by error message** (`/api/track-error`, same createIfNotExists + read-modify-write pattern as
`/api/track-404`) — a deterministic id hashed from `source + message` means the same recurring error lands on
one document with an incrementing `occurrenceCount`, not a flood of near-duplicates. Capped at the 200 most
recent occurrences per error, same unbounded-growth protection as 404 Hits' 500-hit cap.

**Deliberately client-side only.** Server-side errors (a failed Sanity write, an API route throwing) already
land in Vercel's own function logs — folding those into this same log too would mean routing every existing
`try/catch` through it as well, a separate, larger change not attempted here.

`/privacy` updated in the same change to disclose this, same pattern as the search-query-logging disclosure.

---

## Rate limiting on public forms (shipped 2026-08-06)

`/api/comments` and `/api/contact` — the two public write endpoints that create real content and, for
contact, send an actual email — now reject a flood from the same IP outright (429, with a friendly message
the existing form UI already knows how to display, since both forms already just check `result.success`/
`result.error` from the JSON body regardless of HTTP status). Added after a direct audit: the honeypot and
math-captcha on both forms stop naive bots, but neither actually throttles a script that solves the captcha
once and then posts straight to the API endpoint repeatedly, bypassing the form's own page entirely.

**`src/lib/rateLimit.ts`'s `isRateLimited()`** counts recent submissions of a given `_type` by IP within a
time window, via a plain Sanity `count(*[...])` query — the exact same shape of query
`comments/route.ts`'s pre-existing "known spammer" check already runs. Deliberately **not** a separate Redis/
Upstash store (the more typical serverless-rate-limiting setup) — no new external account for Asher to set
up, and one extra Sanity read per submission is a non-issue at this site's traffic level. `ip === "unknown"`
(no `x-forwarded-for` header at all, mostly a local-dev-only case) is exempted, same reasoning as the
known-spammer check's own exemption — treating every visitor missing that header as one shared bucket would
risk blocking unrelated people together.

**Current limits:** comments — 5 per 10 minutes per IP (`createdAt` field, since `comment` has one). Contact
— 3 per 15 minutes per IP (`_createdAt`, Sanity's own automatic field, since `contactSubmission` has no
custom timestamp field). Both are conservative enough that no real human would realistically hit them, tuned
loose deliberately since there's no real traffic yet to calibrate against — if a genuine visitor ever reports
being blocked, loosen the specific threshold in the relevant route rather than removing the check.

---

## Analytics / cookie consent

- Google Tag Manager (GTM) only loads after a visitor clicks "Accept" on the cookie banner — it does not load at all otherwise, by design (added 2026-07-28, previously it loaded unconditionally for every visitor with no opt-out).
- The visitor's choice is remembered in their browser (`localStorage`), not sent anywhere else. There's currently no way for *you* to see aggregate consent accept/decline rates — that would be a future addition if it becomes useful.
- If analytics numbers look unexpectedly low, the most likely explanation is simply that visitors are declining or not yet answering the consent banner (expected/normal), not a tracking bug.

## Microsoft Clarity: heatmaps & session recordings (live since 2026-08-02)

Added to `src/components/asher/Analytics.tsx` right alongside GTM, behind the exact same consent gate — it
loads only after a visitor clicks "Accept," never before, same as Google Analytics. One extra small async
script (`clarity.ms/tag/...`), same shape and weight as GTM's own loader.

**Live.** `CLARITY_PROJECT_ID` in `Analytics.tsx` is set to Asher's real project ID (from
[clarity.microsoft.com](https://clarity.microsoft.com) → Settings → Setup), copied verbatim from Clarity's own
manual install snippet to make sure it matched exactly. To ever turn it off again, blank out
`CLARITY_PROJECT_ID` — the script simply stops rendering, nothing else to undo.

This ID isn't a secret (it's sent to every visitor's browser either way, same as the GTM container ID right
above it), so it's hardcoded directly in the file rather than an environment variable — consistent with how
`GTM_ID` is already handled in this same file.

**Privacy note:** Clarity masks the contents of text/number input fields by default (comment box, contact
form, etc. never show up in a recording), and this is already reflected in `/privacy` (both the cookie banner
text and the Privacy Policy page's analytics + third-party-services sections). **If Clarity's default masking
is ever changed** (e.g. deliberately unmasking a specific field to debug a form issue), update `/privacy` in
the same change — its wording currently promises input fields stay masked.

---

## Cookie consent accept/decline counts (shipped 2026-08-03)

Asher asked for accept/decline tracking "via GA" — worth understanding why half of that has to work outside
GA entirely. **Google Analytics/GTM cannot see a Decline click, structurally, not as an oversight**: GTM only
loads after "Accept" (see the consent gate in `Analytics.tsx`), so a visitor who declines never loads GTM or
GA at all — there is no tag anywhere inside Google Analytics that a decline click could ever reach. Sending a
decline event to GA specifically would mean loading GA for someone who just said not to, which is exactly the
promise `/privacy` and the cookie banner make not to do.

**The actual answer: a first-party count, same shape as 404 tracking.** Both Accept and Decline now POST to
`/api/track-consent`, which increments a running total on one singleton Sanity document (`consentLog`,
schema in `consentLogType.ts`) — no IP address, no cookie, nothing that identifies who clicked, just
`acceptedCount` / `declinedCount` plus a capped log of recent choices (same 1000-entry cap pattern as
`notFoundHit`'s 500-hit log). **View it in Studio → Cookie Consent Log** — shows something like "142
accepted · 38 declined · 79% accept rate" at a glance.

**Accept also gets a bonus GA event**, `cookie_consent` (category `privacy`, label `accepted`), pushed to
`dataLayer` via the existing `track()` helper in `src/lib/analytics.ts` — this is real GA data, but only ever
the accept half, for the structural reason above. **Wired through to GA4 in GTM itself on 2026-08-06**
(container `GTM-PVCX5DQ`, no code change): a Custom Event trigger matching `cookie_consent`, feeding a GA4
Event tag (reusing the existing "Google Tag" connection's Measurement ID) named the same. Confirmed live via
GA4's Realtime report showing a real `cookie_consent` event after accepting on a real device — GTM's own
Preview/Tag Assistant tooling refused to connect on the browser used to set this up, which turned out to be
that browser profile's ad-blocker/extensions (it was separately blocking Microsoft Clarity's script outright),
not a problem with the trigger/tag config — worth remembering if Preview mode ever seems to hang for no
reason: check for a blocked request before assuming the GTM setup itself is wrong.

`window.dataLayer` is deliberately seeded (`window.dataLayer = window.dataLayer || []`) right before calling
`track()` on Accept, not left to `track()` alone — at the exact moment of the click, GTM's own script hasn't
loaded yet (that only starts once React re-renders from the consent-change event), so `dataLayer` doesn't
exist yet either. `track()` only pushes if the array already exists; without seeding it first, this specific
event would silently vanish every single time.

---

## Cookie banner: delay, 7-day re-prompt, editable copy variants (shipped 2026-08-11)

**`src/lib/consent.ts`** — storage format changed from a bare `"granted"`/`"denied"` string in `localStorage`
to JSON: `{status, timestamp}`. `getConsent()` now treats a stored choice as expired (returns `"unset"`,
which re-shows the banner) once `Date.now() - timestamp` exceeds `REPROMPT_AFTER_MS` (7 days) — asked for
directly: this site's traffic is low enough that a permanent-forever choice meant each visitor only ever
contributed one data point, ever, with no way to reconsider a decline short of clearing browser storage by
hand. **A legacy plain-string value (no timestamp) is treated as already-expired**, not trusted indefinitely
and not silently wiped either — an existing visitor just sees the banner once more on their next visit,
then enters the normal 7-day cycle like everyone else. Deliberately *not* `sessionStorage`/every-session
re-prompting, which was the other option on the table — that would've re-asked a returning reader on every
single tab they open (reads as nagging) and made the accept/decline count reflect *visits* rather than
*people*, since there's no visitor-identity system here to de-duplicate against.

**`src/components/asher/CookieConsent.tsx`** — `SHOW_DELAY_MS = 10_000`, a plain `setTimeout` gating when
`visible` flips true (re-checks `getConsent()` when the timer fires, not just trusting the closure, in case
consent changed via another tab during the wait). Previously showed on mount with zero delay.

**Banner copy is editable Studio content, not hardcoded JSX** — Studio → Site Admin → **Cookies** (singleton
edit form inside `CookiesTool.tsx`, backing document `cookieBannerCopyType.ts`, `_id: "cookieBannerCopy"`).
Shipped hardcoded first, then moved out same day once Asher asked to be able to edit wording (or add/remove
variants entirely) without a code change each time. `variants[]` is a normal Sanity array of `bannerVariant`
objects: `label` (Studio-only, never shown to visitors), `declineLabel`/`acceptLabel`, `showTasteLink`.
**`body` (originally restricted Portable Text) was replaced 2026-08-11 (second pass) with plain `text` /
`linkText` / `linkHref` / `afterLink` string fields** — see the "Cookies merged into one form" entry below
for why. `CookieConsent.tsx` fetches `*[_type == "cookieBannerCopy"][0]{variants}` client-side on mount
(first-ever client-side Sanity read anywhere in this codebase — see the CSP note below), picks one at random
each time the banner is about to show (`Math.floor(Math.random() * variants.length)`, not stuck to one per
visitor, re-rolled on every prompt including 7-day re-prompts), and renders `text` + (if `linkText`/
`linkHref` are set) a link + `afterLink`, all plain JSX interpolation now, no Portable Text renderer. The
tracked `variant` sent to `/api/track-consent` is that array item's own Sanity `_key` — since variants are
now dynamic, `/api/track-consent/route.ts` can't validate against a fixed enum of known ids anymore; it just
checks the value looks like a real key (`/^[a-zA-Z0-9_-]{1,40}$/`) before storing it.

**`FALLBACK_VARIANT`** (hardcoded, in `CookieConsent.tsx`) is used only if the Sanity fetch fails, or the
document has zero variants (e.g. a fresh dataset before it's been seeded) — a real network hiccup shouldn't
mean the banner (and analytics consent) silently never appears again. Seeded via a one-off script
(deleted after running, not kept in `scripts/`) with the three variants that were live before this change,
so nothing visibly changed for visitors at the moment of deploy.

**No automatic winner-picking, by design** — Asher's own call, given how few data points a variant can
realistically collect at this traffic level; an automated switch would flip on noise. Reviewed by hand
instead, in Studio → Site Admin → **Cookies** (see below) — a live per-variant accept/decline
breakdown, grouped **client-side** from the raw `consentLog.entries[]` array rather than hardcoded GROQ
`count()` queries per id, specifically because variants can now be added/removed/renamed at any time; a
fixed-id breakdown would silently go stale the first time Asher edited the variant list. An entry whose
`variant` key doesn't match any *currently existing* variant (one that's since been deleted, or the literal
`"fallback"` id) still shows up, labeled honestly ("Deleted variant (...)" / "Fallback") rather than
silently dropped. Only entries logged from 2026-08-11 onward carry a `variant` at all.

**`src/components/asher/CookieTasteFeedback.tsx`** — a fully anonymous reaction form (no name/email/IP
field exists anywhere in `cookieFeedbackType.ts`), three categories (colours/taste/texture, mapped via a
hint line to real feedback on visual design/writing/UX) each rated 1-4 via emoji buttons, plus an optional
comment. Posts to **`/api/track-cookie-feedback`**, one document per submission (`cookieFeedback` type,
`liveEdit: true`) — a different shape from `consentLog`'s single running-tally singleton, since each
response's free-text comment has standalone value worth browsing individually, not just aggregating.

**Real bug found and fixed during testing, not shipped blind**: the first version of `CookieTasteFeedback`
was another `fixed inset-x-0 bottom-0` bar, same positioning as the consent banner itself. Opening it
stacked directly on top of the consent banner's Accept/Decline buttons and blocked clicks to them — caught
by an actual Playwright run that tried to click Accept after opening the feedback form and timed out
waiting for the (covered) button. Rebuilt as a centered modal with its own backdrop (`createPortal` to
`document.body`, same pattern `ImageLightbox.tsx` already established elsewhere on this site), which can't
collide with a bottom-anchored bar regardless of either element's height. Auto-closes 2.5s after a
successful submit, so a visitor doesn't have to remember to close it to get back to Accept/Decline.

**Second real bug, also caught by testing rather than shipped blind: a CSP block.** Once banner copy moved
to a client-side Sanity fetch, every attempt was silently blocked by the site's Content-Security-Policy
`connect-src` directive (`next.config.ts`) — the fetch goes through Sanity's CDN read endpoint
(`*.apicdn.sanity.io`), a genuinely different hostname from `*.api.sanity.io`, which was already allowlisted
for `<SanityLive>`'s unrelated real-time connection but doesn't cover the CDN subdomain at all. This is the
*first* client-side Sanity read anywhere in this codebase, so nothing had hit this gap before. Fixed by
adding `https://*.apicdn.sanity.io` to `connect-src`. Caught locally as a CSP violation in the browser
console; after the fix, local testing still showed a CORS failure on the same request — but that's this
project's already-understood "Sanity's CORS origins are configured for the real domain, not localhost"
limitation (`<SanityLive>` hits the identical wall locally, documented earlier in this same file), not a
new problem — confirmed by testing directly against the deployed production domain, where the real fetch
succeeded and rendered live Sanity content (visible from the real Privacy Policy link resolving, not the
fallback text).

**Verification**: built a real Playwright suite against the production build with `Math.random` mocked per
run to force specific variants deterministically — confirmed no banner before the 10s mark, correct copy
after it, the tracking POST body carrying the right `variant` key, the new `{status, timestamp}` localStorage
shape, an 8-day-old stored choice re-showing the banner, a legacy plain-string value also re-showing it, and
a fresh choice staying hidden. Ran the same checks again against the real deployed production domain after
each deploy, not just the local build, specifically to catch the CSP/CORS class of issue above that only
a real domain can confirm. Every test run wrote real entries to the live `consentLog`/`cookieFeedback`
documents (this site's tracking routes don't distinguish test traffic from real traffic, by design — same
as everywhere else) — all test-generated entries were identified by their known `_key`s/content/recency and
removed afterward, leaving only genuine visitor data.

---

## Cookie Insights: merged consent + feedback, grouped into a new Logs folder (shipped 2026-08-11)

**Superseded the same day, second pass — see "Cookies merged into one form, Logs folder flattened back out"
below.** `CookieInsightsTool.tsx` no longer exists (replaced by `CookiesTool.tsx`), the "Logs" folder no
longer exists (flattened back into direct Site Admin children), and "Cookie Insights" + "Banner Copy" are no
longer two sibling panes (merged into one component). Kept below for the historical reasoning that's still
accurate — why a stats view replaced the raw entries list, why Redirects moved into Site Admin, the URL
validation fix — just not the structural specifics.

**`src/sanity/components/CookieInsightsTool.tsx`** replaces two separate Site Admin entries (Cookie Consent
Log, Cookie Taste Feedback) with one tabbed tool, same `Tab`/`TabList`/`TabPanel` pattern
`ContentHealthTool.tsx` already established for Content Audit + Link Checker. Asked for directly: the
default Sanity array-field editor for `consentLog.entries[]` renders every single accept/decline as its own
expandable row, which "is not helpful the longer it gets." The **Consent** tab shows aggregate numbers
instead — total accepted/declined, accept rate, and the per-variant breakdown described above — never the
raw entries list. The **Feedback** tab shows average colours/taste/texture scores plus the 30 most recent
submissions with their comments (capped, for the same "don't let a list become unreadable" reason).

**Current final structure (Site Admin → Logs):** 404 Hits, Error Log, Search Queries, and Cookie Insights —
all four grouped together as of 2026-08-11, on the reasoning that they're all the same kind of thing (an
event log with a pending/ignored/actioned status, or an aggregate view of one), not action queues the way
Contact Submissions/Export/Bulk Operations are. 404 Hits and Error Log moved in from Site Admin's flat level
in a *second* pass, after Asher pointed out there was no real reason they'd been left out of Logs when
Search Queries (which has the identical status mechanism) was already in it — worth remembering: the first
grouping pass drew a distinction that didn't actually hold up once questioned directly.

**Cookie Insights is itself a small folder, not a single component** — `Insights` (the stats tool above) and
`Banner Copy` (the editable `cookieBannerCopy` document, see the cookie banner entry above) as two sibling
items under one shared entry point. First shipped as two *separate* Studio locations (Banner Copy lived as
its own top-level singleton near Site Settings); Asher asked directly whether it could merge with Cookie
Insights instead. A custom `S.component()` pane and a real Sanity document-editing form can't technically
combine into one pane, so this nested-list structure is the closest genuine merge available — one shared
entry point in the sidebar, not scattered across two different areas of the tree.

**Redirects moved from its own top-level slot into Site Admin** (also 2026-08-11) — an occasional
maintenance task (repointing a changed URL), the same category as Export/Bulk Operations already there.

**Real validation bug, caught immediately by actually looking at the result**: the seeded `cookieBannerCopy`
variants all showed "Not a valid URL" in Studio. Sanity's `url` field type rejects a relative path like
`/privacy` under its default validation — an absolute URI is required unless told otherwise. Fixed with
`validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true})` on the link annotation's
`href` field, since an internal link to this site's own Privacy Policy page was exactly the point of that
field.

**A more general instruction came out of this thread**: check for an existing logical Studio container
before adding a new standalone entry, rather than defaulting to bolting one on. Saved to auto-memory
(`studio-logical-containers`) since it applies to any future addition, not just this one.

**Content Health stayed in the top nav, not moved into Logs** — it's a different kind of thing from the
items above: an active check you run and act on, not a passive record, and it's there specifically for
one-click daily access (see the top-nav cleanup notes elsewhere in this file). The real problem underneath
Asher's low usage of it turned out to be something else entirely — see Content Audit's own entry above for
the per-check dismissal that actually fixed it.

---

## Cookies merged into one form, Logs folder flattened back out, Link Checker gets dismissal (shipped 2026-08-11, third pass)

**The "Logs" folder from the previous pass is gone.** Asher's own reversal, hours after suggesting it:
"Move the 404 hits, error log, search queries, cookie insights... all up one level into site admin. No need
to put them too far in, you're right." `structure.tsx`'s Site Admin list now has `404 Hits`, `Error Log`,
`Search Queries`, and `Cookies` as direct children again — same ids as before (`notFoundHits`, `errorLog`,
`searchQueries`), plus the new `cookies` id. `DashboardTool.tsx`'s `LINKS` deep-link paths were updated to
match (`/studio/structure/siteAdmin;notFoundHits` etc., one segment shallower than before).

**`src/sanity/components/CookiesTool.tsx`** (new, replaces the deleted `CookieInsightsTool.tsx` and the
old two-sibling-panes structure) — one component, three stacked sections, no tabs: **Insights** (unchanged
logic — aggregate accept/decline totals + per-variant breakdown, grouped client-side from
`consentLog.entries[]` the same way as before), **Copy** (new — an inline editable form for
`cookieBannerCopy.variants[]`: `TextInput`/`TextArea` per field, edits held in local component state, one
"Save all changes" button does a single `client.patch('cookieBannerCopy').set({variants}).commit()` for the
whole array, plus Add/Remove variant buttons), **Feedback** (unchanged logic — average colours/taste/texture
scores + recent submissions). Asher's own framing: "Call this Cookies and then it shows the insights (which
is the data) and then the copy." He also flagged uncertainty about the Feedback section's actual value
("not turning it on for all of them") — left in per his own "we will see if it's actually being used," not
a removal request.

**Why a genuine single form is now possible, when it wasn't before**: `cookieBannerCopyType.ts`'s `body`
field moved off Portable Text onto plain `text` / `linkText` / `linkHref` / **`afterLink`** (new) string
fields. Sanity's rich-text block editor is a document-form-only field type — it can't be mounted inside a
custom `S.component()` pane, which is exactly why the previous pass had to leave Banner Copy as a separate
sibling document form rather than truly merging it. Plain string fields render as plain `TextInput`/
`TextArea` components anywhere, which is what makes the inline Copy section above possible at all.

**`afterLink` exists because all three real variants had wording *after* the link, not just before it** —
checked directly against the live document before assuming a before-link-only shape would do: "Current" had
"... here. Click Accept to help me out, thanks!" after the link, "Formal" had a trailing ".", "Cookie
tasting" had " if you want the fine print." None of these were rephrased to fit a simpler shape; the field
was added instead so the original approved copy carries over exactly. Render order in
`CookieConsent.tsx`: `text` (trimmed of its own trailing space) + a manually-injected `" "` + the link (if
`linkText`/`linkHref` are set) + `afterLink` appended with no extra separator (so it can start with a space,
punctuation, or nothing, matching whatever the original wording needed).

**Live migration**: the seeded `cookieBannerCopy` document (3 variants: Current, Formal, Cookie tasting) was
converted from its old Portable Text `body` shape to the new fields via a one-off script (`@sanity/client`
+ `SANITY_API_WRITE_TOKEN` from `.env.local`, deleted after running, same convention as the original seed
script). Each variant's original `_key` was preserved — `consentLog` entries reference these keys for the
per-variant accept/decline breakdown, so keeping them is what stops that history from being silently
orphaned. Verified by reading the document back after the patch and confirming `body` was gone and the new
fields matched exactly.

**Link Checker (the "broken/blocked links" half of Content Health) gets the same pending/ignored/actioned
dismissal Content Audit already had.** Re-checking Content Health after the previous pass's fix, Asher
reported "still no option to mark or change the status" — correct, because that fix only ever covered
`ContentAuditTool.tsx` (missing metadata); `LinkCheckerTool.tsx` (broken/blocked/affiliate links, the other
tab) had no `status` field or dismiss control at all. Added: a `status` field on `linkCheckType.ts`, a
`Select` (Pending/Ignored/Actioned) per row in `LinkCheckerTool.tsx` shown only for Broken/Possibly Blocked
rows (same `client.patch(id).set({status}).commit()` pattern `NotFoundHitsTool.tsx` already established).
**This first version kept a dismissed row sitting in the same visible list with the section's own count
badge unchanged — superseded the same day, see "Internal links validated against Sanity data" below for
the real fix.**
**One real gotcha caught by reading the actual write path first**: `src/lib/linkChecker.ts`'s
`runLinkCheck()` does a full `createOrReplace` on every `linkCheck` document, on every run (daily cron +
on-demand Check Now) — a naive `status` addition would've silently reset to `pending` on the very next
automated check. Fixed by fetching and carrying `status` forward explicitly, the same way the pre-existing
`brokenSince` field already had to be. `DashboardTool.tsx`'s `linkIssues` count was updated to exclude
`status == "ignored"` the same way the other counts already do (later tightened to pending-only, see below).

**New Error Log entry investigated on request, diagnosed, not a bug**: `Uncaught Error: Error invoking
postMessage: Java object is gone`, stack trace rooted entirely in `iabjs://navigation_performance_logger_android`
URLs, user agent confirmed Instagram's in-app browser (Android WebView). This is Instagram's own injected
JavaScript for its navigation-performance logging, failing to reach a Java bridge object that's already
been garbage-collected during page teardown — external to this codebase, not fixable here, same category
as the already-dismissed "ResizeObserver loop completed" entry. Recommended marking it Ignored via the
existing Error Log dismiss control rather than investigating further.

---

## Internal links validated against Sanity data, not a live fetch; dismissed links now actually disappear (shipped 2026-08-11, fourth pass)

**Why asheraw.com's own pages showed "possibly blocked."** Right after the Link Checker dismissal fix above
shipped, Asher used it and immediately found four false positives: `/#contact` and three of his own blog
posts, all HTTP 403. Diagnosed by testing directly, not guessed: the exact same URLs returned a clean 200
from `curl` on an outside network, both with the checker's own User-Agent and a browser one. The 403 only
happened when the request originated from Vercel's own serverless infrastructure calling back into
asheraw.com's own production domain (also on Vercel) — confirmed via `npx vercel firewall overview`/
`attack-mode`/`system-mitigations`, which exist specifically because Vercel runs automatic system-level
DDoS/bot mitigation on every plan (not configurable on this project's plan tier, which returned "IP Bypass
is unavailable for this plan" on the overview call). Same underlying class of false positive as the
webmd.com 500 documented above (an IP-reputation/traffic-pattern block, not a real broken link) — just
happening on the site's own infrastructure instead of someone else's.

**Fixed at the root, not worked around**: `src/lib/linkChecker.ts` now validates any link whose URL starts
with `https://asheraw.com` structurally, against real Sanity data, instead of ever making a live HTTP
request for it. `fetchInternalTargets()` fetches (once per run) every published post slug, category slug,
author slug, distinct tag, and every `redirect` document's `from` path. `checkInternalUrl(url, targets)`
parses the URL's pathname (fragment and query stripped automatically by `new URL().pathname`, which is why
`/#contact` resolves to `/` and passes the static-path check), matches it against
`/blog/<slug>`/`/blog/category/<slug>`/`/blog/author/<slug>`/`/blog/tag/<tag>` shapes, and returns a
`CheckResult` directly — no network call, so nothing for Vercel's traffic heuristics to ever misjudge
again. `runLinkCheck()` tries this first for every link and only falls through to the real `checkUrl()` for
anything not on this domain or not matching a recognized internal route shape (so a genuinely mistyped
internal path still gets a real check, not a silent skip).

**Redirects matter as much as current slugs — caught by testing against live data before shipping.** One
of the four flagged URLs, `/blog/how-i-lost-my-writing-home-for-13-years`, doesn't match any *current* post
slug — but a real visitor following it lands on a real page, because a `redirect` document already exists
for that exact old path (renamed to `/blog/how-i-lost-my-writing-home`). A slug-only check would have
"fixed" three of the four false positives and introduced a fourth, subtler one: a working, correctly
redirecting link reported as broken. `redirectFroms` is checked before the route-shape matching, mirroring
`middleware.ts`'s own exact-pathname lookup — trusted at one level (a redirect's own `to` destination isn't
itself re-verified), the same shallow trust `middleware.ts` already gives every redirect.

**Verified against real production data, not just logic-checked**: ran `fetchInternalTargets()`'s exact
query and `checkInternalUrl()`'s exact matching logic in a standalone script against the live dataset before
shipping, confirming all four previously-flagged URLs resolved correctly (including the redirect case).
After deploying, triggered a real `POST /api/check-links` against the live production domain and confirmed
via a direct Sanity read that all four internal URLs came back `ok: true` with no live network request
involved, and that the only two remaining flagged links were the pre-existing external ones Asher had
already marked Ignored.

**Dismissed links now actually move, instead of silently not appearing to.** The dismissal control shipped
in the previous pass (see above) left an Ignored/Actioned row sitting in the exact same visible list with
the section's own count badge unchanged — only a separate, less prominent summary badge further up the page
reflected the dismissal at all. Asher: "I've stated as ignored but then nothing happens. The 'possibly
blocked' number stays at 6." Fixed to match the pattern already shipped for `ContentAuditTool.tsx` (and
already confirmed working well there): within the Broken/Possibly Blocked sections, rows now split into
`activeRows` (status pending) shown directly and `dismissedRows` (ignored/actioned) tucked behind a
"Show dismissed (N)" toggle — same `LinkRowCard` component renders both lists, so the same Select control
can move a row back to Pending from inside the dismissed list. The section's own header badge now counts
`activeRows.length`, not the raw section total, so it agrees with the toggle and with the top summary badges
immediately. `DashboardTool.tsx`'s `linkIssues` count was tightened at the same time from "not ignored" to
"pending only" (`status == "pending" || !defined(status)`), matching `notFoundPending`/`errorPending`'s
existing convention exactly, so an Actioned link no longer keeps counting toward the Dashboard's issue
total either.

---

## Social Shares / Distribution dashboard: which posts get shared where (shipped 2026-08-03, folded into Distribution 2026-08-04)

Asked for as a "social distribution dashboard." Scoped deliberately: this tracks *outbound* share-button
clicks on `ShareBar.tsx` (X, Facebook, LinkedIn, WhatsApp, Email, Copy Link, native share sheet) — it does
**not** pull replies, likes, or engagement back from X/Facebook/LinkedIn's own APIs. `ACE_MASTER_SPEC.md` is
explicit that automated multi-platform engagement tracking isn't worth the ongoing API fees, OAuth, and
platform churn for a solo creator; this is the scoped, actually-useful half.

**One document per post** (`shareLog`, `_id: "share-<slug>"`, schema in `shareLogType.ts`), created/
incremented by `/api/track-share`, called from `ShareBar.tsx` alongside its existing `track()` GA event —
same "works regardless of consent" reasoning as `/api/track-consent`: GA/GTM only exists for visitors who
already accepted analytics, so a first-party count is what makes this accurate for everyone. Counts total
shares plus a per-platform breakdown (`xCount`, `facebookCount`, etc.), no IP address, no visitor-identifying
data — just tallies against a post.

**View it in Studio → Distribution** (was its own "Social Shares" list until 2026-08-04, now folded into the
dashboard below — the standalone list item was removed from Structure). Component:
`src/sanity/components/DistributionDashboardTool.tsx`.

**Manual engagement notes (added 2026-08-04):** `shareLogType.ts`'s `engagementNotes` array — a free-text
note plus optional platform and timestamp, addable per post right from the dashboard. This is the spec's
"Tier 2" of the distribution dashboard concept: a manual log ("got 3 replies on LinkedIn"), not an automated
integration, for the same reason engagement-pulling was never built in the first place. Adding a note for a
post that's never been shared yet `createIfNotExists`'s a fresh `shareLog` document first, so there's always
somewhere for the note to live.

Verified against the live dataset: the original share-count tracking (clicked X-share and Copy Link on a real
post, confirmed counts updated correctly) 2026-08-03; the "add note" flow (`createIfNotExists` + append)
tested against a real post with no prior share record 2026-08-04. Test data removed both times.

**"Share this post" (shipped 2026-08-08).** Each post row now has a button that drafts AI social captions
right there, the same flow "Draft Social Copy" already gives from inside a post's own editor — see the "One
implementation, two entry points" note under **AI Workspace: social copy drafting** below for how the two
share code. `SharePanel.tsx` fetches the post's `body` on demand (not eagerly for the whole list — Distribution
only loads `_id`/`title`/`slug`/`publishedAt` per post normally, kept light since it loads every post at
once) the first time this panel is opened for a given post, then calls the same suggestion flow.

---

## AI Workspace: social copy drafting (shipped 2026-08-04)

First slice of "AI Workspace, expanded" from the roadmap — asked which of tone controls / a review queue /
more drafting help mattered most, Asher picked drafting help. Same "AI proposes, human decides" shape as the
existing **Suggest SEO & Excerpt** action: a new **Draft Social Copy** button on any post, drafts 2 caption
options each for X, LinkedIn, and Facebook from the post's own title/content via Gemini, shown in a dialog
with a Copy button per option — nothing is posted anywhere or written to the document automatically.

**Deliberately author-facing, not reader-facing** — separate concept from `ShareBar.tsx` (which lets a
*reader* reshare a post that already exists). This is for when Asher himself is about to announce a new post
on his own X/LinkedIn/Facebook accounts and wants a drafted starting point rather than a blank composer.

**The generated text never includes the actual URL.** Originally (2026-08-04) this was framed as "the
platforms generate their own link preview card from a pasted URL, so repeating it in the caption is
redundant." **Reframed 2026-08-08, on Asher's own ask**: the caption is now written to stand completely on
its own with no link attached to the post at all — not even as a preview card — because X and LinkedIn both
measurably favor posts without an outbound link attached directly. The link gets pasted into a reply/first
comment instead, once the post is up, which is the standard workaround for that reach penalty. The prompt
now explicitly instructs against writing anything that reads like it's missing a link ("link in comments,"
"link below") too, since that telegraphs the workaround and defeats the point — the caption has to actually
read as a complete post. See `SOCIAL_TASK_INSTRUCTIONS` in `suggest-social/route.ts` for the exact wording.

New route: `src/app/api/ai/suggest-social/route.ts`, same `gemini-3.6-flash` + `responseSchema` structured-
JSON pattern as `suggest-seo`. New action: `src/sanity/actions/suggestSocialCopy.tsx`, registered in
`sanity.config.ts` right next to `createSuggestSeoAction()`.

**One implementation, two entry points (shipped 2026-08-08).** The actual fetch/state logic and every
result card (per-platform captions, copy buttons, the "Open X to post" link) live in
`src/sanity/components/SuggestSocialCopyShared.tsx` — shared between this document action and the new
**"Share this post"** panel on the Distribution dashboard (`SharePanel.tsx`, see the Distribution section
above), so drafting from inside a post's editor and drafting from Distribution are two doors into the same
real code, not two copies of it. **X gets a genuine one-click "Open X to post"** — its own compose intent
(`https://twitter.com/intent/tweet?text=...`) supports real pre-filled text with no URL attached, matching
the link-in-comment flow exactly. **LinkedIn and Facebook don't get an equivalent** — both platforms'
official share endpoints only accept a `url` param, not custom caption text (an anti-spam restriction on
their end, not something to work around), so a copy button is the honest affordance there rather than a
button that looks like one-click posting but silently can't carry the caption.

*(Update, same day: this section originally said the prompt instructions were hardcoded here specifically
to avoid drifting into "tone/voice controls" — that item shipped a few hours later, see below. The
task-specific instructions in this route are still hardcoded (what to produce, per-platform rules), but
voice now comes from the same shared, Studio-editable field `suggest-seo` also reads.)*

Verified against the live Gemini API before shipping — real title/body from an existing post produced two
genuinely usable, on-voice options per platform, correctly under X's 240-character cap, no hashtags, no
invented details, no raw URL in any of them.

**Known pre-existing issue, not introduced here:** `suggestSeo.tsx` already had a TypeScript error on its
error-message `<Text tone="critical">` (a `@sanity/ui` prop-type mismatch) before this file existed;
`suggestSocialCopy.tsx` uses the identical pattern and inherits the identical error. Doesn't block the build
either way — noting it here so it doesn't look like something new broke.

---

## AI Workspace: shared voice guidance + review queue (shipped 2026-08-04)

The other two-thirds of "AI Workspace, expanded" — asked to build both after Draft Social Copy landed
earlier the same day.

**Shared voice, not duplicated per feature.** New field, **Studio → AI Suggestion Settings → "Voice & tone
(used by every AI feature)"** (`aiPromptSettingsType.ts`'s `voiceGuidance`) — plain free text, same
"nothing unsafe to break" philosophy as the existing `promptInstructions` field. Both `suggest-seo` and
`suggest-social` now fetch this one field and prepend it to their own task-specific instructions, so editing
Asher's voice once adjusts every AI feature instead of needing the same tweak copied into two or three
different prompts. `promptInstructions` (renamed in Studio to "SEO suggestion instructions" for clarity) stays
scoped to the SEO task specifically — length limits, what to produce — not voice. Default value:
`DEFAULT_VOICE_GUIDANCE` in `aiPromptDefaults.ts`.

**Review queue: `aiOutputLog`, one document per generation.** Every call to `suggest-seo` or `suggest-social`
now also creates an `aiOutputLog` document (schema: `aiOutputLogType.ts`) — which feature, which post, the
raw suggestions returned, and whether any of it actually got used. Browsable in **Studio → AI Output Log**,
sorted most-recent-first. Not a queue that blocks or requires action — a plain, honest record, matching how
Asher actually works (solo, reviews every suggestion live in the dialog already).

"Used" tracking is genuinely granular, not just a single yes/no: `usedActions` is a timestamped array, one
entry per apply/copy click (e.g. `Used SEO title: "..."`, `Copied X caption (option 2)`, `Added tags: x, y`).
New route `src/app/api/ai/log-usage/route.ts` handles this — called from both `suggestSeo.tsx` and
`suggestSocialCopy.tsx` the moment an editor clicks "Use this" or "Copy," fire-and-forget (never blocks or
delays the actual apply/copy action, and a failed log call is silently swallowed rather than surfaced).

Both `suggest-*` routes now return a `logId` in their response (used only to tell `log-usage` which
generation a later click belongs to) — awaited server-side so it's available to return, but wrapped in its
own try/catch separate from the actual suggestion generation, so a logging failure can never sink the
suggestions the editor is actually waiting on.

Verified against the real Gemini API and the live dataset before shipping, both features: called each
`suggest-*` route with real content, confirmed a real `logId` came back and the `aiOutputLog` document was
created correctly, called `log-usage` against that real `logId`, confirmed `used` flipped to `true` and
`usedActions` recorded the action with a timestamp. Deleted both test documents afterward.

**AI usage visibility (added 2026-08-04):** the ACE spec's "cost/usage controls" item, scoped to what's
actually meaningful while Gemini calls sit on the free tier — call counts, not a dollar figure, since there's
no real cost to show. Surfaced in **Studio → Distribution**'s header: total AI suggestions this month, and an
all-time breakdown by feature (SEO/Social/Image prompt), computed directly from `aiOutputLog` — no separate
tracking needed since every call already creates one of those documents. If Gemini usage ever moves to a paid
tier, this is the place to add real cost figures, not a new system.

---

## AI Workspace: alternative headlines, pull quotes, FAQ suggestions (shipped 2026-08-04)

The last named gap in Phase 8 (AI Workspace) from the ACE spec — closed by extending the existing **Suggest
SEO & Excerpt** dialog rather than adding a fourth button next to it, since these are the same shape of thing
(AI-drafted options, reviewed before anything happens) as SEO title/excerpt/tags already are.

**Alternative headlines** patch the post's real `title` field directly — same one-click "Use this" pattern as
SEO title, just uncapped (no 70-character limit to show progress against, since the post title itself has no
length cap). **Pull quotes** and **FAQ suggestions** copy to the clipboard instead of patching a field —
neither maps to one: a pull quote goes wherever the writer decides to place it in the body (as a Quote block
or a pull-quote snippet), and there's no FAQ section on posts to write into.

**Pull quotes are constrained to be exact substrings of the post's own content** — the prompt explicitly
requires it, and it was verified against a real response (both quotes returned were confirmed present
word-for-word in the source text). This matters specifically because a "pull quote" that isn't actually in
the post would be a fabricated quote attributed to the post — a different failure mode than a slightly-off
SEO title suggestion, worth the extra verification step.

All three new output types live in the same `responseSchema` on `src/app/api/ai/suggest-seo/route.ts` and the
same `aiOutputLog` entry (feature: `"seo"`) as the existing SEO suggestions — no new route, no new schema
type. UI additions in `src/sanity/actions/suggestSeo.tsx`: `HeadlineOption` (title patch) and
`CopyTextOption` (clipboard, shared by pull quotes and FAQs).

Verified against the real Gemini API before shipping: real post content produced sensible alternative
headlines and FAQ pairs, both pull quotes confirmed as exact substrings of the source text, and the
`aiOutputLog` entry confirmed to store all three new fields correctly — then the test log entry was deleted.

**"Make image" on a pull quote (shipped 2026-08-08).** Generates a shareable quote-card graphic via a new
edge route, `src/app/api/og/quote/route.tsx` — same brand palette (`#0a0807` background, `#f0b865` gold
accent, `#f5efe4` text) and Playfair Display font-loading technique as the existing branded social card
(`/api/og/[slug]/route.tsx`), on purpose: a functional, on-brand default, not a finished design system —
Asher's own framing was that he'll experiment with the actual style later. Query-param driven
(`?text=...&attribution=...`) rather than tied to a post's slug, since a quote isn't a property of the post
document itself. 1200×1200 (square) — a deliberately platform-neutral shape rather than optimizing for one
specific network's preferred aspect ratio.

**Real bug caught only by rendering test images, not by reading the code:** the "asheraw.com" attribution
line initially rendered with a silent font switch mid-word ("ashera" in Playfair, "w.com" in a fallback).
Cause: Google Fonts' `text=` parameter subsets the font file to only the exact characters requested, and the
font was only being loaded for the quote + attribution text — not the literal "asheraw.com" string that's
*always* rendered regardless of what's passed in. Whether the bug showed at all depended entirely on
whether the quote/attribution happened to already contain every letter in "asheraw.com" — it was invisible
on some test inputs and glaring on others, exactly the kind of thing that looks fine reading the code and
only breaks in a real render. **Fixed by including the literal domain string in the font-loading request
regardless of what the actual quote contains** — if this route is ever changed to render any other
always-present text (a new label, a watermark), that text needs to go into the same font-load call too, or
this exact bug reappears for it.

---

## AI Workspace: Suggest Image Prompt rebuilt around a fixed template (shipped 2026-08-13)

**The existing "Suggest Image Prompt" document action was quietly disconnected from Asher's real workflow.**
It already existed (`src/sanity/actions/suggestImagePrompt.tsx` + `src/app/api/ai/suggest-image-prompt/
route.ts`) and already called Gemini, but asked the model to freely write 2 generic photographic/editorial
prompts from scratch — nothing tying them to the actual steel-plate-engraving/sepia-monochrome template
Asher had been pasting in by hand for most of his existing post images. Surfaced when he asked for help
generating image ideas for 48 posts just imported into drafts; checked what already existed before
proposing anything new, and this was the natural thing to fix rather than duplicate.

**Gemini's job was narrowed to exactly two decisions per idea, everything else is fixed.** The template
itself — `{SUBJECT}, in the style of a 19th-century steel-plate engraving...rendered entirely in sepia
monochrome...{COMPOSITION_MODE}...an unobtrusive "Asher Aw, 1984" in the bottom margin` — is now stored as
an editable Studio field (`aiPromptSettingsType.ts`'s new `imagePromptTemplate`, alongside two more new
fields for the two composition-mode descriptions: `compositionMode1` "studio-style specimen illustration,
single subject centered and isolated..." and `compositionMode2` "fully rendered environmental scene with
layered depth..."), defaulting to Asher's own exact wording (`DEFAULT_IMAGE_PROMPT_TEMPLATE`/
`DEFAULT_COMPOSITION_MODE_1`/`DEFAULT_COMPOSITION_MODE_2` in `src/lib/aiPromptDefaults.ts`, same
single-source-of-truth pattern as the existing SEO defaults). Gemini only ever returns a concrete `subject`
string and a `mode` (1 or 2) per idea — `suggest-image-prompt/route.ts` substitutes both into the template
server-side via `{SUBJECT}`/`{COMPOSITION_MODE}` placeholders (`split().join()`, not `.replace()`, so a
template edited to reference either placeholder more than once still substitutes every occurrence). The
wrapper text is therefore byte-for-byte identical across every idea and every post — the AI can no longer
subtly reword "sepia monochrome" into something close-but-different from one suggestion to the next.

**Composition mode is decided per idea, not fixed site-wide — confirmed directly with Asher, not assumed.**
Asked explicitly which of a few options he wanted (AI picks per idea and mixes them / always Mode 1 / always
Mode 2 / a manual toggle each run); he picked "AI picks per idea, mixed" specifically because 3 ideas that
are all the same composition shape isn't actually 3 different things to consider. The task prompt tells
Gemini both mode descriptions and instructs it to vary the choice across the 3 ideas "where it genuinely
fits" — a real test call returned modes `[1, 2, 1]` for one post, confirming the mixing actually happens,
not just 3-of-the-same by default. Each result shows a small "Isolated specimen" / "Environmental scene"
badge in the dialog (`suggestImagePrompt.tsx`) so the shape of each idea is visible before reading the full
prompt text.

**2 ideas -> 3**, per Asher's explicit ask — the `responseSchema` on the Gemini call now requires an `ideas`
array of `{subject, mode}` objects instead of a flat `prompts: string[]`.

**Real bug, caught by an actual test call against real Gemini output, not assumed correct from reading the
prompt instructions:** the first version produced prompts like `"...wrapping around the hands., in the
style of a 19th-century steel-plate engraving..."` — a stray double-punctuation, because the template joins
`{SUBJECT}` directly into a longer sentence with its own comma, and Gemini's subject text sometimes ended
with a period as if it were a complete sentence on its own. Fixed on both sides: the task instructions now
explicitly ask for a lowercase, no-trailing-period noun phrase with a worked example, and
`suggest-image-prompt/route.ts` strips a trailing period (`.replace(/[.。]+$/, "")`) as a backstop
regardless of whether Gemini actually follows the instruction. Re-verified with a second real test call
before shipping — no stray punctuation in either result.

**Verified against the real Gemini API and real Sanity data before shipping**: called the live route with a
real, already-published post's actual title/content (not synthetic test text), confirmed 3 ideas with
genuinely mixed composition modes, confirmed each assembled `prompt` matched the template exactly
(word-for-word crosshatching/sepia/signature text, correct mode description substituted), confirmed the
`aiPromptSettings` fallback-to-defaults path worked correctly (the singleton document didn't have the three
new fields set yet at the time of testing, since they're brand new), and confirmed Studio's schema loads
with no errors after the new fields were added — then deleted both test `aiOutputLog` entries afterward.

---

## PLAY mode: the homepage's 3D/2D walking world (freeze fixed twice + loading state added 2026-08-08)

**Not the per-post registry documented below.** This is the homepage's own PLAY toggle (`page.tsx`'s
`mode` state — client-only, no URL param, gated off entirely on mobile) — a single, fixed, hand-built
walking scene, not a Sanity-driven registry. `src/components/asher/play/PlayMode.tsx` owns the toggle
between two versions of the same experience: `World3D.tsx` (`@react-three/fiber` + three.js, real 3D) and
`GameCanvas.tsx` (plain 2D canvas API). Both share the exact same zone data shape and the same
`handleZoneEnter` callback, passed down as a prop — the character crossing into a zone calls it, which
updates the "Currently in" status and smooth-scrolls the content panel (`PlaySections.tsx`) to the matching
section.

**The walking freeze (fixed 2026-08-08).** Asher reported a brief freeze walking toward a zone whose
content sits far down the page. **Confirmed by reading both render loops directly, not assumed:** neither
version loads any image/model/texture per zone — every 3D zone structure (`ZoneStructure` in `World3D.tsx`)
is built from primitive Three.js geometries defined inline and is *already* mounted for all 8 zones at
once, so there's genuinely nothing async happening when the character enters a new one. The real cause:
`handleZoneEnter` called `getBoundingClientRect()` twice (once on the scroll container, once on the target
section) to compute a scroll offset — a call that forces the browser to synchronously recalculate layout
for anything currently "dirty." Both `World3D.tsx`'s `useFrame` and `GameCanvas.tsx`'s own
`requestAnimationFrame` loop called this function **directly, synchronously, inside their own per-frame
update** — forcing that reflow mid-frame, stacked on top of the frame's own render work, every single time
the character crossed a zone boundary. Reflow cost scales with total DOM complexity, which is why a longer
`PlaySections.tsx` (more content below) meant a more noticeable freeze — exactly what Asher described.

**Fix:** the DOM-measuring, scroll-triggering part of `handleZoneEnter` now runs inside `window.setTimeout(
fn, 0)` rather than synchronously in the caller. This pushes the layout-forcing work to the next macrotask,
after the current animation frame has had a chance to paint, instead of blocking it. **The `setActiveSection`
state update and the `track()` analytics call stay synchronous** (cheap, no DOM reads) — only the two
`getBoundingClientRect()` calls and the actual `scrollTo()` are deferred. **If a similar freeze ever
reappears on zone entry**, check first whether something new was added to `handleZoneEnter` (or a similar
per-frame callback) that reads layout (`getBoundingClientRect`, `offsetHeight`, `offsetTop`, etc.)
synchronously — that's the actual failure mode here, not "something is loading slowly."

**Loading state (shipped 2026-08-08).** Both `World3D` and `GameCanvas` are dynamically imported in
`PlayMode.tsx` (`next/dynamic`, `ssr: false`) — a real async gap, since only one of 2D/3D ever renders at a
time and there's no reason to ship both in the initial bundle. `PlayLoader.tsx` (an animated pencil,
[Uiverse.io by AnnaVAnTiM](https://uiverse.io/AnnaVAnTiM/rare-pug-90), the HSL-brown variant Asher picked)
is the shared `loading:` fallback for both. **Real dark-mode bug fixed in the source snippet**: the
graphite tip was a hardcoded `hsl(223,10%,10%)` (near-black) that nearly disappeared against this site's
near-black dark background — changed to `fill="currentColor"` so it reads off the same value as the drawn
stroke line (which already used `currentColor`), both set via `.pencil { color: var(--spotlight); }` in
`globals.css` — correct in either theme automatically, no `.light`-specific override needed since
`--spotlight` itself already resolves differently per theme. Also added `prefers-reduced-motion` handling
(freezes each part at its own resting keyframe rather than removing the pencil entirely), which the
original Uiverse snippet didn't have. **GameCanvas is dynamically imported for the first time here too** —
previously it was a plain static import, always bundled into the initial page load even on visits that
never open PLAY mode at all, unlike `World3D` which already had this treatment.

Verified end-to-end with Playwright against both a local build and the live site: clicked into PLAY,
caught the loader mid-animation on both 2D and 3D (screenshotted, not assumed), then walked with arrow keys
across a zone boundary and confirmed the content panel updates correctly with zero console errors either
way.

**The walking freeze, round two (fixed 2026-08-08).** Asher reported the freeze was still there walking to
"At a Glance" or "Contact" specifically, meaning the `handleZoneEnter` fix above was real but incomplete.
First attempted to measure it directly — a Playwright script injecting a `PerformanceObserver({entryTypes:
['longtask']})` during a real walk to "At a Glance" captured ~30 long tasks spread continuously through the
whole walk. Before trusting that as a signal, ran a control with zero zone crossings (wiggling in place
within one zone) and got an almost identical noise pattern. **This sandbox's headless Chromium has no real
GPU access**, so `longtask` timing here is dominated by software-rendering noise, not a genuine per-
transition signal — a real limitation of this environment for any future perf investigation, not just this
one. Went back to reading `Scene`'s `useFrame` callback in `World3D.tsx` instead of trying to measure
further.

**The actual second cause:** `setCurrentZone(zoneId || "hero")` was called **synchronously inside
`useFrame`**, on the same tick as Three.js's own per-frame render. That's a React state update, and it
drives `active={zone.id === currentZone}` on `Ground` and all 8 `ZoneStructure`s — so every zone crossing
re-rendered all 8 zones' active-only lights, plus (for "At a Glance" specifically) mounted a fresh
`Sparkles` particle system (`MagnifierZone`'s `{active && <Sparkles .../>}`) — real geometry and shader
material allocation, not free. Confirmed this is exclusive to the 3D version by reading `GameCanvas.tsx`:
its equivalent logic (`if (inZone !== currentZoneRef.current) currentZoneRef.current = inZone;`) already
uses a plain ref, never triggers a React re-render at all.

**Fix:** added a `pendingZoneRef = useRef<string | null>(null)` alongside `currentZone` in `Scene`, and
changed the `useFrame` callback so `setCurrentZone` is only ever called from inside a `setTimeout(fn, 0)` —
same deferral technique as `handleZoneEnter` above — guarded by `pendingZoneRef` so a new zone doesn't
get a fresh `setTimeout` scheduled on every single frame while the first deferred call is still pending.
**If a similar freeze reappears on zone entry in the 3D version specifically** (not 2D), check first
whether a new `set*` React state call has been added directly inside `useFrame` — that pattern (a
synchronous React re-render competing with Three.js's own per-frame work, on the same tick) is the
recurring failure mode here, and the fix is always to push the state update to the next macrotask via
`setTimeout(0)`, not to try to make the render work itself faster.

Verified with `tsc --noEmit` and `npm run build` (clean), then a local Playwright walk to both "At a
Glance" and back toward "Welcome" (screenshotted mid-walk both times, zero new console errors), then
re-verified the same walk against the live production site after deploying — same result. **Honest caveat
on confidence level:** because this sandbox has no real GPU, there's no way to get a reliable hard
before/after timing number here to prove the freeze duration actually dropped — confidence here rests on
correct architecture (no synchronous state update left inside the render loop) plus clean functional
behavior, not a benchmark.

**Story mode and Play mode content: `data.ts` is meant to be the single source of truth, but wasn't fully
one (found and fixed 2026-08-08).** `src/components/asher/data.ts` exists specifically so Story mode's
components and `PlaySections.tsx` read the same underlying content rather than each maintaining their own
copy — its own file header says as much. In practice, list-type content (`ROLES`, `STAGE_STATS`, `BRANDS`,
`COACHING_TOPICS`, `FAITH_VALUES`, etc.) was consistently imported by both. Prose paragraphs and headlines
were not: several Story-mode components (`Philosophy.tsx` most notably) hardcoded their own local copy of
content that also existed in `data.ts`, rather than importing it. `Philosophy.tsx`'s local `PRINCIPLES`/
`PERSONALITY` matched `data.ts`'s version by coincidence, not by design — and that's exactly how Play
mode's Philosophy closing paragraph ended up with a whole extra sentence Story mode's version never had:
someone (or something) edited one copy and not the other, with nothing to catch the drift.

**Fixed for the pieces touched during a copy-editing pass (2026-08-08):** `Philosophy.tsx` now imports
`PRINCIPLES`/`PERSONALITY` from `data.ts` instead of re-declaring them. Two new shared constants,
`PHILOSOPHY_CLOSING_NOTE` and `COACHING_INTRO`, hold paragraphs that were previously separately hardcoded
in both `Philosophy.tsx`/`CoachingSection.tsx` (Story) and `PlaySections.tsx` (Play) with already-diverged
wording — now each is one string, imported by both. **Not a full audit**: other prose (Two Callings'
pull-quotes, Faith section's paragraphs, Stage's intro) still has separate Story/Play copies that happen to
say similar-but-not-identical things by original design, not drift — left alone rather than force-merged,
since Story and Play are allowed to phrase the same idea differently when that's an intentional choice, not
an accident. **If Story and Play ever visibly disagree about a fact** (a stat, a credential, a stated
belief), check whether the relevant component is importing from `data.ts` or has its own local copy first —
that mismatch is the most likely cause, per this exact bug.

**Cycling-word effect on Two Callings (shipped 2026-08-09).** Asher found a cycling-word hero effect on
21st.dev (stacked, absolutely-positioned words, spring-animated in/out of a fixed slot) and wanted to use it
somewhere, tied to the duality he likes about the hero's "An actor who teaches. A teacher who acts." line.
**Deliberately not placed on the hero itself**: that line currently shows both halves of its mirror
structure simultaneously, which is what makes it read instantly — cycling it into a one-at-a-time reveal
would trade that immediacy for a slower payoff, a real cost, not a free upgrade. Two Callings' "many roles"
framing fit the effect better on its own merits: it's about plurality of roles, not a two-way mirror, and
already names the same four roles (Actor, Coach, Marketer, Storyteller) in its own static body copy — the
cycling word just replaces that static list with the same four words shown one at a time.

`src/components/asher/CyclingCallingWord.tsx` — adapted from the reference's *technique*, not its code: the
21st.dev demo is built on shadcn's `Button` and generic Tailwind tokens that don't exist in this codebase,
so the actual animation (a `relative inline-block` container with `overflow-hidden`, each word an
`absolute inset-x-0`-positioned `motion.span` animating `y`/`opacity` via a spring transition, cycling on a
plain `setTimeout` loop) was rebuilt against this site's real styling from scratch. `inset-x-0` (not a fixed
pixel width) is what keeps whatever follows the cycling word from jumping horizontally as word length
changes between "Actor" and "Storyteller" — the box always spans the full available width regardless of
which word is showing, so only the text's own natural left-alignment inside it changes, not the box itself.

**Moved into the headline itself, with a dynamic article (shipped 2026-08-09, same day).** Asher asked for
a restructure: the big headline now reads "Asher is a/an [role]" (the cycling word, with the correct article
animated in as one unit — "an Actor" but "a Coach"/"a Marketer"/"a Storyteller"), with the section's static
text ("Many roles, one craft. Each role sharpens the other.") moved down to the subtext line underneath.
Two new props on the shared component support this without hardcoding the new phrasing into it directly:
**`withArticle`** prefixes each word with `articleFor(word)` (checks for a leading vowel — computed, not a
hardcoded per-word lookup, so a future edit to `CALLING_WORDS` can't silently ship the wrong article) as one
animated unit, and **`wordClassName`** lets each caller style the word to fit its own context (italic +
`text-spotlight-gradient` at headline scale in `TwoCallings.tsx`/`PlaySections.tsx`'s title now, vs. the
original plain body-copy styling still available as the default for any future body-copy usage). Play mode's
`Section` component needed its `title` prop widened from `string` to `React.ReactNode` to hold the embedded
component — a safe widening, since every existing plain-string `title` usage stays valid without any other
changes. (The width-reservation approach mentioned in earlier drafts of this section — a hand-guessed
`min-w-[Nch]` — was replaced entirely by the CSS Grid rewrite below; there's no width prop to reason about
anymore.)

**Vertical misalignment, fixed (shipped 2026-08-09, later the same day).** Asher flagged from a screenshot
that the cycling word looked visibly out of alignment with "Asher is" beside it. Root cause, confirmed with
real DOM measurements rather than a visual guess: the word's container reserved `h-[1.3em]` — extra headroom
added when the component first shipped, "in case a descender like the 'y' in Storyteller needs room." At
headline scale that made the box a full ~20px taller than the surrounding text's actual line height. Each
word renders flush to the *top* of its box, while `align-bottom` anchors the box's *bottom* edge to the
line — so the oversized box pushed the visible word noticeably out of position relative to text sitting in
the normal (much shorter) line height beside it. First fix: shrunk to `h-[1em]`, confirmed via measurement
that the `<h2>`'s own line-box height dropped from 93.6px back to 73.4px (exactly matching the surrounding
text's natural line height). Superseded a few hours later by the Grid rewrite below, which fixes this same
class of problem more fundamentally rather than by tuning a second guessed number.

**"The Premise" gets a synced two-slot version (shipped 2026-08-09, later the same day).** Asher asked for
the same effect on `ThreePillars.tsx`'s headline ("00 · The Premise"), but with two words cycling in the
same sentence — "You have a **story** worth **telling**" / "You have a **voice** worth **hearing**" — where
the pairing must stay locked: story always with telling, voice always with hearing, never crossed into "a
story worth hearing." **No Play-mode equivalent exists for this section** (`PlaySections.tsx` has no
"three-pillars"/"00 · Premise" section — its own "00" is a different thing, the Welcome/hero section), so
this one is Story-mode only, unlike every other `CyclingCallingWord`-family usage on the site.

Solved by extracting the timer logic `CyclingCallingWord` already had into its own hook,
**`useCyclingIndex(length, intervalMs)`** (returns `{index, reduceMotion}`), and having `ThreePillars.tsx`
call it *once* with `length: 2`, then render **two** `CyclingWordSlot`s (`SUBJECT_WORDS = ["story","voice"]`,
`PREDICATE_WORDS = ["telling","hearing"]`) both driven by that *same* `index`. Two independently-timed slots
— even started together — would drift out of sync within a cycle or two, since `setTimeout` drift
accumulates independently per timer; one shared index makes desync structurally impossible rather than just
unlikely. **Verified programmatically, not just by eye**: sampled each slot's active word via computed
`opacity` every 400ms across multiple full cycles and asserted the pairing (`story→telling`, `voice→hearing`)
held on every sample — zero mismatches.

**`CyclingWordSlot` rewritten to use CSS Grid stacking, fixing a real bug the mobile check for the above
surfaced.** The original implementation (`position: absolute` + a hand-guessed `min-w-[Nch]`) worked fine
when nothing followed the slot on the same line (Two Callings' "Asher is *[word]*" has nothing after it),
but broke visibly here: "worth" and "." both follow a slot on the same line, and the `ch`-based width guess
didn't match this italic serif display font's actual glyph widths, leaving a visible empty gap before
whatever came next — worse, the mismatch was large enough to push the *second* slot onto its own line
unnecessarily on a narrow viewport. Fixed by giving every word the *same* `grid-area` inside an
`inline-grid` container: CSS Grid auto-sizes a cell to whichever item sharing it is actually
widest/tallest, using real rendered glyph metrics instead of a guessed unit — solving both the width bug
found here **and** the height/alignment bug found earlier in the same rewrite, since both were really the
same root problem (a hand-tuned size estimate that doesn't match real text) wearing two different
disguises. `transform: translateY` (paint-time) still drives the slide animation and doesn't affect what
Grid uses for sizing (layout-time), so the animation itself is unchanged. **`minWidthClass` no longer
exists as a prop** — there's nothing left for a caller to guess. Re-verified after the rewrite: the sync
check above still passed with zero mismatches, Two Callings was re-screenshotted to confirm no regression,
and the Premise headline was checked on both a 1400px desktop and a 390px mobile viewport — mobile
specifically, since that's where the width guess had broken down; it now wraps as "You have a voice" /
"worth hearing." with no gap and no orphaned punctuation.

**First component in this codebase to call `useReducedMotion()` directly** (from `framer-motion`), rather
than the raw CSS `@media (prefers-reduced-motion: reduce)` block `PlayLoader`'s keyframes use. Worth calling
out as the reason for the different approach: this is a continuous, indefinite loop (a much clearer
`prefers-reduced-motion` case than the rest of this codebase's `whileInView` scroll-triggered fades, which
fire once and settle). When reduced motion is preferred, the interval never starts and the component simply
renders the first word (`"Actor"`) with zero animation, rather than looping forever regardless of the
setting.

**Shared between Story mode (`TwoCallings.tsx`) and Play mode (`PlaySections.tsx`) as one component from the
start** — both import the same `CyclingCallingWord`, rather than each getting its own copy that could drift
the way `PRINCIPLES`/`PERSONALITY` did before being fixed earlier the same day. If this effect is ever
extended to a new section, extract shared state (the word list, the interval, the reduced-motion check) into
`CyclingCallingWord.tsx` rather than copy-pasting the component's internals into the new spot.

**Round 3 — the single-active-word fix regressed the animation itself (shipped 2026-08-09, same day).**
The Grid-rewrite fix above solved descenders and the width gap correctly, but rendering only the active word
via `AnimatePresence`/`layout` with a small `0.4em` slide offset (no `overflow-hidden`, since the box's
height now tracked the active word's own unclipped natural size) meant the motion read as a fade — opacity
dominated a slide too small to register as scrolling. Asher flagged this directly: "it used to scroll up/
down but now it fades in/out... keep to what it was before."

**Fix, without giving back the descender/width correctness**: `pb-[0.28em]` on the wrapper gives real,
unclipped room below the text for a descender; `-mb-[0.28em]` cancels that exact amount so the box's outer
margin edge — the thing sibling inline content actually aligns against — lands exactly where it would with
no padding at all. Padding protects the glyph from the (now-restored) `overflow-hidden` clip; the matching
negative margin protects the alignment from the padding. With that in place, `overflow-hidden` could safely
come back, and the slide distance went back to a full `y: "100%"`/`"-100%"` (each word travels its own
whole height, matching the original scrolling-reel character) rather than the small `0.4em` nudge.
**Verified by capturing a burst of screenshots across an actual transition** (not just resting-state
before/after frames): the outgoing word is visibly sliding out and getting clipped at the box edge mid-
frame — a real scroll, confirmed visually, not assumed from the code.

**Round 3 also fixed a real mobile layout-shift bug**, unrelated to the animation itself: `TwoCallings.tsx`'s
headline has no explicit line break, so "Asher is an Actor" (fits on one line at mobile width) and "Asher is
a Storyteller" (wraps to two) gave the `<h2>` a *different total height* depending on which word happened to
be showing — meaning every section below it shifted up and down as the word cycled, a real, visible
annoyance on a phone. Fixed with `Asher is<br className="sm:hidden" /> <CyclingCallingWord .../>` — a
permanent two-line break below the `sm` breakpoint only (desktop has room for every combination on one line
already, so no break there). **Verified by measuring `h2.getBoundingClientRect().height` directly** across a
full cycle, including mid-transition frames where two words briefly overlap in the DOM: exactly `73.4px`
(precisely 2× the mobile line-height) on every single sample, never once different. Play mode's own
`CyclingCallingWord` usage didn't need the same fix — Play mode never renders on mobile at all (`page.tsx`
forces `effectiveMode = "story"` below the mobile breakpoint), so this is scoped to `TwoCallings.tsx` only.

**"Calling 02" renamed "The Studio" → "To Serve" (shipped 2026-08-09, same day, content decision not a
bug).** Asher: the framing of two callings (Stage + Serve) is still accurate, but "The Studio" no longer
fit what that second calling actually covers — 15 years in marketing, current trainer at Nas Academy,
corporate workshops, and 1:1 coaching. First proposed "The Serve" to match "The Stage"'s naming pattern;
corrected directly to **"To Serve"**. Updated in both `TwoCallings.tsx` and `PlaySections.tsx`'s "callings"
section for the same reason every other piece of shared content in this file gets updated in both places at
once — this is exactly the kind of fact that drifted before (see the `PRINCIPLES`/`PERSONALITY` note
earlier in this file) if only one copy gets touched.

**The pull-quote rewritten from Asher's own words, not AI-drafted (shipped 2026-08-09, same day).** The
original — *"Whether the audience is a thousand-seat auditorium or a one-to-one Zoom call, the job doesn't
change. Say the true thing, clearly."* — was flagged directly as something that had been generated, not
said. Replaced with a line built from Asher's own explanation of what he actually means (**"whether it's in
a 1,000-seat hall or a 1-to-1 Zoom call, it is to serve by presenting all I have, as authentically as I
can"**), lightly shaped to fit the existing quote/emphasis-span structure: *"Whether it's a thousand-seat
hall or a one-to-one Zoom call, it's the same calling — to serve. **Presenting all I have, as authentically
as I can.**"* Play mode's own closing line (a variant, not identical wording even before this round —
see the note near the top of this section on Story/Play prose intentionally differing) got the same
"to serve, presenting all I have" reframing for consistency, without literally duplicating Story mode's
exact sentence.

**Play mode has no zone for Story mode's "00 · The Premise" (confirmed, scope decision made 2026-08-09).**
Asher asked directly whether this was missing. Confirmed: `PlaySections.tsx` has no section corresponding to
`ThreePillars.tsx` — Play's own "00" slot is `id="hero"`/`eyebrow="00 · Welcome"`, a different zone serving a
different purpose (the actor/teacher tagline + bio), not a Premise equivalent. **Why this isn't a quick
fix**: Play mode's sections are each tied to a real, physical position in the walkable 3D (`World3D.tsx`)
and 2D (`GameCanvas.tsx`) worlds via `data-section-id` — adding a genuine new zone means new geometry in
both, plus renumbering every zone from `01`–`07` to `02`–`08`. Given the choice between that and folding the
core idea into the existing Welcome zone, Asher chose the smaller change: `PlaySections.tsx`'s hero section
now opens with a short "Finding Your Voice" line + "You have a story worth telling, and a voice worth
hearing" statement, right before its existing bio paragraph — representing the same idea Story mode's
dedicated section states more elaborately, without any new 3D/2D geometry or zone renumbering. **If a real,
fully independent Premise zone is ever wanted later**, budget for World3D.tsx/GameCanvas.tsx geometry work
specifically, not just a `PlaySections.tsx` text change — that's the part that makes this different from
every other copy-only fix in this file.

---

## PLAY mode, per-post (shipped 2026-08-04)

**Not the homepage's 3D world.** That's a single, fixed, hand-built experience with no Sanity registry and no
per-post opt-in — a different product that happens to share the "PLAY" name. This is the ACE spec's actual
Phase 4 ask: an editor-configurable, per-post interactive presentation, built from an approved registry of
component types with structured configuration data — never arbitrary JavaScript stored in Sanity.

**The registry.** `postType.ts`'s `play` object: `enabled` and `mobileEnabled` booleans, plus `presentation`
— an array capped at exactly one item (`rule.max(1)`). That array-of-one is the registry slot itself: Sanity
naturally offers a type picker for an array once it has more than one `of` member, so registering a *second*
presentation type later is just adding another array member type there, not restructuring this field or
anything that reads it.

**First registered type: Key Moments** (`postType.ts`'s `keyMoments` object) — an optional intro line plus 2+
`moments` (a quote/key line and an optional caption each). Renderer: `src/components/asher/blog/
KeyMomentsPlay.tsx`, a client component with keyboard (arrow keys), click, and touch-swipe navigation, a
progress-dot indicator, and a "Back to the full post" exit. Route: `src/app/(site)/blog/[slug]/play/page.tsx`,
lean dedicated query `POST_PLAY_QUERY` (title/slug/`play` only — doesn't need the post's full body). Editors
can paste "Suggest SEO & Excerpt"'s pull-quote suggestions straight into `moments` — same underlying idea
(a short, striking line from the post's own text), different destination.

**Mobile disabling is server-side, not client-side viewport width** — `src/lib/device.ts`'s
`isMobileUserAgent()` checks the request's own `User-Agent` header. Two places use it: the PLAY page itself
redirects to the real post if `mobileEnabled` is `false` and the UA looks mobile (so a shared PLAY link never
shows a broken/disabled page to a mobile visitor), and the STORY page's entry-point button doesn't render at
all under the same condition (so there's no link that would just redirect away). This matches the spec's
explicit instruction not to rely on browser width after already downloading a PLAY experience.

**SEO:** the PLAY page sets `robots: {index: false}` and `alternates.canonical` pointing at the real post URL
— "the canonical version always wins, alternatives are derivatives, never rivals," per the spec. If a PLAY
page ever needs to be indexable later, this is the one line to change.

**If the PLAY page's own header bar looks like it's overlapping the site's real header:** check the
outermost wrapper in `KeyMomentsPlay.tsx` still has `pt-28` — the site header (`SiteHeader.tsx`) is
`position: fixed`, and every other page (see `BlogChrome.tsx`) accounts for its height the same way. This was
a real bug caught only by an actual screenshot during verification, not by checking rendered HTML with curl.

Verified with a real Playwright browser against the live site (not just curl): entry-point link, intro
screen, click-through navigation between real moments with correct captions and progress-dot state, the
mobile-UA redirect firing in an actual browser navigation, and noindex/canonical tags — all against a real
test post, deleted afterward.

---

## Editorial Calendar (shipped 2026-08-04)

**Studio → Calendar** — a drag-and-drop month view, `src/sanity/components/EditorialCalendarTool.tsx`. Not
Sanity's own Schedule Publishing (confirmed gated behind their paid Growth plan, $15/seat/month, before
building anything) — a plain custom Studio tool patching a normal field, free on every tier, same pattern as
every other tool in this project.

**Two kinds of card:** published posts (solid, keyed off `publishedAt`) and unpublished drafts with a
`scheduledPublishAt` field set (dashed, `postType.ts`). Dragging either to a new day patches that field,
keeping the original time-of-day and only changing the date. A draft that's already been published once
(has a real published counterpart) never shows here even if `scheduledPublishAt` is still set on an in-
progress edit — that field only means something before a post's first publish.

**Auto-publishing:** `src/app/api/cron/publish-scheduled/route.ts`, a daily Vercel Cron (`vercel.json`, same
`CRON_SECRET` auth as the other two crons). Publishes any unpublished draft whose `scheduledPublishAt` has
passed — a real `createOrReplace` + `delete` transaction (draft → published document), not Sanity's own
publish action. **Precision limit, by design, not a bug:** Vercel's Hobby plan caps cron frequency at once
per day and doesn't guarantee an exact minute within the scheduled hour — so a post scheduled for a given
day goes live *sometime* that day, not at a specific time. This is stated directly in the field's own
description in Studio so it's never a surprise; if precise-time scheduling is ever needed, that requires
either Vercel's Pro plan (more frequent crons) or Sanity's paid Schedule Publishing.

**Important gotcha, found the hard way:** this Sanity API version's default query *perspective* excludes
`drafts.*` documents from results entirely — even an exact `_id ==` match returns nothing unless the query
explicitly passes `{perspective: 'raw'}` as a third argument to `.fetch()`. `getDocument()` doesn't accept a
perspective option at all, so anywhere a draft's full content needs reading, use `.fetch('*[_id == $id][0]',
{id}, {perspective: 'raw'})` instead. This is scoped to the *specific queries* that need to see drafts, not
set on the shared `writeClient`/`useClient()` instances, so it can't silently change behavior anywhere else
in the project. If a future feature needs to read a draft document and mysteriously gets `null`/empty
results despite the document definitely existing, check for this first before assuming something's broken.

Verified against live data: a real unpublished draft with a past-due `scheduledPublishAt` was genuinely
auto-published by the real cron endpoint (draft deleted, published document created, `publishedAt` correctly
backdated to the scheduled time). The calendar's queries and drag-move patch logic were verified separately,
including moving a real published post's date by exactly one day and reverting it immediately afterward.

---

## Privacy Policy (shipped 2026-08-02)

`/privacy` (`src/app/(site)/privacy/page.tsx`), linked from the site footer's copyright line (every page) and
from the cookie-consent banner. Two-part layout, per Asher's request: a "30-second version" — plain-English
bullet points, no legalese — at the top, then the full detailed policy underneath for anyone who actually
wants it.

**Hand-written in code, not a Sanity document.** Unlike post content, this isn't meant to be freely editable
from Studio without review — legal text is exactly the kind of thing that benefits from the same scrutiny as
any other code change (a PR/diff, not a quick edit that goes live instantly). It also changes rarely enough
that this isn't a real workflow cost.

**Written to describe what the site actually does, not generic boilerplate** — cross-checked against the real
code paths at the time it was written: what `/api/contact` and `/api/comments` actually store (name, email,
optional phone, message, IP — IP explicitly for spam detection only, see both routes' own comments), that
404 tracking (`notFoundHitType`) never captures IP or anything else identifying, that analytics
(`Analytics.tsx`) only loads after explicit consent, and the real list of third-party services in use (Sanity,
Resend, Vercel, Google Analytics/Tag Manager) — no newsletter provider was in that list as of this writing;
add one when a newsletter tool actually gets integrated, and update the policy's third-party list and cookie
section together in the same change, since email-capture tools almost always come with either a tracking
script or their own cookies.

**If any of the underlying facts above change** — new third-party service added, new kind of data captured,
retention behavior changes — the `/privacy` page needs a matching edit and its `LAST_UPDATED` constant bumped
in the same change. It's not automatically kept in sync with the code it describes.

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

**Illustration + copy (2026-08-04):** the page shows one of three illustrations (`public/asher/404-*.png`),
picked at random per visit via a `useState` lazy initializer in `NotFoundContent.tsx` — computed once on mount
so it's stable for that visit, not re-rolled on every re-render. Adding a fourth just means adding one more
entry to the `NOT_FOUND_ILLUSTRATIONS` array at the top of that file plus the image file itself in
`public/asher/`; nothing else needs to change.

---

## 404 hit tracking: one overview page, full per-hit log

**Studio → 404 Hits** (top nav) redesigned 2026-07-30 from a plain document list (click into each path's own
form) into a single overview page, most-hit paths first — same pattern as Media and Comments. Each row shows
the path, total hit count, first/last seen, and a status control (toggle directly in the list, no need to
open the document). Component: `src/sanity/components/NotFoundHitsTool.tsx`.

**Pending / Ignored / Actioned, in three accordions (shipped 2026-08-04):** `notFoundHitType.ts`'s `status`
field replaced the old `actioned` boolean — `pending` (default, set by `/api/track-404/route.ts` on
creation), `ignored` (looked at, deliberately left alone), or `actioned` (dealt with — a redirect, a new
post, whatever). The tool groups rows into three collapsible sections by status instead of one flat list;
Pending starts open, Ignored/Actioned start collapsed. Each row's status is a small dropdown. Creating a
redirect from a row (see the Redirects section above) still sets it to `actioned` automatically. Existing
data was migrated once by hand at ship time (`actioned: true` → `"actioned"`, everything else → `"pending"`)
— nothing to do for that retroactively, only relevant if a very old backup/export is ever restored, in which
case check for `notFoundHit` docs with an `actioned` field but no `status` and run the same mapping again.

**Full hit log, not just first/last seen:** every individual hit is now recorded (`hits` array on
`notFoundHitType.ts` — timestamp + referrer per hit), expandable per-row in the tool. Asked for directly by
Asher, specifically to be able to spot a burst of hits in a short window (suggests a bot scanning/
bruteforcing for pages) versus scattered one-off hits over weeks (organic broken links, old bookmarks, etc.).
Capped at the most recent 500 hits per path (`src/app/api/track-404/route.ts` trims via `.slice(-500)`) so a
path getting hammered can't grow its document without bound — `hitCount` stays the true total even past that
cap, only the detailed log trims.

**Existing 404 hit documents from before 2026-07-30 have no hit log** — `hitCount`/`firstSeenAt`/`lastSeenAt`
on them are still accurate, but the individual-hit detail was never captured before this shipped, so it can't
be reconstructed retroactively. Only hits from this point forward have the full log.

**If the hit log looks wrong or missing for a path that should have one:** check `/api/track-404/route.ts`
still does a read-modify-write (fetch existing `hits`, append, `.slice(-500)`, then `.set()`) rather than a
blind `.append()` — the read step is what makes the 500-cap possible; without it there's no way to trim.

**Create redirect, inline (shipped 2026-08-04):** each row also has a **Create redirect** button
(`src/sanity/components/CreateRedirectForm.tsx`) that writes a real `redirect` document without leaving this
tool — see the Redirects section above for the full behavior. The destination field searches existing
posts/categories/authors/static pages as you type; picking one fills in the real path instead of it being
typed by hand.

**User-Agent captured too (shipped 2026-08-05):** each hit (top-level "last" value and per-hit in the log)
also stores the requester's User-Agent, read server-side from the request header in
`/api/track-404/route.ts` — not from the client body, so it can't be spoofed the way a POSTed field could.
The tool shows a quick **"likely a bot"** badge (`looksLikeBot()`, a loose regex against common
crawler/bot User-Agent substrings — not real bot detection, just enough to separate "a search engine
re-found a stale link" from "a real visitor hit a wrong URL" at a glance). Deliberately does **not** also
capture IP for this — IP collection is scoped in the privacy policy specifically to spam detection on the
contact form and comments; extending it to anonymous 404 tracking would need that policy updated first.

---

## Search query tracking: content ideas straight from what readers look for (shipped 2026-08-06)

**Studio → Site Admin → Search Queries** logs every distinct thing typed into the blog's search box
(`BlogSearch.tsx`) — same overview-page pattern as 404 Hits, and built for the same reason: turn "what are
visitors actually looking for" into something browsable in Studio instead of buried in Google Analytics (or
not captured at all, as it wasn't before this). Asher's own framing when asking for this: the search box
becoming something closer to a content-idea funnel, and — his longer-term thought — a natural fit for a
future RAG-style avatar (see the note at the end of this section).

**What actually gets logged, and when:** `BlogSearch.tsx` debounces 800ms after the visitor stops typing (not
on every keystroke — a partial "h", "he", "hel" while typing "help" would be meaningless noise) before calling
`POST /api/track-search` with the settled query text and how many posts it matched. Skipped entirely for
anything under 2 characters, and never re-logged if the exact same settled query fires twice in a row (e.g.
clicking back into an already-typed box). One document per distinct **normalized** query (trimmed, lowercased,
whitespace-collapsed) — `searchQueryLogType.ts` — repeat searches increment `hitCount` rather than piling up
duplicate documents, exactly the same `createIfNotExists` + read-modify-write pattern as `/api/track-404`.
`lastResultCount` (and a full per-search `hits` log, capped at 500) tracks how many posts matched each time —
**a query that keeps coming back with 0 results is the single strongest signal this captures**: something
readers want that this blog doesn't have yet (or the search index genuinely can't find, worth checking before
assuming it's a real gap).

**Runs unconditionally, not gated by analytics cookie consent** — same reasoning already established for
404-hit tracking and share tracking: this is anonymous, first-party, operational data (just the search text
and a result count, nothing that identifies a visitor), not a third-party analytics script, so it isn't the
kind of thing the cookie banner's "Accept/Decline" choice is about. Disclosed in `/privacy` regardless (see
"What you search for on the blog" under "What's collected automatically") — the same discipline every other
tracking feature here follows: a new data-collection point always gets a matching policy update in the same
change, not "later."

**Studio tool** (`SearchQueriesTool.tsx`) mirrors `NotFoundHitsTool.tsx`'s Pending/Ignored/Actioned accordion
pattern exactly — Pending starts open, most-searched-first within each group, a **"no results"** badge on any
row whose most recent search came back empty, expandable per-query search log. Mark a query **Actioned** once
you've written a post about it (or realized it already exists and search just isn't finding it), **Ignored**
if it's not worth pursuing.

**On the RAG idea specifically:** this ships the data-collection half only — logging queries and turning them
into a browsable content-idea list. It does **not** build the "AI avatar that answers questions using the
site's own content" idea Asher separately floated (already logged in `IDEAS.md` as an explicitly deferred,
bigger project). The two are complementary, not the same feature: if that avatar/RAG project happens later,
these logged queries — especially the zero-result ones — are a genuinely useful head start on knowing what a
retrieval system should be able to answer, but building this tracker doesn't require or imply building that.

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
