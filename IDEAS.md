# Ideas — Good to Have, Not Now

A running list of things that came up, got seriously considered, and were deliberately set aside — not
forgotten, not silently dropped. Different from the phase gaps tracked in `ACE_PRD.md` / `ACE_MASTER_SPEC.md`
(the original spec's roadmap): these are ideas that came up along the way, usually while building something
else, that don't have a phase or a deadline. Check here before re-suggesting one of these from scratch, and
add to here — don't just mention in chat — whenever a real idea gets a "good idea, not now."

Newest first. Each entry: what it is, why it's not built, and what would make it worth revisiting.

---

## A floating badge for unhandled Contact Submissions, like the Comments one

**What:** the same always-visible "N need attention" floating badge just built for pending comments
(`CommentsNavbarBadge.tsx`), generalized to also cover Contact Submissions — a count of submissions where
`handled != true` (`src/sanity/schemaTypes/contactSubmissionType.ts` already has this exact field, tracked by
hand, "nothing automatic depends on it" per its own schema description).

**Why not now:** raised 2026-07-31, right after confirming the comments badge actually works — Asher's own
framing was to explore this once there's a real contact submission to test it against and he's actually
replied to one, rather than build and verify it against nothing.

**Worth revisiting when:** the next real contact form submission comes in and gets marked handled — a natural
moment to build and check this against real data instead of a guess.

---

## Blog pagination — infinite scroll, or an AI avatar asking what to read

**What:** `/blog` currently loads every post on one page (flagged as a real gap: the spec calls for
"pagination or progressive loading," and it'll become a real page-weight problem as the post count grows).
Asher's preference, raised 2026-07-31: not classic numbered pagination — readers are more used to scrolling,
so infinite/lazy-loading feels more natural here. He also floated a bigger, more experimental idea for later:
an AI avatar (tying into the "Avatar Door" concept in `ACE_MASTER_SPEC.md` Part VI, explicitly scoped to
Phase 7+ in the spec) that asks a reader what they're in the mood to read and surfaces posts that way, instead
of a plain scrolling list.

**Why not now:** the post count is low enough right now that loading everything on one page isn't actually
hurting anyone yet. The AI avatar idea is explicitly experimental and Asher's own framing was "later" — not
something to design against today, and the spec itself gates the whole Avatar Door concept behind the
publishing foundation being stable first.

**Worth revisiting when:** the post count grows enough that `/blog`'s page weight becomes a real problem —
at that point, infinite/lazy-loading is the more scoped near-term fix, with the AI avatar concept staying a
separate, later, bigger idea rather than something bundled into a basic pagination fix.

---

## Series/collections & footnotes/citations

**What:** both come from the original spec (`ACE_PRD.md` line 149, `ACE_MASTER_SPEC.md` lines 143/173) as
generic STORY-frontend features — "group posts into an ordered series" and "academic-style, auto-numbered
citations." Sitting in that list on their own, they read like blog features (a themed run of posts; sourced
essays). They're not — clarified 2026-07-31: the actual intent was **publishing whole books on the site,
chapter by chapter**, not grouping blog posts. Two specific books prompted it:
- **"Live Streaming for Coaches & Consultants"** — already self-published on Amazon, but Asher isn't happy
  with it as it stands and the content is now outdated. The idea was putting a revised version on-site as
  chapters, where it can actually be updated over time instead of staying frozen as a static Amazon listing.
- **"Acting As Jesus"** — background work done, not yet written.

**Why not now:** neither book is ready to actually go up. A real "book on the site" feature needs its own
design work once there's a specific book to build it around — chapter numbering and a table of contents,
reading progress across an entire book rather than one post, whether it's a distinct content type from a
blog post, a "start reading" entry point, and (for a book with real sources, unlike Asher's current blog
content) whether footnotes/citations actually apply to *that* book specifically. None of that is worth
guessing at unprompted for a book that doesn't exist on the site yet.

**Worth revisiting when:** one of the two books is actually ready to start going up — most likely "Live
Streaming for Coaches & Consultants" first, since it already exists and needs revision rather than being
written from scratch, versus "Acting As Jesus," which is still at the background-work stage.

---

## Figma-style inline highlight comments

**What:** instead of (or alongside) the comment box at the bottom of a post, let a reader highlight a
specific passage of text and leave a comment anchored right there.

**Why not now:** considered 2026-07-31 in place of extending the existing top-level/threaded comment system,
and turned down for three concrete reasons:
1. **Mobile.** Selecting text on a phone already triggers the browser's own native selection handles and
   copy/paste menu — a custom "add a comment" popup has to fight that, and doesn't do so reliably across
   browsers/OS combinations.
2. **Anchoring drifts.** A comment anchored to an exact span of text breaks (or needs ongoing fuzzy-matching
   to relocate itself) whenever that paragraph is edited later — permanent complexity added to every future
   edit of older posts, not a one-time build cost.
3. **Wrong tool for a blog.** Inline annotation earns its keep on documents people are *jointly editing*
   (Figma, Notion, Google Docs) or crowdsourced annotation (Genius) — a reader responding to a finished,
   published post is a different, better-served-by-threaded-comments use case.

**A lighter middle ground**, if the underlying appeal (react to a specific passage) comes back up:
"highlight to share" — select text, get a floating button that pre-fills a quote-and-link share (X,
WhatsApp, copy-link) for that exact passage. No persistent anchoring, no thread infrastructure, no fight
with mobile's native selection UI — a one-shot action, not something that has to keep pointing at a specific
span forever. Worth considering as its own small feature, separate from comments entirely, if this comes up
again.

**Worth revisiting when:** there's a specific, concrete reason readers want to react to individual passages
rather than the post as a whole — not just "this would be neat."
