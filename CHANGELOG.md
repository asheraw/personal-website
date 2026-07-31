# Development Log

A running, single log of what's actually shipped on asheraw.com — one entry per work session, newest at the
top. This is the one place (human or AI, desktop or remote) should read to know what's actually been done,
and the one place to add a new entry to when something ships. Don't create a separate summary document per
day — add a dated section here instead, so there's never more than one place to check.

Written for two audiences at once: Asher, reading in plain English, and a new developer (human or AI)
picking up the project cold. For *why* something works the way it does, or what to do when it breaks, see
`RUNBOOK.md`. For the project's actual goals and roadmap, see `ACE_PRD.md` and `ACE_MASTER_SPEC.md`.

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
