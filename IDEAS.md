# Ideas — Good to Have, Not Now

A running list of things that came up, got seriously considered, and were deliberately set aside — not
forgotten, not silently dropped. Different from the phase gaps tracked in `ACE_PRD.md` / `ACE_MASTER_SPEC.md`
(the original spec's roadmap): these are ideas that came up along the way, usually while building something
else, that don't have a phase or a deadline. Check here before re-suggesting one of these from scratch, and
add to here — don't just mention in chat — whenever a real idea gets a "good idea, not now."

Newest first. Each entry: what it is, why it's not built, and what would make it worth revisiting.

---

## AI spam-check for comments

**What:** when a new comment comes in (`POST /api/comments`), ask an AI model whether it actually reads as
relevant to the post versus spam/off-topic/promotional, and surface that as a flag in Studio's moderation
queue — a badge next to the comment, not an automatic action. Natural fit for the AI Workspace pattern already
in place for SEO/social suggestions (`GEMINI_API_KEY`, `@google/genai`, structured JSON output, logged to
`aiOutputLog`) — same model, same "suggests, doesn't act" shape.

**Why not now:** raised 2026-08-06 alongside a review of caching/image-compression setup, and Asher's own
framing was explicit — no visitors yet, so nothing to actually filter, and building spam detection against
zero real submissions means tuning it blind. There's already a first layer doing real work without AI: a
honeypot field, plus auto-flagging any new submission whose email/IP matches something already marked spam
(`src/app/api/comments/route.ts`).

**Worth revisiting when:** the site has enough real traffic that genuine borderline comments (not just bot
honeypot trips) start showing up in the moderation queue, giving something real to tune the flag against.
**Auto-delete specifically** — acting on the AI's judgment without a human check — is a separate, later step
again, only worth considering once the flagging half has a track record of being right.

---

## The Avatar Door (3D/2D talking avatar greeter)

**What:** from `ACE_MASTER_SPEC.md` Part VI / Phase 10 — a talking avatar (3D head on desktop, lighter 2D
sprite on mobile) greeting visitors on the homepage: "Want to read my latest thoughts?" / "What do you want
to know?", routing to the latest post or an AI-search-plus-TTS answer. Distinct from what's already built —
the existing walkable 3D PLAY world and the reading-companion mascot riding the progress bar are a different
thing, not this.

**Why not now:** shelved 2026-08-05, Asher's own call, on two fronts at once. First, the "talking" part (TTS
voice playback) is dropped as a requirement entirely — if this gets built, on-screen text is a fine
substitute, no audio needed. Second, and the bigger reason: the whole thing waits until there's actually
enough of an audience and archive to justify it — specifically, **meaningful traffic and at least 200 blog
posts**. Right now there's neither the readership nor the back-catalog depth that would make an AI-search
greeter genuinely useful versus a normal way in.

**Worth revisiting when:** the blog has real, sustained traffic and the post count crosses 200 — at which
point this is a text-based (not voice) avatar/search entry point, not the original spec's TTS-driven version.

**Related, shipped 2026-08-06:** the blog search box now logs every settled query as a content-idea signal
(Studio → Site Admin → Search Queries, see RUNBOOK.md) — Asher's own framing for asking for it was that this
could be a natural fit feeding a future RAG-style version of this avatar. That's groundwork data collection
only, not a step toward building the avatar itself — the traffic/200-post gating above is unchanged.

---

## Audio narration (auto TTS per post)

**What:** from `ACE_MASTER_SPEC.md`'s Phase 10 list — automatic text-to-speech narration per post,
Substack-style, so a post can be listened to as well as read.

**Why not now:** researched pricing 2026-08-04 assuming Google Cloud TTS's WaveNet voices had a genuine
ongoing free tier — Asher corrected this directly (Google no longer offers free text-to-speech). A follow-up
check against Google's own pricing page didn't return usable content to confirm the current state either way,
so this is going on Asher's word rather than a re-verified source. Every other option checked has real,
non-trivial cost at any real usage (Amazon Polly's free tier is a 12-month trial, then $16/million
characters; Gemini's native TTS is priced per output token with no clearly documented free allowance).
Shelved specifically because there's no honestly-free option right now, not because the feature itself lacks
value.

**Worth revisiting when:** a genuinely free (not trial-limited) TTS option with reasonable voice quality
becomes available, or Asher decides the cost of a paid option (Polly/Gemini/ElevenLabs) is worth it for what
it'd actually get used.

---

## An AI avatar asking readers what they're in the mood to read

**What:** instead of (or alongside) a plain scrolling list of posts, an AI avatar that asks a reader what
they're in the mood for and surfaces posts that way. Ties into the "Avatar Door" concept in
`ACE_MASTER_SPEC.md` Part VI, explicitly scoped to Phase 7+ in the spec. Raised 2026-07-31 alongside the
(now-built, see CHANGELOG.md 2026-08-03) infinite-scroll pagination for `/blog` — this is the bigger,
separate idea that pagination didn't need to wait for.

**Why not now:** explicitly experimental, and Asher's own framing was "later" — not something to design
against today, and the spec itself gates the whole Avatar Door concept behind the publishing foundation
being stable first.

**Worth revisiting when:** the publishing foundation (Phases 0-3, closed) has had time to prove itself in
daily use, and there's a concrete reason to believe a mood-based picker would actually get used over a
normal scrolling list.

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

**Reconfirmed 2026-08-05:** asked directly whether footnotes/citations should be split out as its own
independent item (since it's tracked separately in the spec) — Asher's call was no, keep them tied together
on purpose, since footnotes only actually matter *for* a book. Same "no pending works" reasoning holds.

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
