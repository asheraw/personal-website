# Development Log

A running, single log of what's actually shipped on asheraw.com — one entry per work session, newest at the
top. This is the one place (human or AI, desktop or remote) should read to know what's actually been done,
and the one place to add a new entry to when something ships. Don't create a separate summary document per
day — add a dated section here instead, so there's never more than one place to check.

Written for two audiences at once: Asher, reading in plain English, and a new developer (human or AI)
picking up the project cold. For *why* something works the way it does, or what to do when it breaks, see
`RUNBOOK.md`. For the project's actual goals and roadmap, see `ACE_PRD.md` and `ACE_MASTER_SPEC.md`.

---

## 2026-08-05 (continued) — Pasting a YouTube/Instagram URL now auto-embeds it

Asher pointed out the actual friction: embedding a video meant opening the block-insert menu, picking
"YouTube embed," *then* pasting the URL a second time into that block's own field. Now pasting a bare
YouTube or Instagram post URL directly into the body — on its own line, or over selected text — inserts the
real embed block immediately, no menu detour.

Built on Sanity's own documented `onPaste` hook on the Portable Text input (`src/sanity/lib/autoEmbedPaste.ts`),
wired through `DistractionFreeWritingPanel.tsx`'s existing `renderDefault()` call, since that's the one place
already customizing the body field's input component — no second, competing `components.input` override
needed. A regex checks whether the *entire* pasted string is just a YouTube or Instagram URL (not a sentence
that happens to mention one) and returns the matching block object directly; anything else falls through to
Sanity's normal paste handling untouched.

**Honest limit, stated directly to Asher:** this only fires on an actual clipboard paste (Ctrl/Cmd+V). Typing
a URL by hand and pressing space/Enter does *not* trigger it — that would need a different, currently
undocumented Studio "Behaviors" API, not attempted here since it's real internals Sanity hasn't committed to
as stable public API yet.

**Verified the matching logic directly, not the live paste interaction itself** — this sandbox has no way to
log into Studio and click-test a real paste event, so the actual `onPaste` wiring couldn't be exercised
end-to-end. What *was* verified: running the real matching function against realistic URL variants
(youtube.com/youtu.be/shorts, instagram.com/p//reel, with and without query strings or trailing slashes) —
every real video/post URL matched correctly, and a URL sitting inside a normal sentence was correctly left
alone. Worth a real check in Studio to confirm the block actually appears on paste.

---

## 2026-08-05 (continued) — ACE spec review, two shelved, and Markdown export shipped

Asked what's left in the original `ACE_MASTER_SPEC.md` roadmap. Cross-checked the actual spec against
everything shipped rather than trusting memory — most of it is done (Phases 0–4, 6–9, several well beyond
what the spec even asked for). What's genuinely left, split into "on hold by Asher's own call" (Email &
Newsletter, waiting on a lead magnet; bulk operations; audio narration, no free TTS option) versus "not
started yet" (series/collections + footnotes, content audit/stale detection, import/export, the Avatar Door,
a dedicated final-hardening pass).

**Two of those got a real decision today, logged in `IDEAS.md`:**
- **The Avatar Door** — the "talking" (TTS) requirement is dropped entirely; text-on-screen is fine if this
  ever gets built. Shelved specifically until there's real traffic *and* the post count crosses 200 — not
  just "the publishing foundation is stable," a higher bar than the spec's own gate.
- **Series/collections & footnotes** — reconfirmed tied together (footnotes only matter *for* a book), still
  shelved since neither of the two books Asher has in mind is ready to go up yet.

**Import/export tooling — started, scoped down deliberately.** The full spec item covers five import formats
and five export formats; rather than guess at where to start, asked directly. Landed on Markdown export
first — real portability, no new heavy dependencies. Shipped:

- **"Export as Markdown"** — a document action right in a post's own editor (works on an unpublished draft
  too), downloads that one post as a real `.md` file: YAML frontmatter (title, date, author, categories,
  tags, excerpt) plus the body converted via the official `@portabletext/markdown` package.
- **Studio → Export** — the "full collection" half: every *published* post zipped client-side into one
  download, each as its own file. Drafts deliberately excluded — an archive meant to leave the building
  shouldn't include work still mid-draft.
- Every custom block type got its own converter: callouts, code blocks, dividers, accordions (as GFM
  `<details>`), YouTube/Instagram embeds (as links), and the merged image block including its gallery photos.
  `internalLink` marks resolve to real `/blog/<slug>` paths and `snippetRef` blocks inline the referenced
  snippet's own content — reusing the exact reference-resolution shape `POST_BY_SLUG_QUERY` already proved
  live, so this can't quietly drift from how the real post page resolves the same references.

**Verified against real content, not fixtures** — ran the actual conversion function against real fetched
posts (via `tsx`, no dev server needed for this kind of check): a post with internal links and a YouTube
embed, a 6-photo gallery, and a post with an accordion all converted correctly, checked by reading the actual
generated Markdown.

**Two unrelated things found and fixed along the way, not part of the ask:**
- `POST_SUMMARY_PROJECTION`'s own `mainImageAlt` fallback (used by the blog listing, RSS, sitemap, and every
  category/tag/author page) was still querying the pre-migration `asset._ref` field — a leftover from the
  `imageAssetAlt` hotfix days ago that only touched two of the three occurrences at the time. The
  library-level default alt text had been silently never applying anywhere except the single post page
  itself since then.
- The Christmas 2015 post's photo gallery was still set to "Scrolling strip" from an earlier same-session
  test that didn't actually revert the way it looked like it had — reset back to its real original
  "Slideshow" setting.

---

## 2026-08-05 — RSS URL guesses redirected, 404 hits now capture User-Agent

Asher asked where the RSS feeds live (answered: `/rss.xml` site-wide, plus `/blog/category/[slug]/rss.xml`,
`/blog/tag/[tag]/rss.xml`, and `/blog/author/[slug]/rss.xml`) and separately noticed `/blog/rss` 404ing — a
reasonable guess given the other three feeds all live under `/blog/...`, even though the site-wide one has
always lived at the bare root. Added two redirects via **Studio → Redirects** (`/blog/rss` and `/blog/rss.xml`,
both → `/rss.xml`) rather than moving the real feed's URL, since that one's presumably already the URL any
existing subscriber has. Verified live: both now 301 through to a real `200` on `/rss.xml`.

**404 Hits now capture User-Agent**, following up on "any possibility to get more data to better identify" —
read server-side from the request header (can't be spoofed via the client body the way a POSTed field could),
stored alongside the existing path/referrer, both as a "last" value and per-hit in the log. **Studio → 404
Hits** shows it in the summary line, in the expanded per-hit log, and a quick "likely a bot" badge from a loose
User-Agent pattern match — enough to separate "a crawler re-found a stale link" from "a real visitor hit a
wrong URL" at a glance. Deliberately did *not* add IP here too: that's scoped in the privacy policy
specifically to spam detection on the contact form and comments, and extending it to anonymous 404 tracking
would need that policy updated first, not just a code change.

Verified with a real request carrying a bot-like User-Agent string before shipping — the field landed exactly
as sent, in both places — then cleaned up.

**Also today:** Asher asked for the Comments tool to show a post's newest comment at the top instead of
needing a scroll to find it. Top-level comments within each post's group now sort newest-first; replies
within a thread stay oldest-first, since a conversation should still read the way it actually happened.

---

## 2026-08-04 (continued) — Comments tool: clickable post titles, cleaner info line, less clutter

Two follow-ups from Asher restoring a growing number of old comments (see below): the tool was getting
visually heavy, and there was no quick way to jump from a comment to the actual post it's on.

**Settled threads collapse by default.** A post's comment group now shows a one-line "On 'X' · N comments"
header once nothing in it is pending, expandable with one click — remembered per post for the session. Groups
with something pending still open automatically, same as before. Modeled on how WordPress/Disqus/YouTube all
lead moderation with status rather than raw chronology; the direct fix for restoring dozens of settled 2014/
2015 comments making the page longer forever with nothing left to actually review.

**New search box** filters by name or message text — matching a comment's whole thread (not just the one card
containing the term, which would read as context-free out of its reply chain), always shown in full while
searching regardless of collapse state.

**Post titles are now links.** "On 'X'" — both the main grouped view's header and the Trash view's per-card
reference — opens the live post in a new tab.

**Per-comment info line cleaned up.** Name/email/IP/date/edited-date used to be split across two separate
rows with hand-glued "· " string prefixes that misaligned once they wrapped, especially with restored
comments' longer placeholder email addresses. Now one joined line (`Array.filter(Boolean).join(' · ')`)
directly under the name — always spaces consistently regardless of width.

**Follow-up same day:** Asher flagged that the collapsed group headers still looked ragged — different post
title lengths (and "Lock" vs "Unlock comments") pushed the count badge and buttons to a different spot on
every row. Rebuilt on a fixed-column `Grid` (same pattern `ContactSubmissionsTool.tsx` already uses) instead
of a `Flex` — title truncates with an ellipsis into whatever space is left; every column after it now lands
at the same fixed position on every row, regardless of content.

---

## 2026-08-04 (continued) — Restored two old posts' comments from the Wayback Machine

Asher found archived comment threads for two pre-migration posts and asked to have them re-entered with their
original dates rather than today's. 24 comments added across "My Confession: 5 Minutes As Judas" (12) and "The
Journey To Become The Son" (12), all created directly as `approved` (already public originally) with
`isAuthorReply: true` on Asher's own replies.

