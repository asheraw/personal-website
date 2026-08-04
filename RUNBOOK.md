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

**"SEO Preview" tab** (shipped 2026-07-31): every post's document pane has a second tab next to the normal
Editor form (`src/sanity/components/SeoPreviewView.tsx`, wired in `structure.tsx`) — an approximate Google
search-result preview and social-share-card mockup, live character counts against the same 70/160 limits the
schema fields and "Suggest SEO & Excerpt" already use, and the same "worth a look" checklist the pre-publish
dialog shows (now also flags a featured image with no alt text, not just a missing image). Updates as the
draft autosaves via Sanity's own `useEditState` hook — not a fixed snapshot, no separate "refresh" step.
Complements, doesn't replace, the pre-publish dialog: that one's a last-chance popup right before Publish,
this one's visible the whole time you're actually writing. Both share one function
(`getChecklistIssues`, exported from `prepareForPublish.tsx`) for what counts as "worth a look," so the two
can't quietly disagree with each other.

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

## Link Checker: broken links, monitoring, and affiliate registry (shipped 2026-08-04)

**Studio → Link Checker** (top nav) scans every post and reusable snippet's own rich text for links — both
the plain URL annotation and the Affiliate link one (below) — and checks each URL live: HEAD first, falling
back to GET for hosts that reject HEAD outright. Results group into three sections: **Broken**, **Affiliate
links**, **Everything else**. Component: `src/sanity/components/LinkCheckerTool.tsx`. Shared checking logic:
`src/lib/linkChecker.ts`.

**Results persist, not just report.** Each checked URL is its own `linkCheck` document (deterministic id
hashed from the URL, so re-checking upserts rather than duplicating), storing which post(s)/snippet(s) use it,
last status, and `brokenSince` (set the first time a URL fails, left untouched on every subsequent failed
check, cleared automatically the moment it passes again). A URL that's been removed from every post/snippet
it used to appear in has its `linkCheck` document deleted on the next run — the registry only ever reflects
what's actually in current content, never stale history.

**Monitoring, not just an on-demand audit.** `vercel.json` runs `/api/cron/check-links` weekly (same
`CRON_SECRET` auth as `/api/cron/purge-trash` — already configured, nothing new to set up). **Check now** in
the tool itself calls `/api/check-links` (no cron secret needed — same no-extra-auth pattern as the AI
suggestion routes, since reaching Studio is the access control on this solo-owner site) to run the identical
check on demand.

**False positives happen.** Some sites block automated/bot-like requests (a plain `HEAD`/`GET` with no
browser fingerprint) even though the page loads completely fine for an actual visitor — a flagged link is
worth a quick manual click before assuming it's really broken, not an automatic "go fix this."

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

**Display size + lightbox (2026-08-04).** Every Image block also has a **Display size** field: Small (max
420px), Medium (max 720px), or Original (fills the column, the default — matches every pre-existing post
exactly). This is purely cosmetic on the page; clicking or tapping *any* image, in every display style, opens
`ImageLightbox.tsx` — a full-size, untouched view of the original, dismissible via Escape, clicking outside, or
its close button. `SizedImage.tsx` handles the plain-image case; `ImageCarousel.tsx`'s own slide/thumbnail
buttons handle the gallery cases. One thing worth knowing if a carousel's click-to-lightbox ever seems to
misfire after this: the click handler checks `emblaApi.internalEngine().dragHandler.pointerDown()` and bails
out if a drag is still in progress — without that guard, dragging to the next slide also pops the lightbox
open, since a drag ends in a pointerup that looks just like a click.

**Missed spot, closed same day: the Featured Image.** All of the above only ever covered Portable Text *body*
images. The separate `mainImage` field rendered at the top of every post (`src/app/(site)/blog/[slug]/page.tsx`)
went through plain `next/image` with no lightbox at all until Asher noticed. Fixed with a small dedicated
wrapper, `FeaturedImage.tsx` — always full width (it's the hero, not a Display-size-able body block, so it has
no size options), but opens the same `ImageLightbox.tsx` on click. Worth remembering if another image spot
turns up outside the post body later (an author photo, a category card image, etc.) — none of those go through
`portableTextComponents.tsx` either, so none of them automatically inherited this for free.

---

## Instagram embed block (shipped 2026-08-04)

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

---

## Share bar: resharing a post to other platforms (shipped 2026-08-02)

Every post page has a **Share this post** row (`src/components/asher/blog/ShareBar.tsx`), placed after the
post body/tags and before the comment section. Buttons for X, Facebook, LinkedIn, WhatsApp, and Email each
open that platform's own public share-intent URL with the post's title and URL prefilled — no SDK, no
third-party embed, nothing that loads or phones home before a reader actually clicks one. A **Copy Link**
button copies the URL to the clipboard and shows a checkmark for 2 seconds as confirmation. On a device that
supports the browser's native Web Share API (most mobile browsers, essentially no desktop browsers), an
extra **Share** button appears first and opens the OS's own share sheet — feature-detected client-side
*after mount* specifically (not during the initial render) so server-rendered HTML and the client's first
render always agree; checking `"share" in navigator` directly during render would make Next.js's hydration
pass disagree with the server output, since `navigator` doesn't exist during server rendering at all. Every
button fires a `share_click` analytics event (`src/lib/analytics.ts`, same `track()` helper used elsewhere on
the site) labeled with which platform was used.

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

**If the "Used in" counts look wrong:** the query only checks the `post` document type. If a future feature
lets other document types (e.g. author bios) hold images too, this tool's query needs `_type == "post"`
widened to match — currently by design, since posts are the only place images live today.

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
comment with one-click **Approve** / **Reject** / **Mark as Spam** / **Edit** / **Trash** buttons, and a count
of comments awaiting review at the top of the tool. Component: `src/sanity/components/CommentsTool.tsx`.

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

**Post titles link to the live post,** in both the main view's group header and the Trash view's per-card
reference — `https://asheraw.com/blog/<slug>` in a new tab, using each row's already-fetched `postSlug`.

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
the accept half, for the structural reason above. It arrives in GA4 as a raw dataLayer event; if Asher wants
it as a proper GA4 conversion/event report, that needs a Trigger + Tag added in Tag Manager itself (variable:
Event equals `cookie_consent`) — nothing further to do in code for that part.

`window.dataLayer` is deliberately seeded (`window.dataLayer = window.dataLayer || []`) right before calling
`track()` on Accept, not left to `track()` alone — at the exact moment of the click, GTM's own script hasn't
loaded yet (that only starts once React re-renders from the consent-change event), so `dataLayer` doesn't
exist yet either. `track()` only pushes if the array already exists; without seeding it first, this specific
event would silently vanish every single time.

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

**The generated text never includes the actual URL** — X/LinkedIn/Facebook all generate their own link
preview card from a pasted URL, so baking the link into the caption text itself is redundant and eats into
X's character budget for nothing. Asher pastes the caption, then the link, separately.

New route: `src/app/api/ai/suggest-social/route.ts`, same `gemini-3.6-flash` + `responseSchema` structured-
JSON pattern as `suggest-seo`. New action: `src/sanity/actions/suggestSocialCopy.tsx`, registered in
`sanity.config.ts` right next to `createSuggestSeoAction()`.

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
