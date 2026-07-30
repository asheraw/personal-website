# Current State Audit

A snapshot of what actually exists in this repo and how it actually works, as of 2026-07-30. Written as the
Phase 0 read-only discovery document `ACE_PRD.md` requires ("produce `CURRENT_STATE_AUDIT.md`") — this
records what *is*, not what's planned; see `ACE_PRD.md` / `ACE_MASTER_SPEC.md` for the roadmap, `CHANGELOG.md`
for what's shipped and when, and `RUNBOOK.md` for what to do when something breaks.

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack build), React 19, TypeScript 5.
- **Content:** Sanity CMS v6 (project `oj9eajjd`, dataset `production`), queried via GROQ, live updates via
  Sanity's Live Content API (`SanityLive`, `sanityFetch()`).
- **Styling:** Tailwind CSS v4, shadcn/ui components (Radix primitives) for form controls, custom CSS
  (`src/app/globals.css`) for the site's own theatre-stage design language and light/dark theme tokens.
- **Animation:** Framer Motion. Homepage PLAY mode additionally uses `three.js` / `@react-three/fiber` /
  `@react-three/drei` for a 3D scene.
- **AI:** Google Gemini (`gemini-3.6-flash` at time of writing — this string changes; see `RUNBOOK.md`),
  used only for the Studio's "Suggest SEO & Excerpt" action. Server-side only, key never exposed to the
  browser.
- **Email:** Resend, for the contact form's notification email only (not a newsletter/marketing tool — that
  doesn't exist yet, see Phase 5 gap below).
- **Secondary database:** Postgres via Prisma (`prisma/schema.prisma`), holding exactly one real model
  (`User`, currently unused/dormant — a leftover from the original project template) and, historically,
  contact form submissions, which were migrated *off* this database to Sanity on 2026-07-28 (see incident
  log). Nothing content-related belongs here; see `RUNBOOK.md`'s "First 24 hours" section.
- **Hosting:** Vercel, auto-deploys on push to `main`. No staging environment — `main` is production.
- **Backups:** GitHub Actions (`.github/workflows/backup.yml`), daily Sanity export, 30-day retention as
  workflow artifacts. See `BACKUP_AND_RECOVERY_GUIDE.md`.

## Route map (as of this audit)

```
/                          Homepage (Story + Play modes, one shared data source)
/blog                      Blog index
/blog/[slug]                Individual post
/blog/category/[slug]       Category archive
/blog/tag/[tag]              Tag archive
/blog/author/[slug]         Author archive
/connect                   Link-in-bio page (own metadata, own OG image, now shares the global header/footer)
/studio/[[...tool]]         Sanity Studio (isolated root layout — see below)
/rss.xml, /sitemap.xml, /robots.txt   Standard discovery feeds
/api/contact                Contact form submission (Sanity + Resend)
/api/ai/suggest-seo          Gemini-backed SEO/excerpt/tag suggestions
/api/track-404               404 hit logging (Sanity notFoundHit doc)
/api/draft-mode/enable, /disable   Sanity preview draft mode toggle
not-found.tsx (root)        Global 404 boundary — required to be at app root by Next.js, so it renders its
                             own SiteProviders (ThemeProvider + chrome config) rather than sharing (site)'s
                             layout, but mounts the identical SiteHeader/SiteFooter
```

`src/app/layout.tsx` is deliberately minimal (fonts, base styles, a blocking inline theme-init script) since
it's the one layout shared by both the marketing/blog site *and* Studio — everything site-specific
(analytics, cookie banner, theme system, cursor, live-preview connection) lives in
`src/app/(site)/layout.tsx`, isolating Studio from all of it. This split exists because mounting the
live-preview connection at the true root caused every Studio edit to force-refresh the Studio page itself.

## Sanity schema (current, not the PRD's target ~40-field model)

Registered types (`src/sanity/schemaTypes/index.ts`): `post`, `category`, `author`, `blockContent`,
`contactSubmission`, `aiPromptSettingsType` (singleton), `notFoundHitType`.