Threading followed the exact same 3-level flatten rule `CommentsTool.tsx`'s own reply button already applies
(a reply to an already-3rd-level comment attaches to that comment's *parent* instead of nesting a 4th level) —
worked out by hand for one thread on the Judas post that was genuinely 4 conversational turns deep in the
original screenshots.

**Not every comment had a real date.** A later-found archive page for the Son post used a plain undated
recap format for 4 of its threads (Carol Marsh, Myrna Wang, a second Edmund comment, Lyon) — asked Asher how
to handle it rather than guessing; his call was to estimate dates from the list's own apparent order rather
than wait for a better source or default to today. Those four are flagged as estimated in the restoration
commit message, not exact — fixable later via the comment date-editing feature from earlier today if a real
timestamp ever turns up.

Placeholder `name@restored.invalid` emails were used throughout (WordPress never showed real ones publicly,
so none were ever visible to recover) — harmless, since that field is never shown publicly anyway.

Verified live after every batch: correct nesting, correct dates, and no collision with each post's existing
2026 comments, checked directly against the rendered page before moving on.

---

## 2026-08-04 (continued) — 404 page: three illustrations, new copy, and a Featured Image lightbox gap closed

Asher sent three custom illustrations (a flustered stage actor, the Time Squirrel, Timo the Time Hamster) and
new copy for the 404 page, plus a follow-up spot he noticed: a post's Featured Image wasn't clickable, unlike
every image in the body.

**404 page** (`NotFoundContent.tsx`) — one of the three illustrations is picked at random per visit (`useState`
lazy initializer, so it's stable for that visit but fresh on the next one), sitting above the heading. New
copy: "Oops, Something's Missing" (was "Scene not found."), and a friendlier explanation paragraph. One small
wording fix made along the way: Asher's draft had "is some else" — read as a typo for "is somewhere else" and
shipped that reading; flagged directly in case that guess was wrong.

**Featured Image lightbox** (`FeaturedImage.tsx`, new) — the earlier image-lightbox work only touched Portable
Text body images; the separate `mainImage` field rendered at the top of every post was missed entirely. Same
click-to-lightbox treatment now, always full width (it's the hero, not a Display-size-able body block, so no
size options here).

Verified live: loaded the 404 page six times running and got all three illustrations back across those loads
(confirming the random pick actually varies, not just once and cached), and opened a real post's Featured
Image lightbox end to end, confirming the full-size original actually loads.

---

## 2026-08-04 (continued) — Comments can now have their submitted date edited

Asher is restoring old pre-migration posts and has been tracking down their original comments via the Wayback
Machine — he wants to re-enter them with their real original dates rather than whatever date re-entering them
happens to land on.

The **Comments** tool's existing edit-message flow now has a "Submitted" date field right alongside the
message text box, same Save/Cancel. `createdAt` on the `comment` schema type has been `readOnly: true` since
the type was written — worth noting that *only* matters for Sanity Studio's own generic document form, which
comments never go through anyway (there's no comment entry in Structure's document list at all, by design, to
keep the whole flow inside this one tool). Since this tool has always written directly via the API
(`editedAt`, `isAuthorReply`, etc. are all set the same way already), no schema change was needed at all.

Verified with a real, throwaway comment document: created with today's date, patched with the exact same
`{message, createdAt, editedAt}` shape the tool's Save button now sends, read back to confirm the backdated
date landed exactly as set, then deleted.

---

## 2026-08-04 (continued) — Image display sizes (small/medium/original) and a click-to-lightbox

Asher asked for a way to size down images that don't need to dominate the page, with the full-size original
still reachable on click/tap.

New **Display size** field on the Image block (`blockContentType.ts`): **Small** (max 420px), **Medium** (max
720px), or **Original** (fills the post column, today's existing behavior — the default, so nothing about any
existing post changed). Applies to a plain image and to every carousel/slideshow/scrolling-strip mode alike.

**Every image, everywhere, now opens a lightbox on click** showing the untouched full-size original —
`src/components/asher/blog/ImageLightbox.tsx`, a small portal-rendered overlay (Escape, click-outside, or a
close button dismiss it). Display size only ever changes the inline preview; a reader can always get to the
real full-resolution photo. Wired into `SizedImage.tsx` (new, replaces the plain-image render path) and into
`ImageCarousel.tsx`'s existing slide/thumbnail buttons.

**One real interaction bug caught before shipping:** clicking a carousel slide to open the lightbox also fired
after dragging to the next photo, since a drag ends with a `pointerup` that looks like a click. Fixed by
checking Embla's own `internalEngine().dragHandler.pointerDown()` inside the click handler and ignoring the
click if a drag was in progress — the same guard Embla's own docs recommend for exactly this case.

Verified live end-to-end: opened and closed the lightbox on a plain image and inside a slideshow (confirmed
the full-size image actually loads, not a placeholder), confirmed dragging through the carousel doesn't
misfire it, and confirmed Small actually renders at a real capped, centered width via a temporary toggle on a
real post (reverted immediately after).

---

## 2026-08-04 (continued) — Found and fixed the real cause of every failed deploy today

Asher reported not seeing any of today's work live, and separately noticed the Vercel dashboard showing
repeated "resource provisioning failed" errors — his own hunch was Supabase, since he'd seen a
"supabase-teal-clock" indicator and doesn't want to depend on it (it can pause itself from inactivity).

He was right. This project ran on Supabase/Postgres for the contact form long before migrating to Sanity —
the code hasn't touched it in months, but the **Vercel integration itself was never disconnected**, and it was
marked *required for every deployment*. Supabase's free tier had auto-paused the underlying project from
inactivity; Vercel tried to provision that dead, paused resource on every single deploy from that point on and
failed before the app's own code ever got a chance to matter. Every "Error" in the deployment history — 5 in a
row, starting exactly at the Instagram/Embla commit purely by coincidence of timing — shares this one cause,
confirmed directly via the Vercel API (`errorCode: "BUILD_FAILED"`, `errorMessage: "Resource provisioning
failed"` on every one, with the actual Next.js build step itself always reporting success).

Fixed in two steps, both explicitly confirmed with Asher first since they touch live infrastructure, not just
code: disconnected the Supabase resource from the project (`vercel integration resource disconnect`), then
fully deleted it (`vercel integration resource remove`) once confirmed nothing else used it. A manual
`vercel deploy --prod` right after came back `Ready` immediately, and the very next real git push (the image
lightbox work above) deployed cleanly on its own — confirming the fix holds, not a one-off.

No code was ever the problem here — worth remembering the next time a deploy fails right after a normal
commit: check whether the *build* step itself actually succeeded before assuming the new code is at fault.

---

## 2026-08-04 (continued) — Image and Carousel merged into one block, plus a scroll-strip style

Follow-up to the Embla rebuild above, from feedback on the same day: Asher asked whether the plain **Image**
block and **Image Carousel / Slideshow** block could become one field instead of two, and separately pointed
at Embla's own [predefined examples](https://www.embla-carousel.com/docs/examples/predefined/) — specifically
the variable-width, auto-scrolling style — as something he wanted an option for.

**Merged into one block.** The `image` schema type (`blockContentType.ts`) gained an optional
`additionalImages` array field and a `displayStyle` field (hidden until at least one additional photo exists).
A block with no additional photos renders exactly as a plain image always has — fully backward compatible
with every other post's existing single-image blocks, no migration needed for those. The old standalone
`imageGallery` type is gone from the schema entirely now, so there's one toolbar button, not two.

**One real migration was required**, not zero: the single post that used the old `imageGallery` shape
("Christmas 2015: The Quest") had its one gallery block rewritten via a one-time script into the new shape —
same 6 photos, same order, same Slideshow setting, just reshaped. This was a live write to production content,
so it went through Asher directly rather than running unattended (the auto-mode safety classifier correctly
flagged the first unattended attempt as the kind of action that needed a human yes). Verified afterward against
the live page: renders identically, Next/dot navigation still advances correctly.

**New "Scrolling strip" display style** — photos shown at their natural aspect ratio side by side (not locked
to one uniform box), continuously auto-scrolling via `embla-carousel-auto-scroll`, pausing on hover/touch via
its own `stopOnMouseEnter`/`stopOnInteraction` options. Verified live with a real temporary toggle on the
Christmas 2015 post (reverted back to Slideshow immediately after): two screenshots a second and a half apart
show the strip having visibly advanced.

**Also reordered the toolbar** so **YouTube embed** — used often — sits right after Accordion instead of
buried behind "...". (Divider still opens an empty edit dialog on insert even though it has nothing to
configure; looked for a clean documented fix and didn't find one worth shipping blind — see `RUNBOOK.md`.)

**Real snag hit along the way, not a code bug:** after the migration, the live post kept showing the *old*
gallery shape for several minutes despite the write having genuinely gone through (confirmed directly against
the API). Traced to `.next`'s on-disk fetch cache surviving a `next build` run from earlier in the session —
deleting the whole `.next` directory (not just `.next/cache`) and restarting fixed it immediately. Worth
knowing for next time this happens.

---

## 2026-08-04 (continued) — Instagram embeds, and the carousel rebuilt on Embla

Two requests handled together: an Instagram post embed block for the post editor, and a rebuild of the
existing image carousel/slideshow on [Embla Carousel](https://github.com/davidjerleke/embla-carousel), which
Asher pointed at directly as "a simple elegant one to use."

**Instagram embed** — new `instagramEmbed` block type in the post body editor: paste a post URL, it renders
using Instagram's own free `embed.js` (a `<blockquote>` that Instagram's script hydrates into the real card —
photo, caption, account, like count, a link back to the post). Worth being upfront about a limit: this does
*not* render an actual scrollable comment thread — Instagram's free embed doesn't expose one. Getting a real
comment thread would need Meta's Graph API (token-gated, requires app review), which felt like the wrong
tradeoff for one post block. Verified the schema compiles cleanly in Studio and the block
renders on a real post page; couldn't fully verify `embed.js`'s hydration itself from this sandbox (it's a
live external script), so that's worth a glance on the real site the first time it's used.

**Carousel/slideshow rebuilt on Embla** — `embla-carousel-react` was already an installed dependency
(pulled in transitively by shadcn/ui), so this added just one new package, `embla-carousel-autoplay`, for the
slideshow's auto-advance. Replaces the old hand-rolled `useState` index + `setInterval` + manual touch-delta
swipe detection with Embla's own scroll engine — same look and controls (dot indicators, chevron buttons,
per-image captions, pause on hover), but touch/drag swiping is now Embla's native behavior instead of a
40px-threshold heuristic. Verified live against a real post with a multi-image gallery
(`christmas-2015-the-quest-a-christmas-adventure`): clicking Next correctly advanced the image and moved the
active dot.

---

## 2026-08-04 (continued) — Editorial calendar: free drag-and-drop scheduling

Asher asked for a drag-and-drop editorial calendar but flagged upfront that Sanity's own scheduling might be
a paid feature — confirmed before building anything: Sanity's native Schedule Publishing is indeed gated
behind their paid Growth plan ($15/seat/month). Sidestepped entirely by building it the same way as every
other tool this session — a plain custom Studio tool patching a normal field, free on every tier.

**Studio → Calendar** — a drag-and-drop month grid. Published posts show on their `publishedAt` date;
unpublished drafts with a new `scheduledPublishAt` field show (differently styled) on that date instead.
Dragging a card to a new day patches the relevant date, keeping the original time-of-day. Native HTML5
drag-and-drop, no new dependency.

**Auto-publishing is also free** — a daily Vercel Cron, same pattern as the two existing crons. Vercel's
Hobby plan caps cron frequency at once per day and doesn't guarantee an exact minute within that hour
(checked against Vercel's own docs) — so "scheduled for the 5th" genuinely means "goes live sometime that
day," documented directly on the field rather than promising precision the free tier can't deliver.

**A real bug surfaced along the way, unrelated to anything just built:** this Sanity API version's default
query perspective silently excludes `drafts.*` documents from results entirely, even an exact `_id` match —
found because the cron's first live test found and published nothing despite a genuinely due draft existing.
Fixed with an explicit `perspective: 'raw'` option on just the specific queries that need to see drafts,
passed per-call rather than changed on the shared client, so nothing else in the project is affected by it.

Verified end to end against live data: a real unpublished draft with a past-due `scheduledPublishAt` was
genuinely auto-published by the real cron endpoint — draft deleted, published document created, `publishedAt`
correctly backdated to the scheduled time. The calendar's own queries and drag-move logic were verified
separately, including moving a real published post's date by exactly one day and reverting it. All test data
cleaned up afterward.

---

## 2026-08-04 (continued) — Hotfix: broken Studio schema (imageAssetAlt)

Asher reported live Studio (asheraw.com/studio) failing to compile entirely — a real regression from the
media-library alt-text work shipped earlier today. `imageAssetAlt`'s `asset` field was a `reference` typed
`to: [{type: 'sanity.imageAsset'}]`, but a reference's `to` array has to name a type from this project's own
schema; `sanity.imageAsset` is a system type, not a valid target there.

Fixed by switching `asset` (a reference) to `assetId` (a plain string storing the asset's own `_id`) — the
field is `readOnly` and only ever set programmatically by `MediaLibraryTool.tsx`, never through Sanity's own
reference-picker UI, so a real reference was never actually needed. Updated the one write site and the three
GROQ queries that read it to match. Pushed immediately as its own commit, ahead of the in-progress editorial
calendar work, since a broken Studio blocks all content editing.

---

## 2026-08-04 (continued) — PLAY architecture (Phase 4): per-post interactive presentation

The biggest remaining phase from the ACE spec — and a genuinely different thing from what "PLAY" already
meant on this site. The homepage's 3D world is one fixed experience; the spec's PLAY is a *per-post*,
editor-configurable interactive presentation, built from an approved registry of component types with
structured configuration data — never arbitrary code in Sanity. Asked what the first registered component
type should actually be rather than guessing at a creative direction; picked "minimal architecture + one
simple component" to prove the pattern properly before investing in more.

**The registry, for real.** New "PLAY mode" section on posts: enabled/mobile-availability toggles, and a
`presentation` array capped at exactly one item — the registry slot itself. Adding a second component type
later means registering another array member, not restructuring anything.

**First component: Key Moments.** A click-through carousel of a post's own pull quotes — keyboard, click, and
swipe navigation, a progress indicator, an optional intro line. Nicely reuses today's earlier pull-quote AI
suggestions: draft them with "Suggest SEO & Excerpt," paste them straight into Key Moments. New route
`/blog/[slug]/play`, linked from a small entry-point button on the real post.

**Mobile disabling is genuinely server-aware**, not client-side viewport sniffing — checked from the
request's own User-Agent header before anything is sent, both for the redirect-away-if-disabled behavior and
for whether the entry-point button shows at all. The PLAY page sets `noindex` plus a canonical pointing back
at the real post — "the canonical version always wins, alternatives are derivatives, never rivals," straight
from the spec.

Verified with a real Playwright browser against the live site, not just curl: the entry-point link, the
intro screen, real click-through navigation with captions and progress-dot state, the mobile-UA redirect
firing in an actual browser navigation, and the noindex/canonical tags — all against a real test post,
cleaned up afterward. The screenshot step caught a real bug curl alone couldn't have: the page's own header
bar was rendering underneath the site's fixed global header instead of below it — fixed before shipping.

---

## 2026-08-04 (continued) — AI Workspace: alternative headlines, pull quotes, FAQ suggestions — Phase 8 closed

The last named gap in Phase 8. Extends the existing **Suggest SEO & Excerpt** dialog rather than adding
another button — these are the same shape of thing (AI-drafted options, reviewed before anything happens) as
what's already there.

**Alternative headlines** patch the post's real title directly, same one-click pattern as SEO title/excerpt.
**Pull quotes** and **FAQ suggestions** copy to the clipboard instead — neither maps to a single field: a pull
quote goes wherever the writer decides to place it in the body, and there's no FAQ section on posts to write
into. Pull quotes are constrained to be exact substrings of the post's own content, never invented — a "pull
quote" that isn't actually in the post would be a fabricated quote attributed to it.

With this, image-prompt drafting (Social Images), the Distribution dashboard, and this all together close out
Phase 8 (AI Workspace) from the ACE spec.

Verified against the real Gemini API: real post content produced sensible alternative headlines and FAQs, and
confirmed both generated pull quotes were exact substrings of the source content before cleaning up.

---

## 2026-08-04 (continued) — AI Workspace: Distribution dashboard (Tier 1 + Tier 2)

Closes out most of Phase 8. Ties together three things that were each already tracked separately — whether a
post has drafted social copy (AI Output Log), how many times it's actually been shared (`shareLog`), and now
a place to log engagement by hand — into one per-post view: **Studio → Distribution**, replacing the plain
Social Shares list rather than sitting alongside it.

This is the ACE spec's own two-tier "distribution dashboard": **Tier 1** (drafted-copy status + share counts
+ open-post, together in one place) and **Tier 2** (a manual engagement log). Deliberately not automated
engagement pulled from X/Facebook/LinkedIn's own APIs — `ACE_MASTER_SPEC.md` is explicit that isn't worth the
ongoing fees/OAuth/platform churn for a solo creator, so Tier 2 here is exactly what the spec actually asks
for: a manual note ("got 3 replies on LinkedIn"), not a platform integration. Notes live on a new
`engagementNotes` array on `shareLogType.ts`, created on demand the first time a note's added for a post
that's never been shared yet.

Also surfaces basic AI usage visibility (calls this month, all-time by feature) right in the same dashboard's
header — the spec's cost/usage-controls item, scoped to what actually matters on Gemini's free tier: call
counts, not a dollar figure.

Verified against live data: the "add note" flow tested against a real post with no prior share record,
confirmed it saved correctly, and the drafted-social-copy correlation checked against real AI Output Log
data — then the test note was removed.

---

## 2026-08-04 (continued) — Three small ACE-spec gaps: library alt text, link-target override, snippet versioning

**Media library alt text.** New `imageAssetAlt` companion document — Sanity's own image asset type can't be
extended with custom fields, so this is a separate one, one per image, editable right in Studio → Media. A
post's own alt text always wins when it's actually written; the library default only fills the gap when a
post's Featured Image has none. Scoped deliberately to Featured Image, not every image inserted into a post
body — true inheritance everywhere would mean touching every image-consuming field across the whole schema,
well past what "small" meant.

**Link-target override.** External links already opened in a new tab by default (confirmed, not new) — added
the missing per-link "open in the same tab instead" override, off by default, for the rare case a writer
wants one to replace the current page.

**Snippet versioning/rollback.** Checked Sanity's history/transactions API directly and confirmed full
document history is retained back to the project's earliest documents — Sanity's own built-in Studio history
panel already covers this for every document type, snippets included. No custom code needed; documented in
RUNBOOK.md instead of building redundant infrastructure.

Verified the alt-text fallback against real live data: confirmed a post's own alt text takes priority when
set, and the library default only activates when a post's alt is genuinely absent — tested both states
explicitly against a real post, then cleaned up.

---

## 2026-08-04 (continued) — Social Images (Phase 7): focal-point crops, platform previews, branded cards, DreamLab prompts

Ran a fresh audit of `ACE_PRD.md`/`ACE_MASTER_SPEC.md` against everything actually shipped, to find genuinely
open work beyond the informal roadmap. Asher picked Social Images from what turned up.

**A real, previously-invisible bug, found first.** Every image crop site-wide (OG images, post cards, related
posts, author avatars, structured data) used Sanity's default center-crop mode — even though every image
field has had focal-point/hotspot controls in Studio's editor all along. `.crop("focalpoint")` was never
actually called anywhere, so any focal point Asher set was silently ignored. Fixed everywhere at once.

**Crop previews.** Studio's SEO Preview tab now also shows Square (1:1) and Vertical (4:5) previews next to
the existing landscape one — nothing publishes to those automatically, but they're there to check a crop
before pasting an image manually into another platform's own composer.

**Branded social cards.** New "Use branded social card" toggle per post, off by default. When on,
`/api/og/[slug]` generates a title/category/author card (real brand type and colors, not the photo) used for
sharing instead — a small, controlled template, not a design editor.

**DreamLab workflow.** New "Suggest Image Prompt" action on posts — drafts two AI image-generation concepts
from the post's own content to paste into Canva DreamLab (or any generator) by hand. Deliberately not an
automated Canva integration, per the spec's own explicit guidance not to automate a sub-one-minute manual
step without a stable official API.

Verified against live production content: the focal-point fix confirmed via the real rendered `og:image` URL
now carrying `crop=focalpoint`. The branded card was checked against two real posts (with and without a
category) — correct title, author, and real Playfair Display rendering both times. The image-prompt action
ran against real post content end to end, producing two real usable prompts and a correct log entry, then
cleaned up. Also surfaced and confirmed (not new, not a regression): raw script-driven Sanity writes don't
reliably show up live through the dev server's own caching within the same session — reproduced identically
with an unrelated, long-standing field, so it's a pre-existing dev-only characteristic, not something this
work introduced. The underlying data and toggle logic were confirmed correct independently of it.

---

## 2026-08-04 (continued) — Link Management: broken-link checker, monitoring, affiliate registry

Closes out the last open piece of Phase 3 (SEO & Machine Readability) — three related roadmap items (a
broken-link checker, external-link monitoring, an affiliate-link registry) built together since they share
the same underlying question: what URLs does the site's own content point to, and are they still good.

**Studio → Link Checker** (new top-nav tool) scans every post and reusable snippet's own rich text for links,
checks each one live, and groups results into **Broken** / **Affiliate links** / **Everything else**. Results
persist as `linkCheck` documents — a browsable record between runs, not a one-off report. Re-running upserts
by URL rather than piling up duplicates, and a URL removed from every post/snippet it used to appear in gets
cleaned up automatically. A weekly cron re-runs the same check without Asher needing to remember to — that's
what makes this monitoring, not just an on-demand audit.

**Affiliate links, made real.** New "Affiliate link" annotation in the post editor, separate from the plain
URL one, so it's unambiguous while writing which links are affiliate. Renders with `rel="sponsored"`
automatically (Google's recommended rel for paid links) and any post using one now shows a disclosure banner
automatically — a writer can't forget to add the disclosure on one post but not another, since it's derived
from the content itself rather than a separate step. Not an FTC/US-specific concern (Asher's Singapore-based)
— Singapore's own ASAS/SCAP advertising standards expect sponsored content to be identifiable, and affiliate
programs like Amazon Associates require the disclosure contractually regardless of where the affiliate is
based, so the practice still holds even though the specific "FTC" citation wouldn't.

Verified against real production content before shipping: a live run found all 27 real links across existing
posts and snippets, correctly attributed to their source, and caught one genuinely broken link (a Reuters
article now returning 401 — a real find, not a test artifact). Re-ran to confirm the upsert logic (stable
document count, no duplicates) and that `brokenSince` persists across runs instead of resetting each time.
Verified the affiliate path end-to-end with a temporary test post — correct affiliate flag, correct source
attribution, correct cleanup once the test post was deleted.

---

## 2026-08-04 (continued) — Contact Submissions: text clipping actually fixed, table polished

The earlier fix for clipped Name/Email/Subject text (wrapping Sanity UI's `Text` in an `overflow:hidden` div)
turned out not to actually work — Asher's follow-up screenshot still showed dots missing from i's and
descenders cut off g's. Root cause: `Text` renders its children inside its own nested box, so a *parent's*
`overflow:hidden` doesn't reliably ellipsize a grandchild's text — it just clips a few pixels off the top and
bottom of the glyphs instead of truncating sideways. Fixed for real this time by dropping `Text` entirely for
those three cells and using a plain element that owns both the text and the overflow style directly, which is
the only way this is reliably correct in CSS.

Also asked for: general UI polish, since the table felt clunky. Unhandled rows now get a subtle left-border
accent instead of blending in with handled ones, rows highlight on hover for better click affordance, and the
loud red "Delete" text button became a small icon-only trash button so it doesn't visually compete with the
Handled checkbox for attention.

---

## 2026-08-04 (continued) — Internal post links were already built — just invisible

Asher asked whether blog post links could search for another post instead of only taking a raw URL. Turns
out that was already built (2026-07-30) — a second "Internal link (post)" option sits right next to the
plain URL one in the link toolbar. It just wasn't visible: neither annotation had an icon set, so Sanity's
editor fell back to the same generic link icon for both, making two buttons look like one.

Fixed by giving each its own icon (`External URL` / `Internal link (post)`), so the option Asher was looking
for is now actually discoverable instead of silently hiding next to the one he already knew about.

---

## 2026-08-04 (continued) — 404 Hits: Pending / Ignored / Actioned accordions

Asher wanted the 404 list grouped instead of flat — a section for new/pending paths, a separate one for
paths he's deliberately decided to leave alone, and one for paths he's already dealt with.

The single "Actioned" checkbox is now a 3-way **status** (pending/ignored/actioned) on `notFoundHitType`, and
the tool groups rows into three collapsible sections instead of one flat list. Pending starts open (it's the
one that actually needs a look); Ignored and Actioned start collapsed. "Ignored" didn't exist before — there
was no way to record "I looked and decided it's not worth doing anything about" separately from "I dealt
with it," so both got lumped into the same checkbox. Each row's status is now a small dropdown; creating a
redirect from a row still moves it straight to Actioned automatically.

Migrated all 10 existing live 404 hit documents from the old `actioned` boolean to the new `status` field
before shipping — `actioned: true` became `"actioned"`, everything else became `"pending"` — and verified
every one read back correctly afterward.

---

## 2026-08-04 (continued) — Contact Submissions: fixed clipped text, added a message preview

The "unreadable" text Asher reported turned out to be real, just not a strikethrough — the Name/Email/Subject
cells were only showing the *bottom half* of each letter. Cause: `overflow`/`text-overflow`/`white-space`
were applied directly on Sanity UI's `Text` component, which clipped its own internal line box rather than
just truncating sideways. Fixed by moving that truncation onto a plain wrapping `<div>` instead, letting
`Text` render at its natural, unclipped height inside it.

Also asked for: a preview of the message body under each row (250 characters) so reading through submissions
needs fewer clicks — previously the message was hidden entirely until a row was expanded. Now a preview
always shows; the full message (and phone/notification-email status) is still one click away for anything
longer.

---

## 2026-08-04 (continued) — Found and fixed the real cause of a "duplicate" contact submission

Asher spotted two identical Contact Submissions with the same content and, once the table started showing
time too, the same minute — asked why, wanting to know if it was a true double-entry.

It was, and the cause was a real bug: the contact form saves to Sanity *before* attempting the notification
email, but if that email step failed (or Resend just wasn't configured), the response still told the
*visitor* `success: false`. That showed a genuine "Message failed to send" screen with a "Try the form again"
button — and clicking it resubmitted a message that had already gone through, creating an actual duplicate.
The test message content itself ("Testing this form to see if it captures all fields") matches this exactly.

Fixed at the source: `/api/contact` now only reports failure to the visitor if their message genuinely wasn't
captured. An email-notification gap is Asher's own concern, already visible per-submission in Studio →
Contact Submissions (`emailSent`/`emailError`) — not something a real visitor should ever be prompted to
"fix" by resubmitting.

Also checked and ruled out along the way: the send button disables correctly while submitting, and the
browser's own implicit-Enter-submission is blocked by that same disabled state — so this wasn't a
double-click/double-Enter issue, it was specifically the false "failure" inviting a real, intentional retry.

---

## 2026-08-04 (continued) — Legacy `.html` URLs now redirect automatically, site-wide

Asher spotted `/blog/how-i-lost-my-writing-home-for-13-years.html` 404ing right next to the real, working
post at the same path minus `.html` — a leftover from the pre-migration site's URL structure.

Since this app never serves any route ending in `.html`, `middleware.ts` now strips a trailing `.html` from
any path and 301-redirects to the same path without it, unconditionally — one rule instead of a Redirect
document per old post. Covers this one and every other `.html` link still floating around from the old site
(old bookmarks, old search results, old backlinks), not just the one that happened to get reported.

Verified locally with real requests before shipping: the reported `.html` URL 301s to the correct working
post (confirmed 200 on the target), an unrelated path that was never real still 404s untouched, and a
made-up `.html` path correctly redirects then 404s rather than silently fabricating a page.

---

## 2026-08-04 (continued) — 404 Hits: turn a broken link into a redirect inline

Asher noticed fixing a 404 meant leaving **Studio → 404 Hits**, copying the broken path over to **Structure →
Redirects** by hand, and switching back — asked if that could happen without the back-and-forth, plus a way
to search for the right destination instead of typing it from memory.

**Create redirect, right on the row.** Each 404 hit now has a **Create redirect** button that opens an inline
form: the broken path pre-filled as "From," a destination search box, and the existing Permanent (301)
toggle — no navigating away from 404 Hits at all. Creating it writes a real `redirect` document, so it shows
up under Structure → Redirects exactly like one created by hand, and the 404 hit is automatically marked
Actioned.

**Search, not memory.** The destination field searches every existing post, category, author page, and the
site's static pages (Home, Blog, Connect, Privacy) as you type — picking one fills in the exact real path, so
a typo can't quietly create a *second* broken link. Typing a path or full URL directly still works too, for
anything not in that list (an external link, or a path that doesn't exist as a page). Also checks for an
already-existing redirect from that same path before creating a new one, so two redirects can't silently
collide.

Verified against the live dataset before shipping: real posts/categories/authors all appeared as searchable
options, a real 404 hit was turned into a real redirect (showed up correctly filtered under Structure →
Redirects), the hit was auto-marked actioned, and the duplicate-from check correctly blocked a second attempt
— then all test documents were deleted.

---

## 2026-08-04 (continued) — Contact Submissions: table view, live edit, delete

Asher asked for the Contact Submissions list in Studio to become a proper table, with a Handled checkbox and
a way to delete, and pointed out it doesn't need a draft/publish step since replies never happen from inside
Studio itself.

**Table, not a document list.** New top-nav Studio tool (**Studio → Contact Submissions**, replacing the old
sidebar entry) showing every submission as a real table — date, name, email, subject, a Handled checkbox,
and a delete button as columns. Click a row to expand the full message, phone number, and notification-email
status inline, instead of opening a separate document.

**No more draft/publish.** The schema now uses Sanity's `liveEdit` option, so ticking Handled saves instantly
— no separate Publish step, since there was never anything here worth reviewing before it "goes live."
First use of `liveEdit` in this codebase; a good fit specifically because this data is operational record-
keeping, not editorial content.

**Delete, with a confirmation step.** A two-step "Delete → Yes, delete forever" pattern (same one Comments
moderation already uses) — no accidental one-click deletes, and no soft-delete/trash system either, since
nothing here needs to be recovered later.

The floating "N contact messages need a reply" badge now links straight to the new tool.

Verified against the live dataset before shipping: created a real submission, confirmed no `drafts.` copy
was created (liveEdit working), patched Handled, ran the table's exact query, ran the badge's pending-count
query, then deleted it — all as expected — before removing the test document.

---

## 2026-08-04 (continued) — AI Workspace, expanded: shared voice + review queue

The other two-thirds of "AI Workspace, expanded" — Asher asked for both after Draft Social Copy landed
earlier the same day.

**One voice, not three copies of it.** New "Voice & tone" field in Studio → AI Suggestion Settings, shared by
every AI feature (SEO suggestions and social copy so far, anything added later too) — edit it once, every
feature sounds more consistently like Asher instead of needing the same tweak pasted into two or three
separate prompts. The existing SEO instructions field stays, renamed for clarity to make clear it's the
task rules (lengths, what to produce), not the voice.

**Review queue.** Every AI suggestion — SEO or social — now leaves a record in **Studio → AI Output Log**:
which feature, which post, exactly what was suggested, and whether any of it actually got used. Not a queue
that blocks anything, just visibility — "used" tracking is genuinely granular (a timestamped log of each
individual thing applied or copied, not just yes/no).

Verified against the real API and the live dataset before shipping: real suggestion calls confirmed to
create a log entry correctly, real "mark as used" calls confirmed to update it — then deleted the test
entries.

---

## 2026-08-04 — AI Workspace, expanded: social copy drafting

"AI Workspace, expanded" was marked Large effort on the roadmap and genuinely covers a few different things
(tone controls, a review queue, more drafting help) — asked which mattered most before building blind.
Asher picked drafting help.

**Draft Social Copy**, a new button on any post right next to the existing "Suggest SEO & Excerpt," same
shape: drafts 2 caption options each for X, LinkedIn, and Facebook from the post's own content via Gemini,
shown for review with a one-click Copy per option — nothing posts anywhere or writes to the document on its
own. Deliberately author-facing (drafting Asher's *own* announcement post) rather than reader-facing (the
existing `ShareBar` is for readers resharing something that already exists) — two different jobs that
happened to sound similar. The generated captions never include the raw URL, since X/LinkedIn/Facebook all
build their own link-preview card from a pasted link anyway.

Verified against the real Gemini API before shipping: a real post's title/content produced two genuinely
usable, on-voice drafts per platform, correctly under X's character cap, no hashtags, no invented details.

Tone/voice controls and a review/output log stay on the roadmap as separate, still-unbuilt items — this was
one deliberate slice of "AI Workspace," not the whole thing.

---

## 2026-08-03 (continued) — Three items off the roadmap: contact badge, blog pagination, social shares

Working down the effort/value list from the previous session in order: fastest first, then the two Asher
picked next. Newsletter/Kit stays parked until there's a lead magnet, per Asher's own call.

**Contact Submissions badge.** Same always-visible floating pill already built for pending comments,
generalized to Contact Submissions — counts `handled != true` (the field `contactSubmissionType.ts` already
tracked by hand). Stacked above the comments badge so both can show at once without overlapping. Verified
the GROQ query directly against live data (2 pending) before shipping. Removed from `IDEAS.md` — it was
logged there as "revisit once there's a real submission to test against," and now there was one.

**Blog pagination, infinite-scroll style.** `/blog` no longer loads all 15 published posts at once — first
page shows 8, a "Load more" button (also auto-triggered by scroll via IntersectionObserver, so it feels
seamless without losing a real keyboard-focusable control) fetches the rest from a new `/api/blog/posts`.
Search stays unaffected: it already ran off its own lightweight index, now made deliberately independent of
pagination too, so it can still find a post that hasn't been scrolled into view yet — verified by searching
for post #14 of 15 without ever clicking "Load more." RSS/sitemap/category/author/tag pages untouched, they
still want every post at once. Removed the pagination half of its `IDEAS.md` entry; kept the separate,
still-deferred "AI avatar recommends what to read" idea it was filed alongside.

**Social Shares.** Asher's ask was a "social distribution dashboard" — scoped deliberately to what's
actually achievable and worth building for a solo site: which posts get shared, and to which platform.
Every `ShareBar.tsx` click now also POSTs to `/api/track-share`, incrementing a per-post, per-platform tally
in Sanity (no IP, no visitor-identifying data) — same "has to work regardless of analytics consent"
reasoning as the cookie-consent counts, since GA only sees clicks from visitors who already accepted. View
it in **Studio → Social Shares**, sorted most-shared-first. Deliberately does *not* pull replies/likes back
from X/Facebook/LinkedIn's own APIs — `ACE_MASTER_SPEC.md` explicitly flags that kind of automated
multi-platform engagement tracking as not worth the ongoing API/OAuth overhead for a solo creator, and this
sticks to that guidance rather than quietly overriding it. Verified against the live dataset (real X-share
and Copy Link clicks through an actual post page, confirmed the document updated correctly), then deleted
the test document.

`/privacy` gets two more disclosure lines for the two new anonymous tallies (accept/decline counts, share
counts) — same treatment as everything else automatically collected on that page.

---

## 2026-08-03 — Cookie consent accept/decline counts

Asher asked for this "via GA" — the honest half-answer: Google Analytics structurally can't see a Decline
click. GTM only loads after a visitor clicks Accept (that's the whole point of the consent gate in
`Analytics.tsx`), so there is no tag anywhere inside GA that a Decline click could ever reach — sending it to
GA specifically would mean loading GA for someone who just said not to.

Built the actual answer instead: a first-party count, same shape as the existing 404-hit tracking. Both
Accept and Decline now log to a new Sanity singleton (`consentLog`) via `/api/track-consent` — no IP, no
cookie, just a running tally plus a capped recent-choices log, visible in **Studio → Cookie Consent Log** as
"142 accepted · 38 declined · 79% accept rate." Accept also gets a bonus real GA event (`cookie_consent`) via
the existing `track()` dataLayer helper, for the half of this that GA actually can see. `/privacy` updated
with one more line disclosing the anonymous tally, for the same reason every other automatically-collected
data point on that page is spelled out rather than glossed over.

Verified end-to-end against the live dataset before shipping (one real accept, one real decline through the
actual banner, confirmed the Sanity document updated correctly), then reset the counts back to zero so the
log starts clean from real visitors instead of that test.

---

## 2026-08-02 (continued once more) — Microsoft Clarity wiring (heatmaps/session recordings), not live yet

Added the Clarity loader script to `Analytics.tsx`, right alongside Google Tag Manager and behind the exact
same consent gate -- it never loads before a visitor clicks "Accept" on the cookie banner. **Not actually
turned on yet**: it needs a real Clarity Project ID (free, from clarity.microsoft.com), and stays silently off
until one is filled in. See RUNBOOK.md's new "Microsoft Clarity" section for the 3-step setup once Asher has
an ID.

Also updated `/privacy` and the cookie-consent banner to mention Clarity by name, ahead of it actually going
live -- same as the newsletter section added earlier today, written in advance rather than after the fact.
Clarity masks the contents of text fields (comment box, contact form) by default, which the policy now says
explicitly.

---

## 2026-08-02 (continued) — Privacy policy covers a future newsletter; rich text gets a theme-safe color mark

**Privacy policy: added a section for a newsletter that doesn't exist yet.** Asher's concern: he might build
an email list down the line, and there's a common misconception worth heading off in writing before it comes
up for real — a sponsor paying to have their message included in an email is not the same thing as selling
subscribers' personal information, and people conflate the two constantly. New "If a newsletter launches"
section, written in future tense: joining would be opt-in only (never auto-added from a comment or the
contact form), every issue would carry a one-click unsubscribe, and the sponsorship/data-selling distinction
is spelled out plainly. Matching bullet added to the top TL;DR. Written now so the policy doesn't need a
rewrite the day a newsletter actually ships.

**Rich text: a color mark that can't produce illegible text.** Asher's ask, with the trap named up front: a
color that reads fine in dark mode (his example — yellow) can go illegible the moment a reader switches to
light mode, and an ordinary hex/RGB color picker hands a writer exactly that footgun. The fix isn't a
smarter picker — it's not offering a hex value in the first place. New "Text color" option in the post
editor: a closed set of 8 named colors (red, orange, yellow, green, teal, blue, purple, pink), each name
resolving to a CSS variable with one shade tuned for dark mode and a separately-chosen shade for light mode.
Picking "Yellow" means a bright yellow at night and a dark mustard gold in daylight, automatically — the
site controls both shades, the writer only ever picks a name. Same pattern the theme already used for its
own colors (spotlight, destructive, etc.), just extended with 8 more names. The color list lives in one
place (`src/lib/textColors.ts`) shared by the Studio dropdown and the frontend renderer, so they can't drift
out of sync with each other.

**Also confirmed, not built:** strikethrough, bullet/numbered lists, blockquotes, inline code, bold, italic, and
underline were all already in place on both the editor and the live site — checked the actual schema and
renderer directly rather than assuming, since Asher wasn't sure offhand what was already there.

---

## 2026-08-02 (continued) — Privacy Policy page

New `/privacy` page, linked from the site footer (every page) and the cookie-consent banner. Per Asher's
request: a "30-second version" of bullet points at the top (since realistically nobody reads a full privacy
policy), then the complete, detailed version below it. Covers, accurately, what this site actually does today
— what's collected through the contact form and comments, what IP addresses are used for (spam detection
only), that analytics stays off until the cookie banner is explicitly accepted, and every third-party service
involved (Sanity, Resend, Vercel, Google Analytics/Tag Manager). Hand-written and versioned in code rather
than editable from Studio — legal text changing without a second pair of eyes reviewing it first isn't a risk
worth taking for how rarely it needs to change. Added to the sitemap at low priority; not excluded from search
indexing.

---

## 2026-08-02 — Image carousels/slideshows in post bodies, and a Share bar

**Image Carousel / Slideshow block.** A new insertable block in the post editor, alongside the existing plain
Image block: pick 2+ photos and a layout —
- **Carousel:** sits still, the reader clicks arrows or dots (or swipes on mobile) to move through it.
- **Slideshow:** the same controls, plus an auto-advance timer (5s) that pauses the moment a reader hovers or
  touches it, so it never yanks an image away mid-look.

Same alt text + optional caption per image as the regular Image block. Renders as `ImageCarousel.tsx`, wired
into the Portable Text renderer as a new `imageGallery` type (`blockContentType.ts` / `portableTextComponents.tsx`)
— no changes needed to the post GROQ query, since the body field is already fetched as a full spread.

**Share bar.** Every post page now has a "Share this post" row (above the comment section): X, Facebook,
LinkedIn, WhatsApp, and Email links (each opens that platform's own share dialog with the post's title and
URL prefilled), a Copy Link button with a checkmark confirmation, and — on devices that support it (mostly
mobile) — a native Share button that opens the OS's own share sheet. No third-party embed or SDK; every link
is just that platform's own public share-intent URL. New component: `ShareBar.tsx`.

---

## 2026-07-31 (continued) — PLAY mode: Asher's real face on the 2D character, then a modeled 3D head

**2D character: swapped the drawn face for Asher's real photo, then fixed it twice more on feedback.**
- First pass just clipped his existing 8-bit avatar image into the head circle — Asher's read: "that's not
  right, that's just swapping in the image." He wanted the yellow background actually removed, the face
  enlarged, and the body's style to follow the head's.
- Rebuilt: cropped a proper close-up from one of his reference photos (chroma-keyed to transparent), enlarged
  the head, and ran the whole body through a low-res offscreen buffer to give it a matching chunky pixel-art
  look. Asher's read this time: it looked blurry, not stylized — the buffer trick that pixelated the body was
  also degrading the face, and a 15px-radius circle doesn't have enough buffer pixels to keep a photo legible.
- Fixed by decoupling the two: the body still renders through the pixel-art buffer, but the face is drawn
  separately afterward, at full resolution, directly onto the main canvas.
- Then: **the body itself stopped being pixelated too**, on a third round of feedback — Asher said the whole
  character used to look sharper, pixelation included. Removed the offscreen-buffer technique entirely; body
  is smooth full-resolution canvas drawing again, same as before any of this started. Also removed two small
  "ear" circles that were leftover from the old drawn-face era — against a real photo they just read as two
  stray dots beside the head.
- **Fixed a "walking backwards" illusion.** The character was mirroring the whole sprite (face included) to
  face left/right. A dead-on photo mirrored horizontally still looks like it's staring straight at the
  viewer either way — there's no profile to turn into — so the face flip contradicted the body's own turn and
  read as moonwalking. Now only the body/props/shirt mirror with direction of travel; the head stays upright
  and identical no matter which way the character's walking.

**3D character: tried the same real-photo approach, Asher rejected it, ended up modeling the head instead.**
- Built an isolated, unlinked preview page (`/dev/3d-face-test`, since removed) billboarding the same photo
  in front of a 3D head — a flat plane that always turns to face the camera, since a single photo has no
  back/side to show as a real 3D head rotates. Asher's call after seeing it: "doesn't work for me... can you
  model it?" — a clean rejection of the photo idea for 3D, not a request to iterate on the billboard.
- Removed the preview entirely and modeled a real 3D head instead: dark cap with a red brim, a "胡" badge
  (rendered onto a canvas texture at runtime so the browser's own CJK font renders it — no font asset
  needed for one glyph), and rectangular glasses replacing the old plain eye dots. The cap swaps for the
  graduation mortarboard at Philosophy instead of both showing at once ("two hats stacked").
  Note for whoever touches this next: the game's camera looks down at a steep angle (see `CameraRig`), so
  anything meant to be seen — like the cap badge — needs to face mostly *up*, not forward; a front-facing
  badge is invisible from this angle. The badge also has to sit clearly outside the crown sphere's own
  radius, not embedded in it, or the crown's own surface hides it completely (that was the first-pass bug).
- **Per-zone gear:** Studio headset enlarged and recoloured blue (was black-on-black against the also-black
  cap, essentially invisible; mic boom stays black). Magnifying glass hand-prop removed at "At a Glance";
  the trophy there pushed toward a shinier, more saturated gold with a `<Sparkles>` scatter for the
  champion-trophy feel (was reading as dull bronze). Open book added at Philosophy, held up in front of the
  chest, replacing a reading pose that previously had nothing actually in his hands.
- **Real bug fixed, unrelated to any of the above:** arms weren't swinging while walking manually
  (WASD/arrow keys) — only during click-to-walk. `isMoving` was being read straight off
  `charTarget !== null`, which manual movement never sets, so the walk-cycle animation never played for
  keyboard movement; arms just sat in whatever the current zone's idle pose was, popping between poses as
  the character passed through zones. Fixed with a proper `isMoving` state updated from the same condition
  that actually moves the character each frame.
- **Known, not fully solved:** held props (the new book, and the pre-existing phone at Contact) are
  positioned relative to the character's own body rotation, which turns to face the last direction of
  travel — not always toward the fixed-angle chase camera. Approaching a zone from certain directions can
  leave a prop partly hidden behind the character's own body. This is how every held prop in this file has
  always worked, not something newly introduced.

**Two more 3D fixes from Asher checking it live:**
- **The cap brim read as a red dot on the face ("looks like a red nose"), not a cap.** Moved it from the
  front to the back — a snapback now, and it clears the face entirely instead of needing to be shrunk further.
- **The floating cross at "The Heart" started disappearing on every step**, not just when leaving the zone —
  a direct side effect of the arm-swing bug fix above. The cross was gated on the same `!isMoving` condition
  as the hand-held props (book, phone), which never actually did anything before `isMoving` was fixed (manual
  movement never set it true, so the cross always showed, bug and all). Once `isMoving` started reflecting
  real movement, the cross — which isn't a hand prop and shouldn't have had that gate at all — started
  vanishing mid-stride. Removed the gate; it now shows purely off `zoneId`, same as the mortarboard/cap/
  headset.

## 2026-07-31

**Comments, extended.** Built on top of the Sanity-native comment system shipped the day before:
- **Nested replies + a way for Asher to actually respond.** The Studio moderation tool now has a Reply
  button on every comment. Typing a reply and posting it creates a linked comment, auto-approved (it's
  Asher's own words, not visitor content) and styled distinctly on the site — a spotlight-tinted card with
  an "Author" badge, indented under the comment it replies to. One level of nesting only; a reply to a reply
  isn't supported, by design.
- **Better empty state.** A post with no comments now reads "Start the Conversation" instead of a flat,
  slightly discouraging "0 Comments."
- **Comment counts on the blog listing.** Any post with at least one approved comment now shows a small
  speech-bubble icon and count on its card, linking straight to that post's comment section.

**Considered and explicitly deferred, logged here for a future revisit (Asher's own request):** a Figma-style
alternative was on the table — instead of a comment box at the bottom of the post, let readers highlight a
specific passage of text and leave a comment anchored right there. Recommended against, for three concrete
reasons rather than a vague "too complex":
1. **Mobile.** Selecting text on a phone already triggers the browser's own native selection handles and
   copy/paste menu — there's no clean, reliable way to also pop up a custom "add a comment" button on top of
   that without it feeling broken on at least some combination of browser/OS.
2. **Anchoring drifts.** A highlighted-text comment has to keep pointing at the exact span of text it was
   left on. Edit that paragraph later — fix a typo, rephrase a line — and the anchor either breaks, jumps to
   the wrong spot, or needs ongoing fuzzy-matching logic to relocate itself. That's new, permanent complexity
   for every future edit to older posts, not a one-time build cost.
3. **Wrong tool for a blog.** Inline annotation earns its keep on documents people are *jointly working on*
   (Figma, Notion, Google Docs) or crowdsourced annotation (Genius). A blog reader reacting to a finished,
   published piece is a different, better-served-by-threaded-comments use case — even Medium's own
   "highlight" feature is closer to private bookmarking/social sharing than a persistent comment thread.

**A lighter middle ground, if the underlying appeal (react to a specific passage) comes back up:**
"highlight to share" — select text, get a floating button that pre-fills a quote-and-link share (X,
WhatsApp, copy-link) for that exact passage. No persistent anchoring, no thread infrastructure, no fight with
mobile's native selection UI, since it's a one-shot action rather than something that has to keep pointing at
a specific span forever. Worth considering as a separate small feature alongside comments, not instead of
them, if this is still interesting later.

### Continued (same day — opened replies to everyone, real notifications, redesigned the moderation page)

**Replies, opened up.** Corrected from earlier the same day: replies aren't Asher-only. Anyone can reply to a
top-level comment now (still one level deep — no reply-to-a-reply, checked server-side too, not just hidden
in the UI), through the same moderation queue as any other comment. Asher's own replies from Studio are the
one exception — those still auto-approve and get the distinct spotlight styling, since they're not something
that needs moderating.

**The actual reason comments got missed: no notification.** Asher found out about real comments because a
friend told him directly, not because anything in Studio prompted him to look. The pending badge on the
Comments nav icon works, but only helps if you're already looking at Studio — it can't reach you. Fixed with
an email notification on every new comment or reply, reusing the exact same setup the contact form already
had (same inbox, same service) — no new configuration needed. Best-effort: the comment is always saved and
queued regardless of whether the email actually sends.

**The moderation page itself, redesigned.** Asher's read: functional, but hadn't had real UI/UX thought put
into it — fair, it hadn't. It was one long list mixing every post's comments together, a reply shown as a
muted "replying to ..." text reference instead of visually connected to what it replies to, and no way to
tell what was actually new since the last visit. Now: grouped by post, posts with something pending sorted
to the top, replies nested directly under the comment they answer, and a "New" tag on anything since the
last time the page was open *in that browser specifically* (doesn't sync across devices — a real limit,
noted directly in `RUNBOOK.md` rather than glossed over).

**Also fixed: the "Previewing a draft" banner that wouldn't go away.** Turned out to be exactly what it
looked like — a preview session with no real expiry, so once draft mode was switched on in a browser it
just never turned itself back off, showing the banner on every post regardless of whether it actually had
unpublished changes. Now expires automatically after 4 hours instead of lingering indefinitely.

**Started `IDEAS.md`** — a dedicated, ongoing "good to have, not now" list, separate from the actual phase
roadmap. First two entries: notifying a commenter by email when Asher replies (raised today — deferred over
a real spam-risk concern, not just "later"), and the Figma-style inline comments idea from earlier today,
moved here from a one-off chat mention so it has one durable home instead of being buried in a dated log
entry.

### Continued once more (comment count badge on the post page itself)

**Comment-count speech bubble, now also on the post page.** It already showed on blog listing cards; now the
same badge sits right next to "X min read" at the top of the post itself, and clicking it jumps straight down
to the comments. Pulled out into one shared `CommentCountBadge.tsx` component so both spots always match.

**Double-checked: the count already includes replies, not just top-level comments.** The GROQ query behind it
counts every *approved* comment that references the post — replies included, since a reply references the
post directly too, same as a top-level comment. If a badge looks low right after someone replies, the
near-certain reason is that the reply is still sitting in Studio's moderation queue — the badge, like the
comment section itself, only ever counts what's actually approved and visible.

### Continued yet again (related posts, print, search, and a redesigned reading bar)

**Related Reading**, at the bottom of a post: up to 3 other posts sharing a category or tag, ranked by how
much overlap there is rather than just recency. Nothing to configure — automatic from whatever categories
and tags a post already has, and simply doesn't show for a post that has neither.

**Printing a post** now prints cleanly: no header, footer, comments, related reading, or navigation, forced
to plain black-on-white no matter which theme the site's currently in, and an external link's actual
destination prints after the link text.

**Search**, on `/blog`: type a query, it opens a `site:asheraw.com`-restricted Google search in a new tab.
Per the PRD, no custom search index to build or maintain — Google already has the whole site indexed.

**The reading progress bar, rebuilt.** It was a thin line under the header; now it's a bottom bar in the same
style as the homepage's own progress bar — same walking-character mascot, same amber track — with
checkpoints automatically pulled from the post's own section headings (clickable, jump straight there) and a
small rotating line of encouragement that tracks how far through the post you actually are, ending in a
"You've finished it! Thanks~ Got any comments?" that links straight to the comments. Scroll suspiciously
fast and it swaps in a playful "slow down" nudge instead — built specifically not to misfire when *clicking*
an anchor link (this bar's own checkpoints included) triggers the site's smooth-scroll and covers a lot of
distance quickly in a way that would otherwise look identical to "reading too fast." Hidden while previewing
a draft, same as the bar it replaced.

### Hotfix (same day — blog posts were showing a server error)

Asher reported blog posts failing to load with a generic server error shortly after the batch above shipped.
Prime suspect: the new Related Reading query used a compound expression (`count(...) + count(...) desc`)
inside GROQ's `order()` — every *other* pattern in that query had precedent elsewhere in this codebase, that
one didn't, and it's the kind of thing that's easy to get subtly wrong without a live dataset to test against
(this sandbox can't reach Sanity's API to verify GROQ before it ships). Rewritten so the query itself only
filters and fetches up to 12 candidates in plain `order(publishedAt desc)`, and the actual overlap-ranking
(picking the top 3) now happens in plain JavaScript after the fetch — same end result, nothing left in the
query that isn't already a proven shape.

Also wrapped the related-posts fetch in a try/catch (a nice-to-have section failing should never take the
whole post down with it) and, more generally, added `src/app/(site)/error.tsx` — the site had *no* error
boundary anywhere before this, so any uncaught error on any page fell through to the blank generic crash
screen visitors saw. Now it shows a proper in-theme "Something went wrong" page with a working Try Again
button instead.

### Continued (reading bar timing + page order, per Asher's feedback after testing)

**The reading bar now waits to appear** until the reader has scrolled down a little (about 220px) instead of
being visible the instant the page loads, sitting over the title before there's any progress to actually
show. Same slide-up-from-the-bottom entrance the homepage's own bar already uses.

**Page order, after the post itself:** was body → tags → Related Reading → back-to-blog link → comments.
Now it's body → tags → **comments** → **Related Reading** → back-to-blog link — comments come right after
the post, and Related Reading moved to the very end, after the comment thread instead of before it.

### Continued (search now stays on-site)

**Search, reworked.** Asher pointed out the search box was sending readers to Google in a new tab for even a
simple title lookup — worse than it needed to be for a blog this size. Now it's instant and on-site: typing
filters the posts already loaded on `/blog` (by title, summary, tags, categories) and shows matches in a
dropdown you click straight to, no new tab, no page leave. A "search the wider web" link stays at the bottom
as a fallback — the on-site index only covers titles/summaries/tags, not full post bodies, so a query that
finds nothing on-site can still fall through to the old Google-restricted search. Nothing new to host or
maintain: it's built entirely from data the page was already fetching.

### Continued (per-channel RSS feeds)

Added `/blog/category/[slug]/rss.xml`, `/blog/tag/[tag]/rss.xml`, and `/blog/author/[slug]/rss.xml` alongside
the existing site-wide `/rss.xml` — a reader who only cares about one category, tag, or author can now
subscribe to just that. All four share one XML-building helper (`src/lib/rss.ts`) so they can't quietly drift
apart from each other. Also fixed a related, pre-existing gap while in there: several blog pages define their
own `alternates` without realizing that silently drops the feed link a parent layout had already set (Next.js
metadata doesn't deep-merge that field) — every blog page now re-declares its own feed link explicitly.

### Continued (series/collections and footnotes/citations, shelved)

That closed out the last of the phase gaps buildable without a real content-model decision. The two that
remained — series/collections and footnotes/citations — turned out to be about something different than they
read as in the spec: Asher's actual intent was publishing whole books on the site chapter by chapter (a
revised "Live Streaming for Coaches & Consultants," and eventually "Acting As Jesus"), not grouping blog
posts or sourcing essays. Neither book is ready to go up yet, so both are shelved rather than designed
against a guess — logged in `IDEAS.md` with the real context so this isn't reinvented from scratch later.

## 2026-07-31 (continued) — auditing what's left in Phase 2, then next-phase prep

Checked the full Phase 2 (STORY Frontend) list against what's actually built. Most of it was done; found and
fixed a few concrete, low-risk gaps:

- **Tag pages were missing from the sitemap.** They're indexable but had no way for a crawler to discover
  them without following every post's tag links. Fixed in `sitemap.ts`.
- **The breadcrumb structured data was a hardcoded stub** — one site-wide `BreadcrumbList` that always said
  just "Home," wrong on every other page. Replaced with a real per-page breadcrumb trail on `/blog`, a post,
  and the category/tag/author pages (`buildBreadcrumbSchema()`, `src/lib/structuredData.ts`).

Two other flagged items were discussed and explicitly not built:
- **Pagination on `/blog`.** Asher's preference is infinite/lazy-loading over classic pagination when the
  post count actually starts to matter — not urgent yet — with a bigger, explicitly experimental idea (an AI
  avatar asking readers what they want to read, tying into the spec's "Avatar Door" concept) floated for much
  later. Logged in `IDEAS.md`.
- **A web app manifest** (PWA install icon/name) — Asher's read: nobody's installing this site to their home
  screen, so this isn't worth the effort right now. Not built, not logged as a "later" idea — just skipped.

A third item, a "skip to content" accessibility link, was explained but not yet decided on — pending Asher's
go-ahead.

### Continued (reply-notification subscriptions, heading style cleanup, a scope question answered)

**Reply notifications, rebuilt as opt-in.** The blanket "email everyone when Asher replies" idea was deferred
back on 2026-07-30 over real spam-deliverability risk. Asher came back with a properly-scoped version instead:
a small, unchecked-by-default checkbox on every comment form ("email me if there's a reply to this"),
covering replies from *anyone* in the thread, not just Asher. Auto-expires after 30 days of no new activity
(extended another 30 days each time a real notification goes out, so an active conversation keeps its
subscribers subscribed), with a working one-click unsubscribe link in every email. The email itself is a
small styled HTML card built to push the reader back to the site rather than inviting a reply *to* the email
(`hello@asheraw.com` doesn't parse inbound mail). Full breakdown in `RUNBOOK.md`. This replaces and removes
the old "not now" entry in `IDEAS.md` — it's built now, just not the way it was first floated.

**Heading styles cleaned up.** "H1" is no longer offered as a body-text style in Studio — the post title is
the page's one real H1, multiple H1s per page isn't good practice, and there was never a real need for
authors to reach for it anyway. The remaining choices got friendlier labels too: **Header** (was H2),
**Subhead** (was H3), **Minor Heading** (was H4). Purely cosmetic under the hood — the actual stored style
values didn't change, so this touched zero already-written posts.

**Answered: is Site Settings supposed to only affect the homepage?** Not an error — Site Settings only ever
controls metadata (tab title, description, share image), never page content, and it *looks* homepage-only
because every blog page already sets its own specific metadata, leaving Site Settings as an unused fallback
there. Also answered the bigger question behind it — the homepage's actual content isn't in Sanity at all,
and that's staying that way on purpose: it's a bespoke, art-directed one-page site, not the kind of
frequently-changing, structurally-repeatable content a CMS is worth the overhead for. The blog is the
opposite of that, which is the real reason the two are built so differently.

### Hotfix (same day — the pending-comments badge wasn't actually visible)

Asher tested the Comments moderation page after two new comments came in and confirmed there was still no
visible signal in Studio's nav — he had to click into Comments to find out. Root cause: the badge built
earlier lived on the Comments tool's *icon*, but Sanity's navbar only renders that icon in narrow/overflow
contexts — at normal window widths it shows tool names as plain text instead, so the badge was never actually
shown where it mattered. Fixed with an independent, always-visible signal instead: a floating "N comments
need review" pill fixed to the bottom-right corner of every Studio screen, wired in through Studio's own
navbar extension point rather than depending on how an individual tool tab happens to render
(`CommentsNavbarBadge.tsx` + `StudioNavbar.tsx`, `sanity.config.ts`). Both this and the original tool-icon
badge now share one polling hook instead of two separate timers hitting the same query.

Also logged: a similar always-visible badge for unhandled Contact Submissions, once there's a real submission
to build and test it against (`IDEAS.md`).

### Continued (skip link, redirects, and the SEO Preview tab — starting Phase 3)

Closed out the last pending Phase 2 item and started Phase 3 (SEO & Machine Readability):

**Skip-to-content link.** The one accessibility gap flagged in the Phase 2 audit — a keyboard or
screen-reader user previously had to tab through the entire header on *every page* before reaching actual
content. Now the first focusable element on every page is an invisible "Skip to content" link that only
appears when it receives keyboard focus, jumping straight past the header. No visual impact for anyone using
a mouse or touch. `SkipToContentLink.tsx`.

**Redirect handling.** There was previously no mechanism at all for "old URL → new URL" — a renamed post's
slug just 404'd. New **Studio → Redirects**: add a from/to path (or full URL), toggle permanent (301) vs
temporary (302), done — no rebuild or redeploy needed. `src/middleware.ts` checks every request against the
current redirect list (cached ~60s) and redirects before Next.js even tries to match a route.

**SEO Preview tab.** Every post now has a second tab next to the normal Editor — an approximate Google
search-result preview and social-share-card mockup, live character-count guidance against the same limits
already used elsewhere (70/160), and the same "worth a look" checklist the pre-publish dialog shows (now
also catches a featured image with no alt text). Updates as the draft autosaves. This is the first piece of
Phase 3; the pre-publish checklist and "Suggest SEO & Excerpt" AI action already covered "intelligent
defaults" and "missing-field warnings" from the spec — this tab is specifically the "see it before it ships"
preview piece that was still missing. Asher's read: not core to his current workflow, but useful to have.

### Continued (double-checked: a failed comment doesn't get lost)

Asher asked directly: if someone fails the math check while leaving a comment, is their typed message gone?
Traced it through — no, it already wasn't: the form only clears on a *successful* submit, and nothing
unmounts on a failed one, so every field a visitor already typed just sits there untouched. The real gap was
that the UI never actually said so, leaving a visitor to just guess. Fixed by adding "your comment hasn't
been lost" straight into the math-check error message itself. Also cleaned up a stale RUNBOOK passage left
over from the earlier badge fix that still claimed the old (non-working) tool-icon badge was "confirmed
working."

### Continued (delete a comment, and a real anti-repeat-spam mechanism)

Asher asked for two things: an actual way to delete a comment (Reject only ever hid it, never removed it),
and whether spam could be reported "to Google or something." The honest answer on the second one: no, that's
not a real capability for a site this size, and a fake button that does nothing wouldn't be worth building.
What's real and now built:

- **Delete**, with an inline confirm step, permanently removes a comment. Deleting a top-level comment with
  replies doesn't cascade — the replies just quietly stop showing (nothing crashes), and the confirm text
  says so.
- **Mark as Spam**, separate from Reject: once anything is marked Spam, matching future submissions (same
  email, or the same IP if it's a real one) get auto-sent to spam status the moment they're created — still
  saved for the record, but never shown on the site, never counted as needing review, and skipped in the
  notification email too. Comment IP addresses are now captured at submission specifically to make this
  matching hold up better than email alone. Doesn't touch anything already posted — only blocks recurrence
  going forward.

### Continued (Trash instead of permanent delete, Edit, and a real formatting bug fixed)

Asher sent screenshots: a commenter's paragraph breaks showed up fine on the live site but as one run-on
block in Studio. Real bug, traced to the actual cause — the line breaks were always saved correctly; Studio's
Comments tool just wasn't displaying them (`@sanity/ui`'s `Text` collapses whitespace by default). One-line
fix, nothing was ever actually lost.

Also asked for: an editing option, and for Delete to work like a real trash can (recoverable, not instant).
Both built:

- **Edit** a comment's message in place, same inline pattern as Reply. Shows a small "edited" note next to
  the timestamp in Studio only — not surfaced publicly.
- **Delete reworked into Trash.** Trashing a comment hides it from the live site immediately but keeps the
  document — a new **Trash** view in the tool lists everything trashed, with **Restore** or **Delete
  Forever** (actually permanent, its own confirm step) for each. Anything left in Trash for 30 days gets
  auto-deleted by a new daily Vercel Cron Job (`/api/cron/purge-trash`) — needs a one-time `CRON_SECRET`
  environment variable set in Vercel before that part actually starts running (same shape as the
  `GEMINI_API_KEY` setup). Every place that decides whether a comment counts as "live" (the public fetch, both
  comment-count queries, the reply-notification eligibility check) was updated to also exclude trashed
  comments, not just the obvious one.

Small extra, per Asher: "Mark as Spam" no longer shows on a comment that's already been Approved.

### Continued (comments now nest 3 levels deep, and the reply-notification email got three small fixes)

Feedback from a reader: they wanted to respond to Asher's reply to their comment, which the original
one-level-deep design didn't allow. Extended to 3 levels (comment → reply → reply to that reply) on both the
live site and in Studio's Comments tool. The 3rd level keeps its own Reply button, but posting from there
doesn't nest a 4th level — it flattens, landing as another comment alongside the one just replied to, at the
same (3rd) depth. This is enforced server-side in `/api/comments`'s POST handler (and duplicated the same way
in Studio's own reply action, since that creates comments directly rather than through the API) — not just a
UI choice, so a hand-crafted request can't create a deeper chain either. No schema change needed: the flatten
decision is derived on the fly from the existing `parentComment` reference (checking whether the comment
being replied to already has a "grandparent") rather than a new stored depth field.

Also, three fixes to the reply-notification email (the one sent to a commenter who opted in to "notify me on
reply"), all per Asher's feedback:
- The quoted preview snippet now truncates at 120 characters instead of 160, still with the same
  ellipsis-and-link pattern.
- The post title in the email is now a clickable link straight to the post, instead of plain text.
- The sender changed from `AsherAw.com Comments <hello@asheraw.com>` to `AsherAw.com/blog Notifications
  <blogcomment@asheraw.com>`, and the email now sets its reply-to address to Asher's own notification inbox —
  so if a recipient replies anyway (the email itself says not to), it still reaches Asher rather than
  disappearing into an unmonitored mailbox.

### Continued (lock comments on a post)

New `commentsLocked` toggle on the post document, same shape as the existing "Hide from search engines"
checkbox. Turning it on stops new comments and replies on that post going forward — nothing about existing
comments changes, they stay exactly as visible as before. Enforced server-side in `/api/comments`'s `POST`
handler (rejects with "Comments are closed for this post," not just hidden in the UI), and the live site's
comment form and every Reply button disappear on a locked post, replaced by a plain "Comments are closed for
this post" line. Also toggleable with one click straight from Studio → Comments — a Lock/Unlock button next
to each post's heading in the moderation view, right where Asher's already working, instead of needing to
open the post document separately. Asher's own replies from Studio still work on a locked post (a deliberate
choice — locking is about stopping new outside comments, not about Asher having the last word).

### Continued (desktop session — the reading-bar mascot is now Asher's real avatar)

Asher sent his actual 8-bit avatar (an old NFT-era pixel-art self-portrait) and asked for it cropped tighter
to the head. `WalkingCharacter.tsx` — the little character riding along both the homepage's progress bar and
the blog's reading bar — no longer draws a generic stick figure; it's now his real portrait, cropped and
resized with `sharp` (nearest-neighbor, to keep pixel edges crisp rather than blurred), shown as a small
bouncing circular medallion with an amber border. Verified visually on both the homepage and a real blog
post before shipping. Closes out the "swap the mascot" entry logged in `IDEAS.md` a few hours earlier — that
entry's removed now that it's done.

### Continued (two follow-ups on the real avatar: faces scroll direction, bar hides past related posts)

**The avatar now faces the direction of travel** — right while scrolling down, left while scrolling back up
— tracked once inside the shared `WalkingCharacter.tsx`, so both the homepage and blog bars picked it up
automatically with no changes needed to either.

**The blog reading bar now hides once past Related Reading**, instead of staying pinned at 100% for the rest
of the page. Uses an always-present marker element right after the comment section so this works reliably
even for a post with no related reading to show. Both verified end-to-end — scrolled a real post to the
footer (bar correctly gone) and confirmed the flip in both directions on both bars — before shipping.

---

## 2026-07-30

**Theme system:** Found and fixed a real React hydration bug in `ThemeProvider` — it read the visitor's
saved theme during the very first render, which could differ from what the server rendered, causing React
to silently discard and rebuild large chunks of the page on every full page load for anyone using light
mode. This is very likely the actual cause of light mode "reverting" across navigation reported the night
before. Fixed by always starting state at `"dark"` (matching the server) and correcting once, before paint.

**Header & footer:** `SiteHeader` and `SiteFooter` now render once, globally, from the shared site layout
instead of every page carrying its own copy — intended to fix `/connect` and the 404 page never having had
a theme toggle. **Status: reported by Asher as still not working correctly on `/connect` and the 404 page —
open issue, not yet resolved.** Needs a fresh look before considering this closed. *(Update, later the same
day: `/connect` and 404 both confirmed working correctly by the next session — see "Continued" below. The
home→blog colour issue specifically is still open.)*

**Theme-toggle hint:** the once-daily "try light/dark mode" nudge was too subtle on mobile and looped
forever even after being seen. Reworked: dropped the infinite pulse, added a persistent static ring around
the button (visible without relying on animation timing) plus a few finite pulses on first appearance, and
made the hint badge itself tappable (bigger target than the small icon, especially on mobile).

**Blog:** added a reading-progress bar to individual post pages — fills as you scroll through the article,
same math as the homepage's existing scroll-progress indicator.

**Project alignment:** the ACE PRD and master spec previously only existed in Claude.ai project knowledge,
which the desktop Claude Code session could see and this remote session couldn't — causing this session and
the desktop session to disagree about what phase the project was actually in. Committed both as
`ACE_PRD.md` and `ACE_MASTER_SPEC.md` so every session, going forward, reads the same source. Also created
this file for the same reason — no more one-off run-sheet artifacts that only exist as a chat link.

**Reality check on Phase 0 / Phase 1:** cross-referenced the run sheet's "Phase 0 formally closed" and
"Phase 1 gaps closed" claims against the actual PRD's exit criteria. Neither phase is actually complete:
- Phase 0 is missing its two required planning documents, `CURRENT_STATE_AUDIT.md` and
  `IMPLEMENTATION_PLAN.md` — the backup/restore half of Phase 0 is solid, the audit half was skipped.
- Phase 1 is missing a Site Settings singleton, distraction-free writing mode, reusable content
  snippets, and full (image-level) media library reuse tracking.

This isn't a criticism of past work — it's the first time these claims were actually checked against the
real spec instead of a shorter, looser description of it. Flagging it here so it doesn't get re-declared
"done" by mistake in a future session.

**Housekeeping:** opened [PR #1](https://github.com/asheraw/personal-website/pull/1) to merge all of the
above from `claude/project-ace-progress-clpqg9` into `main`.

### Continued (desktop session, later the same day)

**Synced up:** pulled PR #1, read `ACE_PRD.md`/`ACE_MASTER_SPEC.md`/`RUNBOOK.md` fresh rather than trusting
the prior summary, confirmed the Phase 0/1 reality check above is accurate.

**`/connect` and the 404 page:** confirmed fixed — theme toggle works on both, real click-through tested
(home → light → Blog link → `/connect` → a broken link → toggle right there on the 404 page) locally and
live, every step correct. `/connect` now also shares the same `SiteFooter` as every other page (previously
opted out with its own minimal one) and embeds the homepage's `ContactForm` instead of just a `mailto:` link.
Contact email switched to `hello@asheraw.com` (Asher's own inbox) — see `RUNBOOK.md`. Fixed the 404 page's
browser tab showing the raw URL — turned out to be a known Next.js bug where `not-found.tsx` metadata
doesn't reliably render; worked around with a direct `document.title` assignment.

**Home→blog colour bug: still open.** Re-tested Asher's exact repro extensively (real clicks, heavy
throttling, live + local) and could not reproduce it in any automated test. Real and reported twice now —
not a false alarm — but needs Asher's specific browser/device to keep investigating. Full detail in
`RUNBOOK.md`'s incident log.

**Phase 0, closed:** wrote `CURRENT_STATE_AUDIT.md` (full stack/schema/route snapshot) and
`IMPLEMENTATION_PLAN.md` (key decisions made so far, with reasoning, plus the plan for the Phase 1 work
below). Backup/restore half was already solid — Phase 0 is now genuinely complete per the PRD's exit
criteria.

**Phase 1, three of four gaps closed:**
- **Site Settings singleton** — the default author (previously hardcoded to a specific author's slug) is
  now configurable in Studio.
- **Media library reuse tracking** — a new "Media" tool in Studio shows every image and which posts use it,
  same technique as the existing category "Posts" tab.
- **Reusable content snippets** — a new "Reusable Snippets" document type; inserting one into a post stores
  a reference, not a copy, so editing the snippet updates every post using it. Verified end-to-end with a
  throwaway test snippet/post before trusting it (created and deleted via script, no real content touched).
- **Distraction-free writing mode — declined a second time, Phase 1 closed without it.** Asher was asked
  about this exact feature before (2026-07-29) and said Sanity's default editor is good enough; asked again
  since it was the only item keeping Phase 1 open, same answer. *(Update, later the same day: he changed his
  mind and asked for it after all — see "Continued" below. Built after Phase 1 was already closed, as an
  extra rather than a reopened gap.)*

### Continued again (same day — OG image fix, internal link picker, writing mode, comments)

**OG image on WhatsApp shares — actually fixed.** Asher tried sharing a real post and confirmed no preview
image showed. Root cause: the OG image URL requested a crop but no format/quality, so a source PNG came out
around 2MB at that crop size — confirmed directly via `curl` on the real URL from the post's actual meta
tags. WhatsApp's crawler is known to silently drop oversized/slow images rather than error. Fixed by
compressing to JPG at quality 75 (~224KB, 9x smaller, visually unchanged) for the OG/Twitter/structured-data
image, and applied the same fix to blog-list thumbnails (`PostCard.tsx`) since they had the identical
unbounded-size pattern. If a specific post URL was shared/tested before this fix, WhatsApp may keep showing
its old cached (imageless) preview until forced to re-scrape via
[Facebook's Sharing Debugger](https://developers.facebook.com/tools/debug/) — new shares of any post should
just work.

**Internal link picker.** In the rich-text editor, a new "Internal link (post)" option sits alongside the
existing URL link — search and pick a post (Sanity's own built-in reference search, fast, nothing custom to
load) instead of typing or pasting its URL. The link stores a reference to the post's stable ID, not its
slug, so renaming that post's slug later doesn't silently break every link pointing at it — the current slug
is resolved fresh every time the linking post renders. Verified end-to-end with a throwaway test post before
trusting it against real content.

**Distraction-free writing, after all.** Asher changed his mind after Phase 1 had already closed without it,
and asked for it. Built: live word count, reading-time estimate, a session timer, and a collapsible heading
outline (with best-effort click-to-jump) layered on top of Studio's existing editor rather than replacing it.
Deliberately left out: a fade-non-active-paragraph focus effect and cursor-centering typewriter scroll — both
would require patching Sanity's Portable Text editor internals in ways that aren't a stable customization
surface, a real risk of breaking on a future Sanity upgrade for comparatively little value. Full-screen
writing was already available via Studio's own built-in expand button on this field.

**Comments — Sanity-native, decided 2026-07-29, built today.** Every comment starts as "pending" and shows
nowhere on the site until approved in a new dedicated Studio moderation tool (one-click approve/reject, a
pending count shown at the top — the "unread badge" Asher wanted, WordPress-style). Spam protection is a
honeypot plus a simple math check, per Asher's preference for that over a third-party captcha service — and
checked on the server this time, not just in the browser (a gap the existing, similar-looking contact-form
check has, worth revisiting there too at some point). Two real bugs caught by testing before this went live:
approving a comment wasn't showing up live for up to a minute (the read endpoint was using a CDN-cached
client with real propagation lag — switched to a non-cached one for comments specifically), and submitted
comments had no timestamp (a schema default that only applies to documents created through Studio's own UI,
not the API — same class of bug already seen once with the AI settings singleton). Also fixed, found in
passing: Reusable Snippets was appearing twice in Studio's sidebar navigation, since it was never added to
the "don't also show this in the generic list" exclusion.

### Continued once more (Studio usability follow-ups from testing the day's work)

**Comments now show a live pending-count badge right in Studio's nav bar**, not just inside the Comments
screen itself — WordPress-style, so there's no need to click in just to check. Sanity has no built-in way to
badge a nav item, but a tool's icon can be any component, so the icon quietly polls the pending count itself.

**Site Settings expanded** from just "default author" to also cover the site's title, meta description, and
default social-share image — previously hardcoded in code, now editable in Studio, split into clearly labeled
sections. A settings change can take up to a couple of minutes to show up live (Sanity's own caching plus this
site's own refresh window stacking) — confirmed and explained, not worth tightening further for something
this infrequent.

**404 Hits redesigned** into one overview page instead of a list you click into one path at a time, sorted by
how often each was hit. Now also keeps a full log of every individual hit (not just first-seen/last-seen) —
Asher specifically wanted this to be able to tell a burst of attempts in a short window (someone probing for
pages) apart from scattered one-off broken links. Capped per path so it can't grow forever if someone really
does hammer the same URL.

**Reusable Snippets confirmed not broken** — checked the actual data directly: zero snippets have been
created yet, so the empty screen is correct, expected behavior, not a bug. Also cleared out a handful of 404
entries that turned out to be from this session's own testing rather than real visitors.

---

## 2026-07-29

**Content:** imported 10 old blog posts (2013–2019) from a prior platform as Studio drafts, original publish
dates preserved, Markdown converted to real rich content. Two posts flagged for a manual retype (encoding
damage from an old export); one flagged for a privacy read before publishing.

**Mobile bug sweep:** fixed several real display bugs found by an actual phone-width scroll-through —
clipped placeholder text, a clipped stat-card word, a boot-animation flash on repeat visits, overlapping
labels, an awkward heading wrap. Found and fixed the underlying cause of a stats mismatch: the homepage's
Story and Play modes each kept their own separate copy of career stats, so updating one silently left the
other stale — both now read from one shared source.

**Phase 0 (Audit & Protection):** ran the first full backup restore drill — exported live content, restored
into a throwaway copy, verified every document matched, all in under 15 seconds. Built reusable tooling so
this can repeat monthly. *(Note, added 2026-07-30: the restore-drill/backup half of Phase 0 is genuinely
solid, but Phase 0 also required two planning documents — `CURRENT_STATE_AUDIT.md` and
`IMPLEMENTATION_PLAN.md` — that were never written. Phase 0 is not actually fully closed; see today's entry
above.)*

**Phase 1 gaps closed:** reading time now shown automatically on every post; categories switched from a
search-and-pick popup to an all-visible checkbox list; tags now autocomplete from existing tags to cut down
on near-duplicates; the AI suggestion tool now proposes tags too, alongside titles and excerpts.

**Studio tuning:** reordered post editor fields to match the real writing order (body → title → slug →
image → category → tags → author → date → SEO last). Made the AI's instructions fully editable in Studio.

**Category safety:** every category now has a "Posts" tab showing what uses it before you touch anything;
deleting an in-use category now asks whether to reassign its posts or leave them uncategorised, instead of
silently orphaning them.

**Reader engagement groundwork:** WhatsApp and theme-toggle clicks are now tracked separately for blog pages
vs. the homepage (previously lumped together, making some questions unanswerable). Added the once-daily
"try dark/light mode" hint.

**Late pass:** brought back `/connect` (link-in-bio style page); added the site's first real favicon (one
had been referenced in code but the actual files never existed); added a proper on-brand 404 page with
every hit logged to a "404 Hits" list in Studio.

**Real bug, actually fixed:** the homepage's light mode was rendering with the wrong (dark) colours on
first load even though the toggle itself said "light" — the page always started in dark colours by default
and only switched once the page's script finished running, usually too fast to notice but visible on the
homepage's heavier animation load. Fixed by setting the correct colours before the page draws anything, on
every page. *(Note, added 2026-07-30: this fix addressed the visible colour flash, but not the deeper React
hydration mismatch that caused theme state itself to go flaky across navigation — that was found and fixed
the next session; see today's entry above.)*

Found during the fix, deferred: light mode not surviving home→blog navigation, and the theme switch missing
on `/connect` and non-functional on the 404 page.

---

## 2026-07-28

**Safety net first:** automated daily backups of all blog content; fixed a bug where the live site was
frozen on old content (new/edited posts weren't appearing at all — the blog pages never rechecked Sanity
after the initial deploy); removed a leftover duplicate content table.

**Blog, made real:** every post now gets its own real search-engine listing instead of a shared generic one;
fixed the sitemap and added an RSS feed; added category/tag/author pages; rebuilt the visual design to
actually match the rest of the site (dark stage theme, Playfair headings, amber accents); linked the blog
into the homepage navigation.

**Real writing tools:** fixed images embedded in a post silently never showing up live; added numbered
lists, underline/strikethrough, dividers, code blocks with syntax highlighting, callouts, accordions,
YouTube embeds, image captions; merged "Excerpt" and "SEO description" into one field; auto-generated
excerpts when none is written; added a "primary category" for a clear breadcrumb even when a post has
several categories.

**The Studio itself:** new posts default to Asher as author; added a live preview tool (desktop/mobile,
before publishing); traced and fixed a chain of issues (a missing security setting, an unwired connection, a
misplaced Publish button) down to the real cause — Studio was refreshing on every keystroke because it
accidentally shared setup with the rest of the site; gave it its own separate space, which stopped it. New
categories can now only be created from the Categories tab, not accidentally mid-post.

**Contact form, made durable:** moved submissions off a Postgres database (via Supabase) that was about to
auto-pause itself from inactivity, into the existing Sanity project (already backed up daily); fixed a bug
where retrying a failed submission wiped out everything already typed.

**Small but real:** homepage intro animation now plays once a day instead of every reload; mobile header was
missing the Blog link.

---

*Entries above 2026-07-28 predate this log; see git history and the RUNBOOK.md incident log for anything
earlier.*
