# Development Log

A running, single log of what's actually shipped on asheraw.com — one entry per work session, newest at the
top. This is the one place (human or AI, desktop or remote) should read to know what's actually been done,
and the one place to add a new entry to when something ships. Don't create a separate summary document per
day — add a dated section here instead, so there's never more than one place to check.

Written for two audiences at once: Asher, reading in plain English, and a new developer (human or AI)
picking up the project cold. For *why* something works the way it does, or what to do when it breaks, see
`RUNBOOK.md`. For the project's actual goals and roadmap, see `ACE_PRD.md` and `ACE_MASTER_SPEC.md`.

---

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