**`post`** is the real content type. Current fields (in the editor's actual writing order — body first,
metadata last, matching how Asher actually writes): body (Portable Text with callouts/code
blocks/accordions/YouTube embeds), title, slug (manual, not yet auto-generating live), main image,
categories (checkbox multi-select, custom input) + primary category, tags (autocomplete, custom input),
author (reference, defaults via a hardcoded GROQ lookup for `slug.current == "asher-aw"` — **not yet
configurable via a Site Settings singleton**, one of the identified Phase 1 gaps), published date, excerpt,
SEO title, social image, noIndex flag. Reading time is computed on the fly (not stored) from body content.

Not yet present, relative to the PRD's ~40-field target model: alternative headline, scheduled/archived
lifecycle states beyond draft/published, updated/last-reviewed dates, PLAY configuration per post,
alternative-version linking, key takeaways / questions answered / people-mentioned / references fields,
canonical URL override, per-post Twitter fields distinct from Open Graph, newsletter settings, analytics
identifiers.

**Singletons that exist:** only `aiPromptSettingsType` ("AI Suggestion Settings" — the editable prompt text
behind Gemini suggestions). **Singletons the PRD's Studio nav calls for that don't exist yet:** Site
Settings, SEO Defaults, Analytics, Newsletter, Navigation. Of these, only **Site Settings** is in the current
Phase 1 gap list (the others belong to later phases — SEO Defaults/Analytics to Phase 6, Newsletter to
Phase 5).

**Custom Studio tooling that exists:** category checkbox input, tag autocomplete input, a "Posts" tab on
each category showing what references it (`CategoryPostsView.tsx`), a delete-guard that asks about
reassignment before deleting an in-use category, editable AI prompt instructions, a "404 Hits" list. No
media-library-level reuse tracking yet (which posts use a given *image* — the category version of this
exists, the image version doesn't; identified Phase 1 gap).

## Theme system

Custom (no library) React Context (`ThemeProvider.tsx`) toggling a `.light`/`.dark` class on `<html>`, backed
by `localStorage`. A blocking inline script in the root `<head>` sets the class synchronously before first
paint (avoids a flash-of-wrong-theme on slow connections); `ThemeProvider`'s own state always initializes to
`"dark"` (matching the server) and self-corrects via a guarded `useLayoutEffect`, specifically to avoid a
React hydration mismatch that was previously causing theme state to go flaky across full page navigations
(fixed 2026-07-30, see `RUNBOOK.md` incident log). **Status:** confirmed working in every automated test run
this session (local + live, including full click-through home→blog→connect→404), but Asher has reported it
still misbehaving specifically on the home→blog transition in his own real browser after this exact fix
shipped — unreproduced, open, needs his browser/device details to continue (see `RUNBOOK.md`).

## Known gaps vs. the PRD (the honest list, not the aspirational one)

This is the actual reason this document exists — a prior chat-only summary claimed "Phase 0 and Phase 1 are
done," which didn't hold up once checked against `ACE_PRD.md`'s real exit criteria. See
`ACE_MASTER_SPEC.md` Part VIII (phase table) and the Definition of Done for the complete target list. As of
this audit, closed vs. not:

- **Phase 0:** backup/restore drill genuinely done and verified (see `RUNBOOK.md` incident log,
  2026-07-29). This document and `IMPLEMENTATION_PLAN.md` were the missing pieces — being written now.
- **Phase 1:** reading time, category checkboxes, tag autocomplete, AI-suggested tags all shipped and
  verified. Still missing: Site Settings singleton, distraction-free writing mode, reusable content
  snippets, media-library-level image reuse tracking (all being worked on this session — see
  `CHANGELOG.md` for what's actually landed by the time you're reading this).
- **Phases 2–10:** not started. Phase 2 (STORY Frontend: series/collections, footnotes/citations,
  per-author/category/tag RSS, print stylesheet) is the next phase in sequence once Phase 1 genuinely closes.

## What this document is not

Not a roadmap (that's `ACE_PRD.md`/`ACE_MASTER_SPEC.md`), not a shipped-work log (that's `CHANGELOG.md`), not
a troubleshooting guide (that's `RUNBOOK.md`). This is a point-in-time snapshot of what exists — it will go
stale. If a future session needs "what does the codebase actually look like right now," re-derive it from
the code rather than trusting this file blindly once enough time has passed; the four documents above are
the ones expected to stay current.
