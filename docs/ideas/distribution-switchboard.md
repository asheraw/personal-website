# Distribution Switchboard & Comment Reflection

## Problem Statement

How might we let Asher turn one canonical post into ready-to-post derivatives for the platforms/formats
he actually wants, and cheaply reflect real social conversation back onto his own site — in a way he'll
actually remember to use, without taking on the ongoing API costs and fragility the project has already
ruled against (see `ACE_MASTER_SPEC.md`'s engagement-tracking feasibility table and Tier 1/2/3-4 decision)?

## Recommended Direction

A per-post opt-in checklist, synced to a persistent switchboard table, plus a comment-pull pipeline
built on Apify Actors rather than official platform APIs (which don't exist for personal accounts on
most of these platforms).

At publish time, the post editor (extending the existing AI Workspace panel) shows one row per
platform/format with a checkbox — nothing generates until checked, so a post that doesn't need a TikTok
script never triggers one. "Video script" is a *format*, not a platform-locked thing — it can be tagged
for TikTok, YouTube Shorts, IG Reels, or Facebook, so it isn't hardcoded to only the obviously
video-native platforms.

The existing `DistributionDashboardTool.tsx` grows into the actual switchboard: one row per post, one
column per platform/format, each cell showing status (not started / drafted / used), reading and writing
the same underlying record the publish-time panel uses — so the two surfaces never drift out of sync.
Comments get their own columns on the same table: a "pull comments" button per post/platform runs the
relevant Apify Actor, normalizes the result, and merges it through the same dedupe/preserve-approved-status
logic already proven on the Facebook comment importer. The post schema's single `legacyFacebookThreadUrl`
string becomes a `socialLinks` array (`{platform, url}` pairs, `platform` a fixed dropdown — not freeform,
since the comment-pull button matches platform → Apify Actor in code, and a mistyped freeform value would
silently fail to find one).

## Key Assumptions to Validate

- [ ] An Apify Actor can reliably pull comments from Asher's personal Facebook profile posts (the
      confirmed first target) at a reasonable per-run cost — test against 2-3 real posts before building
      the full pipeline around it.
- [ ] A visible "0 of 7 drafted" indicator at publish time is actually enough to break the habit problem
      that made the existing Draft Social Copy button go unused — this is a UX bet, not a given; worth
      checking after a few weeks of real use rather than assuming it's solved by construction.
- [ ] The platform × format grid stays readable at real post-count scale (dozens of posts, up to ~21
      cells each) without collapsing into a wall of checkboxes — needs an actual UI pass (collapsed rows
      by default), not just a schema decision.
- [ ] Google/Gemini image generation produces carousel-quality images good enough to ship without a
      dedicated design tool — untested; not part of MVP scope below until validated separately.

## MVP Scope

**In:**
- `socialLinks` array field on the post schema (`platform` fixed dropdown + `url`), replacing/extending
  `legacyFacebookThreadUrl`.
- Per-post opt-in panel: one checkbox per platform/format, reuses the existing `SuggestSocialCopyShared`
  generation pattern, only generates what's checked.
- Distribution table extended with per-platform/format status columns, reading/writing the same record
  the per-post panel writes — one data model, two views.
- One Apify Actor wired end-to-end for Facebook specifically, proving the pull → normalize → dedupe →
  import pipeline before any other platform is added.
- Video-script format decoupled from platform (taggable to TikTok, YouTube Shorts, IG Reels, or Facebook).

**Out (see Not Doing below).**

## Not Doing (and Why)

- **Eager background generation for every platform on every post** — rejected directly (resource cost,
  and not every post needs every platform). Opt-in only.
- **Email/Resend digest of ready derivatives** — explicitly rejected for now; the work should stay
  primarily on the website. Worth reconsidering only if ACE is ever productized/sold.
- **All 6 comment-source platforms wired at once** — Apify's actual reliability and cost for scraping a
  personal account are unvalidated. Prove it on Facebook first; expand only after that's real.
- **Visual carousel image generation in v1** — no tool has been validated yet (leaning Google/Gemini, but
  untested). Ship text-only carousels first.
- **Freeform platform text field** — a short, known list doesn't need typing-it-yourself flexibility, and
  the comment-pull button needs an exact match to pick the right Apify Actor.
- **Scraping the live page directly (no Apify, no API)** — more fragile than a maintained third-party
  Actor; the project has explicitly avoided hand-built scraping before.

## Open Questions

- Exact list of platforms for the `socialLinks` dropdown — Facebook, Instagram, TikTok, LinkedIn, X,
  Threads, YouTube, or a trimmed subset to start?
- Should a "drafted but not yet used" cell ever nag/remind, or stay purely pull-based (matches "AI
  proposes, human decides," per the project's own Seven Pillars)?
- Comment-pull refresh behavior: does re-clicking "pull comments" on a post merge in only new comments
  since last pull, or re-check everything each time? Affects both Apify cost and dedupe complexity.
