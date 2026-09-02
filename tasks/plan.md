# Implementation Plan: Distribution Switchboard — Facebook Skeleton

## Overview

First vertical slice of `docs/ideas/distribution-switchboard.md` and the matching `ACE_PRD.md` update.
Goal: prove the "two synced surfaces + Apify comment pull-back" pattern end-to-end using exactly one
platform (Facebook), reusing as much existing code as possible, before repeating the pattern for any
other platform. Every other platform becomes "same pattern, different dropdown value" once this ships.

Facebook was chosen deliberately as the first slice because caption generation for it already works
(`suggest-social/route.ts` already produces a Facebook caption alongside X/LinkedIn) — the genuinely new
work here is the schema, the per-platform status surfacing, and the Apify comment pipeline, not new AI
generation logic.

## Architecture Decisions

- **Reuse `shareLog`/`aiOutputLog`, don't invent a new "distribution status" schema type.** `shareLog` is
  already the one-document-per-post home for distribution-related state (share counts, engagement notes).
  `aiOutputLog`'s `usedActions` array already logs a free-text action per copy/use click (e.g. "Copied
  Facebook caption"). Task 4 verifies whether that's granular enough to show Facebook-specific status
  before deciding whether any schema change is actually needed there.
- **`socialLinks` replaces `legacyFacebookThreadUrl`.** That field's own description already states
  nothing else in the codebase reads it and it's "safe to delete" — low-risk to replace.
- **Apify integration is a new server-side API route**, calling Apify's REST API directly with a
  server-side token (never a client-side call) — consistent with the project's "keep API keys server-side"
  rule. Not the same thing as this session's own Apify MCP access, which is used only for Task 1's
  research spike, not by the shipped feature.
- **Reuse, don't duplicate, the Facebook comment dedupe/import logic** already proven in the historical
  `.txt` importer (RUNBOOK.md, "Facebook comment re-extraction") — extract it into a shared function
  rather than writing a second copy for the new live pull-back path.

## Task List

### Phase 1: De-risk the unvalidated assumption
- [ ] Task 1: Validate Apify can pull Facebook personal-profile comments

### Checkpoint: Phase 1
- [ ] Apify spike result documented (works / doesn't work / partial) with real cost-per-run data
- [ ] Go/no-go decision recorded before any schema work begins

### Phase 2: Data model
- [ ] Task 2: Add `socialLinks` array to `postType.ts`
- [ ] Task 3: Add `connectedAccounts` array to `siteSettingsType.ts`

### Checkpoint: Phase 2
- [ ] Studio schema deploys with no errors
- [ ] Both new fields editable in Studio against a real (test) post/settings document

### Phase 3: Surface Facebook status + close the comment loop
- [ ] Task 4: Surface Facebook-specific drafted/used status in `DistributionDashboardTool.tsx`
- [ ] Task 5: New API route — pull Facebook comments via the validated Apify Actor
- [ ] Task 6: Extract shared comment dedupe/import logic for reuse
- [ ] Task 7: "Pull comments" button wired into the dashboard's Facebook column

### Checkpoint: Complete
- [ ] End-to-end: click "Pull comments" on one real post with a known Facebook URL, confirm new comments
      land in Sanity, already-`approved` comments keep their status, a second click doesn't duplicate
- [ ] Review with Asher before starting any second platform

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Apify can't reliably scrape a personal Facebook profile's comments, or costs more than expected | High — kills the comment-pull half of the whole direction | Task 1 tests this first, before any other work, with real cost numbers |
| `aiOutputLog.usedActions` isn't actually granular enough per-platform | Medium — Task 4 needs a schema addition instead of a pure UI task | Verify the exact logged string format at the start of Task 4, before writing UI code |
| Apify's Facebook Actor output shape doesn't match the existing `.txt` importer's parsed structure | Medium — Task 6's "reuse" plan becomes "adapt" | Confirm Apify's actual output shape during Task 1, adjust Task 5/6 scope if needed |
| Removing `legacyFacebookThreadUrl` breaks something despite the "nothing reads it" comment | Low | Grep the codebase for the field name before removing it, not just trusting the comment |

## Open Questions

- Does Apify's chosen Actor return comments in a shape close enough to the existing `.txt` importer's
  parsed format to reuse its dedupe logic directly, or does it need a translation layer? (Answered by
  Task 1.)
- What's an acceptable per-run cost ceiling for "pull comments" before it's worth rate-limiting or
  gating behind a confirmation dialog?
