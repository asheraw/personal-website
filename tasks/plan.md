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
- [x] Task 1: Validate Apify can pull Facebook personal-profile comments — DONE 2026-09-03

### Checkpoint: Phase 1
- [x] Apify spike result documented (works / doesn't work / partial) with real cost-per-run data — see
      `tasks/todo.md` Task 1 findings: `apify/facebook-comments-scraper`, $0.0285 for an 11-comment test
      run against a real personal-profile post
- [x] Go/no-go decision recorded before any schema work begins — **GO**

### Phase 2: Data model
- [x] Task 2: Add `socialLinks` array to `postType.ts` — DONE 2026-09-03
- [x] Task 3: Add `connectedAccounts` array to `siteSettingsType.ts` — DONE 2026-09-03

### Checkpoint: Phase 2
- [x] Studio schema deploys with no errors — `tsc --noEmit` clean on both changed files (pre-existing,
      unrelated errors elsewhere in the codebase are untouched by this work)
- [x] Both new fields editable in Studio against a real (test) post/settings document — verified via the
      Sanity write client directly: 50 real posts migrated into `socialLinks`, one real `connectedAccounts`
      entry saved to Site Settings. **Not yet eyeballed in the Studio browser UI itself** — worth a quick
      manual look before this ships, to confirm the dropdown and object preview render as expected.

### Phase 3: Surface Facebook status + close the comment loop
- [x] Task 4: Surface Facebook-specific drafted/used status in `DistributionDashboardTool.tsx` — DONE 2026-09-03
- [x] Task 5: New API route — pull Facebook comments via the validated Apify Actor — DONE 2026-09-03 (real
      token added later the same day, real end-to-end run confirmed working)
- [x] Task 6: Extract shared comment dedupe/import logic for reuse — DONE 2026-09-03, but written fresh
      (see todo.md's caveat: the historical script this was meant to extract from no longer exists
      anywhere in the repo or its git history)
- [x] Task 7: "Pull comments" button wired into the dashboard's Facebook column — DONE 2026-09-03

### Checkpoint: Complete
- [x] End-to-end (logic level): once a real `APIFY_API_TOKEN` was added, ran the actual shared logic behind
      the button twice against `even-my-discipline-was-an-escape` -- first run pulled 11 real comments, 10
      created as `pending` (correctly threaded), 1 correctly caught as a within-batch duplicate; second run
      pulled the same 11, 0 created / 11 matched, confirming no duplication on re-pull. Both existing
      `approved` comments on that post stayed untouched. See `tasks/todo.md` Task 7 for the full numbers
      and the one honest gap: this verified the shared logic and the route's exact request shape directly,
      not a literal click on the Studio button or the live post page -- Studio's browser UI remains
      unreachable for automated testing (documented limitation).
- [ ] Asher to click the real "Pull comments" button in Studio at least once, confirm the pending comments
      show up correctly in the Comments moderation queue, and approve/reject the real batch already sitting
      there from the run above
- [x] Review with Asher before starting a second platform -- **Instagram**, picked over the plan's original
      Threads suggestion (X/Threads/YouTube engagement is near-zero for Asher; Instagram is where real
      comments happen). See `tasks/todo.md` Task 8: validated, generalized the shared pipeline, verified
      end-to-end for real (2026-09-03).

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
