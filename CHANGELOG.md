# Development Log

A running, single log of what's actually shipped on asheraw.com — one entry per work session, newest at the
top. This is the one place (human or AI, desktop or remote) should read to know what's actually been done,
and the one place to add a new entry to when something ships. Don't create a separate summary document per
day — add a dated section here instead, so there's never more than one place to check.

Written for two audiences at once: Asher, reading in plain English, and a new developer (human or AI)
picking up the project cold. For *why* something works the way it does, or what to do when it breaks, see
`RUNBOOK.md`. For the project's actual goals and roadmap, see `ACE_PRD.md` and `ACE_MASTER_SPEC.md`.

---

## 2026-09-03 — TikTok, YouTube, and LinkedIn comment pull-back added

Rounded out the remaining comment-pull platforms Asher asked for. Same generalized pipeline as Instagram:
**TikTok** via `clockworks/tiktok-comments-scraper` and **YouTube** via `streamers/youtube-comments-scraper`
(both official Apify, both validated against a real public post/video), and **LinkedIn** via
`harvestapi/linkedin-post-comments` (no official Apify LinkedIn actor exists — this one has the strongest
usage/rating among the real options). Real limitation found on YouTube specifically: the Actor only returns
a relative time string ("4 years ago"), never an absolute date, so YouTube-imported comments fall back to
"now" for their stored date. LinkedIn's real-world reply shape is still unconfirmed (the validated test post
had none) — written defensively, worth re-checking on the first real post with replies.

X (Twitter) and Threads deliberately skipped this round: no official Apify actor exists for either, the
real third-party alternatives cost meaningfully more per comment and carry lower usage/ratings, and Asher's
own priority call is that engagement on both is already near-zero.

## 2026-09-03 — Fixed Facebook comment imports mislabeling Asher's own replies

The Apify comment-pull path (see below) hardcoded `isAuthorReply: false` on every imported comment
regardless of who wrote it, so Asher's own Facebook replies (imported under "Asher Aw") landed in the
moderation queue looking like a stranger's comment instead of getting the site's author styling. Fixed to
check the incoming name against the aliases Facebook actually uses for him (confirmed against existing
`isAuthorReply` comments already in the dataset — "Asher" and "Asher Aw"), and retroactively patched the 5
already-pending comments this affected.

## 2026-09-03 — Instagram comment pull-back, and the Facebook pipeline generalized to share it

Second platform for the distribution switchboard's comment pull-back, picked by Asher over the plan's
original "Threads next" suggestion — X/Threads/YouTube engagement has been near-zero for him, Instagram is
where real comments actually happen.

