# Implementation Plan

The record `ACE_PRD.md`'s Agent Rule #6 calls for: every non-obvious decision, with reasoning, so a future
session (human or AI) inherits *why*, not just *what*. Written retroactively for decisions already made
(better late than never — this document itself was a Phase 0 gap), and kept current going forward for new
ones. Companion to `CURRENT_STATE_AUDIT.md` (what exists) and `CHANGELOG.md` (what shipped, dated).

---

## Key decisions made so far, and why

**AI provider: Gemini, not Claude or OpenAI.** The project's own Claude Pro subscription doesn't cover API
usage (billed separately). Gemini's `gemini-*-flash` tier has a genuine permanent free tier (1,500
requests/day at time of writing) — at personal-blog volume this should never cost anything. Revisit only if
usage genuinely outgrows the free tier, or if a future Gemini pricing change removes it.

**Contact form storage: Sanity, not a separate database.** Originally Postgres via Supabase; migrated
2026-07-28 after Supabase's free tier auto-paused itself from inactivity. Sanity was already the canonical
content source and already backed up daily — a second service that can silently sleep added risk for no
benefit. The Postgres/Prisma setup (`prisma/schema.prisma`) still exists for one dormant `User` model, kept
only because removing it entirely wasn't necessary to fix the actual problem — worth fully removing later if
it's confirmed nothing depends on it.

**Search: no dedicated search service planned.** Per `ACE_PRD.md`'s explicit preference, defer to
Google-powered site-restricted search rather than standing up a paid or self-hosted search index. Not yet
built (Phase 2+ territory) — flagging the decision now so a future session doesn't reach for Algolia/etc. by
default.

**Comments: Sanity-native, not Disqus or a hosted widget.** Decided 2026-07-29, not yet built (Phase 9).
Disqus was explicitly rejected — third-party data ownership, ads/tracking, and a direct conflict with the
project's "one canonical source in Sanity" principle (Pillar 1). The eventual system: its own Sanity document
type, moderated in Studio, unread-count badge similar to what a self-hosted forum would show.

**Theme system: no external library.** A small custom React Context + CSS custom properties is enough for a
two-state (light/dark) toggle; a full theming library would be more machinery than the problem needs (Rule
#4, prefer maintainable simplicity). This did cost a real, multi-session debugging effort (see
`RUNBOOK.md`'s incident log) — the complexity wasn't in choosing to build it custom, it was in getting SSR
hydration right, which a library would have handled but at the cost of a new dependency and less control over
the site's specific stage/spotlight visual language.

**Default author: currently hardcoded, being fixed this session.** `postType.ts`'s author field resolves its
initial value via a GROQ query for `slug.current == "asher-aw"`, not a Site Settings singleton — functionally
correct today but not what the PRD specifies ("configurable in Site Settings"), and brittle if that slug ever
changes. Being replaced as part of this Phase 1 closure pass (see below).

**Distraction-free writing mode: intentionally not built, pending Asher's confirmation.** The PRD lists this
as Phase 1 scope (focus mode, document outline, typewriter scroll, word count, session timer, streak
counter). Asher was asked directly on 2026-07-29 whether he wanted a focus-mode editor and said Sanity's
default editor is good enough. That's a real answer from the actual Decision Authority (per the Decision
Authority Matrix, this kind of UX/workflow preference is his call, not something to override toward strict
PRD compliance) — but it leaves this specific PRD line item formally unmet. Flagged back to him again this
session (2026-07-30) rather than silently building something he already declined, or silently marking Phase
1 complete without it. Whatever he decides gets recorded here as the actual, final call.

---

## Plan: closing the remaining Phase 1 gaps (2026-07-30)

Four items identified in `CURRENT_STATE_AUDIT.md` as still open. Build order and reasoning:

1. **Site Settings singleton (default author, configurable).** Smallest, most concrete, and other future
   singletons (SEO Defaults, Navigation, etc.) will want the same "singleton with a real Structure Builder
   entry" pattern already established by `AI Suggestion Settings` — this is the second instance of that
   pattern, not a new one. Scope kept to exactly what's needed now (site title/tagline, default author
   reference) rather than speculatively adding fields no workflow uses yet (Rule #5, don't invent
   requirements) — grows when a real need shows up, not before.

2. **Media library reuse tracking.** Directly reuses the exact pattern already built and shipped for
   category reuse tracking (`CategoryPostsView.tsx` — a GROQ `references($id)` query surfaced as a custom
   Studio document view). Applying the same pattern to image assets is mechanical, not a new design problem.

3. **Reusable content snippets.** A new schema type (`snippet`) plus a Portable Text custom block that
   *references* a snippet document rather than cloning its content — the reference is what makes "update
   once, every post updates" actually true. Bigger than #1/#2 but still a single, well-scoped feature with a
   clear PRD description to build against.

4. **Distraction-free writing mode.** Deliberately last, and gated on Asher's answer above — not started
   until he confirms whether he wants it built, a lighter version of it, or wants this line item formally
   accepted as "won't build" for Phase 1 (a legitimate outcome per the Decision Authority Matrix, as long as
   it's a documented decision rather than a silent gap).

Each of these ships with its own `RUNBOOK.md` entry (per the PRD's own rule: the runbook ships *with*
features, not retroactively) and a `CHANGELOG.md` entry once done.
