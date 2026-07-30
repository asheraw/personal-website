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

**Distraction-free writing mode: finally decided — not building it.** The PRD lists this as Phase 1 scope
(focus mode, document outline, typewriter scroll, word count, session timer, streak counter). Asher was asked
twice: 2026-07-29 (said Sanity's default editor is good enough) and again 2026-07-30, specifically because it
was the one item keeping Phase 1 formally open. Second answer, same day: "For now, I can just use the current
one, I don't have a big issue with it." Final. This is a legitimate PRD deviation, not a gap — his call, per
the Decision Authority Matrix, and asked twice rather than assumed. **Phase 1 is now fully closed.**

**Internal link picker: new, real gap surfaced by Asher, not yet built.** Asked 2026-07-30: right now, linking
to another post inside the rich-text editor means manually typing or pasting its URL — there's no
WordPress-style "search existing content" picker. Worse, the pasted URL embeds the *slug* directly, so if that
other post's slug ever changes later, the link silently breaks with no warning. WordPress avoids this by
linking through a stable numeric post ID internally and resolving it to the current slug at render time — the
displayed URL always stays correct even after a slug change. This is exactly the PRD's "internal-link
suggestions while editing" line under Content hygiene & platform tooling (Part III). The fix is architecturally
the same pattern already used for reusable snippets: a new Portable Text mark/annotation that stores a
*reference* to the target post (its stable `_id`) instead of a raw URL string, resolved to the current slug
only at render time. Not yet built — flagged here so it isn't lost; ask Asher to confirm before building, since
it changes how the rich-text link toolbar works for every future post.

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

4. **Distraction-free writing mode.** Resolved same day — Asher confirmed (second time asked) he doesn't
   want it built. See the decision entry above. Phase 1 closed without it.

Each of these ships with its own `RUNBOOK.md` entry (per the PRD's own rule: the runbook ships *with*
features, not retroactively) and a `CHANGELOG.md` entry once done.