Validated `apify/instagram-comment-scraper` (official Apify) against a real post
(`https://www.instagram.com/p/Db3TQcwj57p/`, linked to `even-my-discipline-was-an-escape`), cross-checked
against a second independent Actor — both agreed exactly (Asher's own single comment, no replies),
confirming the result reflects the real post, not a scraper gap. Real limitation found along the way: on a
free-tier Apify account this Actor only returns top-level comments (replies are paid-plan-gated) and caps
at the newest ~15 per post — fine for the comment volumes seen so far.

Since this is now a second platform doing the same thing, extracted the platform-agnostic dedupe/match/
create logic out of the Facebook-only module into a new shared `src/lib/socialCommentImport.ts`, so
Facebook and Instagram run through one implementation instead of two near-identical copies — each platform
keeps only its own small raw-Apify-shape normalizer. The dashboard's "Pull comments" button is likewise now
one generic, platform-parameterized component instead of a Facebook-specific one.

Verified end-to-end for real, same bar as the Facebook slice: ran the actual shared logic against the real
Apify output twice — first run created the one real comment as pending (correctly recognized as Asher's own
via his real Instagram handle), second run matched it with zero duplicates.

## 2026-09-03 — Link Page (asheraw.com/link) cards now show as a grid in Studio

Asher recalled the card editor used to show a grid, matching the live page's layout, rather than one
full-width row per card. Added Sanity Studio's built-in `layout: 'grid'` option to the cards array — same
mechanism already used for the post gallery's "More photos" field.

## 2026-09-03 — Distribution Switchboard, Facebook skeleton: comments can now be pulled in from Facebook

First real slice of the "distribution switchboard" idea (`docs/ideas/distribution-switchboard.md`): posts
can now record their real social-platform links, and Facebook comments can be pulled in from a live
Facebook thread instead of staying siloed there forever. Full task-by-task detail, acceptance criteria, and
verification notes live in `tasks/plan.md`/`tasks/todo.md` (kept up to date as the actual source of truth
for this feature, not just this summary) -- the short version:

- **Validated the riskiest assumption first**: can Apify actually pull comments from a Facebook *personal
  profile* post (harder than a Page, less-supported)? Yes -- `apify/facebook-comments-scraper`, ~$0.03 for
  an 11-comment real test run, no login/cookies needed. Confirmed against a real post before any schema
  work began, not assumed from a README.
- **`socialLinks`** replaces the old single `legacyFacebookThreadUrl` string on posts -- a real array of
  `{platform, url}`, Facebook first. 50 already-published posts migrated automatically
  (`scripts/migrate-legacy-facebook-thread-url.mjs`), verified afterward: 0 posts still carry the old field.
  **`connectedAccounts`** added to Site Settings for the site-wide account registry this'll eventually
  read from for autofill.
- **Distribution dashboard** now shows Facebook's drafted/copied status separately from X/LinkedIn's
  (previously one bundled badge for all three), reusing the exact same usage-logging strings already being
  written, no new tracking needed.
- **A new "Pull comments" button** on each post's Facebook row calls a new API route
  (`/api/ai/pull-facebook-comments`) that fetches the real thread via Apify, normalizes it, and imports it
  through the same match/dedupe/preserve-approved-status logic the site's historical `.txt`-based importer
  used (documented in RUNBOOK.md) -- new comments land as `pending`, ready to approve/reject like any other
  comment, never auto-published.
- **Verified for real, not just typechecked**: ran the actual import logic twice against a real post
  (`even-my-discipline-was-an-escape`) once the Apify token was in place -- first run pulled 11 real
  comments, created 10 as pending (correctly threaded replies), caught 1 genuine within-batch duplicate;
  second run on the same thread created 0 and matched all 11, confirming a re-pull never duplicates. Two
  pre-existing, unrelated approved comments on that post were untouched throughout.
- **One honest gap, not hidden**: this verified the shared logic and the API route's own request shape
  directly (not by clicking the actual Studio button, which remains untestable by automation -- Studio's
  browser login stays blocked, a longstanding limitation). Asher's own next step: click the real button
  once in Studio and confirm the pending batch already sitting there looks right in the moderation queue.

## 2026-08-31 — GIFs get the same float left/right option as Small/Medium photos

Follow-up to the image float feature: Asher asked whether GIFs could wrap text the same way. Same shape as
Image's own `float` field (blockContentType.ts) -- None/Left/Right, only relevant for a small or medium GIF
-- but rendered through `GifPickerInput.tsx`'s own custom Select rather than Sanity's default radio control,
since that form is fully hand-built already (Display size already worked this way). Switching size back to
Wide/Original now also clears a previously-set float automatically, so a stale value doesn't sit in the
data waiting to matter again if size gets switched back later.

Live rendering (`portableTextComponents.tsx`'s `externalGif`) mirrors `SizedImage.tsx`'s exact float logic --
same breakpoint, same margin classes, same independent re-check of size before ever applying a float, so a
stale value can't visually apply there either. The `clear-both` already added to headings/quotes/dividers/
callouts for the image feature covers GIFs too, automatically -- no separate change needed there.

## 2026-08-31 — Slug auto-fills from the title, so Preview no longer silently disappears

Asher noticed the "Preview" button vanishes with no explanation when a post has no slug yet -- traced to
`openInPresentation.ts`'s own `if (!slug) return null` guard, which is correct (there's genuinely no
`/blog/<slug>` URL to preview without one) but gave no indication *why* the button was gone. Root cause of
the missing slug itself: Sanity's slug field doesn't auto-fill from the title on its own -- it needs the
"Generate" button clicked by hand, easy to miss.

Discussed the actual decision before building: does editing an older post's title ever touch its existing
slug? No -- confirmed directly, since a slug is a permanent address once a post exists (search engines
index it, links point to it), only the very first save should ever get to invent one for free.

`SlugAutoGenerateInput.tsx`, wired onto `slug` in `postType.ts`, fills the slug from the title automatically
the moment there's real text to slugify -- but only while the slug is still genuinely empty. The instant
it's set, by this auto-fill or by typing one in by hand, it locks in permanently; further title edits never
touch it again, no matter how many times the title changes after that. Reuses the same `slugify()`
`portableText.ts` already had for heading anchor ids (now exported) rather than a second implementation --
verified its output against several real, already-live post slugs and got an exact match, confirming
nothing about migrating to this changes what any existing post's URL would have been.

## 2026-08-30 — "Add multiple from Media Library" can now upload brand-new photos too

Follow-up to the fix below, same conversation: Asher asked whether uploading several new files at once was
also possible from inside a post, having previously said bulk uploads belonged in the Media Library section.
Advised on the tradeoff first (real convenience vs. a second upload entry point) before building, on request.

`BulkImagePickerInput.tsx`'s dialog now has two sections instead of one: a new "Upload new photos" drag-and-
drop/file-picker area above the existing "Or pick from what's already in the library" search+grid. Each
uploaded file appends to the gallery the moment it finishes (`client.assets.upload`, same call
`CompressedUploadSource.tsx` already uses), not gated behind the "Add N photos" confirm button -- choosing
to upload a file already is the confirmation, same as Sanity's own default one-at-a-time upload behaves. One
failed file in a batch doesn't stop the rest; its name shows in an error list instead of silently dropping
it or aborting everything after it.

## 2026-08-30 — Fixed "Add multiple from Media Library" showing stale selections after Cancel

Asher noticed: pick a few photos in the bulk picker, hit Cancel, reopen it later, and the same tiles still
showed as selected even though nothing had actually been added. Root cause: `BulkImagePickerInput.tsx`
itself never unmounts (only the Dialog's JSX conditionally renders), so `selectedIds` lives in the parent
component and survives a close/reopen -- `addSelected()` already reset it after a real add, but Cancel and
the Dialog's own `onClose` (X / click outside / Escape) both just hid the dialog, leaving the selection
state untouched. Fixed by routing all three close paths through one shared `closeDialog()` that resets
`selectedIds` and the search box, so a cancelled session never leaks into the next one.

## 2026-08-30 — Small photos can now float left/right with text wrapping around them

Asher asked whether Small/Medium images could float like a classic magazine layout, with body text wrapping
around them, rather than always sitting centered on their own line. Advised first (feasibility, what it'd
take, the one real risk) before building, per his own "don't execute yet."

New `float` field on the image block (`blockContentType.ts`) -- None (default) / Left / Right -- shown only
for a single Small or Medium photo, hidden for Wide/Original (nothing left to wrap around) and for a gallery
(floating several photos at once is a much stranger reading pattern). `SizedImage.tsx` applies the actual
CSS float, re-checking size independently of Studio's hidden-field gate so a stale `float` value left over
from switching sizes can never visually apply. Floats only kick in from tablet-width up (`sm:`), same
breakpoint every other size class already uses -- stacks full-width on mobile like everything else.

The one real risk flagged up front, addressed directly: a floated image can visually bleed into whatever
comes right after it if there's not enough text to wrap around first. Added `clear-both` to headings,
blockquotes, dividers, and callouts (not plain paragraphs/lists, where wrapping around the float is the
whole point) so a floated photo never runs into the next section, without needing a separate manual
toggle. Exports (Markdown/HTML/PDF/EPUB) untouched -- they already don't reflect `displaySize` at all
(every exported image renders at one standard size regardless of Small/Medium/Wide/Original), so skipping
`float` there too is consistent with existing behaviour, not a new gap.

## 2026-08-30 — Cleaned up 18 stale Vercel mentions across the codebase, confirmed the cron replacement actually works

Asher confirmed the site is no longer on Vercel (host is Netlify) and asked for a full sweep of the stale
references that turned up while fixing the Error Log's own description text (see the entry below). Fixed
the public **Privacy Policy page** first -- it named Vercel as the host in its own infrastructure-disclosure
list, a real accuracy problem on a live legal page, not just a comment.

**A real discovery along the way, not just cosmetic**: `netlify.toml`'s own comment claimed the three
scheduled tasks (purge-trash, check-links, publish-scheduled) had "no working replacement" since the
Netlify migration -- alarming, since one of those is exactly what makes "Schedule for later" actually
auto-publish. Checked, and that comment was itself stale: three GitHub Actions workflows
(`.github/workflows/cron-*.yml`) already replaced Vercel's built-in Cron feature, on the same schedules,
authenticated the same way. Confirmed via GitHub's own Actions run history -- 8/8 recent runs of
`publish-scheduled` succeeded on schedule, no failures. Fixed `netlify.toml`'s comment to say so accurately
instead of claiming it's broken.

Everything else: swapped stale "Vercel" mentions for the real current explanation in cron route comments,
`LinkCheckerTool.tsx`/`errorLogType.ts` (which also still claimed to only catch "real visitor" errors --
fixed to match the earlier entry's correction), `postType.ts`/`EditorialCalendarTool.tsx`'s Studio-visible
schedule-timing text, and `rateLimit.ts`. **Not blindly find-and-replaced**: `linkChecker.ts`'s bot-
protection/IP-reputation comments describe specific behavior actually observed while on Vercel -- reworded
as historical context (what was true then) rather than asserting Netlify behaves identically, since that
hasn't been independently re-confirmed. `NotFoundContent.tsx`'s `vercel/next.js#61236` is a real upstream
GitHub issue reference (Next.js's own repo lives at that path regardless of who hosts this site) -- left
untouched, not a hosting claim at all.

## 2026-08-30 — Error Log: closed out 2 pending entries, fixed a stale description

Asher spotted 2 pending Error Log entries and asked whether they were things already fixed. Checked: yes.
Both traced to the same root cause -- `ChevronDown` used in `SortableTableHead.tsx` (the new Skill Table
block, still in progress) without being imported, and a second entry that's fallout from the same crash
(React's own dev-mode render-logging hitting a null while trying to report the first error, 12 seconds
later, same page, same browser session). Confirmed fixed by reading the current source -- `ChevronDown` is
now properly imported from `lucide-react`. Marked both **Fixed**, not Ignored, with a resolution note
explaining the shared root cause -- this was fixed as part of the Skill Table's own in-progress work, not
something patched in this review.

Also fixed the tool's own description text, on Asher's request: it claimed to catch errors from "a real
visitor's browser," but both entries above were from `localhost` -- confirmed via `track-error/route.ts`
that error tracking has no environment gating at all, so local dev testing lands in the same log as real
visitors. Reworded to say so plainly. Same line also named Vercel as where server-side errors land --
stale (Asher confirmed 2026-08-30 he's no longer on Vercel; this project's host is Netlify), fixed to say
Netlify instead. A broader sweep for other stale Vercel mentions across the codebase (including the public
Privacy Policy page, which still names Vercel as the host) was flagged to Asher rather than done
unprompted -- some of those comments describe Vercel-specific platform behavior that needs verifying
against Netlify's actual behavior, not just a find-and-replace.

## 2026-08-30 — "Schedule for later" now confirms it actually registered

Asher's follow-up to the previous entry: even with the confusing native "Schedule publish" action gone, the
"Schedule for later" field itself gave no feedback that a chosen date had actually taken -- the only way to
check was leaving the post entirely for Studio -> Calendar. Reasonable to want confirmation right where the
date was just set.

`ScheduledPublishInput.tsx`, wired onto `scheduledPublishAt` in `postType.ts`, wraps the default datetime
picker with a plain-language status card underneath: a future date shows "Scheduled — will publish
automatically sometime on [date]" (positive tone); a date that's already passed shows a caution note that
the daily check either hasn't run yet today or something's blocking it, worth checking Calendar if it's
still unpublished tomorrow. No banner at all when the field is empty -- nothing to confirm.

## 2026-08-29 — Removed Sanity's built-in "Schedule publish" menu item -- paywalled, and this site already has a free alternative

Asher clicked "Schedule publish" in the "..." menu (right there next to Duplicate/Discard/Delete) expecting
it to relate to the "Schedule for later" field he'd just set -- hit an upsell dialog instead. Turns out those
are two completely unrelated things that happen to sound identical: "Schedule for later" is this site's own
free field + daily cron (see the entry above and `publish-scheduled/route.ts`); "Schedule publish" in the
menu is Sanity Studio's own built-in action (id `'schedule'`, confirmed by reading Sanity's own bundled
source), gated behind their paid Scheduled Publishing add-on this project doesn't have.

Since the free alternative already exists and does the same job, the built-in one is pure confusion with no
upside -- filtered out of the actions list entirely for posts (`sanity.config.ts`, same `.filter()`/`.map()`
pattern already used there for Publish/Delete customization), rather than left in the menu to be clicked by
mistake again.

## 2026-08-29 — Pre-publish checklist now warns about a conflicting schedule

Asher noticed a post with "Schedule for later" set to Sept 5 and asked whether clicking Publish would
somehow respect that, or turn the button into something like "Schedule" instead. Neither -- `scheduledPublishAt`
and the Publish button are two completely unrelated mechanisms. The field is just a plain date a separate
daily cron job (`/api/cron/publish-scheduled`) checks; Publish has no idea it exists and always goes live
immediately regardless of what it says. Easy to assume otherwise, since the field visually sits right there
suggesting it controls when the post goes live.

Added to the existing "worth a look" pre-publish checklist (`prepareForPublish.tsx` -- already warns about a
missing featured image, no excerpt, etc., same "warn, never block, editor's call" dialog) rather than
building a second mechanism: if `scheduledPublishAt` is set and still in the future, Publish now shows
"Scheduled for September 5, 2026 — publishing now goes live immediately instead, ignoring that schedule"
before confirming. Nothing changes for a post with no schedule set, or one whose schedule has already
passed.

Asher tried the new GIF block from the entry below and hit an error, couldn't scroll past the first page of
results, and asked whether the picker really needed to load a default set of GIFs the moment it opened.

The error was real and worth finding: `pickGif()` called `onChange(set({url, thumbUrl, title}))` with no
path, which replaces the *entire* stored value of the block being edited. Since `_type` and `_key` weren't
among the fields in that patch, this silently stripped them off the block on save -- corrupting it. Fixed by
patching each field at its own explicit path (`set(value, ['fieldName'])`) instead, which only ever touches
those three fields and leaves `_type`/`_key` alone.

Pagination: `/api/gif-search` already returned `hasMore`/`nextOffset` (needed for the comment-form picker's
own scroll, which already used them), but `GifPickerInput.tsx` never wired them up -- fixed with a "Load
more" button that appends results instead of replacing them.

And the picker no longer searches on open with an empty query (which hit Giphy's trending endpoint just to
avoid a blank first frame, same as the public comment form's picker still does on purpose) -- now shows
"Search for a GIF above" until there's an actual query, cutting that call entirely, per Asher's own ask.

## 2026-08-29 — New GIF block hotlinks straight to Giphy instead of copying into Sanity storage

Asher noticed picking a GIF for a post copied it into his own Sanity asset storage -- a real download + a
real upload, every time, even though Giphy's own CDN is already reliable, fast, and free. Asked whether the
image field could just hotlink to Giphy's URL directly instead, aware of and fine with the trade-off (if a
GIF is ever pulled from Giphy, it stops showing here too).

Turns out it couldn't, not on that field: Sanity's `image` field type requires a real managed asset --
that's what the crop/hotspot editor, `urlFor()`'s CDN resizing, and the OG-image pipeline all depend on.
There's no way to point an `image` field at an arbitrary external URL instead. So this isn't a tweak to the
existing "Insert GIF" option -- it's a **new, separate block type** for the post body, built the same way
the existing `youtube`/`instagramEmbed` blocks already work: just a stored URL, rendered directly, nothing
ever uploaded.

**The old path is gone.** "Insert GIF (Giphy)" removed from every image field's asset-source menu
(`sanity.config.ts`) -- `GiphyAssetSource.tsx` and `/api/gif-upload/route.ts` (the download-and-reupload
route it called) both deleted outright, no longer used by anything.

**The new path**: a `GIF (Giphy)` block, `externalGif` in `blockContentType.ts`, sitting right next to Image
in the insert toolbar (Asher's own ask -- "put it beside image because it's for a gif"). Reuses the existing
`/api/gif-search` proxy (unchanged, still used by the public comment form too) for the same search-and-pick
grid, but picking one just patches `url`/`thumbUrl`/`title` straight onto the block -- no upload call at
all. `GifPickerInput.tsx` replaces the object's whole edit form (search grid until something's picked, then
a small preview + "Choose a different GIF"); `CollapsedGifBlock.tsx` gives it the same compact-card,
select-then-double-click-to-open treatment `CollapsedImageBlock.tsx` already established for Image, just
simpler -- the thumbnail is already a plain external URL, no `urlFor()` resolution needed since there's no
Sanity asset behind it.

Rendered on the live post as a plain `<img src>` pointed at Giphy's own URL (`portableTextComponents.tsx`) --
needed no CSP change, `*.giphy.com` was already allowlisted in `img-src` for the public comment thread's own
hotlinked GIFs. Every export format got a matching renderer: Markdown (`![title](url)`), HTML (a `<figure>`
around the same `<img>`, inherited automatically by the EPUB export too, same as how a real photo already
hotlinks to Sanity's CDN there), and PDF (a plain clickable link, not a real embed -- pdfkit's image renderer
only decodes JPEG/PNG, the same constraint the real "image" case already works around, and there's no
Sanity-hosted still-frame to convert from for an external GIF). JSON export needed nothing -- it just
serializes the post as-is. `portableTextToPlainText` (reading time) also needed nothing -- a GIF has no
prose, so it correctly falls through to the same empty case `image`/`youtube` already do.

## 2026-08-29 — Divider's popup fixed properly (round 2); Callout gets a custom label and rich text (migrated for real)

Two more Studio editor reports, same session. Divider's only field (`style`) is `hidden: true` -- there's
genuinely nothing to configure -- but Sanity's default behaviour still auto-opened a full edit panel the
instant one was inserted, an empty black box with nothing in it but an X to close.

**First attempt** (`DividerBlockPreview.tsx` ignoring `props.open` entirely, rendering a hand-built `Card` +
`BlockPreview` instead) fixed the empty popup but, as Asher caught by screenshot comparison, also lost
Sanity's own default block chrome -- the "..." menu (Remove/Duplicate/move up-down) that a plain,
non-overridden object block gets for free. That chrome turns out to be part of what `renderDefault` itself
draws; there's no way to keep it while swapping in fully custom collapsed content.

**Second attempt, shipped**: always call `renderDefault(props)` with the real, unmodified props -- so it
faithfully mirrors Sanity's true open/closed state and draws the exact same chrome (dots included) a plain
divider would. The only intervention: a `useLayoutEffect` calls `onClose()` the instant `open` becomes true
(which happens automatically on insert, since there's nothing to fill in) -- before the browser paints the
open frame, so there's nothing to see. Every other click/select interaction is Sanity's real default,
unmodified.

**Image doesn't get the same fix, and can't via the same mechanism.** Divider's problem was specifically the
*open* state (fixed by bouncing straight back out of it). Image's problem is different: Sanity's real
default *collapsed* preview for a single image is already full-size, permanently, not just right after
insert -- that's the original reason `CollapsedImageBlock.tsx` exists at all, and bouncing out of `open`
doesn't touch it. Getting Image's exact native "..." menu back isn't possible without accepting that
full-size default again.

Tried dropping the real thumbnail and letting `BlockPreview` fall back to the array member's own
`icon: ImageIcon`, on the assumption it'd behave like Divider's `icon: UlistIcon` fallback -- wrong,
confirmed by screenshot: `BlockPreview` used standalone doesn't show any icon without one explicitly passed,
just bare title text, which looked worse than the thumbnail, not more consistent with it. **Reverted** --
Image keeps its real photo thumbnail. Net result: Image and Divider now share the same selection/click
behaviour (single-click selects, double-click opens) and Divider got its native chrome back, but Image's
collapsed row still doesn't have Divider's "..." menu or its exact plain-row look -- a genuine, confirmed
constraint of Sanity's own component model (a default preview with real media attached shows that media;
one without doesn't), not something still open to try a third way on.

Callout's "Style" field (Note/Tip/Warning) used to control both the colour *and* the displayed label --
picking "Tip" always showed the word "Tip" on the live post, no way to change it. A new optional `label`
field now overrides that word when set, leaving Style to just pick the colour (blank label = today's
behaviour, unchanged). And Callout's Text field was plain string -- no bold, links, or lists -- upgraded to
the same restricted rich text Accordion already has (bold/italic/underline/lists/a plain link), via a
generalized `restrictedRichTextField()` factory (was accordion-only, now shared) and a new
`restrictedRichTextComponents.tsx` extracted from `Accordion.tsx` so both blocks render identically instead
of two copies of the same renderer.

Every place that reads callout text got the same defensive-both-shapes treatment Accordion's own migration
already established: `portableText.ts` (reading time), `exportHtml.ts`/`exportMarkdown.ts` (full rich
rendering via the same toHTML/portableTextToMarkdown pipeline the post body uses), and `exportPdf.ts`
(flattened to plain text for the PDF specifically -- its callout box needs its height known before drawing,
which doesn't fit recursive block rendering; a documented scope cut, not an oversight). `bulkOperations.ts`
already explicitly excluded callout text from search & replace, so nothing needed changing there.

**`scripts/migrate-callout-text.mjs`** (new, same `--dry-run`-first / patch-by-`_key` pattern as
`migrate-accordion-content.mjs`) converts existing plain-string callout text into the new block-array shape.
**Run for real 2026-08-29** after a dry run + spot-checking two of the real strings (same diligence as the
accordion migration): migrated 12 callout blocks across 8 already-published posts, all single-paragraph, and
the script's own built-in re-check confirmed zero blocks still had the old string shape afterward. Manually
re-fetched one migrated post's data directly to confirm the text (including an emoji and hashtag) came
through byte-for-byte, not just typechecked.

## 2026-08-29 — Image blocks in the post body lost their selection outline, single-click opened them instead of selecting

`CollapsedImageBlock.tsx` (the compact-preview override for image blocks in the body editor) intercepted
every single click and immediately opened the block for editing -- Asher's report: he used to be able to
single-click an image block to select it (for backspace-delete or drag-to-reposition), with a visible
selection outline, and only double-click actually opened it. That interaction, plus the outline itself,
got lost when this override was first built to fix the "single image renders full-size" bug (see the
2026-08-28 entries below).

Fixed in two parts. The click handler moved from `onClick` to `onDoubleClick`, so a single click now falls
through untouched to Sanity's own block-selection handling instead of being intercepted. And the outline
itself needed to be drawn by hand: Sanity's own default image preview reads `props.selected` internally to
show its ring, but this component replaces that default preview entirely, so nothing was reading it. Now
wraps the compact preview in a `Card` with `tone={props.selected ? 'primary' : 'transparent'}` -- same
tone-for-state pattern already used for status colouring in `ErrorLogTool.tsx`.

## 2026-08-29 — "Suggest SEO & Excerpt" and "Suggest Image Prompt" moved into the writing flow

Asher's ask, after noticing the Publish button's overflow menu had grown to 9 items: two of the AI-assist
actions there matter enough to reach for constantly, and shouldn't need three clicks (Publish -> ... ->
find it) every time. Rather than a generic "make everything a toolbar button" pass, asked which ones
actually felt like part of the flow -- his answer was specifically these two, placed specifically next to
the fields they're about: "Suggest SEO & Excerpt" right under the Title field, "Suggest Image Prompt"
right under the Featured Image field. Draft Social Copy and Generate Featured Image stay in the overflow
menu, on his own call.

Neither action existed as a reusable button before this -- "Suggest SEO & Excerpt" did (`SuggestSeoButton.tsx`,
already used on the SEO Preview tab), so the Title field just gained a second entry point into the same
dialog. "Suggest Image Prompt" didn't, so it got the same split `suggestSeo.tsx`/`SuggestSeoShared.tsx`
already went through: fetch/state/dialog-body logic moved out of the document action into
`SuggestImagePromptShared.tsx`, the document action slimmed down to thin glue over it (unchanged
behavior), and a new `SuggestImagePromptButton.tsx` added as the second entry point.

Both new inline buttons live in field-level `components.input` overrides (`TitleInputWithSeoSuggest.tsx`,
`MainImageInputWithSuggestPrompt.tsx`) that render the field's normal input plus the button underneath --
same `props.renderDefault(props)` pattern already used by `CollapsedImageBlock.tsx`. Since a field-level
input only gets its own value via props, sourcing the sibling fields these actions actually need (body,
tags, slug, document id) goes through `useFormValue`, the same hook `PrimaryCategoryInput.tsx` already
uses for the identical reason.

## 2026-08-29 — Error Log's resolution note was invisible in the actual tool, plus the status dropdown's arrow wasn't clickable

Follow-up to the entry below, same day. The `resolutionNote` field existed in the schema and was being
written correctly on the 3 patched entries, but Asher couldn't see it anywhere in the live Error Log --
because `ErrorLogTool.tsx` is a fully hand-built React tool with its own GROQ query and JSX, not Sanity's
generic document form. Adding a field to the schema alone doesn't make it appear there; the tool has to be
told to fetch it and render it separately. Asher also flagged that the little arrow beside the Ignore/Fix
dropdown wasn't clickable.

Fixed both: the GROQ query now fetches `resolutionNote`, and each entry shows it as an editable text box
once its status is Ignored or Fixed (saves on blur). The status dropdown was replaced entirely with three
always-visible buttons (Pending / Ignored / Fixed) -- rather than debug why the native `<select>`'s arrow
had a dead hit-area, this removes the arrow/dropdown interaction altogether.

## 2026-08-29 — Error Log gets a "Resolution note" field

Checked the Error Log with Asher and found 3 pending entries, all from 2026-08-26 -- two (a ChunkLoadError
and 124 identical "Server Action not found" hits) traced to the same ordinary cause: a visitor had the page
open across a deploy boundary, so their browser's old JS chunk/Server Action references stopped resolving
once the new build replaced them. Asher raised a real gap before agreeing to mark anything Ignored: the
schema only ever stored the status, not *why* -- if one of these resurfaces later, there'd be nothing
recording the reasoning anywhere Studio itself, only in a chat transcript that won't be around for a future
session (human or AI) to read.

Added a `resolutionNote` field to `errorLogType.ts` -- plain text, shown once status is Ignored or Actioned,
so the actual reasoning lives next to the entry it explains. Scoped to Error Log only for now, not the other
tools sharing the same Pending/Ignored/Actioned pattern (404 Hits, Content Audit) -- Asher's own call, can
extend later if it proves useful here first.

## 2026-08-28 — Two real bugs found from Asher's direct testing of the collapsed image block

Follow-up to the collapse fix below, tested live within minutes. Two real issues, both fixed.

The compact preview was rendering as a blank box, no thumbnail -- gallery and single alike. Cause:
`BlockPreview` used standalone (not through Sanity's schema-driven preview pipeline that normally resolves
a raw `{_type: 'image', asset}` shape into a thumbnail wherever `preview.prepare()`'s own output shows up
elsewhere, e.g. Comments tool cards) doesn't auto-resolve an asset reference on its own. Built the real
image URL with the project's existing `urlFor` helper and handed it a genuine `<img>` instead.

Clicking to open was flaky -- opened inconsistently, and sometimes closed again immediately after opening.
The click was bubbling past this component to some other "click outside the open block closes it" handler
almost certainly living in Sanity's own editor chrome, which read the same click (nothing was open yet at
the moment it actually fired) as a reason to close what React had just opened, within the same event.
`event.stopPropagation()` on the click fixes it.

## 2026-08-28 — Second attempt at the single-image collapse -- root cause found this time

Asher confirmed the first attempt (forcing `open: false` when calling Sanity's own `renderDefault`) had no
visible effect -- still full-size in the writing flow. Real cause, found by reading `BlockProps` more
carefully: `open` is state Sanity itself tracks and hands TO this component; overriding it in the object
passed back to `renderDefault` doesn't change what Sanity's own implementation actually reads for that
decision -- only specific documented override points (like `renderPreview`, used elsewhere in Sanity's own
docs for the reverse case) are genuinely honoured that way.

Rebuilt `CollapsedImageBlock.tsx` to stop trying to talk Sanity's own renderer into a different choice and
make the decision directly instead: reads the real `props.open`, and only falls through to Sanity's full
editing view when it's genuinely true (the block just clicked into). Otherwise it renders `BlockPreview`
(Sanity's own compact-card component, the same layout galleries already use) with a click handler wired
straight to `props.onOpen()` -- the same function Sanity's own UI calls -- so clicking the compact card
still opens real editing.

Same honesty note as before: typechecks, schema-validates, and Studio loads clean, but the actual visual
and click-to-edit behaviour can't be confirmed from here (Studio login is blocked for automation). This
time there are two specific things worth checking, not just one: does it render compact while unfocused,
*and* does clicking it still open the real edit form (alt text/caption/hotspot/gallery settings)?

## 2026-08-28 — Single-image blocks now collapse in the editor too, matching galleries

Follow-up to the two fixes above. Asher confirmed the gallery-only thumbnail fix works well (a small
thumbnail + "Image Scrolling strip (12 photos)" row), then flagged that a *single* image (no gallery) still
renders at full size inline in the writing flow -- and confirmed directly, not just from one screenshot,
that it stays full size regardless of whether it's the block currently being worked on. His ask: the photo
should only need to show large in an actual preview, not while writing elsewhere in the post.

Traced this to a real, documented Sanity API: `BlockProps` (the props Portable Text passes to an array
member's inline rendering) has an `open` field -- literally "whether the block is currently opened for
editing" -- controlling collapsed-preview vs full-size-inline rendering. Added `CollapsedImageBlock.tsx`,
a `components.block` override that forces `open: false` unconditionally, so the inline flow always shows
the compact preview (reusing the same `preview.prepare()` output already proven correct by the gallery
fix) regardless of Sanity's own focus tracking.

**Flagging honestly rather than presenting this as fully verified:** this is built on real, current Sanity
documentation and type definitions (confirmed via the installed `sanity` package's own `.d.ts` files, not
guessed), and typechecks/schema-validates cleanly -- but the actual Studio editor can't be checked visually
from here (Google blocks automated login to Studio, same limitation noted elsewhere in this log). Worth
confirming directly: the block should now always render compact in the writing flow, and clicking into a
photo to edit its alt text/caption/hotspot/gallery settings should still work exactly as before -- this
change only touches the read-only inline rendering, not the separate edit dialog.

## 2026-08-28 — Display Size gets a tooltip, and a real fix for the gallery-only thumbnail bug

Follow-up to the Gallery mode work below. Asher asked for the Display Size field's long description (all
4 options plus a mobile caveat) to move into a hover tooltip instead of always taking up its own paragraph
-- built `TooltipDescriptionField.tsx`, a `components.field` wrapper that renders a small "What do these
options mean?" hint with an info icon, suppressing Sanity's own always-visible description in favour of
showing the exact same text on hover. The field's title still renders through Sanity's own default chrome,
unchanged -- only the description paragraph was replaced.

Also: Asher flagged a bug he thought he'd raised before -- a gallery built entirely through "More photos,"
with no primary photo ever added to the slot at the top, not displaying. Checked the actual code rather
than assuming: the *live blog page* was already fixed correctly (from an earlier session, confirmed still
in place). The bug that's actually still real was in Studio's own block-list preview thumbnail -- its
`prepare()` function built the thumbnail from `asset` directly with no fallback, so a fully-populated
gallery with an empty primary slot showed as a blank/broken thumbnail in the post editor, even though the
real page rendered it fine. Fixed the same way the live page already was: fall back to the first
additional photo's asset when the primary slot is empty.

## 2026-08-28 — Image block: a real "Gallery mode" instead of one flat list of fields

Asked for a UX pass on the Image block's editing panel using the ui-ux-pro-max skill. First look (just the
screenshot) suggested minor polish -- shorten one long description, group a couple of fields. Asked to look
deeper at what the panel actually does before proposing anything, which surfaced the real picture: this one
block hides four distinct ways to add a photo (drag/paste, plain upload, "Upload (compressed)", and GIF
search via Giphy -- the last two invisible behind an unlabeled "Upload" dropdown chevron), a whole second
bulk multi-select system for building a gallery, and a display-style/display-size system with 8 combined
options between them -- none of that visible from the screenshot alone.

Picked the deepest of three proposed fixes: the block silently turns from "one photo" into "gallery" the
moment a second photo gets added via "More photos," but nothing on screen ever announced that shift.
Fixed two ways. First, a small badge now sits above the whole panel reading "Single image" or "Gallery — N
photos," computed live from the actual field values (`ImageGalleryStatusInput.tsx`, composed alongside the
existing save-status badge rather than merged into it, since that badge is shared with unrelated blocks
like Accordion and Code that have no gallery concept at all). Second, "More photos" and "Display style" --
the two fields that only matter once you're actually building a gallery -- are now grouped into their own
visually distinct "Gallery" box (a Sanity `fieldset`, schema-only, no extra UI code) instead of blending
into the same flat list as Alt text/Caption/Display size, which describe the image regardless of mode.

Also added one clarifying line to the bulk-photo-picker: it sits directly above Sanity's own default
one-at-a-time add UI with no explanation, reading as two competing ways to do the same thing rather than
two tools for two different situations (bulk-select a batch vs. add/upload one, including the still-hidden
GIF search option). Left the four-hidden-upload-paths discoverability problem and the Display Size
description length as open items, not part of this pass, if Asher wants either addressed later.

## 2026-08-27 — Fixed the same descender clip on 2 more cycling headlines, and a Play-mode content drift

Follow-up to the headline pass below: the ThreePillars line-height fix (0.98 -> 1.15) only touched that
one heading. Asher caught the same clipping on the two other headings using the identical cycling-word
component -- "At a Glance"'s new cycling line and Two Callings' "Asher is a/an ___" -- since both still had
their own tight leading (1.05 and 1.02) untouched. Loosened both to 1.15 to match.

Separately, Asher asked directly why Story mode and Play mode's content don't always update together --
real answer: some content (bios, stats, contact info) already lives in one shared `data.ts` both modes
read from, but section *headlines* are hand-typed separately per mode, not centralized. Today's four
headline edits (Stage, Coaching, At a Glance, Contact) were only made in Story mode, silently leaving Play
mode's own copies -- including the *old* "Built to be used like a craft" line just replaced in Story mode
-- stale. Fixed by updating Play mode's matching titles directly, and for "At a Glance" specifically,
exported the new cycling word list from AtAGlance.tsx so Play mode's version reuses the exact same array
and timer instead of a hand-copied one -- the same drift this project has already been bitten by once
before with duplicated section copy.

## 2026-08-27 — Tightened four homepage headlines, gave "At a Glance" a cycling word too

Asher asked for a pass over every headline on the homepage -- several ran long for display-size type
(11-13 words reading as full sentences rather than headlines). Three shortened directly on his own
wording: Stage section now "The Stage Helped To Shape Asher" (was a 13-word sentence), Coaching section
now "Helping People Communicate Confidently & Authentically" (trimmed from an 11-word line built around an
em-dash pause), and the final CTA now just "Let's Chat" (was a 13-word line explaining what the form
below it already explains).

The fourth, "At a Glance," got more than a trim -- the old line ("Built to be used like a craft --
practised, lived, shared") was pure marketing abstraction sitting directly above four hard stat tiles
(15+ years in marketing, 20+ years on stage, 10+ years as Jesus, 100+ workshops) without referencing any
of them. Replaced with a cycling headline in the same style as the "story/voice" and "Actor/Coach/
Marketer/Storyteller" cyclers elsewhere on the page: "Years [on Stage / in Marketing / as Jesus]." --
the first two phrases are lifted verbatim from two of the real stat labels, so the headline is now a live
pointer at the actual numbers instead of a standalone abstract line. Reused the same shared
`CyclingWordSlot`/`useCyclingIndex` primitives already built for this rather than a one-off animation.

## 2026-08-27 — Rebuilt "Stop Saying AI Won't Replace People"'s comment thread from screenshots

Asher sent 5 screenshots of the real Facebook thread. The version already on the site only had 8 bare
top-level comments with no threading and none of Asher's own replies; the real thread was much bigger and
missing an entire ninth thread (Yang Mu Ming's) outright. Rebuilt from scratch: 29 comments total,
matching Facebook's own comment badge exactly. Threaded properly, including flattening a couple of
exchanges that ran deeper than this site's 3-level cap -- per the site's own documented rule, a reply to an
already-3rd-level comment attaches to that comment's parent instead of inventing a 4th level, same as a
real visitor's reply would behave live. Deleted the old incomplete stub comments rather than leaving them
alongside the real ones. Verified against the live page afterward: renders as "29 Comments", matching the
Facebook screenshot's own count.

## 2026-08-27 — Comment bubble's tail now actually points at the pill it belongs to

Two real layout bugs Asher caught from screenshots. Desktop: the speech bubble's `absolute left-full`
positioning was anchored to the whole search row (full column width), not the comment-count pill next to
it -- so the bubble floated off in empty space with a big gap before it. Fixed by wrapping the pill and
bubble in their own tightly-fitted container so `left-full` resolves against the pill's real width, and
centering both the tail and the ring's anchor point on the bubble's own measured height, so they always
line up regardless of message length.

Mobile: the card sat below "Browse by topic" with no visual link to the pill above it. Moved it to sit
directly under the pill, ahead of the topic tags, and gave it its own upward-pointing tail.

<b>Follow-up (same day):</b> Asher caught it again from a real screenshot -- the ring still cut straight
across the tail on both. Root cause: the ring's path touched the box's straight edge exactly at the tail's
center, which is the *widest* cross-section of the tail's rotated-square diamond shape -- so the highlighted
line bisected it rather than following its outline. A tail's visible border is actually a V-shape sitting
almost entirely *outside* the box (only its two tips touch the edge), not a single point. Rebuilt both ring
paths (`ringPath`, `ringPathTop`) to detour out around that V -- from one tip, out to the diamond's point,
back to the other tip -- using the tail's own rotated-45deg geometry (`(half its 16px side) * sqrt(2)`) so
the ring now hugs the tail's real outline instead of cutting through it. Verified at 4x zoom on both.

<b>Second follow-up (same day):</b> Asher also noticed a tiny visual "blip" -- the ring's outline briefly
breaking right when a testimonial rotates and the bubble resizes to fit the new one. Real cause: the ring's
shape is only as accurate as its last size measurement, which arrives a beat after the new testimonial's
text (and the box's real new height) actually lands -- so for one frame the ring was drawn using the
outgoing testimonial's stale dimensions before snapping to the correct ones. Fixed by hiding the ring the
instant a testimonial swaps (adjusted during render, not in an effect, so the mismatched frame is never
painted) and only letting it reappear once the new size is actually measured -- confirmed directly: the
ring now disappears the moment the swap happens and only redraws once the box's real new height lands,
both changes landing together rather than one trailing the other.

<b>Third follow-up (same day):</b> that fix introduced a new regression Asher caught immediately -- the
ring stopped ever completing a full lap before the next rotation cut it off. Real cause: rotation was
still driven by a plain `setInterval` ticking on its own fixed 7s schedule, independent of when the ring
actually started drawing -- and since the ring now only starts once its post-swap size lands (a beat after
the swap, by design per the fix above), the interval was firing 7s after the *swap*, not 7s after the ring
itself started, cutting every single lap short by that same beat. Rotation is now driven by the ring's own
`onAnimationComplete` instead of a fixed timer, so it always gets its full stated duration -- confirmed by
watching three consecutive cycles run ~7.1s each, and a screenshot catching the ring mid-final-frame as a
complete, unbroken loop.

<b>Fourth follow-up (same day):</b> Asher reported rotation actually hanging outright, always at the same
testimonial (Jeryl Chandler's). Real cause, confirmed against the real data: a swap changes the box's
*content* but doesn't always change its *size* -- Jeryl Chandler's message (208 characters) and the next
one, Joycelynnnnn's (98), both truncate to exactly `MOBILE_MESSAGE_MAX_LENGTH` on mobile and wrap to the
same number of lines. `ResizeObserver` only fires on an actual size change, so the very first time a swap
happened to land on a same-height pair, `size` (nulled on every swap by the earlier blip fix) never got
restored -- the ring could never remount, and its `onAnimationComplete` (the only thing that now advances
rotation) never fired again, freezing there for good. Added a `MutationObserver` alongside the
`ResizeObserver`, re-measuring on every real content change regardless of whether the resulting size
actually moved. Verified against the real data end to end: polled the live page through a full rotation,
watching it sail straight through Jeryl Chandler -> Joycelynnnnn (the exact pair that used to hang) and
wrap cleanly back to the first testimonial into a second lap.

## 2026-08-27 — Cleaned up empty categories, Netlify usage shortcut on the Dashboard

Deleted three categories with zero posts and zero references anywhere (Experience, Storytelling, Life) --
Studio's own delete guard should let an empty category through without a fight, so whatever was blocking it
for Asher looked like something else going on client-side; deleted directly instead of chasing that down.

Asher asked whether Netlify's usage/credits could show up inside Studio's own Dashboard, since checking
netlify.com separately felt like an extra step for something this important to watch. Checked directly
against Netlify's own API docs: there's no endpoint for credit balance or usage at all, only account/
payment-method management -- a live number isn't achievable without reverse-engineering Netlify's own
undocumented internal dashboard API, which isn't something worth building on (unsupported, could break
without warning). Added a one-click external shortcut to the real billing page in Studio's "Quick actions"
row instead -- not a live number, just one less step to get to the real one.

## 2026-08-26 — "Join the conversation" clicks now tracked in GA

Asher asked whether that link was tracked separately from everything else — it wasn't, it was a plain
internal link, so GA only ever saw a normal pageview on the destination with no way to attribute it to this
widget specifically. Wired into the site's existing `track()` convention (same one already used for
share/WhatsApp clicks), with separate labels for the desktop bubble and mobile card, so it's possible to
actually see whether either gets used rather than just assuming it's a nice-to-have.

## 2026-08-26 — Category page content was sitting right of center

Asher noticed category pages felt shifted compared to /blog. Real bug: the sidebar reserved space on the
left of the content column with nothing balancing it on the right, so the whole row stayed centered on the
page while the content column itself sat off-center within it. Added a matching invisible spacer on the
right side, same width as the sidebar — content now renders at the exact same position and width as it
does on /blog, confirmed directly rather than assumed.

## 2026-08-26 — Mobile catches up: rotating testimonial card, category browsing accordion

Asher asked whether any of today's desktop-only features could reasonably adapt to mobile, and flagged one
real problem with the obvious approach: a rotating testimonial card sitting in the normal page flow (unlike
the desktop bubble, which floats free of the layout) would reflow the whole page under it every few seconds
as different-length testimonials swapped in. Fixed by pairing a tighter character cap with a fixed
minimum height on the message area, so the card's own footprint never changes regardless of which
testimonial is showing — confirmed by screenshotting it across 4 real rotations (a 30-character testimonial
and a 1,179-character one both truncated) and measuring the exact same 143px card height every time. It
gets the same progress ring as desktop too, just without a tail (nothing nearby for it to visually "speak
from" this far down the page). Placed below the Featured Post specifically, not in the first fold, which
was already tight before any of this.

The comment-count pill (next to search, shown on every size) drops the "· N replies by Asher" clause on
narrow phones — it's a `rounded-full` pill shape built for one line, and wrapping that clause onto a second
line looked broken rather than intentional. Full two-part version stays everywhere there's room.

Category pages get a collapsed-by-default "Browse N posts" accordion near the top on mobile — a persistent
sidebar has no real mobile equivalent without a margin to put it in. No scrollspy highlighting there, on
purpose: meaningfully more complex to keep correct against a list that's collapsed by default, and much
lower value when a reader isn't simultaneously scrolling past it.

Two more direct fixes to the desktop sidebar itself: it now stays a fixed, compact 42rem tall instead of
stretching to fill the entire viewport height, and it auto-scrolls itself to keep the currently-highlighted
post actually visible as a reader scrolls deep into a long category — previously the highlight was applied
correctly but could land on an entry scrolled out of the sidebar's own (shorter) view, with nothing visibly
changing from the reader's side.

## 2026-08-26 — Fixed "Sept" showing up in dates, sidebar drops the click-to-expand step

Asher spotted that September rendered as "Sept" while every other month abbreviated to exactly 3 letters
("Jan", "Aug", "Oct"...) — a real, genuine quirk of the `en-GB` locale's own short-month data (`en-US`
gives "Sep", but flips the day/month order the format depends on). Rebuilt `formatPostDate()` to construct
the string from a fixed month array instead of trusting any locale's abbreviation table at all, so this
can't happen again regardless of what a browser's ICU data does. Also switched to UTC date getters instead
of local-time ones while already in there — a latent bug where a post published right around midnight
could theoretically show a different date on the server than in a reader's browser, depending on which
timezone each one runs in.

Also reworked the category sidebar's "+N more" from earlier today — Asher decided the capped height looked
fine as-is, so the click-to-expand step was just friction. It now shows the full list from the start,
scrollable in place, same as before the toggle was ever added.

## 2026-08-26 — Constant date format, and the category sidebar's "+N more" now actually expands

Two quick follow-ups. Post dates everywhere on the blog now read "10 Aug 2026" instead of "10 August
2026" — one shared `formatPostDate()` helper (`src/lib/formatDate.ts`) used by every post-date display,
so there's one place to keep them consistent instead of three separate copies of the same formatting
options drifting apart over time.

And the category sidebar's "+N more" note — added earlier today — turned out to be a dead end: it told you
how many posts weren't shown, with no way to actually see them. It's a real toggle now: click to expand the
full list in place, click again to collapse back to the compact default.

## 2026-08-26 — A browsable post list on category pages

Asher sketched an idea over a screenshot: on a category page, use the open margin beside the post list to
show every other post in that category, so a reader can jump around instead of scrolling back to the top
each time. Built as `CategoryPostList.tsx`, a sticky sidebar (2xl+ only, same wide-screen-only pattern as
the comment social-proof bubble) that stays in view while scrolling through the category's posts, with its
own internal scroll so it never outgrows the viewport — "Authenticity" alone already has 40 posts.
Deliberately scoped to category pages only, not individual posts: `RelatedPosts.tsx` already handles
cross-post discovery there, at the end of each article, and a second browsing widget in a different shape
would compete with it rather than add anything. No change at all below the 2xl breakpoint.

**Follow-up (same day):** Asher checked it live and had three notes. First, it felt "congested," sitting
too close to the reading column with unused space further out — shifted left with a CSS transform, which
turned out to be the right tool since it doesn't disturb the sticky-scroll math at all (transforms are a
paint-time-only effect). Second, scrolling through all 40 titles inside the sidebar itself felt like a lot
of scrolling, and would only get worse as the category grows — capped the list to the 15 most recent, with
a quiet "+25 more below" note rather than trying to fit everything. Third, Asher asked whether the sidebar
could highlight whichever post is actually in view as you scroll — a real, well-known pattern (usually
called "scrollspy," the same thing a docs site's table of contents does) — built with an
`IntersectionObserver` watching the post cards directly, no new libraries.

## 2026-08-26 — AI image-prompt settings were invisible in Studio, and a subject-selection upgrade

Two related fixes in the same conversation. First: Asher went looking for the image-prompt/composition-mode
templates in Studio's "AI Workspace" and found them blank — the fields exist and the feature was working
correctly the whole time (falling back to the built-in defaults in code), but the actual Sanity document
was created before those three fields existed in the schema, and Sanity doesn't retroactively backfill
`initialValue` into an already-existing document. Patched the document directly (`setIfMissing`, so nothing
already customized got touched) so Studio now shows the real, editable values instead of empty boxes.

Second: Asher found a "senior visual director" prompt template elsewhere and wanted to merge its thinking
into the site's own image-prompt suggester. Rather than restructuring the whole feature around that
prompt's 12-section output (which would fight the existing, deliberate design — a fixed style template
applied server-side so every image stays visually consistent), the merge landed on enriching the reasoning
Gemini does *before* picking a subject: central message, intended emotional response, strongest visual
metaphor, and what to avoid (generic, misleading, too literal). Tested against Asher's actual in-progress
post before shipping — genuinely more metaphor-driven results (a cracked glass heart, a figure walking from
a glowing doorway) instead of literal illustrations of events in the post.

## 2026-08-26 — Gallery images silently disappearing with no primary photo set

Found while Asher was actively writing a new post: a multi-photo gallery block rendered as nothing at all
on the page whenever the primary image slot at the top of the block was left empty and photos were only
added through "More photos" / the bulk Media Library picker — a real, live bug, not a display-style
setting issue as first suspected. Root cause: `portableTextComponents.tsx`'s image handler checked for a
primary image and `return null`-ed immediately if there wasn't one, before it ever looked at whether
`additionalImages` had anything in it. Now it builds the gallery from whichever photos actually exist,
primary or bulk-added. Also: the "More photos" field now shows as compact grid tiles instead of one
full-width row per photo (Sanity's own built-in `layout: 'grid'` option), and the default display style
for a new multi-photo gallery is now "Scrolling strip" instead of "Slideshow" — Asher's own call, since he
doesn't want a style that requires the reader to click through manually.

## 2026-08-26 — Comment speech bubble redesign, and a Studio Comments tool overhaul

**Comment social proof, rebuilt again.** The side-margin card from earlier today still had two real
problems once Asher checked it live: a longer featured testimonial could still shift the card's own height
unpredictably, and the section read as "floating in the middle of nowhere" with no visual connection to
anything else on the page. Rebuilt as an actual speech bubble (tail and all) anchored to a small stat pill
that now sits right next to the search box instead of its own standalone block — the pill shows on every
screen size, the bubble itself stays desktop-only (2xl+). It auto-rotates through every featured comment on
a 7s timer with a thin ring animating around its own border as a "moving to the next one soon" signal —
the ring's start/end point is anchored to the bubble's own tail, not an arbitrary corner, and it measures
the card's real rendered size on every rotation (via `clientWidth`/`clientHeight`, not `ResizeObserver`'s
`contentRect`, which excludes padding and was drawing the ring inside the actual text). The "on Post Title"
link is now a clearer "Join the conversation →" that jumps straight to that post's `#comments` anchor. Both
numbers in the stat pill are the same amber accent color now (both matter equally), and the copy reads
"replies by Asher" instead of "replied to by Asher." The rotation and ring both respect
`prefers-reduced-motion` — flagged by the `ui-ux-pro-max` design skill as a real gap, not something Asher
asked for directly, but a legitimate accessibility fix while already touching this component.

**Two console errors fixed along the way**, surfaced by checking the change on Asher's own local dev server
before it went anywhere near a push (new working agreement — see below): the site's CSP was blocking
React's own `eval()` usage in dev mode specifically (production's CSP is untouched, `unsafe-eval` is now
dev-only); and post dates were hydration-mismatching (`August 10, 2026` server-side vs `10 August 2026`
client-side) because `toLocaleDateString(undefined, ...)` resolves to a different locale on the server than
in the browser — pinned to `en-GB` everywhere a post date renders.

**Studio's Comments tool overhaul.** Two more rounds of Asher's own feedback, both addressed: (1) a
"Featured" management card at the top of the tool lists every comment currently in the /blog rotation with
an Unfeature button on each — first version was an unreadable, ever-growing single column; rebuilt as a
collapsed-by-default accordion (same Show/Hide pattern already used per post group) opening into a
responsive tile grid, so 20+ featured comments stays a fixed height instead of taking over the screen. (2)
The per-post list below it was rebuilt the same way — tiles in a grid instead of one full-width row per
post, which on a wide Studio panel left most of each row empty. Clicking "Show" on a tile expands just that
one to span the full row width so its thread has real room, while the rest stay compact. The old
fixed-column group-header grid and its mobile-only CSS override are gone, both now genuinely unused rather
than orphaned.

**New working agreement:** Netlify's deploy budget is limited (300 credits, 15 per push-to-main deploy), so
changes now get verified on Asher's own local dev server first, with an explicit go-ahead before pushing,
rather than the push-immediately-after-verifying pattern used earlier this session.

## 2026-08-26 — Comment social proof on /blog, and a Trash-confirmation fix

**Comment social proof.** Followed up on a late-night idea from the previous session ("why not both") —
built the combined aggregate-stat + rotating-testimonial concept logged in IDEAS.md. A new section on `/blog`
(between the category strip and the Featured post) shows two honest, live counts — total comments and how
many of those Asher personally replied to, both scoped to comments on *published* posts only, since a comment
sitting on a still-draft post isn't something a visitor could ever actually see or verify. Alongside it, a
real testimonial: Studio's Comments tool gained a "Feature" button (only on genuine visitor comments, never
one of Asher's own replies) that marks a comment as one of a small curated set `/blog` can pick from — picked
at random server-side, real name, real quote, real date shown as a date (deliberately not "2 min ago," since
a lot of the comment base is legacy-imported with genuinely old timestamps). Nothing shows until Asher
actually features at least one comment; the stat line renders on its own until then.

**Trash confirmation fix.** Asher flagged that clicking "Trash" on a comment opened a confirmation ("Yes,
trash it") in a new row that landed far from the click that triggered it, thanks to the Trash button sitting
alone on the right side of the row (`justify: space-between`) while the confirmation card appeared as a
separate full-width row below with its buttons following a long sentence on the left. Fixed by replacing the
Trash button in place with the confirm/cancel pair, in the exact same right-aligned spot — zero travel
distance now, no separate row.

**Follow-up (same day):** Asher flagged, with a live screenshot, that the first fold felt cluttered with the
social-proof section sitting full-width right under the category strip — and separately, that a longer
featured testimonial could shift page content down unpredictably as different comments get randomly picked.
Rather than just moving the section lower (my first suggestion), Asher had a better idea: put it in the
unused side margin on wide desktop screens, and skip it entirely on mobile/tablet where there's no spare
margin to put it in anyway. Rebuilt `CommentSocialProof` as a narrow (16rem) card, absolutely positioned to
sit just right of the main reading column, shown only from the `2xl` breakpoint (1536px) up — below that it
renders nothing at all, so the first fold on every laptop/tablet/phone size is back to just the category
strip and Featured post. Because it's taken out of the normal document flow, it can no longer push page
content down regardless of message length — the testimonial message itself is also now truncated to 160
characters (matching the same `truncateText` pattern already used for post blurbs) so the sidebar card's own
height stays consistent from one randomly-picked testimonial to the next.

## 2026-08-26 — Dashboard motion pass, blog topic browsing, and a Featured post

Asher asked for a UI/UX proposal on two things he'd been sitting with: the Studio Dashboard "feels stiff and
old" despite working correctly, and whether the blog's endless-scroll listing needed more ways to encourage
reading. Analyzed both directly (read the actual components, checked the design skill's own guidance) before
proposing anything, then built exactly what was approved — no redesign, no speculative extras.

**Dashboard** (`DashboardTool.tsx`): the "stiff" feeling traced to two concrete, verifiable things, not a
vague aesthetic complaint — zero motion anywhere (no entrance animation, no hover feedback on the stat cards,
which the design skill's own data flags as a real medium-severity issue) and every card carrying identical
visual weight regardless of what it's telling you. Added a subtle stagger fade/rise-in on load (framer-motion,
~300ms, no bounce/overshoot — the design skill's own motion data specifically warns a bouncier easing "reads
as sloppy" on dense informational UI like this), real hover lift + tap feedback on every card, and gave
"Pending comments" — the single item Asher's own priority-order comment in this file already puts first —
a visually bigger, bolder treatment so the page has one deliberate focal point instead of a uniform grid.
Deliberately left out: trend/sparkline context on each stat, which would need new historical-count
infrastructure that doesn't exist yet — flagged as a bigger, separate undertaking, not folded in here.

**Blog** (`blog/page.tsx` + new `FeaturedPostCard.tsx`): checked what already existed before proposing
anything new (reading-progress bar, Related Reading, on-site search, comments were all already shipped) —
the real, verified gap was that the blog listing had category and tag pages (`/blog/category/x`,
`/blog/tag/x`) with literally no link to any of them anywhere on `/blog` itself. Added a category browsing
strip near the top (only the 8 of 11 categories that actually have posts — the other 3 would've been dead-end
clicks, checked against real data before deciding) and a "Featured post" reference field on Site Settings,
letting Asher deliberately choose what a first-time visitor sees first instead of it always being whatever's
newest — shown in its own distinct card treatment, excluded from the regular feed (including every "Load
more" page) so it never appears twice. Left empty by default; the page renders exactly as before until Asher
sets one. Deliberately not built: a "series" grouping feature — checked, and the existing tag system (family
update, recovery update, etc.) already does most of that job through Related Reading.

**Follow-up the same day**: Asher looked at the shipped category strip and flagged it as feeling "orphaned"
— it reused the exact same visual style as the small metadata tags already sitting inside every post card,
with nothing distinguishing "here's a description" from "here's something to click." Added a small "Browse
by topic" label above the strip and a real post count on each pill (`BLOG_CATEGORIES_WITH_POSTS_QUERY` now
returns `count` too) — the count does double duty, since a number next to a word reads unambiguously as "a
filterable collection of N things" even without the label. Verified the counts against real data (Theatre 9,
Authenticity 33, etc. — matches exactly) before shipping.

## 2026-08-28 — Fixed: Studio's GIF picker squished again once results scrolled

Asher hit this live, replying to a comment from Studio: search results rendered as tall, unusable strips
instead of squares. The 2026-08-21 squish fix was real but only ever verified against a results grid that
fit without scrolling — turns out that's exactly the condition the remaining bug needed. Reproduced in an
isolated test page (same `@sanity/ui` `Grid` + `aspectRatio: '1'` markup, a real generated animated GIF, not
a placeholder): a 6-result grid (2 rows, no scrollbar) rendered clean squares every time; the same markup at
24 results (8 rows, needs its own scrollbar) rendered every cell as a tall strip, no exceptions — a genuine
CSS Grid + `aspect-ratio` + `overflow: auto` interaction, not a markup mistake. Fixed by dropping
`aspect-ratio` for the older padding-bottom-percentage technique (a square derived from the wrapper's own
width, never from the grid's row-track sizing), confirmed against the same isolated repro before porting
into `CommentsTool.tsx`. Also added `loading="lazy"` to the thumbnail, matching the public comment form's
picker and cutting down on 24+ GIFs all decoding/animating at once. Full root-cause writeup in
`RUNBOOK.md`.

## 2026-08-21 — Fixed: check-links was failing on a permissions-limited token on Netlify

Testing the new GitHub Actions cron replacement turned up a second, separate bug: `check-links` returned a
500 even with the correct `CRON_SECRET`. Ruled out the secret and the Sanity connection first —
`purge-trash` succeeded fine using the exact same `writeClient`. Asher pulled the real error from Netlify's
own function logs: `Insufficient permissions; permission "update" required`, a 403 straight from Sanity.
Purge-trash only ever *deletes*; check-links *updates* existing `linkCheck` documents from earlier runs —
so whatever token was set as Netlify's `SANITY_API_WRITE_TOKEN` could create and delete but not update.

Vercel's copy of the token turned out to be locked/unreadable too, so the fix ended up being a fresh Sanity
API token instead — scoped to just this project with the **Editor** role (full content access, no org-wide
permissions), pasted into both the Production and Deploy Previews contexts on Netlify. One extra gotcha
along the way: saving the new value alone didn't fix anything — Netlify only applies an environment variable
change on the *next* deploy, not to whatever's already running, so it took an explicit "Trigger deploy"
before the fix actually took effect. Confirmed fixed by re-testing directly: `check-links` now returns a
clean 200 (58 links checked, 2 genuinely broken — a real, unrelated, pre-existing finding). `publish-scheduled`
uses the identical write pattern, so it's confirmed fixed too without needing to trigger a real early publish
just to prove it.

## 2026-08-21 — Rebuilt the 3 scheduled tasks on GitHub Actions, added a /services redirect

Two follow-ups from checking Google Search Console and the Netlify migration earlier today.

**Scheduled tasks, rebuilt.** The nightly trash purge, link checker, and scheduled-publish routes had no
scheduler calling them since Vercel Cron stopped applying (see the entry above). Went with GitHub Actions
over building real Netlify Functions: it's portable to wherever the site ends up hosted next, and this repo
already has a proven, working example (`backup.yml`) to follow. Added three focused workflows —
`cron-purge-trash.yml`, `cron-check-links.yml`, `cron-publish-scheduled.yml` — each just a scheduled `curl`
against its route with the same `Authorization: Bearer <CRON_SECRET>` header Vercel used to attach
automatically, at the same original UTC times. Needs a repository secret named `CRON_SECRET` (same value as
the one already configured on Netlify) to actually authenticate — that part needs Asher's own GitHub access,
same as the earlier Netlify dashboard step did.

**`/services` redirect added.** The one real gap from the Search Console check — an old WordPress services
page that 404s with nothing pointing anywhere. Added a redirect to `/#coaching`, the closest modern
equivalent, confirmed live.

## 2026-08-21 — Every deploy since moving to Netlify had been failing — fixed the config

Asher moved asheraw.com's DNS over to Netlify from a mobile session (confirmed directly with him — this
wasn't a stray/unauthorized change). Checking the Netlify dashboard found every deploy since `netlify.toml`
was first added had failed at "Reading and parsing configuration files." Confirmed the exact cause with
Netlify's own CLI (`netlify status`): `Configuration property functions must be an object` — the file's
`[[functions]]` blocks (trying to schedule the 3 `/api/cron/*` routes the way `vercel.json`'s `crons` array
used to) used an array-of-tables shape that isn't valid Netlify config at all; `functions` has to be a single
table, and Netlify Scheduled Functions only ever schedule a real Netlify Function by name, not an arbitrary
path the way Vercel Cron does. Removed the invalid blocks so deploys can succeed again, confirmed via
`netlify status`/`netlify build --dry` locally (the config-parsing error is gone; what's left is only "not
logged in," expected in this sandbox with no Netlify auth).

**Real gap, not resolved yet**: none of the 3 scheduled tasks (nightly trash purge, link checker, scheduled
publishing) have a working scheduler right now. The routes themselves are untouched and still work if called
directly — they're just not being called by anything on Netlify the way Vercel's cron used to. Needs Asher to
weigh in on the replacement (a real Netlify Function wrapping each route, vs. an external pinger like GitHub
Actions) rather than picking one unprompted, since either needs a new secret/config choice on his end.

**Also worth knowing**: DNS now resolves to Netlify's own load-balancer IPs (confirmed via `nslookup`), so
Vercel is no longer what's actually serving asheraw.com, even though `npx vercel ls` still shows successful
Vercel deploys — that's a live Vercel *preview* deployment, not the production domain anymore. Every
verification step in this log that said "confirmed live" going forward needs to mean Netlify, not Vercel.

## 2026-08-21 — The "Powered by Netlify" badge can't be hidden with CSS — removed the dead attempt

A separate session had added `netlify.toml` and a `[data-netlify-badge] { display: none !important; }` rule
in `globals.css` to hide Netlify's free-plan badge. Asher reported the badge was still showing. Checked
Netlify's own docs directly rather than guessing at another selector: the badge is injected at Netlify's edge
into an isolated `<iframe>` *specifically so a site's own CSS can never reach it* — no selector was ever going
to work, correct attribute name or not. Removed the dead rule and replaced it with a comment pointing at the
actual, officially-supported switch: Netlify dashboard → Project configuration → General → "Powered by
Netlify badge" → off. Works on the Free plan, no upgrade needed — just needs Asher's own login, which is why
this couldn't be finished from here.

## 2026-08-21 — Fixed squished GIF thumbnails and added a "load more" to the GIF picker

Asher noticed two things about the GIF picker in Studio's Comments tool: the thumbnails looked squished, and
search never went past the first page of results. Both turned out to be real, and both got fixed everywhere
this picker exists (Studio's reply/edit forms and the public comment form on the blog), not just where he
happened to notice them.

**The squish** was Studio-specific — its thumbnail button relied on `aspectRatio: 1` to force a square, but
with no explicit `width` set, the button sized itself from its own content (the image's natural, usually
non-square dimensions) instead of the grid column it sat in. The public form's identical-looking CSS
(`aspect-square` inside a real `display: grid` container) never had this problem, since CSS Grid's default
`stretch` behavior already gives every item a definite width to compute the square from — `@sanity/ui`'s own
`Grid` apparently doesn't stretch children the same way. Fixed by adding an explicit `width: '100%'`, which
sidesteps needing to know exactly why Sanity's Grid behaves differently.

**The pagination** was a real, shared gap — `/api/gif-search` never accepted an offset, hardcoded to one
batch of 24 results with no way to ask Giphy for more. Added `offset` support server-side (returning
Giphy's own `hasMore`/`nextOffset` so the client doesn't have to guess), then wired an infinite-scroll
sentinel into both `GifPickerButton` implementations — same `IntersectionObserver`-on-a-scoped-container
pattern already used by the bulk image picker and Media Library tool, appending each new batch rather than
replacing the list. Verified against the live public comment form: thumbnails came back genuinely square
(98×98, not stretched), and scrolling the results box loaded a second batch of 24 with zero overlap with
the first.

## 2026-08-21 — Can now attach a GIF when editing a comment, not just when replying

Asher asked why he couldn't add a GIF while editing a comment in Studio, when replying already had a GIF
picker. Turned out editing and replying were always two separate code paths that had drifted apart — the
reply form already had the full Giphy search/attach flow, but the edit form only ever had a plain text box
and a date field, no `gifUrl` handling at all. Added the same `GifPickerButton` (search, pick, preview,
remove) to the edit form, and relaxed the Save button's validation to match the reply rule already in place
elsewhere: a GIF alone is a valid comment, same as text alone. Saving now explicitly unsets `message`/`gifUrl`
in Sanity when either is cleared during an edit, rather than leaving a stale value behind.

## 2026-08-21 — Posts list can now sort by the post's own date

Asher has a backlog of draft posts imported from Facebook posts spanning several years, and wanted to work
through them in real chronological order — but Studio's built-in "Sort by" menu on the Posts list only ever
offers Title, Last Edited, or Created, none of which is the date that actually matters here (Created is when
the Sanity draft happened to get typed up this week, not when the original Facebook post was from). Added two
custom orderings to `postType.ts` using the existing `publishedAt` field — "Sort by Post Date, Newest" and
"Sort by Post Date, Oldest" — which now show up as real options in that same menu, same mechanism the
Comments tool's own "Newest first" ordering already used.

## 2026-08-16 — Blog page heading and tagline are now editable in Studio

Asher noticed the "Dig The Mind of Asher" heading and the "still a Work-In-Progress" line under it on
`/blog` were hardcoded and asked for them to move into Site Settings so he can change them without needing a
code change. Added `blogHeading` and `blogTagline` fields to the `siteSettings` singleton (new "Blog page
header" section, same pattern the site title/description/social-image fields already use), pre-filled with
today's exact text so nothing on the live page changes until Asher actually edits them. The page still falls
back to that same text as a hardcoded constant if Site Settings is ever missing the fields entirely (a fresh
dataset, for instance) — same safety-net pattern as the site-wide title/description fallback in the root
layout.

## 2026-08-16 — Fixed the Scrolling Strip gallery not looping with only 2 photos

Asher noticed the "Scrolling strip" display style (variable-width photos, auto-scrolls sideways forever)
looped fine with several photos but stalled at the end with only 2. Root cause: Embla Carousel's loop mode
works by cloning the far slide onto the opposite edge to fake a seamless wrap, and that trick only holds up
if the *other* slides already span the full viewport width on their own -- with just 2 photos at a fixed
height, their combined width is almost never enough, so Embla silently drops back to `loop: false` (no error,
no warning surfaced to Studio) and the auto-scroll plugin correctly stops dead at the end since it can see
looping is off.

Fixed in `ImageCarousel.tsx`'s `ScrollStrip`: below 6 total images, the strip now repeats the photo set
enough times to comfortably clear Embla's internal width check, regardless of each photo's actual aspect
ratio. Repeating 1-2 photos is also just the correct behavior for an "auto-scroll forever" strip that short
on its own -- there's no other sensible way to fill an infinite scroll with so few images. Verified against
a real temporary post with exactly 2 real photos: tracked the strip's pixel position over several seconds and
confirmed it wraps and keeps moving indefinitely rather than freezing, then deleted the test post.

## 2026-08-16 — Fixed a self-referencing reply bug, added 3 more Facebook posts as drafts

Asher manually counted the comments on "I Made 100 Videos..." after the audit above and found only 20
visible against a badge showing 23 — a real bug, not a stale count. Three of Asher's own replies had their
`parentComment` pointing at themselves instead of the comment they were replying to (a copy-paste indexing
slip in that post's original hand-transcription, before the general parser existed). A comment referencing
itself as its own parent doesn't render as either a top-level comment or a nested reply, so it silently
vanishes from the threaded view while still counting toward the total. Fixed the 3 affected documents and
swept every comment on the site for the same shape of bug — confirmed nowhere else, isolated to this one
post.

Also added 3 more Facebook posts as drafts that Asher flagged as missing, using the parallel session's
`scripts/import-facebook-posts.mjs` importer (`.md` files with frontmatter + a "## Comments" section):
"2nd Warning: A Spoiler-Full Review of Mulan" (Part 2 of the existing Part 1), "How Would I Measure My
Success?", and "How Exactly Do You Stand Out?" — the last one's comment thread was initially skipped since
the only version available was a heavily downscaled screenshot too low-resolution to transcribe reliably.
Asher then sent the real, full-resolution screenshot chunks, and all 35 comments (matching Facebook's own
displayed count exactly) got added in a follow-up pass. None of the three have a featured image yet — pasted
chat images aren't accessible as files to write against Sanity's asset API, so all three need Asher to add
their photo manually in Studio, same as the rest of this week's backlog.

**Two gotchas working with `import-facebook-posts.mjs` directly** (not bugs in the script itself, just its
behavior worth knowing): it uses `createOrReplace` on the whole post document, so re-running it on a post
after manually patching a field the script doesn't set (like `legacyFacebookThreadUrl`) silently wipes that
field back out — patch such fields *after* the last import run, not before. And comments lacking an exact
timestamp all fall back to the same `createdAt` (the post's `publishedAt`), which is fine for the parent/child
links but leaves every comment tied on "Newest first" sort — spread them a minute apart in thread order
afterward if display order matters, same fix applied earlier in this same session for relative-timestamp-only
comments.

## 2026-08-16 — Cross-checked every remaining Facebook comment folder against Sanity, fixed 13

Asher flagged one specific post ("I Made 100 Videos But 1 Text Post Changed Everything") whose comments
looked like they hadn't loaded, then asked for a full check of everything in `Downloads\comments\` against
what's actually in Sanity, since he'd finished handing over extractions for his complete list of Facebook
post URLs. Audited all 51 folders (44 with a `comments_<id>.txt` file, 6 older screenshot-based folders, one
`_to_delete`) by comparing each file's own stated comment total against a live count query per matched post.

Found a systemic issue, not just the one flagged post: 12 posts were stuck on a small partial import (often
exactly 9 or 10 comments regardless of how many the post actually had) — the fingerprint of a batch-import
script that had died silently partway through rather than failing loudly, the same failure mode documented
elsewhere in this log. Wrote a general-purpose parser for the established `>>`-nesting comment-file format
(handling exact timestamps, Facebook's relative-only "1y"/"[Edited]" timestamps on screenshot-transcribed
sections, and multi-tag header lines like `[NESTED reply, level 1]  [note: reply addresses "X"]`), validated
it against each file's own stated total before writing anything, then rebuilt all 12 threads via batched
`client.transaction()` writes (never the sequential-await pattern that caused the original silent failures).
One file's own header count (199) turned out to be a 1-comment human tally error against its own transcribed
content (198) — left as-is rather than fabricating a 199th comment that was never actually transcribed.

Five more posts looked mismatched at first glance (Sanity showing *more* comments than the extraction file's
stated total) but turned out fine on inspection — either Sanity already held a more thorough transcription
than the current extraction file, or the "extra" comments were genuine live-site visitor submissions
unrelated to the Facebook import. Also found one real Facebook post ("The Joy Was Cut Short...", about
Asher's brother's hospital readmission) whose 93 comments had no post to attach to by URL match — turned out
the post already existed and already had all 93 comments, just missing its `legacyFacebookThreadUrl` field
(backfilled). Net result: every folder in the directory is now confirmed either complete or accounted for.

## 2026-08-16 — Added a one-click "Approve all pending" button to the Comments tool

The last mass-approval (614 comments, see the "approved the whole backlog" entry further below) was done as
a one-off direct write against Sanity, not through anything in Studio itself — there was no button for it,
so a fresh backlog of pending comments piling back up (491 by the time Asher asked again) had no faster path
than approving them one at a time. Built the real thing this time: a banner in the Comments tool, matching
the existing "Publish all draft comments" banner's look and behavior (batched writes, a live done/total
counter, per-comment error reporting instead of one failure aborting the rest), that shows up once pending
comments cross 20 at once — below that, the normal one-by-one Approve button is still the better fit, so the
banner deliberately doesn't show for an ordinary handful of day-to-day pending comments. Reuses the same
reply-notification call the single Approve button already makes, so a batch that happens to include a real
subscriber-eligible reply still emails them — in practice that's always empty for legacy-imported comments,
since `notifyOnReply` is only ever set by someone submitting through the live comment form.

## 2026-08-16 — A "Wide" option for photo galleries, and a Comments/Media review

Asher asked whether certain posts could use the full screen width on desktop — his example was a 123-photo
gallery that felt like an endless scroll in the normal text column. Built as a new "Wide" choice on the
Image block's existing Display size field, scoped to that block only rather than the whole post: stretching
actual paragraph text across a full wide screen makes it harder to read, so a whole-post toggle would have
fixed the gallery at the cost of quietly hurting anything written on the same post. Masonry galleries
specifically needed more than just a wider box — a wider container with the same fixed column count just
makes existing photos bigger, not more per row, so Wide also adds real extra columns at desktop widths.
Confirmed on mobile there's nothing to change: Wide looks identical to normal there, since there's no extra
screen width to break out into on a phone in the first place. Verified against a real temporary post with
real photos (screenshotted, checked for the wide-mode 100vw scrollbar-overflow bug specifically, none found)
before shipping, then deleted the test post.

Also reviewed Studio's Comments and Media Library tools for UX gaps and checked the site for anything genuinely
stale — nothing urgent came up. Real findings: 21 of 255 image assets are currently unused, the Comments list
still has no pagination/virtualization (a known, already-documented gap that hasn't mattered yet but the
comment count has roughly doubled since it was last measured), and one old script
(`scripts/fix-draft-referenced-comments.mjs`) is confirmed still outdated and safe to delete. Scheduled a
one-time check-in for 2026-09-16 to revisit these rather than act on them now.

## 2026-08-16 — Cross-checked the final 13 Facebook comment threads, and approved the whole backlog

The last 13 posts from the "still in progress" list got their text-file extractions finished, so cross-checked
and updated all of them the same way as the earlier 9 — same parser, revalidated against every file's own
stated total before writing (all 13 matched exactly). 12 built fresh; one ("Bringing Luke to Church",
already published with 8 real comments) got rebuilt from the fuller 19-comment extraction with the existing
8 carried forward under their approved status, same content-matching approach as the earlier batch.

A handful of entries across 4 of these files came with an explicit note flagging a specific mis-scrape (a
reaction/sticker the automated pass read as textless, corrected by cross-referencing the screenshot) — applied
those by hand, keyed on more than just name+timestamp after catching a real near-miss: two different people's
replies from Asher landed in the exact same minute in one thread, and a looser match would have overwritten
the wrong one. One of the seven flagged corrections was missed on the first pass (a comment on "Appreciate
Every Prayer") and caught during final verification — fixed directly afterward.

Separately, Asher asked to approve the entire pending backlog now rather than one at a time — 614 comments
at the time, since he'll still review them individually later regardless. Batch-approved all of them (3
already-rejected ones left untouched, that was a deliberate earlier call). Since every comment's `post`
reference already points at each post's eventual published ID (not the temporary draft ID — see RUNBOOK),
nothing further needs to happen for approved comments to appear the moment each post actually goes live.

## 2026-08-16 — Fixed the Media library lightbox never loading a GIF

Asher noticed clicking a GIF thumbnail opened the lightbox but nothing ever appeared. Measured it directly:
the full-size request was quietly ballooning a 3.8MB GIF into a 79.6MB file, because resizing an animated
GIF means re-encoding every single frame at the new size. Fixed by skipping the resize entirely for GIFs and
loading the original file untouched — same rule already applied to GIFs everywhere else on the site.

## 2026-08-16 — Bulk photo picker now marks what's already in the gallery

Asher noticed reopening the "Add multiple from Media Library" picker to add more photos showed every tile
unchecked again, including ones already added — an easy way to add the same photo twice by accident.
Already-added photos now show a clear "Added" badge and can't be clicked at all, so a duplicate isn't just
harder to cause by mistake, it's not possible through this picker.

## 2026-08-16 — Cleared the last 25 posts' SEO fields without Gemini

Asher decided to generate the remaining backlog images himself manually (no billing wall to work around
there), and asked whether the text half — SEO title, excerpt, tags, category — could be done without
Gemini too, since that's what had hit its own free-tier daily cap. It could: read each of the 25 remaining
posts' real content directly, drafted the SEO title/excerpt/tags/category for each by hand following the
exact tuned prompt and voice instructions already saved under Studio's AI Workspace (not the generic
defaults), and wrote them straight to Sanity — no API calls, so no quota to hit. One deliberate exception:
"Stop Saying AI Won't Replace People" reads as an opinion piece rather than a life update, so it got both
Authenticity and the existing "Artificial Intelligence" category rather than Authenticity alone, matching
how a couple of the original 8 posts already carried a second category when it genuinely fit. All 25
verified written and spot-checked; everything stays a draft for Asher's own read-through before publishing,
same as always. One source file flagged its own content as reconstructed from an AI summary rather than a
verbatim transcript ("Recovering From COVID, Reflecting at Nas Summit") — worth a glance against the
original before that one goes live.

## 2026-08-16 — Fixed the new bulk photo picker stalling past 60 images

Asher reported the "Add multiple from Media Library" picker (shipped earlier today) wouldn't load past a
certain number of photos. Real bug: the first version fetched a flat 60-image slice with no way to see more
at all. Fixed by giving it the same scroll-to-load-more behavior the Media library page itself already has —
scrolling toward the bottom of the picker's own grid now loads the next batch automatically.

## 2026-08-16 — Cross-checked 9 more Facebook comment threads, fixed GIFs breaking on the site, and added GIF search + bulk photo picking to post editing

Asher sent a new, richer round of Facebook comment extractions (this time real text files instead of
screenshots — a mix of automated scraping plus manual fallback for whatever the scraper missed) for 9 posts,
and asked to cross-check and update the comments database against them. Since the new format was
machine-generated and highly consistent (a source URL, an explicit gap-vs-Facebook's-own-count summary,
nesting marked with `>>`/level annotations), built a real parser instead of transcribing by hand — validated
it against every file's own stated total before writing anything, catching and fixing one parsing bug (a
trailing "[Edited]" tag after the nesting annotation) along the way. Two of the 9 already had exactly
matching comment counts from an earlier pass this week; diffed them content-by-content rather than trusting
the count alone, found only cosmetic differences (plus one case where the earlier manual work was actually
more accurate than the new automated scrape — a sticker described visually vs. the scraper just grabbing
Tenor's attribution text), so left those two untouched. The other 7 needed real work: 5 built fresh, 2
rebuilt from a much larger set than before, with already-approved comments carried forward under their
approved status by content match (avoiding hiding real, already-public comments from the site while still
adding everything the earlier rough import missed).

Separately, three site issues Asher raised in the same message:

- **GIFs looked broken on the site.** Root cause: `next.config.ts` forces every image through Next's
  AVIF/WebP optimizer, which flattens an animated GIF to a single static frame — the exact bug already
  fixed for comment GIFs, just never extended to a post's own Featured Image or body images. Fixed the same
  way: detect a GIF by its Sanity CDN URL (which keeps the real file extension) and render it as a plain
  `<img>` instead, in the featured image, single body images, and the image-gallery block's carousel mode.
  Listing-card thumbnails and related-post cards intentionally stay static JPGs — animating dozens of GIFs
  across a blog index page isn't something to "fix," it's already the right call.
- **No way to insert a Giphy GIF into a post's actual content**, only into comments. Added "Insert GIF
  (Giphy)" as a third option on every image field site-wide, alongside the existing Upload/Upload
  (compressed) — searches the same Giphy proxy the comment pickers already use, downloads the chosen GIF
  server-side, and uploads it into Sanity as a real image asset (an image field needs a real asset, not
  just an external URL).
- **Bulk-uploaded photos into the Media Library, but no way to bulk-add them into a post.** The gallery
  block's "More photos" field now has an "Add multiple from Media Library" button above the existing
  one-at-a-time Upload/Select flow — opens a searchable, multi-select grid and adds everything picked in
  one go.

All three verified with `tsc`/`npm run build`/Studio's schema-bootstrap check, plus a real end-to-end test
of the new GIF pipeline (searched Giphy, downloaded, uploaded into Sanity, confirmed the resulting asset
actually serves as `image/gif`) — test asset cleaned up afterward, same as every other real-data
verification this project does.

## 2026-08-14 — Media library: smaller thumbnails, a lightbox, auto-loading on scroll, and sorting

Asher asked for four fixes to Studio's Media library in one go: thumbnails felt too large, clicking one did
nothing, more photos only appeared after clicking "Load more," and there was no way to sort the library at
all. Built all four:

- **More columns** (2 up to 7 depending on screen width, was capped at 5) so each thumbnail renders smaller
  without touching the underlying 200×200 crop.
- **A lightbox**: clicking a thumbnail (outside "Select" mode, which still uses a click to tick the
  checkbox) now opens a full-size view with filename, size, and which posts use it — plus arrow-key/on-screen
  prev-next navigation through whatever's currently visible.
- **Auto-loads on scroll**: a small sentinel below the grid triggers the next page automatically via
  `IntersectionObserver` once it nears the viewport, replacing the manual "Load more" button. Search results
  are unaffected (already return up to 100 in one shot, nothing to page through).
- **Sorting**: a dropdown next to the search box — Newest/Oldest, Filename A–Z, Largest file first, and
  "Unused only" (surfacing the existing "not used anywhere" flag as an actual filter instead of something
  you'd have to scroll the whole library to find). Applies to search results too, not just the plain browse
  view, so switching to "Unused only" then searching doesn't quietly show used images again.

Verified with `tsc`/`npm run build` clean and Studio's schema-bootstrap check; real click-through (lightbox,
scroll-triggered loading, sort switching) still needs confirming after deploy — this sandbox has no way to
get past Studio's own "Connect this Studio to your project" CORS gate to click-test it directly, a known,
already-documented limitation (see RUNBOOK.md), not new to this change.

## 2026-08-14 — Started clearing the Facebook-import backlog with AI: SEO fields, categories, and a real image-generation blocker

Asher wanted the 40 still-bare Facebook-import drafts (title/body only, no image/excerpt/SEO/category) run
through the site's existing AI tools automatically instead of one at a time by hand, prioritizing speed over
polish — the AI-suggested image was explicitly fine as a placeholder to swap later. Built a resumable batch
script (`scripts/process-facebook-backlog.mjs`) rather than a Studio button, since this is a one-time job:
it calls the site's own `/api/ai/suggest-seo` and a new `/api/ai/generate-featured-image` route per post,
re-derives what's still missing from each post's actual current fields (not a fragile one-shot flag) so
it's always safe to just re-run, and applies SEO title/excerpt/tags plus a default "Authenticity" category
(matching every previously-published Facebook import) directly — everything stays a draft for Asher's own
final skim, nothing auto-publishes.

**New, permanent capability, not just script glue**: `generate-featured-image/route.ts` + a new "Generate
Featured Image" Studio action (`generateFeaturedImage.tsx`) — the automated sibling of the existing "Suggest
Image Prompt" action. That one deliberately stops at 3 prompts to paste into DreamLab by hand (the spec's
own rule against automating a workflow with no stable official API). Gemini's own image model IS a stable
official API, so this one picks the single most visually appealing/curiosity-driving concept (reusing
Asher's exact established steel-plate-engraving template, unchanged), renders it, and attaches it as the
post's Featured Image directly — kept as a real one-click button for any future post, not deleted once the
backlog's cleared.

**Hit two real, distinct free-tier walls, not the same problem twice.** Every Gemini image model this API
key can see (Nano Banana, Nano Banana 2, Nano Banana Pro, and the lite variant — checked directly via
`ai.models.list()`, not guessed) returns a hard `limit: 0` on the free tier — not a quota that resets,
image generation on this project needs billing enabled, full stop. Separately, the *text* model used for
SEO suggestions (`gemini-3.6-flash`) turned out to have a real but much smaller free daily cap than assumed
(20 requests/day, not the ~500 general docs suggested) — discovered when a batch of failures turned out to
be `RESOURCE_EXHAUSTED` errors the API route was silently flattening into a generic "couldn't get a
suggestion" message before the script ever saw them. Fixed both routes to surface the real error/429 status
so a future run can detect and stop cleanly instead of thrashing through a wall of doomed retries.

**Result so far**: 15 of 40 drafts have SEO title/excerpt/tags/category applied and spot-checked for
quality (coherent titles, curiosity-driving excerpts, sensible tags, correct category). The rest is paused
pending Asher's call on whether to enable Gemini billing — cheap either way (text calls are near-free,
images run roughly $0.02–0.04 each) but a real decision on his account, not one to make unilaterally. The
script picks up exactly where it left off either way, no rework needed once unblocked.

## 2026-08-14 — Progress counter on the "blocking publish" fix button

Asher hit the "N document(s) are blocking '...' from ever publishing" banner again (93 this time), clicked
"Fix them now," and asked for visibility into how far along it was — the same thing the tool's sibling
"Publish them now" button already shows for stuck draft comments. Gave it the identical treatment: the
button now reads "Fixing… N/total" while it works through each blocker one at a time, instead of just
sitting on "Fixing…" with no sense of progress. Nothing about what the fix actually does changed, only what
Asher can see while it runs.

## 2026-08-14 — Rebuilt "The Joy Was Cut Short" comments from screenshots (93 total), and a self-caused publish scare along the way

Asher provided 10 screenshots for this post's real Facebook thread. The original imported version only had
10 terse comments; the real thread was much deeper — full transcription came to 93 comments once every
reply chain was accounted for, matching Facebook's own comment-count badge exactly as the correctness check.

Along the way, a verification script gave a false reading: it checked for draft content using a Sanity
client with no write token, which — confirmed after the fact — can't reliably see `drafts.*` documents in
this project regardless of any other setting. That made it look first like the post had gone live without
review, then like it had vanished entirely, neither of which was true. Re-checked with a properly
authenticated client and got the real picture immediately: nothing was lost, the post was exactly where it
should have been. One real side effect from the confusion window: the post genuinely was briefly live during
it, and Vercel's page cache had captured that moment, so the live URL kept serving stale content even after
Sanity itself was confirmed correct. Cleared with the site's own `/api/revalidate` route. Disclosed the full
mistake to Asher directly rather than quietly moving past it — no data was actually lost, but the diagnosis
process itself was wrong for a while.

## 2026-08-14 — Cross-checked "The White Stuff" comments against Facebook

Same screenshot cross-check pattern as the other posts this week, 4 screenshots this time. Found and fixed
the same two recurring issues as before: a few separate commenters' messages had been merged into one
document, and one very long reply chain (7 levels deep on Facebook, one exchange about a knee injury) had to
be clamped to this site's 3-level nesting limit, same rule the import script itself already enforces —
flattened into siblings past that depth rather than dropped, so no actual conversation content was lost,
just its exact visual indentation past level 3. Final count matches Facebook's badge exactly.

## 2026-08-14 — Fixed why Studio's Comments page was laggy, then fixed the bigger part of it

Asher asked directly why Comments felt slow. Checked with real numbers rather than guessing: 808 comments
now exist (versus the dozens this tool was ever tested against), and the page was re-scanning the entire
comment list from scratch on every single interaction — a keystroke in search, hovering a button — not just
when data actually changed. Fixed by building a lookup once instead of re-scanning every time; same data,
same order, just far less repeated work. Should make typing and clicking noticeably snappier on its own.

Flagged the bigger, remaining piece honestly rather than just fixing it unilaterally: with hundreds of posts
sitting pending mid-import, nearly all of them were auto-expanding open at once, which was probably the
actual "heavy page" feeling. Asher's answer was clear and specific: keep everything collapsed by default
while he's still working through the import (real visitor traffic on old posts is basically nonexistent —
his words, "no one, except a good friend Joycelyn, comes by"), but once pending comments drop back under 10,
auto-expanding the odd one or two again is exactly right. Built as a threshold, not a one-way switch — it
self-corrects once the import's done and stays out of the way in the meantime. Also switched the group
sort's "most recent" signal from a comment's own (often years-old, imported-from-Facebook) date to when it
was actually added to this site, so working through the import surfaces "the one I just finished" at the
top instead of burying it under old threads that happen to carry a more recent original date.

## 2026-08-14 — Cross-checked 4 more imported Facebook threads against the real comments, and Studio gets its own emoji/GIF pickers

Two follow-ups. First: Asher provided screenshot folders (one per post slug) for 4 more of the imported
posts and asked to cross-check and fill in whatever the original import missed, same as the "How
Unremembered Books" pass the day before. Findings varied post to post: "Throwback to 2004" was already
complete (12 comments, word-for-word match, nothing to do). "Unfollow Now" needed a full rebuild — the
original transcription had literally merged two different people's separate comments into one document, and
had zero of Asher's own replies. "Update on My Brother (Jan 2023)" had zero comments captured at all,
built fresh from 47. "Update Since the Fall" was 9 of 10 already correct, one placeholder fixed, 42 added.
Every post now matches Facebook's own comment-count badge exactly. All new/fixed comments sit as
`pending`, same as before — review and approval still happens in Studio.

Second: the public comment form has had emoji and GIF pickers since the previous pass, but replying as
Asher from Studio's own Comments tool didn't — he pointed this out directly. Added both there too, reusing
the exact same `/api/gif-search` proxy (no second Giphy key needed), rebuilt against `@sanity/ui`'s own
Popover/TextArea components since Studio can't reach into the public site's component library. A Studio
reply can now be GIF-only too, matching the public form's rule.

## 2026-08-13 — 48 old Facebook posts pulled into Sanity as drafts, with real nested comments

Asher wanted his old public Facebook posts on his own site — partly because Facebook comments are
unreadable to anyone not logged in, and partly because the comments themselves are proof people actually
engage with him, which he wanted visible on asheraw.com rather than locked inside Facebook.

Fetched 48 share-link URLs he provided. 43 came back cleanly through WebFetch — Facebook still serves the
actual post text and top comments behind a login *nag*, not a hard wall, for public posts. The other 5 hit
a genuine login wall every time, including on retry.

Before falling back to manual work, tried the "correct" route first: Meta's Graph API Explorer, to pull
structured comment JSON directly instead of screenshotting. Confirmed dead, not just fiddly — personal
profile "singular status" post lookups were deprecated in Graph API v2.4+, and the `/me/posts` fallback is
blocked outright by Meta's "New Pages Experience" migration. Two clean, different failures in a row was
enough to call it and move on rather than keep guessing at permission tweaks.

So: manual capture for the 5 stragglers, via full-page Fireshot screenshots (Print-to-PDF also works, and
is one shot instead of stitching). For the longest thread (16,800px tall), split into ~3,000px overlapping
segments rather than reading one giant compressed image — kept transcription accuracy high enough to catch
real detail, like discovering a "Most relevant" comment sort isn't chronological (two user-supplied
timestamps proved the later comment listed first), which killed a plan to interpolate missing comment dates
by position.

All 48 posts staged as Markdown in `facebook-imports/`, matching the site's existing Sanity export
frontmatter schema, each with a `## Comments` section preserving full reply nesting via indentation.

Built `scripts/import-facebook-posts.mjs` (modeled on the existing legacy-post importer) to actually bring
them in: each post becomes a Sanity draft (`drafts.facebook-<slug>`, never published until Asher says so),
and — a real decision point, not assumed — each Facebook comment becomes an actual `comment` document using
the site's real comment schema rather than flattened into the post body as text. That means correct
`parentComment` threading (clamped to the site's existing 3-level nesting rule, same as live visitor
comments), `isAuthorReply` flagged wherever Asher himself replied, and every comment landing at
`status: "pending"` — nothing surfaces on the live site until he reviews and approves it in Studio.

Ran it: 48 posts, 578 comments, all as drafts/pending. Caught two real bugs afterward by verifying against
the live dataset instead of trusting the script's own "success" output — first, a comment-name parser bug
where the colon from the source `**Name:**` markup leaked into the stored name, which also silently broke
reply-nesting detection for every comment using the `(reply)`-annotation convention (not cosmetic — wrong
`parentComment` links). Second, and more visible: every source file had a blank line between its
frontmatter and its `# Title` heading, which a truthy-check bug caused the H1-stripping step to silently
skip in all 48 files, leaving an invalid `h1`-style block in every post body — surfaced as a live
"Could not find Sanity schema type for style: h1" error when Asher opened a draft in Studio. Fixed the root
cause plus added a defensive floor (block levels can't go below `h2` — the post's own title field is
already the page's H1), then re-ran and confirmed via a direct style audit across all 48 posts that zero
`h1` blocks remain.

Current state: 48 draft posts and 578 pending comments sitting in Studio, untouched and unpublished. Three
posts (short video captions with no recoverable date) need a manual `publishedAt` set before Asher's ready
to review the rest and start approving comments.

## 2026-08-13 — Suggest Image Prompt rebuilt around Asher's real visual style

Asher imported 48 old posts into drafts and needed a way to get image ideas for all of them, in his actual
established style — a steel-plate-engraving/sepia template he'd been pasting in by hand for most of his
existing images. Checked the existing "Suggest Image Prompt" button first rather than building a second
tool: it already existed, already ran on Gemini, but asked the AI to freely write 2 generic prompts with no
connection to that template at all — probably why it had gone mostly unused.

Rebuilt around the template instead of replacing it with AI prose. Gemini's job shrank to exactly two
things per idea: a concrete subject drawn from the post's real content, and which of two composition modes
(an isolated specimen-plate style, or a full staged scene) actually fits that subject — decided per idea,
mixed across the 3 results (confirmed with Asher directly rather than assumed), so the 3 choices are
genuinely different shapes to pick from. Everything else — the crosshatching, the sepia paper, the
"Asher Aw, 1984" signature — comes from a fixed template, assembled the same way every single time, never
reworded by the AI. That template (and both mode descriptions) is now an editable Studio field, not
hardcoded, so tweaking the wording later doesn't need a code change.

Real bug caught by testing against actual Gemini output, not assumed correct: the first pass produced
prompts like "...wrapping around the hands., in the style of..." — a stray double-punctuation where the
AI's subject sentence ended with a period right where the template's own comma picks up. Fixed on both
sides (asked Gemini not to end with punctuation, stripped a trailing period server-side as a backstop) and
confirmed clean with a second real test call before shipping.

## 2026-08-13 — GIF comments via Giphy, hotlinked and never clickable

Follow-up to the emoji picker below: Asher confirmed the hotlinking-bandwidth question directly and
created a free Giphy API key. A comment can now attach a GIF (search-and-pick from Giphy) alongside or
instead of text — a GIF alone is a valid comment on its own, Asher's own call, "it is also a response."
Renders as a plain `<img>`, never wrapped in a link, so it can't reopen the "no clickable URLs" spam
concern this was scoped around from the start.

Built: a server-side `/api/gif-search` route (keeps the API key off the browser, forces Giphy's "g" content
rating, has its own lightweight rate limit against quota abuse), a debounced search-and-thumbnail-grid
picker in the comment form next to the emoji picker, a removable preview before sending, GIF rendering on
both the public comment cards and Studio's moderation queue (so nothing gets approved blind), and a
server-side check rejecting any `gifUrl` that isn't actually hosted on Giphy's own domain — the picker UI
is a convention, not an enforcement, so the real guarantee against a hand-crafted request has to live on
the server.

One real bug caught locally before shipping, not assumed: GIF thumbnails showed as broken-image icons at
first — the site's Content-Security-Policy didn't yet allow images from Giphy's domain. Fixed, confirmed
with a second local test, then verified end to end against the real Giphy API and real Sanity data: a real
GIF-only comment searched, selected, and submitted through an actual browser, confirmed correctly stored,
then deleted afterward along with two direct-request tests confirming the hostname guard and the
missing-both-fields validation both actually fire.

## 2026-08-12 — A quick emoji picker for comments, and the Google Analytics placeholder removed

Two small, separate follow-ups. First: Asher asked whether Google Analytics could show on the new Studio
Dashboard. Checked properly — genuinely possible via Google's own reporting API, but it needs a one-time
manual step in his own Google account first (a service account with read access), not something buildable
from this side alone. He confirmed he was just checking feasibility for now, so the "not connected"
placeholder card that had been sitting on the Dashboard for exactly that possibility came back out.

Second: asked about adding fun media to comments — emoji, and GIFs from Tenor or Giphy — with one
condition: no clickable links, to avoid inviting spam. Assessed both before building either, since he
explicitly asked for clarity first, not code. Emoji: genuinely trivial (unicode characters the comment
field already accepts), approved and shipped the same message — a smiley button next to the comment box
opens a curated grid of common emoji, inserting whichever one's clicked at the actual cursor position, not
just tacked onto the end. GIFs: a real, bigger feature, fully scoped (search picker, a new field, keeping
it restricted to genuine Giphy images, a moderation preview) but intentionally not built yet — needs a free
API key only Asher can create. Picked up the next day once he had one (see above).

## 2026-08-12 — Built and validated a custom "asher-voice" writing skill, installed globally

A Claude Code skill (`.claude/skills/asher-voice/`) that drafts or edits any first-person content — blog
posts, newsletters, captions — in Asher's actual voice, built from close reading of all 21 posts on
asheraw.com/blog (2009–2026) rather than a generic "sound human" prompt. Installed at both project level
(committed here) and user level (`~/.claude/skills/asher-voice/`), so it triggers in any Claude Code session
going forward, not just this repo.

Runs alongside the existing `no-ai-slop` skill but explicitly overrides it on several patterns that look
like generic AI tells on the surface but are confirmed as Asher's own long-standing voice (present since
2013, well before AI was part of his workflow): sentence fragments, ellipses as real pauses, question-phrased
section headers, and callback endings that reuse an image already planted earlier in the post rather than
inventing a new closing metaphor.

Went through two real rounds of validation against Asher's own direct feedback on drafted output (not just
self-assessment) before being called done. First round scored 100% against the skill's own assertions but
Asher rated the actual output "bad" — it compressed his stories into 300–450 word highlight reels instead of
telling them, which the assertions hadn't been written to catch. Rewritten around four narrative frameworks
he explicitly wants his content built on (PAS, Story Spine, 3-Act, Hero's Journey — documented with which of
his real posts exemplifies each in `references/story-frameworks.md`), with instructions to dramatize the
pivotal scene in near-real-time rather than summarize it, and to let realizations arrive only after the
struggle that earns them. Also fixed on that pass: never use an em dash (not a style preference — he simply
doesn't have easy keyboard access to the character), British/Singapore spelling throughout, no invented
internal feelings or vague "something shifted" transitions. Second round of feedback was positive with two
small refinements folded in: always address the reader 1-to-1 ("you," never "we"/"us"), and prefer numerals
over spelled-out numbers ("day 4" not "day four").

Shipped to every surface Asher actually writes from. Committed and pushed to `origin/main`
(`80ea611`), so it's now available in Claude Code web sessions on this repo, not just this machine.
Also packaged as a standalone `.skill` file (`scripts/package_skill.py`, after installing the missing
`pyyaml` dependency it needed) for upload into claude.ai's own separate Skills feature — a different
product with no shared install path from Claude Code, so that copy needs uploading by hand through
claude.ai's Settings → Capabilities → Skills, and won't stay in sync automatically if the skill is
revised later.

## 2026-08-11 — Internal links validated against Sanity data, not a live fetch; dismissed links actually disappear

Fourth follow-up the same day, both real bugs caught by Asher actually using what shipped minutes earlier.

**Why internal links to asheraw.com's own pages showed "possibly blocked":** confirmed by testing the exact
same URLs from outside Vercel's own network — every one came back a clean 200. The 403s only ever happened
when the link checker's own serverless function (running on Vercel) called back into asheraw.com's own
production domain (also on Vercel); Vercel's system-level bot/DDoS mitigation was flagging that
self-referential traffic pattern as suspicious. Fixed properly rather than worked around: links to this
site's own domain are now validated structurally against real Sanity data (does this post/category/author
slug actually exist? is this tag actually used? does a redirect exist for this exact path?) instead of a
live network request at all — no fetch means nothing for Vercel's traffic heuristics to ever misjudge again.
One of the four flagged links turned out to be a genuinely renamed post slug with a redirect already in
place for it, not a coincidence — caught by testing against live data before assuming a simpler "does the
current slug exist" check would be enough, which would've wrongly flagged that redirect as broken.

**Why marking a link Ignored looked like it did nothing:** it didn't move anywhere. The row stayed in the
same visible list, and that section's own count badge kept counting it — only a different, less obvious
summary badge further up the page actually reflected the dismissal. Fixed to match the pattern already
shipped for Content Audit (and already confirmed working well): a dismissed link now moves into a
collapsed "Show dismissed" list within its section, reversible any time, and the section's own count drops
to match immediately.

## 2026-08-11 — Cookies merged into one real form, Logs flattened back out, Link Checker gets dismissal

Third follow-up pass the same day, all direct reactions to using the previous pass's changes. Asher's
verdict on the "Logs" sub-folder from earlier: "no need to put them too far in, you're right" — **404 Hits,
Error Log, Search Queries, and Cookies are now direct Site Admin children again**, not nested one level
deeper. The folder idea came from his own suggestion a few hours earlier; reversing it just as readily once
it didn't feel right in practice is the same kind of call as everything else in this session's Studio
cleanup — organize by how it's actually used, not by how it sounded on paper.

**Cookie Insights and Cookie Banner Copy are now one genuinely combined form**, renamed "Cookies" — not the
folder-with-two-sibling-panes structure from the last pass, but a single page showing Insights, then Copy,
then Feedback, stacked top to bottom. That only became possible by moving the banner copy off Sanity's
Portable Text editor onto plain text fields (`text`, `linkText`, `linkHref`, and a new `afterLink`) — a real
rich-text editor can't be mounted inside a custom Studio pane, only a document's own form can host one. All
three real copy variants turned out to have wording *after* the link (not just before it), so `afterLink`
was added specifically to carry that over untouched rather than rewording anyone's copy to fit a simpler
shape. The live document was migrated to the new shape directly, keeping each variant's original tracking
key so the accept/decline stats stay attributed correctly.

Re-checking Content Health surfaced the real gap: **Link Checker (broken/blocked links) had no dismiss
option at all** — the per-check dismissal built for Content Audit last pass only ever covered half of
Content Health. Given the same pending/ignored/actioned control Content Audit and 404 Hits already use;
the Dashboard's issue count now excludes ignored links the same way.

Also checked a new Error Log entry mentioning `postMessage` on request — it's Instagram's own in-app
browser (Android WebView) failing to reach a garbage-collected Java bridge object during page teardown,
from its own injected `iabjs://` navigation-logging script. External to this codebase, same category as
the already-dismissed "ResizeObserver loop completed" entry — worth marking Ignored rather than chasing.

## 2026-08-11 — Content Audit can finally be dismissed, and one more Studio tidy-up

Two more follow-ups from the same conversation. First, a real bug: the new Cookie Banner Copy document
showed validation errors on all three variants — Sanity rejected the internal `/privacy` link as "not a
valid URL" by default. Fixed, since an internal link was exactly what that field was built for.

Then more consolidation, on Asher's own follow-up questions: **Cookie Banner Copy folded directly into
Cookie Insights** (a real merge this time — one shared entry, two views inside it — rather than living in a
different part of the sidebar). **404 Hits and Error Log moved into Logs** alongside Search Queries, once it
was clear they're genuinely the same kind of thing (an event log with a pending/ignored/actioned status),
not meaningfully different from what was already grouped there. **Redirects moved into Site Admin** — an
occasional maintenance task, same category as Export/Bulk Operations, not something that needed its own
top-level slot.

Also finally fixed the real problem behind Content Health going unused: Content Audit had **no way to
dismiss anything**. Asked whether dismissal should work per-post or per-check — Asher chose per-check
specifically because a blanket per-post dismiss risked hiding a real issue alongside whatever was actually
being waived. Built accordingly: each flagged check (missing image, alt text, excerpt, category) can be
dismissed individually, stays reviewable in a collapsible "Dismissed" section, and can be restored with one
click — nothing disappears for good. The Dashboard's own issue count was updated to apply the same logic,
so the two numbers can't quietly drift apart the first time something gets dismissed.

## 2026-08-11 — Cookie tools merged, banner copy made editable in Studio

Follow-up to the cookie banner work shipped earlier the same day. Asher flagged that the raw "Recent
choices" list in Cookie Consent Log — every single accept/decline shown as its own row — stops being useful
once it grows, and asked to merge it with Cookie Taste Feedback into one place instead of two separate
sidebar entries. He also suggested grouping Search Queries in with them under a shared "Logs" section, and
asked more generally: before adding new things to Studio going forward, check for an existing logical home
first rather than bolting on another standalone entry.

Merged into one **Cookie Insights** tool — aggregate totals and a per-variant breakdown instead of a
growing row-by-row list, plus the feedback submissions with their averages. Grouped it with Search Queries
into a new **Logs** folder inside Site Admin. Separately asked whether Content Health belonged in that same
folder too — kept it where it is (top nav) for now, since it's an active check you run and act on, not a
passive record like the other two, and it was deliberately placed there for one-click daily access. That
led to real feedback, though: he doesn't actually use Content Health often, because its 16 flagged "issues"
aren't real problems and there's no way to dismiss or act on any of them (unlike 404 Hits/Error Log/Search
Queries, which all support marking something as ignored). Queued as a follow-up rather than folded into this
same batch.

Also asked to see the banner's copy variants and make them editable — they were hardcoded in the component,
meaning any wording tweak needed a code change. Moved them into a new **Cookie Banner Copy** document in
Studio: real rich text (bold/italic/links), and variants can now be added or removed entirely from Studio,
not just edited. Seeded with the three variants that were already live so nothing changed for visitors.

Found a real bug while verifying this against the actual production domain: the site's security headers
(CSP) blocked the one new thing this shipped — a cookie banner reading its own copy from Sanity, from the
visitor's browser — because that read goes through a different Sanity address than the one already
allowed. Fixed, and confirmed working against the live site afterward, not just locally.

## 2026-08-11 — Cookie banner: a delay, a 7-day re-prompt, and a copy experiment

Asher asked how the cookie banner actually behaves — how often it re-appears after someone declines, and
whether an accept/decline decision ever gets asked again. Checked the real code rather than guess: it was
permanent, forever, for both choices, with zero delay before showing. Pulled the real numbers too (19
accepted / 9 declined at the time, 28 total since Aug 3) so the advice wasn't generic.

Three changes followed from that conversation:

**A 10-second delay** before the banner shows at all, instead of appearing the instant the page loads.

**Re-prompts after 7 days now**, not never — deliberately not "every session," which would've made the
accept/decline count reflect visits rather than people. A visitor's existing choice (even one made before
today) gets asked again once on their next visit, then settles into the normal 7-day cycle.

**Three banner copies, picked at random each time it shows** — the current wording, the exact formal
wording this banner used before (pulled from git history, not rewritten from memory), and a new playful
"cookie tasting" version paired with a tiny anonymous feedback form (colours/taste/texture, standing in for
real feedback on the visual design/writing/UX). No auto-picked winner — Asher wants to review this by hand,
so the Dashboard now shows the accept/decline split per variant to make that easy.

Found and fixed a real bug along the way during testing: the feedback form and the consent banner both
tried to anchor to the bottom of the screen, so opening the feedback form blocked the Accept/Decline
buttons underneath it. Rebuilt as a proper centered modal instead. Verified the whole thing end-to-end
against real production data (all three variants, the delay timing, the 7-day expiry, old-format visitors,
the feedback form) before shipping, then cleaned every test entry back out of the real dataset afterward.

## 2026-08-11 — A Studio landing dashboard

Asher's question after the sidebar cleanup: with this much now in Studio, would a dashboard showing what
matters at a glance — as the actual first screen after logging in — make sense? Gave him the honest
tradeoff (real new build, not just reorganizing, and only useful if it shows the right handful of things)
and asked what he'd actually want to see rather than guess.

He gave a clear, ordered list: quick actions (new post, schedule one), comments/contact needing a reply,
distribution status, pending issues (Content Health, 404s, errors), and stats (cookie consent, search
queries, and traffic — "if [Google Analytics] can't be pulled in automatically, skip it"). Checked first:
no GA integration exists in this project at all, so that one's a plain "not connected" note rather than a
fake number.

Built as the new first screen in Studio — every count on it reuses the exact same query logic its real tool
already shows, just surfaced sooner, with each card linking straight through. See RUNBOOK for how the
deep-links were verified against Sanity's actual source rather than guessed (this codebase already got
burned by a guessed Studio URL once, back on 2026-08-05).

## 2026-08-11 — /link grid fix, orphaned-field cleanup, and a Studio sidebar tidy-up

Asher spotted the `/link` grid leaving what looked like blank tiles whenever the card count wasn't a
multiple of three — turned out to be a border wrapping the whole grid, which CSS always draws around all
3 column tracks in a row regardless of how many tiles are actually in it. Moved the border/background onto
each tile individually instead; an incomplete row now just shows real tiles against the plain page
background, the way Instagram's own grid does. Also switched the crop from square to portrait 3:4, closer
to Instagram's actual proportions.

He also caught Studio flagging an "unknown field" warning on the Link Page item — leftover data from a
field removed earlier the same day. Cleaned that up, plus an equivalent leftover on the post from the very
first (now-replaced) version of the feature.

Separately tidied the Studio sidebar: AI Suggestion Settings and AI Output Log were two unrelated-looking
top-level items for what's really one feature's settings and its own log — grouped into one "AI Workspace"
folder. Cookie Consent Log moved into the existing Site Admin folder, since it's an occasional-glance number
like everything else already living there.

## 2026-08-10 — A link-in-bio page for Instagram (asheraw.com/link)

Asher wants to point his Instagram bio link at something like lnk.bio — specifically the layout
`lnk.bio/mothership` uses: a grid of square tiles, each showing a photo with its headline overlaid, tapping
through to the real article. Self-contained on his own domain, not a third-party service.

Shipped in two passes the same day. The first version auto-built the page from a simple "show this post"
toggle on each post, reusing whatever that post's Main Image happened to be — reasonable as a first guess,
but not what he actually wanted once he saw it: he asked for real per-card control (pick any image from
Media, choose exactly where each card goes) and for the layout to actually look like Instagram's own grid,
not a stacked list.

Rebuilt properly as a **Link Page** singleton in Studio — a hand-curated, manually-ordered list of cards,
each with its own image (any image from Media, not tied to a post) and a destination: a post on this site,
or an external URL. No manual title field — an internal card's headline comes straight from the linked
post's own title, so there's nothing to duplicate or keep in sync by hand. `/link` renders these as a real
three-square-tiles-per-row Instagram-style grid, headline overlaid on the photo, matching the format readers
already know from the platform they're arriving from.

## 2026-08-10 — Threads added to the share row

Asher noticed the "Share this post" row skipped Instagram and Threads and asked if that was intentional.
It wasn't a deliberate choice for either one — but the two turned out to be genuinely different cases.

Threads has a real, public share-intent URL (the same style X, Facebook, and LinkedIn already use), so it
was just a missing button — added. lucide-react (the icon set every other button in that row uses) doesn't
include a Threads mark, so this pulls the real brand glyph from `simple-icons` instead of standing in some
unrelated icon that wouldn't actually read as "Threads" to a reader.

Instagram stays out, and can't really be added the same way: it has no public "share this link" URL at all
— unlike the platforms already in that row, Instagram has never supported opening a share dialog with a
link via URL. The native share button that already appears on mobile (the OS's own share sheet) already
reaches Instagram for anyone with the app installed; there's just no way to add a dedicated one-click button
for it the way the others work.

## 2026-08-10 — Accordions can hold real formatting now

Asher asked whether the hidden content inside an Accordion block could support simple rich text — it
couldn't; that field was a plain text box with no bold, italic, or link support at all.

It can now: bold, italic, underline, bullet/numbered lists, and links — kept deliberately smaller than the
main writing area's full toolbar (no headings, no code blocks, none of the special link types), matching
what "simple" actually means rather than just turning on everything.

The real work was making sure nothing quietly broke for posts that already had accordions written the old
way. Checked first, found 6 real accordions across 3 already-published posts using the old plain-text
format, and ran a proper migration — converted each into the new format, split cleanly into paragraphs,
verified nothing was lost by actually reading two of the real originals first (one had no line breaks at
all, one had eighteen clean paragraph breaks) to make sure the conversion logic wouldn't mangle either kind.
Also checked and fixed every other place that reads an accordion's content, so word count, reading time, and
every export format (Markdown, HTML, PDF) all still work correctly with the new format, not just the page
itself.

---

## 2026-08-09 (continued twice more) — Four fixes: scroll motion, mobile reflow, "To Serve," and a real quote

More feedback on the cycling-word work, all four addressed in one pass:

**The animation had quietly turned into a fade.** The previous fix (rendering one word at a time to solve
the descender and width bugs) used a small slide distance that read as a fade rather than the original
scrolling motion. Restored the original full-height scroll — the trick that made it safe to bring back
without reintroducing the descender clipping: a bit of extra padding gives the letter genuine room, and an
equal negative margin cancels that same padding out for alignment purposes, so the surrounding text still
lines up correctly. Confirmed with a burst of screenshots mid-transition — the outgoing word is visibly
sliding out and getting clipped at the edge, a real scroll, not a cross-fade.

**A real mobile bug, caught and fixed.** On a phone screen, "Asher is an Actor" fits on one line but
"Asher is a Storyteller" doesn't — meaning the whole page was shifting up and down as the word cycled,
since everything below follows the headline's own height. Forced a permanent two-line break on mobile only,
so the height never changes no matter which word is showing. Measured it directly across a full cycle: the
exact same height, every single time.

**"The Studio" renamed to "To Serve."** Not quite capturing what that half of the work actually is anymore
— now explicitly named around serving, with its description spelling out marketing, teaching at Nas
Academy, corporate workshops, and coaching. Same change made in both the regular homepage and the
interactive version, so they don't quietly drift apart again.

**The pull-quote rewritten in Asher's own words**, replacing the AI-drafted original with what he actually
meant: whichever room he's in, whether a thousand-seat hall or a one-to-one Zoom call, it's the same
calling — to serve, presenting everything he has, as authentically as he can.

**Also checked and confirmed a real gap**: the interactive 3D/2D version of the site has no section
matching the homepage's "The Premise" — by design, since adding a real one would mean new geometry in the
walkable world itself, not just a text change. Folded the core idea into the existing welcome area instead
of building a whole new stop, at Asher's own call.

---

## 2026-08-09 (continued once more) — Fixed a real styling bug, then The Premise gets its own dual cycle

Asher flagged that the Two Callings headline looked off in a screenshot — the cycling word sat visibly out
of alignment with "Asher is" next to it. Traced it to a real cause, not guessed: the word's box was reserving
noticeably more height than one line of text actually needs (leftover headroom from an earlier "just in case
a letter has a tail" decision), and that extra height pushed the word out of position relative to text
sitting in a normal line height beside it. Fixed the box to match the real line height.

Then a follow-up ask: the same effect on "The Premise" section, but with two words cycling in one sentence —
"You have a [story/voice] worth [telling/hearing]" — where the pairing has to stay locked. Story always with
telling, voice always with hearing, never crossed. Built that by having both words driven by one shared timer
instead of two separate ones (two independent timers would drift out of sync almost immediately), and
checked it programmatically over several full cycles, not just by eye, to make sure the pairing never
slipped.

Testing that on a phone-sized screen surfaced a second real bug in the part shipped earlier the same week:
the space reserved for each cycling word was a rough guess that didn't quite match this font, leaving an
odd gap before whatever text came right after it — invisible on the Two Callings headline (nothing follows
the word there), obvious here. Rebuilt the underlying piece properly this time — it now measures the actual
words instead of guessing, so this can't happen again for any future word list, not just this one.

---

## 2026-08-09 (continued) — Two Callings: the cycling word moves into the headline

Follow-up to the cycling-word effect shipped earlier the same day. Asher asked to restructure it: the big
headline now reads "Asher is a/an [role]" — Actor, Coach, Marketer, or Storyteller, cycling through with the
article changing correctly each time (an Actor, but a Coach, a Marketer, a Storyteller) — with "Many roles,
one craft. Each role sharpens the other." moved down to the smaller subtext line underneath.

Same shared component, extended rather than duplicated: it now takes an optional flag to animate the
correct article in as one unit with the word, and a style override so it can match a big headline in one
place and small body copy in another. Both Story mode and the interactive Play mode version of this section
got the update together, and Play mode's own separate mention of the same four roles further down in its
body copy came out — no reason to name the same thing twice in one section now that the headline does it.

Checked all four role/article combinations by eye in both versions of the site before calling it done.

---

## 2026-08-09 — Two Callings: a cycling-word effect, borrowed and adapted

Asher found a cycling-word hero effect on 21st.dev and wanted to explore it for the site, tied to the
duality he specifically likes about the "An actor who teaches. A teacher who acts." headline.

Talked through where it should actually go before building anything, since the obvious first instinct —
put it right on that headline — would have made things worse, not better. That line currently shows both
halves of the mirror at once, which is exactly what makes it land in one glance; animating it into a
one-at-a-time cycle trades that instant read for a slower reveal. Went with Two Callings instead, whose
"many roles" framing is a much more natural fit for cycling — it's literally about plurality, not a two-way
mirror, and it already names Actor, Coach, Marketer, and Storyteller in its own copy. Now those four words
rotate through one at a time right where the text already listed them statically.

Adapted the technique from the reference rather than pasting its code — the 21st.dev demo uses shadcn's
Button and generic Tailwind, neither of which this site uses, so the actual animation logic (stacked
positioning, spring transition) was rebuilt against this site's real styling. Also respects a visitor's
"reduce motion" setting properly — freezes on one word instead of looping forever for anyone with that
preference — and shows the same effect in both Story mode and the interactive 3D/2D Play mode from day one,
rather than adding it to one and forgetting the other.

---

## 2026-08-08 (continued once more again, round seven) — Homepage copy pass, using no-ai-slop

Asher asked for a pass over the homepage copy specifically to catch anything that reads AI-drafted, using
the no-ai-slop skill — with one explicit instruction: the "An actor who teaches. A teacher who acts."
tagline stays exactly as it is, untouched.

Found and fixed, with Asher shaping the two rewritten lines himself rather than anything invented: two
generic Philosophy principles that could've belonged to anyone's LinkedIn bio, now specific to what he
actually means; the same sentence ("Stories connect people more deeply than information alone") repeated
verbatim in three different sections, now living in one place with the other two saying something else;
a triple-fragment sentence in Two Callings trimmed to one line, same fix applied to an even longer version
of it in Play mode; two "not X, not Y, just Z" constructions in Play mode rewritten as plain statements;
the page switching between first and third person depending on the section, now third person throughout;
and a ten-word personality list trimmed to six after cutting real overlaps.

Along the way, found a real quiet bug this review was worth doing for on its own: Philosophy.tsx had its
own separately hardcoded copy of the site's core beliefs and personality list, instead of importing the
ones already sitting in the shared data file that Play mode actually uses. They matched today by luck, not
by design — which is exactly how Play mode's closing paragraph ended up with a sentence Story mode's
version never had. Fixed to import from the same source, and pulled two more paragraphs that had quietly
diverged between Story and Play into shared constants too, so this can't happen again.

Read every changed line back on the actual rendered page — both Story and Play mode, screenshots and raw
HTML — before calling it done, not just checking that the build passed.

---

## 2026-08-08 (continued once more again, round six) — Compression as an option when uploading inside a post too

Asher asked whether uploading a photo directly inside a post — not through Media — gets the same
compression. It didn't; that's a completely separate upload path Studio owns itself.

Deliberately didn't make it automatic there the way Media's own uploads are. Fully replacing Studio's
built-in upload behavior for every image field on the site isn't something that could be safely verified
without actually logging into Studio and clicking through it for real, and getting a detail of that wrong
risked disrupting the exact tool used to write every post. Asked directly, and the safer route won: instead
of replacing the default, a second option — **Upload (compressed)** — now sits right alongside the existing
"Upload" on every image field, unchanged and untouched. Pick the compressed one when it's wanted; the
regular one still works exactly as it always has.

---

## 2026-08-08 (continued once more again, round five) — Media library: compress the photos already there too

Follow-up to automatic upload compression: Asher asked whether the photos already sitting in the library —
uploaded before that feature existed — were compressed too, and whether a one-time pass could catch them,
skipping anything already small. Checked the real numbers first: 28 of the library's 49 photos are 300KB or
larger, together accounting for 20.6 of the library's 22.8 MB total. Those 28 never got the automatic
treatment.

"Compress Library" (next to Upload Photos) scans the whole library, skips anything small enough not to
need it, and shows a real preview — which photos, how much each would shrink, how much total space it'd
free up — before anything happens. Confirm, and every photo that benefits gets the same treatment a single
"Replace image" gets: swapped in everywhere it's used, alt text carried over, original sent to Trash
(recoverable for 30 days, not deleted outright), the whole batch logged as one Undo-able entry rather than
a flood of separate ones.

The one real wrinkle: a single post can have more than one oversized photo in it, both getting compressed
in the same pass — needed a bit of extra care so the second swap doesn't accidentally erase the first one's
change when they land on the same field. Verified against real test data end-to-end before shipping,
including that exact scenario, plus a case where two different posts share the same photo, confirming both
correctly picked up the swap and Undo correctly puts everything back.

---

## 2026-08-08 (continued once more again, round four) — Media library: photos compress themselves on upload

Asher asked if there was something like tinypng.com or imagecompressor.com built in. Turns out most of that
was already happening automatically and invisibly: every image the site actually shows already gets
resized and compressed on the fly by Sanity's own image delivery, tailored to exactly where it's shown —
arguably more thorough than a one-time tinypng pass, since a thumbnail and a full-width hero photo each get
their own appropriately-sized, appropriately-compressed version, never the same file. What wasn't happening:
the original file uploaded to Media stayed at full size. Never mattered for what a visitor saw, but did
mean slower uploads (especially with the new mass-upload) and more storage used than necessary.

That gap's closed now. Large photos are automatically resized and re-compressed right in the browser the
moment they're uploaded — quietly if a photo's already a sensible size, visibly (a real "reduced from X to
Y" note) when it actually made a difference. A photo with real transparency is left as a PNG rather than
getting flattened onto a solid background; everything else becomes a JPEG, which is where the real size
savings come from. Same behavior wired into both mass upload and the new "Replace image" feature. Verified
against real test images generated on the spot, including a worst-case one designed to be as
incompressible as possible (pure random noise, nothing like a real photo) just to make sure the numbers
held up even under conditions much harder than any real photo would ever be.

---

## 2026-08-08 (continued once more again, round three) — Media library: replace an image everywhere at once

Asher asked whether a photo in Media could be swapped out without re-uploading and manually re-placing it
in every post. Sanity's images are immutable and content-addressed — there's no "overwrite this file's
bytes" call — so a true in-place replace isn't possible. What's genuinely possible, and now built: upload
the new photo once, and every place the old one appears (main image, a body gallery, an author's avatar,
site settings — a generic deep search rather than a fixed list of fields, so nothing gets quietly missed)
gets repointed to it automatically.

Click "Replace" on any photo in Media, pick the new file, and a confirm step shows exactly which posts (or
other places) will update before anything actually happens. The old photo's alt text carries over to the
new one, and the old photo itself goes to Trash afterward — the same 30-day recovery net everything else in
Media already has, not an outright delete. It also plugs into the Bulk Operations tool's existing History
tab, so a replace shows up there with a real Undo button, the same as a bulk tag or category edit would.

Verified against real data end-to-end before shipping: a real test post with the same test photo used in
two different places, alt text and all, run through the exact logic the button uses, then re-checked
straight from the API afterward — both places correctly repointed, alt text carried over, old photo
trashed, and Undo correctly put everything back. Also tightened a related safety check while in there: the
"don't delete a trashed photo that's secretly still in use" guard (both the daily cleanup and the manual
delete button) used to only check posts — now checks everywhere, since this feature means a photo can end
up referenced by an author bio or site settings too.

---

## 2026-08-08 (continued once more again, round two) — PLAY 3D: the walking freeze had a second cause

Asher confirmed the first freeze fix (deferring `handleZoneEnter`'s DOM measurement) wasn't the whole
story: "I still see the brief momentary freeze when I walk from the center to 'At a glance' or 'Contact'."

First tried to measure it directly with a Playwright `PerformanceObserver` capturing `longtask` entries
during a real walk — got ~30 long tasks spread through the whole walk, not concentrated at the zone
crossing. Ran a control test with zero zone crossings (just wiggling in place) before trusting that data,
and got an almost identical pattern. **Headless Chromium has no real GPU access in this sandbox**, so that
measurement approach was just software-rendering noise — told Asher directly that it was a dead end here,
rather than presenting noisy numbers as a real signal.

Went back to reading `World3D.tsx`'s `Scene` component instead. Found a second, distinct cause:
`setCurrentZone` — a real React state update — was called synchronously inside `useFrame` on every zone
crossing, re-rendering `Ground` and all 8 `ZoneStructure`s on the same tick as Three.js's own frame render.
"At a Glance" is the worst case, since it's the one zone that conditionally mounts a `Sparkles` particle
system (actual geometry + shader allocation) only while active. Confirmed the 2D version never had this
problem — `GameCanvas.tsx` already tracks the current zone in a plain ref, not React state.

**Fix:** deferred the `setCurrentZone` call with the same `setTimeout(0)` technique as the first fix, with
a `pendingZoneRef` guard so it doesn't get rescheduled every single frame while the deferred update is
still in flight. Verified with `tsc`/build, a fresh local Playwright walk (zero new console errors), and
then again against the live site after deploying — walked to both "At a Glance" and back toward "Welcome,"
screenshotted mid-walk both times, zero console errors either way. Being upfront about the limits of this
verification: the sandbox's lack of GPU access means there's no reliable way to get a hard before/after
timing number here — this is confirmed by correct architecture (no more synchronous state update inside
the render loop) and clean functional behavior, not a benchmark.

---

## 2026-08-08 (continued once more again) — PLAY mode: fixed the real walking freeze, added a loading state

Asher reported a brief freeze walking toward a zone whose content sits far down the page, and separately
asked about wiring in a loading screen (a specific Uiverse.io "pencil" animation he'd found) for PLAY's 3D
and 2D parts, "the heaviest load of my site." Traced the freeze before assuming the loader would fix it —
it wouldn't have.

**The real cause, confirmed by reading both render loops directly:** neither the 3D world nor the 2D
canvas loads any image/model/texture per zone — everything is procedural geometry, so there was never
anything to actually finish loading when walking. `handleZoneEnter` (`PlayMode.tsx`) calls
`getBoundingClientRect()` twice to compute a scroll offset, and it's called directly from inside both
World3D's `useFrame` loop and GameCanvas's own `requestAnimationFrame` loop — forcing a synchronous layout
reflow mid-frame, every time the character crosses a zone boundary, on top of that frame's own render
work. Cost scales with how much DOM exists in the content panel below — exactly matching what Asher
noticed. **A loading screen genuinely could not have masked this** — it's a blocking main-thread reflow,
not a network load, so a CSS-animated loader would have frozen right along with everything else. Fixed the
actual cause: the DOM measurement now runs via `setTimeout(0)`, deferred past the current frame's paint.
Verified by actually walking through both versions with Playwright (arrow keys, real zone crossings) and
confirming the content panel still updates correctly with zero console errors — on the live site too, not
just locally.

**The loading state Asher did ask for** is genuinely useful, just not for that freeze — both World3D and
GameCanvas are dynamically imported (code-split out of the initial page bundle), which is a real async gap.
Built `PlayLoader.tsx` from the Uiverse.io snippet he picked (the HSL-brown "pencil" variant), fixing a real
dark-mode bug in the source along the way: the graphite tip was a hardcoded near-black that would have
nearly vanished against this site's dark background. Changed it to `currentColor`, matching the drawn
stroke line, both now reading off `var(--spotlight)` — correct in either theme automatically, no manual
dark/light override needed. Added `prefers-reduced-motion` handling, which the original snippet didn't
have. GameCanvas is now dynamically imported for the first time too (previously always bundled into the
initial load even though only one of 2D/3D ever renders at once) — caught mid-load and screenshotted on
both versions to confirm the loader actually shows and looks right, not just that the code compiles.

---

## 2026-08-08 (continued once more still) — Distribution: a real Share panel, and quote-card images

Asked whether Distribution could help post out to socials directly, with the link going in a follow-up
comment rather than attached to the post (common practice for X/LinkedIn specifically, since both
measurably favor posts without an outbound link attached) — confirmed that's still current, not something
that's been resolved away, and built the answer.

**"Share this post"** on the Distribution dashboard drafts AI captions on demand — the same flow the
existing "Draft Social Copy" document action already gave from inside a post's own editor, now also
available from where Asher actually decides what to share. Extracted the shared fetch/render logic into
`SuggestSocialCopyShared.tsx` so both are one real implementation. **The AI prompt itself changed**: it
previously assumed the link gets attached directly to the post (producing a link-preview card); now it
explicitly assumes the caption stands alone and the URL gets pasted into a follow-up reply/comment
afterward. X gets a genuine one-click "Open X to post" (its compose intent supports real pre-filled text);
LinkedIn/Facebook don't — their own share dialogs only accept a URL param, not custom caption text, so
copy-and-paste is the honest affordance there rather than a fake one-click button.

**Quote-card images.** A "Make image" button next to each AI-drafted pull quote in "Suggest SEO & Excerpt"
generates a shareable graphic (new edge route `/api/og/quote`, same brand palette/font as the existing
branded social card). Caught a real bug by actually rendering test images rather than trusting the code:
the "asheraw.com" line silently switched fonts mid-word, because Google Fonts' character-subsetting only
covered the quote/attribution text passed in, not the literal domain string that's always rendered too.
Fixed, reverified with a fresh render — consistent now, confirmed on the live site as well as locally.

**Deliberately skipped, Asher's own call:** Pinterest (wrong platform for his audience) and resurfacing old
posts (he's published across more than a decade and doesn't want that implying anything needs revisiting).

---

## 2026-08-08 (continued yet again) — Link Checker: real fixes for "shows 500 but opens fine" and stale entries

Asher flagged two things about Content Health's Link Checker. Investigated both against the real live
data rather than guessing.

**"Shows http 500 but opens fine for me."** Checked the actual `linkCheck` documents: `webmd.com` was
recorded as a 500 from the last run. Re-tested it directly and got a clean 200 — then re-tested again
specifically from Vercel's own serverless IPs (via a live production request) and got 500 again,
consistently, while a different network got 200 every time. That's a persistent IP-reputation block (a
CDN/WAF treating cloud/datacenter IP ranges differently), not a real broken link and not even a transient
hiccup — added 500 to the same "Possibly Blocked" classification 401/403/429 already get. Also added a
general resilience fix regardless of cause: any failed check now retries once after a short pause before
being recorded as broken at all, verified against both a genuinely-404 URL (stays broken, retry doesn't
mask real breakage) and a working one (succeeds immediately, no added delay).

**"Removed/changed links still stay listed."** The cleanup logic that deletes a `linkCheck` doc once its
URL no longer appears in any post/snippet is correct — read it directly, no bug found. Traced instead to
cadence: the automatic check only ran once a week (every Monday), so anything edited after the last run
just hadn't been re-checked yet. Bumped to daily, matching the other two crons already running daily, and
added a line to the tool's own copy pointing at "Check now" for anyone who wants results sooner than that.
Ran a real check against the live site immediately after shipping both fixes to refresh Asher's data right
away rather than leaving it stale until the next automatic run.

---

## 2026-08-08 (continued once more) — Media library: search, pagination, mass upload, trash, Masonry gallery mode

Followed up the crash fix below with the design discussion Asher asked for directly: how other CMS handle
a growing media library, whether mass upload/select/delete were possible, and whether image embeds could
hold many photos at once (album/masonry). Answered with a plan, then built all of it.

**Media library is lightweight at scale now, not just at 44 images.** A search box (by filename,
debounced), pagination (60 at a time via "Load more" instead of fetching every asset unconditionally), and
`loading="lazy"` on every thumbnail — the same handful of techniques WordPress/Contentful/Cloudinary all
converge on once a library grows past a trivial size.

**Mass upload.** A button and a whole-tool drag-and-drop zone, uploading multiple files at once via the
client's own asset upload API (`client.assets.upload`) — one bad file doesn't block the rest, with visible
per-file progress.

**Mass select + trash, matching Comments' existing pattern exactly** — a "Select" mode reveals checkboxes,
a floating bar trashes the selection, a "Trash" view lists what's there with Restore/Delete Forever per
item. Real constraint worked around the same way default alt text already does:
`sanity.imageAsset` is a Sanity system type that can't hold a custom `trashedAt` field directly, so
trashing writes a companion `imageAssetTrash` document instead (`assetId` + `trashedAt`). The daily purge
cron that already sweeps 30-day-old trashed comments now also sweeps 30-day-old trashed images — but
re-confirms nothing references the asset first, so a post that started using a trashed image again doesn't
lose it out from under itself.

**A fourth gallery display style: Masonry grid.** Alongside Carousel/Slideshow/Scrolling strip, for a post
with many photos shown all at once rather than one-at-a-time — pure CSS multi-column layout, no JS layout
library, each photo keeping its own natural aspect ratio, opening the same lightbox every other mode
already uses.

Verified against real data throughout: pagination/search queries, a real upload, and a full
trash-then-restore round trip run directly against the live dataset and cleaned up after; Masonry mode
verified with a real throwaway post (created, screenshotted with all 8 images and a working lightbox,
deleted).

---

## 2026-08-08 (continued) — Media library: fixed a real crash, and a spacing typo

Asher reported updating an image's default alt text crashed the page. Root cause: `saveAlt()` in
`MediaLibraryTool.tsx` had no `catch` block at all, only a bare `try {} finally {}` — any write failure
became an unhandled promise rejection instead of a visible message. Confirmed the actual write works fine
against real data (tested `createOrReplace` directly), so the bug was the missing error handling, not the
mutation itself. Now catches and shows the real error inline. Also fixed "0not currently used in any
post" — rewrote that line as an explicit template string rather than relying on JSX's line-wrapping
whitespace collapsing to insert the space correctly.

---

## 2026-08-08 — Post editor: grouped fields, SEO action moved onto its own tab, session timer fix

Asked to analyze the post editor page for grouping/clarity, then to implement the result, plus a follow-up
fix raised in the same conversation.

**Fields grouped into fieldsets, not reordered.** `postType.ts` was one flat list of 17 fields with zero
visual separation. Added five fieldsets (Organize, Publishing, Search & Sharing, Discussion, PLAY mode) at
the seams that were already implicit in the field order's own existing logic (there's a long-standing
comment explaining that order matches how Asher actually writes) — nothing moved, just divided and
labeled. PLAY mode collapses by default since it's off for most posts; everything else stays open, since
its fields are either touched on every post or matter enough to stay visible without an extra click.

**"Suggest SEO & Excerpt" now also lives on the SEO Preview tab**, right above the "Worth a look"
checklist it directly acts on (it patches `seoTitle`/`excerpt`/`tags` — confirmed by reading what it
actually does, not assumed). Previously it only lived in the Publish button's overflow menu, one tab away
from the thing it fixes. Extracted the whole dialog (fetch logic, every result card) into
`SuggestSeoShared.tsx` so the document action and the new tab button are two entry points into one real
implementation — same suggestion, same "Use this" buttons, either way in.

**Session timer now starts on the first real edit, not on mount.** Asher: didn't like that opening a post
to reread it already showed time elapsed. `DistractionFreeWritingPanel.tsx`'s timer now waits until the
body's plain text differs from a snapshot taken when the panel first mounted, then starts counting from
that moment — one-way (doesn't un-start if everything typed gets deleted again). Compares plain text
rather than the raw Portable Text array, since Sanity's own editor can re-key that array on mount without
any real edit happening, which would have started the clock on a false positive.

Verified: `tsc`/`build` clean (only the same pre-existing baseline errors), Studio schema loads with no
errors both locally and confirmed against the real live site (zero console errors, a clean login screen —
no crash from the schema changes).

---

## 2026-08-06 (continued once again) — Security headers, first-party error monitoring, rate limiting, one-click New Post

Four pieces of work from the same session: three from a direct audit ("what other feature is missing?"),
one a workflow ask that came in mid-build.

**Security headers.** A real Content-Security-Policy plus X-Frame-Options, Referrer-Policy,
Permissions-Policy, and HSTS, added via `next.config.ts`'s `headers()` — applied to the public site only,
`/studio` deliberately excluded since Sanity Studio needs far broader permissions to function and getting
that wrong risks breaking Asher's own daily editing tool. The CSP's allowlist was built by grepping every
external URL this codebase's own components touch, then corrected **twice** against what a real browser
actually did — first against a local production build (caught `<SanityLive/>`'s own connection to
`*.api.sanity.io`, a library-internal component, not this codebase's own code), then against the actual
live site (caught `static.cloudflareinsights.com`, a beacon Vercel's own hosting injects automatically —
impossible to find by reading source at all). Both real gaps, both things static grepping alone would have
missed and shipped broken. `'unsafe-inline'` for scripts/styles is a stated, deliberate tradeoff, not an
oversight — GTM's bootstrap snippet, Clarity's loader, and the JSON-LD structured data are all inline
`<script>` tags with no nonce wiring in this codebase, and a strict script-src would have broken them
outright. Full writeup and the tradeoff explained in RUNBOOK.md.

**Error monitoring — first-party, not Sentry.** New Studio → Site Admin → Error Log, same
Pending/Ignored/Fixed triage pattern as 404 Hits. Catches the three kinds of JS error a real visitor's
browser can hit: uncaught script errors and unhandled promise rejections (a new `ErrorMonitor.tsx`,
mounted site-wide), and React render errors (the existing `(site)/error.tsx` now also reports, alongside
what it already did). Chose first-party over a third-party service like Sentry to match every other
tracking feature already in this codebase (404s, search queries, shares) — no new account for Asher to
sign up for and remember to check, browsable in the one place he already looks. Doesn't cover server-side
errors (a failed API call, a bad Sanity write) — those already land in Vercel's own function logs; folding
those in too would be a separate, bigger change.

**Rate limiting on comments and contact.** The two public endpoints that create real content and (for
contact) send an actual email — a flood does real damage the honeypot/captcha alone don't stop, since a
script that solves the captcha and posts straight to the API skips both entirely. A shared helper
(`src/lib/rateLimit.ts`) counts recent submissions by IP against Sanity itself rather than pulling in a
separate Redis/Upstash account — reuses the exact same kind of IP-matching query comments/route.ts's
existing spam-flagging already does. 5 comments per 10 minutes, 3 contact messages per 15 minutes, per IP.

**One-click "New Post."** Asher's own ask, mid-build: "Posts → + → New Post" was two clicks for his most
frequent action. New sidebar entry opens straight into a blank post editor in one click. Deliberately not
the old WordPress "auto-draft on page load" pattern he was specifically wary of repeating — this only opens
a pane, Sanity itself doesn't write anything to the dataset until a real edit happens (same as the existing
"+" button already behaves). The draft id is generated fresh inside the click handler on every single
navigation, not once per Studio session, so a second click doesn't reopen whatever got typed and abandoned
the first time.

Verified: `tsc`/`build` clean (only the same pre-existing, unrelated baseline errors), Studio schema loads
with no errors, `/api/track-error` round-tripped against real Sanity data and cleaned up after, the
rate-limit queries ran against real data, and the CSP was checked with a headless browser against the real
live site — a post with all 5 of its YouTube/Instagram embeds, the homepage, `/privacy`, and `/connect` —
zero console CSP violations after both fixes above. Also logged the AI spam-check-for-comments idea
(raised earlier the same session) in IDEAS.md.

---

## 2026-08-06 (continued, for real this time) — Legacy embed migration actually run; the two old buttons are gone

The script logged just below was written but never run (no live Sanity access in that session). Ran it for
real this time: `--dry-run` first to preview (38 blocks across 11 posts, no warnings), then for real. Confirmed
clean afterward via the script's own built-in check — zero posts left referencing the old `youtube`/
`instagramEmbed` types. Deleted both array members from `blockContentType.ts` (and the now-unused
`HeartFilledIcon` import), which is what actually removes the "(legacy)" buttons from the editor's insert
menu — the two types existed in the schema for exactly one reason (keep already-published posts from turning
into "Unknown type" blocks), and that reason no longer applies to any post.

`tsc --noEmit` and `next build` both stayed clean (only the same pre-existing, unrelated baseline errors).
Couldn't click through Studio's actual toolbar to eyeball the buttons gone — this sandbox still hits the same
no-login CORS gate noted elsewhere in this log — so this one's verified by the two things that *are*
checkable here: the code that produced those buttons is deleted, and the schema still compiles.

---

## 2026-08-06 (continued once more) — Migration script for the old YouTube/Instagram embed types

Asher asked what happens if the legacy `youtube`/`instagramEmbed` block types (still in the schema behind the
newer unified `embed` button) just got deleted, and whether existing posts could be moved over to the new type
instead. Answer: deleting them while any post still uses one turns that specific block into "Unknown type" in
Studio's editor -- not safe yet. Migrating is the right move and is genuinely simple, since both legacy types
already store the same single `url` field the new `embed` type does -- it's really just a `_type` rename per
block, nothing about which video/post gets embedded changes.

Wrote `scripts/migrate-legacy-embeds.mjs` to do that: finds every post with a legacy embed block and patches
just that block's `_type` (by its own `_key`, never rewriting the whole body array, so it can't clobber
unrelated edits), with a `--dry-run` mode to preview first. Same network restriction as everything else this
session applies -- no live Sanity access here, so this is written but not yet run against the real dataset.
Once it reports zero posts left using the legacy types, the two legacy array members can come out of
`blockContentType.ts` for good. See RUNBOOK.md's "Embed block" section for the full usage.

---

## 2026-08-06 (continued again) — Studio structure-pane display bug fixed, and blog listing reading time now counts Quote Grids too

Two more fixes today, both follow-ups from the stale-post saga above rather than new incidents.

**Studio sidebar bug.** Asher noticed the left-hand Structure pane (Posts, Categories, Site Admin, etc.) would
render correctly on load, then go mostly blank -- leaving only the last item or two -- the moment the pane
collapsed and re-expanded (e.g. a browser resize narrow enough to trigger the auto-collapse). Checked
`structure.tsx` first since that's this project's own code: it's a fully static, synchronous list with no
async loading or collapse-handling logic, ruling it out as the source. Pointed instead to a known upstream bug
in Sanity Studio's own structure-pane list virtualization. Bumped `sanity` and `@sanity/vision` from v6.7.0 to
v6.9.0 (same major version, low-risk minor bump) to pick up the fix. Verified `tsc --noEmit` (same 23
pre-existing errors, none new), `eslint`, and a full `next build` all still succeed post-upgrade -- but
couldn't re-test the actual pane behavior live in this sandbox (no network access to Sanity's API here, same
limitation as everything else in this saga), so this one needs a quick visual confirmation in Studio after
deploy. See RUNBOOK.md's "Studio version" section for what to do if it still reproduces.

**Blog listing reading time.** Flagged as a known loose end when the stale-post incident wrapped up: the post
page's reading time got fixed to count Quote Grid content properly, but the blog listing card computed
reading time through a completely separate path -- `POST_SUMMARY_PROJECTION` in `src/sanity/lib/queries.ts`
used GROQ's own `pt::text()` function, which has the exact same blind spot (`quoteGrid` isn't a `block`-type
span, so `pt::text()` never sees it) that the post-page fix didn't touch. Asher: "might as well fix it now."
Rather than re-solving the same problem a second time in untested GROQ, `POST_SUMMARY_PROJECTION` now fetches
a lightweight `bodyBlocks` array (just the handful of fields `portableTextToPlainText()` reads) and
`PostCard.tsx` runs that same already-tested shared function over it -- one implementation instead of two,
so the listing card's reading time (and its auto-excerpt fallback) can't drift from the post page's own count
again. Since `POST_SUMMARY_PROJECTION` is shared, this covers the blog listing, category pages, tag pages,
and author pages all at once. Left `RelatedPosts.tsx` and site search alone deliberately -- neither shows a
reading time, and search is intentionally kept to a lightweight per-post fetch; noted as a smaller, optional
follow-up in RUNBOOK.md if it turns out to matter.

---

## 2026-08-06 (the actual last one) — Found and fixed the real bug: the revalidate route wasn't reaching post pages at all

The automatic on-publish fix from the previous entry still didn't work -- confirmed directly (edited, published,
hard refreshed, still old), which ruled out Cloudflare (purged directly, no effect) and a Sanity project/
dataset mismatch between Studio and the live site (checked: both share the same env config, no code path for
them to diverge). The real bug: `/api/revalidate` called `revalidatePath('/blog', 'layout')`, which only
cascades when a real `layout.tsx` exists at that path -- it doesn't (`/blog` and `/blog/[slug]` are separate
page files, no shared layout) -- so that call was silently only ever touching the listing page, never an
individual post's own page, regardless of redeploys, Cloudflare purges, or repeated Publish clicks. This is
exactly why the listing showed fresh (if undercounted) content while the post itself stayed stuck indefinitely.

Fixed by revalidating the actual `/blog/[slug]` route pattern with `'page'` type, which does correctly reach
every post page. `revalidateOnPublish.ts` also now passes the specific post's own resolved URL as a direct,
guaranteed hit on top of that. Also dropped the secret entirely from `/api/revalidate` in the previous pass
and confirmed here it still isn't needed.

---

## 2026-08-06 (truly the last one) — Stale-post fix made automatic, no manual step needed

Asher's feedback on the first version of the fix below: "too complicated" -- fair, since it required a
one-time Vercel env var setup and then visiting a secret-bearing URL by hand whenever a post looked stale.
Reworked into something that needs nothing from him: `withRevalidateOnPublish` now wraps the post Publish
action itself (`src/sanity/actions/revalidateOnPublish.ts`, composed in `sanity.config.ts` alongside the
existing auto-publish-date/pre-publish-checklist wrappers) and calls `/api/revalidate` automatically ~4
seconds after every publish. Dropped the secret requirement from the route entirely in the same change --
same low-stakes-public-route pattern already used for `/api/track-404` etc., since the worst-case misuse is
just a few extra reads, not worth the setup friction it was creating. Clicking the same Publish button Asher
already uses is now the whole fix; the URL still exists as a manual fallback but shouldn't ever need touching.

---

## 2026-08-06 (once more, resolved) — Found and fixed the stale-post root cause: a stuck Data Cache entry

Follow-up to the incident logged below. A redeploy didn't fix the stale "J Factor" post either, which
disproved the original theory -- checked the actual response headers instead (`x-vercel-cache: MISS`,
`cache-control: no-store`), confirming the page itself has zero HTTP caching and runs fresh on every request.
Traced the real culprit into `next-sanity`'s own source: every `sanityFetch()` call reads through Sanity's
CDN by design, cached in Next.js's Data Cache -- a layer that's deliberately built to survive redeploys, and
is only meant to clear via Sanity's Live Content API pushing a live event through to a `revalidateTag()` call.
When that chain doesn't fire for one specific publish, nothing else forces a refresh, and no amount of
redeploying touches it.

Added `GET /api/revalidate?secret=...` as a direct manual override -- calls `revalidatePath('/blog', 'layout')`,
clearing the Data Cache for the whole blog section in one visit, regardless of why the automatic chain didn't
fire. Needs a one-time `REVALIDATE_SECRET` env var in Vercel (same shape as `CRON_SECRET`) before it'll work;
fails closed with a clear message until that's set. Full mechanism writeup and the setup step are in
RUNBOOK.md's "Publishing" section.

---

## 2026-08-06 (yet one more time) — Incident: an edited published post stayed stale on live for 40+ minutes

Asher edited "Easter 2019: The J Factor Afterthoughts" (already published, converting it to use Quote Grid)
and the live post page kept showing the old content for 40+ minutes, confirmed on a second device on a
different network entirely -- ruling out browser or local-network caching. No code fix shipped here (couldn't
confirm root cause without live Vercel/Sanity access this session), but documented the real architectural gap
this exposed: `/blog/[slug]` has no time-based revalidate fallback at all (removed earlier to fix a
Presentation-mode regression), unlike `/blog` itself which still self-heals within a minute via its own
`revalidate = 60`. Full writeup, immediate unblock steps (trigger a fresh deploy), and the tradeoffs around
adding a longer-interval safety net back are in RUNBOOK.md's "Publishing" section, rewritten to match the
current (not the 2026-07-28-era) architecture.

---

## 2026-08-06 (and once more) — Fixed reading time not counting Quote Grid content

Asher noticed "The J Factor" showing as a 1-minute read despite having real content -- traced it to
`portableTextToPlainText()` (`src/lib/portableText.ts`), the shared word-count function behind reading time
everywhere it's shown: it only ever read `block`/`callout`/`accordion` text, so a post built mostly out of
Quote Grid entries had almost nothing left to count. Added a `quoteGrid` case pulling every entry's quote
text in. Since this one function backs reading time on the live site, Studio's post list, the writing panel's
word count, and what the AI Workspace tools see when drafting SEO/social copy, this fixes all of them at
once, immediately, no data migration needed.

Flagged, not fixed: the auto-generated excerpt/RSS-description/search-blurb fallback uses a separate
mechanism (GROQ's `pt::text()`), which likely has the same blind spot for Quote Grid content. Noted in
RUNBOOK.md as a known gap, worth a look if it turns out to matter.

---

## 2026-08-06 (still going) — Quote Grid: text weight is now a per-block choice, defaulting lighter

Asher's follow-up after the sans-serif fix: he'd used several Quote Grids back to back on one post, and at
that volume the bolder quote weight (added earlier the same day to compensate for dropping the serif face)
got tiring to read, even though it read fine as an accent for a single grid. New **Text weight** field on the
block -- Regular or Bold, radio choice, independent of Layout -- controls just the quote paragraph's own
font-weight; names, roles, and the decorative quote marks/avatar initials are unaffected either way. Flipped
the default to Regular in the same change, since that's what holds up when several grids appear in a row,
with Bold staying available as the deliberate choice for a single grid that wants more visual punch.

---

## 2026-08-06 (one more still) — Quote Grid: quote text switched from serif italic to sans-serif italic

Asher's feedback right after the Quote Grid shipped: the Spotlight and Minimal layouts set the actual quote
text in `font-display` (Playfair Display, the site's serif display face) *and* italic together, which is
genuinely harder to read than sans-serif italic -- the serif italic cut narrows the letterforms further, right
where the point is reading a full sentence, not admiring a single large character. Switched both to the
site's default sans-serif (dropped `font-display`, added `font-medium` to keep some visual weight now that
Playfair's own character isn't doing that work) while keeping the italic treatment and everything else about
the layouts unchanged. Left the *decorative* serif accents alone on purpose -- the large faint quotation marks
and the avatar-initial fallback circles are single glyphs, not body copy, so serif reads fine there.

---

## 2026-08-06 (yet another continuation) — Quote Grid block, and YouTube/Instagram merged into one Embed type

**Quote Grid**, a new post-body block for the "several people's names/photos/comments together" case Asher
raised (his real example: "J Factor Afterthoughts"). Not a spreadsheet-style table -- explicitly scoped away
from that, since a true rows/columns table with merged cells is a much bigger build and tables are genuinely
bad on mobile. Each entry gets a photo (optional), name, role, and quote; three layouts to pick between and
compare -- **Cards** (bordered grid), **Spotlight** (alternating full-width rows, larger italic type), and
**Minimal** (a clean divided list, pull-quote style) -- since Asher specifically wanted room to experiment
with how it looks, not one fixed design.

**YouTube and Instagram embeds merged into one "Embed" block** in the insert menu -- paste either kind of URL
and it figures out which platform automatically. The old two types are still in the schema (not deleted or
hidden) purely so already-published posts stay renderable and editable; a real migration to get the toolbar
down to one visible button needs a session with live Sanity access, which this one didn't have. Every YouTube
embed (new and legacy alike, since this part is a pure rendering change) now also carries `rel=0` +
`loop=1` -- the loop trick in particular means a video never reaches the "ended" state that triggers
YouTube's full-screen suggested-videos overlay, addressing Asher's question about how much control exists
over where an embedded video might send a reader next.

---

## 2026-08-06 (continued yet again) — Image Small/Medium: fixed pixel caps that had a real bug, switched to percentages

Asher asked whether the Small/Medium/Original image-size options being hardcoded pixel values had a real
reason behind it. Checked, and found an actual bug along the way: the article column is only ~704px wide on
desktop, but "Medium" was capped at 720px -- a cap that never bound, so Medium and Original always rendered
identically no matter the screen size. Switched `SizedImage.tsx` and `ImageCarousel.tsx` to percentage-based
width classes instead (`sm:w-1/2` / `sm:w-3/4`), which fixes that and stays correct if the column's own width
ever changes later. Left untouched below the `sm:` breakpoint on purpose -- the column's already narrow
enough on a phone that shrinking further wouldn't help readability, so all three sizes still render the same
on mobile.

---

## 2026-08-06 (continued once more) — Search Queries: the blog search box now logs content ideas

New **Studio → Site Admin → Search Queries** tool -- every distinct thing typed into the blog search box gets
logged (query text + how many posts it matched), same overview-page pattern as 404 Hits: grouped into
Pending/Ignored/Actioned, most-searched-first, with a **"no results"** badge on any query whose last search
came back empty -- the strongest signal here, since it's a direct line to "someone wanted this and this blog
doesn't have it yet."

Debounced client-side (800ms after typing stops, 2-character minimum) so only a settled query gets logged,
never every keystroke while someone's still typing. Runs regardless of cookie-consent choice, same reasoning
as the existing 404-hit and share tracking: anonymous, first-party, no visitor-identifying data, not a
third-party analytics script. `/privacy` updated in the same change to disclose it.

Per Asher: this pairs with the "AI avatar" idea already logged in `IDEAS.md` as a deliberately-deferred,
bigger project (his framing: the logged queries could feed a future RAG-style version of that avatar) --
this ships only the data-collection half, not the avatar itself.

---

## 2026-08-06 (continued) — Housekeeping: fixed a `Text tone=` typo repeated across 8 Studio files

Found while auditing the type-check output after pulling in the last big batch of work: `<Text tone="critical">`
doesn't actually work in Sanity UI -- `Text` has no `tone` prop (only `Card`/`Badge`/`Button` do), so every one
of these silently rendered as plain, uncolored text instead of the intended red/critical styling. It had been
copy-pasted into 13 places across 8 files (`categoryDeleteGuard.tsx`, `exportPost.tsx`, `suggestSeo.tsx`,
`suggestImagePrompt.tsx`, `suggestSocialCopy.tsx`, `BulkOperationsTool.tsx` ×5, `CreateRedirectForm.tsx`,
`ExportTool.tsx`, `LinkCheckerTool.tsx`) -- every one an error message shown after a failed action.

Pulled the fix into one shared `ErrorMessage.tsx` component (a `Card tone="critical"` wrapping a `Text`, since
`Card` does support `tone` and its children inherit the color) instead of re-fixing the same two-line pattern
13 times separately -- one place to get it right, one less spot for the same typo to reappear in file #9.
TypeScript's error count dropped from 36 to 23 (the remaining 23 are pre-existing, unrelated to this).

---

## 2026-08-06 — Google Tag Manager: wired `cookie_consent` through to GA4

Closes the last item on the analytics "last mile." The site already pushed a `cookie_consent` event to
`dataLayer` on Accept (see `CookieConsent.tsx`), but nothing in GTM was listening for it, so it never
reached GA4. Walked Asher through GTM's UI directly (container `GTM-PVCX5DQ`, no code changes needed):

- A Custom Event trigger (`Custom Event - cookie_consent`) matching event name `cookie_consent`.
- A GA4 Event tag (`GA4 - cookie_consent`), reusing the existing "Google Tag" connection's Measurement ID,
  Event Name `cookie_consent`, firing on the trigger above.
- Published.

GTM's own Preview/Tag Assistant tooling repeatedly failed to connect on Asher's desktop browser — turned
out to be that browser profile's extensions/ad-blocker (confirmed separately blocking Microsoft Clarity's
script outright with `net::ERR_BLOCKED_BY_CLIENT`), not a real problem with the tag setup. Verified instead
by checking `gtm.js` loaded with a real `200` in Network tab once consent was granted, then confirming
end-to-end on a phone: `cookie_consent` showed up in GA4's Realtime report with a live event count.

Declines still aren't visible in GA4 by design — GTM/GA never loads at all for a visitor who declines, so
there's nothing for a GTM trigger to ever catch. The first-party `/api/track-consent` → Sanity Cookie
Consent Log remains the only complete record of both choices (see `CookieConsent.tsx`'s own comment).

## 2026-08-05 (continued) — Fixed: "Open post" links opened a tab but never loaded the editor

Asher reported the newly-clickable post/snippet links (Content Audit, Distribution, Link Checker) opened a
new tab that never actually loaded the document editor. Real bug in the URL scheme, not a fluke: the
`openPostInStudio()`/`openDocumentInStudio()` helper hand-constructed a structure-tool pane path
(`/studio/structure/<paneId>;<id>`) based on what looked like the right convention — it typechecked, it
matched Sanity's own default pane-id behavior on paper, but a pane path depends on exactly how
`structure.tsx` nests its panes, which isn't something to guess correctly from outside the structure tree
itself. It evidently wasn't right, and this sandbox has no Studio login to have caught that by clicking it
before shipping.

Switched to Sanity's own **intent** URL scheme (`/studio/intent/edit/id=<id>;type=<type>/`) — a documented,
stable route built specifically for deep-linking to a document from outside the structure tool, resolved
dynamically at runtime rather than depending on pane topology. This time verified by tracing the exact
matching function (`defaultIntentChecker`) in Sanity's own compiled source: confirmed it checks
`params.id` + `params.type` against each pane's own `schemaTypeName`, which the existing Posts/Reusable
Snippets panes in `structure.tsx` already set correctly — no changes needed there at all. One fix, three
buttons covered, since all three share this one helper.

## 2026-08-05 (continued) — Link Checker: real fix for a real false-positive, plus two usability asks

Asher flagged Content Health's Link Checker showing several Instagram profile links as broken when they
weren't. Confirmed with a real check, not a guess: ran the actual production check against live content,
then re-checked the exact URLs from his screenshot (`asheraw.com/#contact`, five Instagram profiles) —
every one came back 200 OK. They were never actually broken; Instagram (and, it turns out, Vercel's own
bot protection occasionally blocking the checker's own distinctive User-Agent on asheraw.com's own pages)
returns 401/403/429 to automated-looking requests specifically, a signal that's fundamentally different
from a genuine 404 or dead domain, but the tool was lumping both under "Broken."

**Real fix, not just a relabel**: 401/403/429 results now get a `blocked: true` flag computed once at check
time (`linkChecker.ts`) and persisted on the `linkCheck` document, showing under a separate **Possibly
Blocked** section (amber, not red) instead of Broken. Verified end to end against live production — every
one of the day's actual 401/403 hits came back correctly flagged as blocked, zero false "broken" reports.

**Two other asks, same conversation**: hovering any status badge now shows a plain-English explanation
(a `STATUS_MEANINGS` lookup — 403 vs. 429 vs. 500 all mean different things, and remembering which is which
shouldn't be required). And every post/snippet a broken or blocked link appears in is now individually
clickable, opening straight into that document's own Studio editor — generalized the `openPostInStudio()`
helper from yesterday into `openDocumentInStudio(schemaType, id)` so it covers snippets too, and threaded
each source's document `_id` through the link collector (it previously only tracked type/title/slug, not
enough to build a Studio deep link).

## 2026-08-05 (continued) — Double-checked the Content Health merge; fixed two small things

Asked directly to verify nothing broke in yesterday's Content Audit/Link Checker merge and to look for
anything streamlinable. Diffed both components against their pre-merge commits — confirmed byte-for-byte
identical functionality, only page chrome (a duplicate title/padding wrapper) was removed. No duplicate
tool registrations, no orphaned imports, `bulkOperationLog` correctly excluded from the Structure sidebar's
auto-generated document list. Found two small pre-existing (not merge-caused) things worth cleaning up
anyway: Content Audit's query fetched every post's `slug` but never used it (the "Open post" button links
by `_id`), and the "open this post in its own Studio editor" deep link was duplicated verbatim in both
Content Audit and Distribution. Removed the unused field, extracted the deep link into one shared
`openPostInStudio()` helper (`src/sanity/lib/openPostInStudio.ts`) used by both.

## 2026-08-05 (continued) — Studio's top nav: 14 tools down to 7

Asked directly whether the growing top bar could combine anything logically — it had reached 14 items
across a session of shipping tools one at a time without ever stepping back to look at the whole bar
together. Three real changes, not just a repaint:

**Removed outright:** Vision (raw GROQ query console) and Releases (Sanity's own content-scheduling
feature). Neither was something Asher, non-technical, would use directly — Vision is a developer tool, and
Releases duplicates what the custom Editorial Calendar already does. Releases in particular had never been
explicitly configured; it's just a Studio v6 default that showed up on its own.

**Merged:** Content Audit and Link Checker into one tabbed **Content Health** tool — genuine overlap, both
are "which posts need a look" checks (missing metadata vs. broken/affiliate links), the same reasoning that
already folded Social Shares into Distribution. Neither component's actual logic changed, only their outer
page chrome — each stopped rendering its own title/padding since the new shared parent provides that once.

**Moved, not removed:** 404 Hits, Contact Submissions, Export, and Bulk Operations — occasional admin tools,
not daily-use — now live in a new **Site Admin** folder inside the Structure sidebar instead of the top
bar, via Structure Builder's `S.component()` (the same mechanism Sanity provides for embedding any custom
component as a pane; confirmed directly against the installed package's type definitions before using it,
not assumed from memory). Comments, Distribution, and Calendar stayed in the top nav since those genuinely
are daily/frequent tools.

Top nav is now: Structure, Presentation, Media, Comments, Distribution, Calendar, Content Health.

## 2026-08-05 (continued) — Restored a YouTube comment thread on "Easter 2018: Under the Sycamore Tree"

Added Ruth's comment and Asher's reply, plus Liu Yuantai's comment and Asher's reply, from a screenshot of
the video's YouTube comments — same established Wayback-restoration pattern, this time from a YouTube
screenshot rather than the blog's own old comment system. The screenshot only showed relative time ("8
years ago"), not an exact date, so both threads are dated from the post's own publish date (2018-04-03)
rather than guessed more precisely — clearly an estimate, not exact. Liu Yuantai is the same person already
restored on the Christmas 2016 post earlier this session — reused the same name and placeholder email
rather than creating a second, inconsistent identity for the same real commenter.

## 2026-08-05 (continued) — Every date in Studio now shows the month as a name

Asked for the month abbreviated (e.g. "Aug") instead of a number wherever a date shows in Studio, instead
of Sanity's own default `YYYY-MM-DD`. Turned out to be a one-line-per-field schema option, not a custom
component — Sanity's built-in datetime input already supports a `dateFormat` string (its literal default
is `"YYYY-MM-DD"`, confirmed by reading `@sanity/util`'s own source). Added `options: {dateFormat:
'YYYY-MMM-DD'}` to all 17 `datetime` fields across every schema type — posts, comments, the new Bulk
Operations log, link checker, 404 hits, share log, AI output log, cookie consent log. Time format
untouched. Verified the exact output directly against Sanity's own formatter function (the same one its
input calls internally) before shipping — confirmed real output `"2026-Aug-05"`, not just that the option
was accepted.

## 2026-08-05 (continued) — Bulk Operations: tag/category/author edits, search-replace, undo

Third and last of the "actively buildable" ACE items this session (content audit and export formats
shipped earlier today). Scoped down from the spec's fuller list, stated plainly: no bulk publish/unpublish
(this schema has no "archived" lifecycle state to move posts into or out of), no "reassign to series" (no
series field exists on posts — inventing one wasn't the ask), no link/URL-migration tool (a distinct,
separate feature). What's here is a real, complete slice: **Studio → Bulk Operations**, three tabs.

**Bulk Edit** — select any set of posts, then add/remove a tag, add/remove a category, or change the
author across all of them at once, with a confirm step showing exactly what will change before anything
commits. **Search & Replace** — find text across every post's title, excerpt, and body paragraphs (not
image captions, callouts, or code blocks — deliberately scoped to plain text, stated in the tool itself
rather than special-casing every custom block type), preview every match with surrounding context, replace
with the same confirm step. **History** — every commit writes a log entry capturing the *previous* value
of every field it touched; **Undo** replays those values back in one transaction and marks the entry
undone. One undo mechanism covers every operation type uniformly, since undoing any of them is really the
same "put this field back to what it was" action regardless of what changed it.

The actual patch-building and search-matching logic lives in its own plain module
(`src/lib/bulkOperations.ts`), separated from the Studio UI on purpose — same reasoning as the export
formats' `src/lib/export*.ts` files — so it could be run directly against real data (`npx tsx`) before ever
touching the interface. Confirmed correct against the live dataset: tag/category/author change
computation, and the GROQ `pt::text(body) match` search used to find candidate posts.

**The one thing that genuinely needed a real write to verify, not just a read**: whether Undo actually
restores content, not just whether the code runs without an error. Ran two full round trips against
throwaway draft posts (created, used, deleted — never touching real content): apply a bulk tag change
through the exact transaction pattern the UI uses, confirm it applied, undo through the exact replay logic
the UI uses, confirm the field matched its real pre-edit state exactly, byte for byte. Did the same for
search-replace across title, excerpt, and body together. Both restored correctly. (The first test run
looked like it failed on the body field — turned out to be a mistake in the *test's* own comparison,
checking against the literal object used to create the post rather than what Sanity actually stored and
returned; comparing against the real fetched pre-edit state confirmed the undo itself was correct all
along.)

## 2026-08-05 (continued) — Four more export formats: JSON, HTML, EPUB, PDF

Second of the three "actively buildable" ACE items this session (content audit first, bulk operations
next). Extends the Markdown exporter shipped earlier today — every format shares the same already-proven
`ExportPost`/`POST_EXPORT_PROJECTION` data, so there's one canonical dereferenced post shape, not five
slightly different ones.

**JSON** is close to free — the dereferenced post shape serialized as-is. **HTML** builds a real,
self-contained per-post page (inline styles, no external font/stylesheet links) via the official
`@portabletext/to-html` package — real YouTube `<iframe>` embeds and internal links, unlike Markdown which
can only link out. **EPUB** is a genuine, hand-rolled EPUB 2.0.1 package (mimetype/container.xml/OPF
manifest/NCX table of contents/XHTML chapters) — the one format that actually downloads and bundles every
image into the archive rather than linking to Sanity's CDN, since e-readers render offline and a remote
image URL just shows broken. **PDF** walks Portable Text directly via `pdfkit`, with real inline
bold/italic/underline/strikethrough/text-color/links — not just block-level structure with plain text
inside, which was the original, more conservative plan.

**PDF needed a new architecture, not just a new file:** `pdfkit` is Node-oriented and can't run in the
Studio browser bundle, so PDF generation happens through a new `/api/export/pdf` route (Node runtime) —
the Studio UI POSTs a post ID (or `{all: true}`) and downloads the response, the same pattern already
established by the Link Checker's "Check now" button. Shipping it also surfaced a real, non-obvious
Next.js/pdfkit incompatibility: bundling pdfkit for the server rewrites the relative path it uses to read
its own font-metric files at runtime, breaking with `ENOENT` on a path that made no sense
(`D:\ROOT\node_modules\...` instead of the real project path). Fixed by marking `pdfkit` as a
`serverExternalPackages` entry in `next.config.ts`, confirmed both locally and — since Vercel's own
serverless file-tracing is a different mechanism than local dev, and could plausibly have dropped the font
files from the deployed bundle even with the same config — verified again directly against the live
`asheraw.com/api/export/pdf` endpoint after deploying, not just assumed from a local pass.

**Caught two real rendering bugs by actually looking at the output, not just running it:** generated real
PDFs from real posts and rendered them to images (`PyMuPDF`) for visual inspection, the same standard this
session already held Markdown export to. Found and fixed: callout/code-block backgrounds where the text
was drawing *above* its own box instead of inside it (a y-coordinate math error `tsc`/`next build` had no
way to catch), and a "▶ Watch on YouTube" label rendering as garbled characters because pdfkit's built-in
fonts only support a Latin-1-range character set — dropped the arrow glyph for PDF specifically rather than
chase down a custom font embed for one symbol.

**Every format's own scope decisions, stated plainly rather than silently:** EPUB's YouTube/Instagram
embeds fall back to a plain link (no `<iframe>` — e-readers don't execute remote content) and internal
links point at the full `asheraw.com` URL instead of a relative path (nothing to resolve a relative path
against inside an offline package). PDF has no fold/unfold for accordions — always shown expanded, the
only sensible behavior for something read linearly. Both verified directly against real content before
shipping, the same bar as every other export format this session.

## 2026-08-05 (continued) — Content Audit tool: missing-metadata check, not "stale by age"

Continuing the ACE spec's remaining "actively buildable" items (import tooling, more export formats,
bulk operations, content audit — see the spec-review entry below). Asked directly whether there's still
content to migrate from WordPress/Medium/Substack/Ghost before starting import tooling: there isn't, so
that one's dropped rather than built against nothing real to validate it — the other three are real.

Started with Content Audit. The spec's version of this was age-based staleness flags (6/12/24-month
thresholds). Asked Asher directly before building it, since a personal blog doesn't have posts that
expire the way a news site's archive does — he confirmed old posts aging isn't something he wants
flagged, and wasn't sure what the actual use case was. Rescoped to something with a real one instead:
**Studio → Content Audit** now flags every published post missing a featured image, image alt text, an
excerpt, or a category — real editorial gaps, regardless of how old the post is. A post with nothing
missing doesn't show up at all, so the list stays short. Each row links straight into that post's Studio
editor. No schema change needed — every check reads a field that already exists, reusing the exact
alt-text-fallback logic already proven in the blog listing's own query.

## 2026-08-05 (continued) — Fixed: approving a comment could collapse its whole group away

Asher described the Comments tool "closing the entire tab" right after approving a comment — disruptive
specifically because he'd often approve a comment and then immediately reply to it. Real bug, not a
misunderstanding: a post's comment group collapses by default once nothing in it is pending (shipped
2026-08-04, to keep dozens of old restored threads from making the tool feel heavy) — but approving, rejecting,
or spam-marking the *last* pending comment in a group makes it "settled" the instant that action lands, which
collapsed the whole group out from under whatever Asher was about to do next. Fixed by pinning a group open the
moment any comment inside it is actioned, the same way manually expanding it already worked — a group only
ever collapses now from the user's own explicit toggle, never as a side effect of the action that just settled it.

## 2026-08-05 (continued) — Checked the comment-count badge across every post with comments: no bug

Asher noticed the byline comment-count badge (the small speech-bubble icon near the post title) wasn't showing
on the just-restored Christmas 2016 post, even though the comments themselves were visible further down the
page. Checked all 8 posts on the site with real comments, live in production — by the time of checking, every
one matched exactly, badge count and comments-section count identical, Christmas 2016 included. Not a lasting
bug: the badge count is server-rendered and cached, invalidated automatically whenever a comment changes, but
that invalidation is normally relayed through an active browser connection to Sanity. Restoring those comments
via a direct script (rather than clicking Approve in Studio, which has that connection open) meant the cache
took a little longer than usual to catch up — a one-time timing lag for script-restored comments specifically,
not a repeatable defect. Worth knowing for future restorations: the comments section itself is always
immediately accurate (it fetches live, uncached), but the small byline badge may lag briefly.

## 2026-08-05 (continued) — Writing stats stayed visible in Focus mode's expanded editor

Asher noticed the word count / reading time / session timer bar disappeared once Focus mode expanded the
editor. It was never actually gone — Sanity's own expanded editor renders itself into a full-viewport overlay
(a React portal) that visually covers the normal document layout, stats bar included, underneath it. Since
`renderDefault` doesn't expose any hook into that overlay's own content, the fix floats a duplicate copy of
just the three stat badges via `createPortal` straight onto `document.body`, fixed top-right, with a
deliberately maximal z-index — shown only while the editor is expanded, so there's no second copy cluttering
the normal (non-expanded) view where the original bar already works fine.

## 2026-08-05 (continued) — Restored a 2016 comment thread from a screenshot

Added Liu Yuantai's comment and Asher's reply to **Christmas 2016: Finding Home**, following the established
Wayback-restoration pattern: created directly via a throwaway write-token script (not through `/api/comments`,
since these are already-public historical comments, not new submissions), `status: 'approved'`, `isAuthorReply:
true` on Asher's reply, placeholder `@restored.invalid` emails, and `createdAt` converted from the screenshot's
timestamps (Dec 28, 2016, 1:34am and 2:56pm, Singapore time) to UTC.

## 2026-08-05 (continued) — Focus mode now auto-expands the body editor

Asher's preferred writing setup is Focus mode (hides the left Structure/post-list panes) plus the body
field's own "Expand editor" fullscreen state — previously two separate clicks, in either order, every time.
Entering Focus mode now automatically triggers Expand editor too; title, slug, and every other field stay in
the normal (non-expanded) view, since only the body field's writing surface needs the extra room.

Implemented in `DistractionFreeWritingPanel.tsx` by reading the document pane's `maximized` flag off
Sanity's `DocumentPaneContext` and, when it flips true, calling `setFullscreenPath(path, true)` on
`FullscreenPTEContext` for the body field's own path — both contexts imported from Sanity's `sanity/_singletons`
entry point (its sanctioned way of sharing context across separately-bundled parts of Studio). Confirmed both
shapes directly against the installed `node_modules/sanity` type definitions before writing any code, since
neither is in Sanity's public docs.

**Caveat worth knowing:** both context values are marked `@internal` in Sanity's own source — not officially
guaranteed to stay stable across Studio upgrades. Written to degrade gracefully rather than break: `DocumentPaneContext`
is read with `?.` since it can genuinely be `null`, and if a future Sanity version removes or renames either
context, the worst case is this quietly stops auto-expanding and Studio reverts to today's two-click behavior
— no crash, no data risk. This only affects entering Focus mode; exiting Focus mode does not auto-collapse the
editor back, since that wasn't asked for.

**Follow-up, same day — Asher reported it didn't actually work:** it didn't. Writing to `FullscreenPTEContext`
turned out to be a no-op in practice: Sanity's `PortableTextInput` only reads that context once, at mount (or
when its own `path` prop changes identity) — the field's real expanded/collapsed state is separate local React
state, seeded from the context at that one moment and never re-synced afterwards. A write from outside, after
mount, just sits in the context unused; nothing tells the already-mounted field to look at it again. Confirmed
by reading `PortableTextInput`'s actual source in `node_modules/sanity`, not just the type definitions this
time. Fixed properly by not trying to fake that internal state at all: the field's real expand button carries
a stable `data-testid` (`fullscreen-button-expand` / `fullscreen-button-collapse`), so entering Focus mode now
finds that real button in the DOM and clicks it — the exact same action a manual click performs, since
`data-testid` and `onClick` land on the same native `<button>` element (confirmed directly in `@sanity/ui`'s
Button source). Same `@internal`/graceful-degradation posture as before: if a future Sanity version renames
that test id, this quietly stops finding the button rather than erroring.

**Second follow-up, same day — confirmed working, and now symmetric:** Asher confirmed entering Focus mode
now expands the editor as intended, then asked for the reverse too, since exiting Focus mode is exactly when
he's back to working on title, slug, images, and SEO fields. Leaving Focus mode now clicks the editor's own
collapse button the same way entering clicks the expand button — one small change, picking the right test id
for the direction instead of hardcoding "expand" only.

## 2026-08-05 (continued) — Pasting a YouTube/Instagram URL now auto-embeds it

Asher pointed out the actual friction: embedding a video meant opening the block-insert menu, picking
"YouTube embed," *then* pasting the URL a second time into that block's own field. Now pasting a bare
YouTube or Instagram post URL onto its own blank line inserts the real embed block immediately, no menu
detour.

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

**Follow-up, same day — a real problem caught before it caused one:** the version above described this as
also working "over selected text," which was wrong and would have been a genuine regression. Asher flagged it
directly: pasting a URL over highlighted text is his existing way to turn that text into a link (Sanity's own
built-in behavior), and this feature's first version didn't check for that at all — it would have hijacked
any highlight-then-paste into an embed instead of a link, unconditionally. `PasteData` has no direct "is
there a selection" flag (confirmed by reading the actual `@portabletext/editor` source), so the fix checks
whether the block being pasted into already has real text in it: a non-empty block means something's
selected, so it now always falls through to normal paste handling in that case. An embed only ever
auto-inserts onto a genuinely empty line. Verified directly against both cases (an empty block still embeds;
a non-empty one — simulating a real highlight-and-replace — now correctly falls through), plus the
can't-identify-the-target case, which also falls through rather than guessing.

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
