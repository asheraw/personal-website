# Skills installation log (local backup)

A local, on-this-machine backup of what's been installed and why. The canonical, cross-surface source of truth is the "How to Keep Track of Your Skills" table (Sanity, `drafts.140e575a-7730-4d73-9789-d738c22c5ace` as of 2026-08-31) - that's what every surface (desktop, browser Code, claude.ai, CoWork) should read and write. This file exists as a redundant local record on this machine only, and may drift from the live table or from copies on other machines/branches - if the two disagree, the Sanity table wins.

---

## 2026-08-31 - agent-skills, marketingskills, grill-me, caveman, skillspector; context-mode evaluated and skipped

| Skill(s) | Source | License | Status |
|---|---|---|---|
| 25 skills (spec-driven-development, test-driven-development, code-review-and-quality, security-and-hardening, frontend-ui-engineering, etc.) + shared `references/` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | MIT | Installed, all 25 as-is (including 2 that overlap existing skills - see below) |
| 50 skills (copywriting, cro, seo-audit, ads, launch, pricing, marketing-council, etc.) + shared `tools/` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | MIT | Installed, all 50, given Asher's coaching business |
| grill-me | [mattpocock/skills](https://github.com/mattpocock/skills) (skills/productivity/grill-me) | MIT | Installed |
| caveman | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | MIT (skill only) | Installed, skill half only |
| skillspector (CLI, not a skill file) | [NVIDIA/skillspector](https://github.com/NVIDIA/skillspector) | Apache 2.0 | Installed as a `uv tool`; thin wrapper skill written |
| context-mode | [mksglu/context-mode](https://github.com/mksglu/context-mode) | ELv2 | **Skipped** |

**Known overlaps, kept deliberately (Asher's call, not a mistake):**
- `agent-skills`' `web-performance-auditor` (`/webperf`) duplicates the already-installed global `web-perf` skill.
- `agent-skills`' `interview-me` is near-identical to `grill-me` (its own description namechecks "grill me" as a trigger phrase).

**Corrected en route:**
- The install command originally given for `caveman` (`npx skills add mattpocock/skills --skill caveman`) pointed at the wrong repo - `caveman` doesn't exist in `mattpocock/skills` at all. Correct command: `npx skills add JuliusBrussee/caveman`. Matt Pocock's repo does separately include its own unrelated `grill-me` skill, installed above under its real name.
- `caveman`'s source repo also ships **Caveman Proxy**, a third local input-compression proxy (BSL-1.1 licensed runtime, separate from the MIT skill). Not installed - redundant with the `model-router`/`fabsol` proxy and `headroom`, already here, and a more restrictive license than everything else in this set.

**Why `context-mode` was skipped:** its README displays "Used across teams at Microsoft, Google, Meta, Amazon, IBM, NVIDIA..." company logos that all link to `#` (nowhere) - unsubstantiated social proof for a tool requesting very broad access (hooks on every lifecycle event: PreToolUse, PostToolUse, UserPromptSubmit, PreCompact, SessionStart, Stop; an arbitrary-code-execution MCP tool; a hosted "Insight dashboard" phone-home). Also directly redundant with `claude-mem` and `headroom`, already installed, for the same context/token-savings problem.

**Verification note:** ran `skillspector scan` against a couple of today's installs as a real test, not just a demo - clean on `caveman`, correctly flagged `headroom`'s external doc link as "referenced artifact not completely inspected" (an honest incomplete-coverage warning, not a false alarm).

---

## Everything before 2026-08-31

See the live Sanity table (canonical) for the full history: `design-taste-frontend`, `design-motion-principles`, `task-observer`, `design-references`, `ui-ux-pro-max` (2026-08-24/25), `claude-mem` (real install 2026-08-30, after an earlier attempt in a since-gone remote sandbox didn't stick), `claude-code-setup`, `headroom` (2026-08-30), plus everything evaluated and shelved (`design-md-chrome`, `OmniRoute`, `twenty`, `voicebox`). The `arcads-*` skill pack and `markitdown` also exist, on branches/PRs from a separate (remote sandbox) environment not reachable from this machine's git history.
