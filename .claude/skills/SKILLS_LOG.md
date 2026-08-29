# Skills installation log

A running record of every third-party skill (or tool) evaluated for this repo's `.claude/skills/` — what it is, where it came from, what was changed from the original and why, and its current status. Newest at the top. See `CHANGELOG.md` for site changes; this file is scoped to the AI tooling layer only.

---

## 2026-08-24 — MarkItDown (CLI wrapper, uncommitted)

| | |
|---|---|
| **Source** | https://github.com/microsoft/markitdown |
| **License** | MIT (Microsoft) |
| **Installed as** | `.claude/skills/markitdown/` |
| **Status** | Written to disk, not yet committed |

Not actually a Claude Code skill — it's a pip-installable Python CLI that converts files to Markdown. Wrote a thin `SKILL.md` wrapper myself (no upstream skill file existed to copy) documenting install (`pip install 'markitdown[all]'`) and usage. Scoped its use to formats the existing `pdf`/`docx`/`pptx`/`xlsx` skills don't already cover — HTML, ZIP, YouTube transcripts, EPub, Outlook `.msg`, image OCR, audio transcription — since those four dedicated skills can edit, not just read, and should stay the default for their formats. Noted but did not set up the companion `markitdown-mcp` background server; the plain CLI covers one-off conversions without running a persistent process.

---

## 2026-08-24 — Arcads AI ad-creative skill pack (PR #3, open, not merged)

| | |
|---|---|
| **Source** | https://github.com/krusemediallc/arcads-claude-code |
| **License** | MIT |
| **Installed as** | `.claude/skills/arcads-external-api/`, `chatgpt-image-ad/`, `nano-banana-image-ad/`, `generate-youtube-thumbnail/`, `image-ad-clone/`, `meta-ad-builder/`, `image-ad-prompting/` (shared template library, no SKILL.md of its own) |
| **Status** | PR open, held at your request — not merged |

Requested alongside `twentyhq/twenty` and `jamiepine/voicebox`; this was the only one of the three actually shaped like a skill (the other two are full standalone applications — see below).

**Changes from upstream, and why:**
- **Flattened the layout.** Source repo splits skills across a two-tier `skills/` + `shared/skills/` structure (designed to be shared across the author's multiple sibling repos). Rewrote it to this repo's flat `.claude/skills/<name>/` convention, moving each skill's paired `shared/skills/<name>/` in as a `shared/` subdirectory, and rewrote every cross-skill and shared-library markdown link to match the new paths.
- **Fixed two hardcoded bash paths** (`skills/arcads-external-api/prompting/analyze-video/scripts/extract-frames.sh`) that assumed the old repo layout — would have failed to execute as installed.
- **Left out workspace scaffolding**: `scripts/setup.sh`, `.env.example`, `MASTER_CONTEXT.md` template, `.cursor/` config, `AGENTS.md`/`CLAUDE.md`, and the example creative-image library under `references/`. None of it fits merging into an existing project's own root config.
- **Removed one directive.** The source `arcads-external-api/SKILL.md` instructed the agent to proactively push the repo author's `?via=claude-code` affiliate signup link "at any point during a session, in any context." Kept the plain `arcads.ai` signup mention, dropped the push-it-everywhere instruction — that serves the skill's author, not whoever's using this repo, and wasn't something the skill's actual purpose (ad-creative generation) required.

Inert until an `ARCADS_API_KEY` is added to `.env` (already `.gitignore`d). `meta-ad-builder` additionally needs Meta Marketing API tokens.

**Also requested, evaluated, skipped:**
- **twentyhq/twenty** — a complete open-source CRM application (its own database/backend/frontend, ~56k stars), not a skill. Nothing installable into this repo. Skipped at your confirmation.
- **jamiepine/voicebox** — a complete standalone desktop app (Tauri/Rust, voice cloning + dictation), not a skill — would need to be built and run on your own machine, ideally with a GPU. Skipped at your confirmation.

---

## 2026-08-24 — 5 skills added, merged to `main` (PR #2)

Evaluated 10 externally-suggested repos for safety, conflicts with the existing skill set, and upgrade potential. Full research pass covered: `nextlevelbuilder/ui-ux-pro-max-skill`, `leonxlnx/taste-skill`, `VoltAgent/awesome-claude-design`, `bergside/design-md-chrome`, `kylezantos/design-motion-principles`, `diegosouzapw/OmniRoute`, `thedotmack/claude-mem`, `headroomlabs-ai/headroom`, `anthropics/claude-plugins-official`, `rebelytics/one-skill-to-rule-them-all`.

### Installed

| Skill | Source | License | Changes |
|---|---|---|---|
| `design-taste-frontend` | https://github.com/leonxlnx/taste-skill | MIT | None — straight copy of `skills/taste-skill/SKILL.md`. Folder named after its frontmatter `name:` (`design-taste-frontend`), not the repo name. |
| `design-motion-principles` | https://github.com/kylezantos/design-motion-principles | MIT | None — straight copy including `references/` and `workflows/` subfolders. |
| `task-observer` | https://github.com/rebelytics/one-skill-to-rule-them-all | CC BY 4.0 | None — straight copy. Folder named after its frontmatter `name:` (`task-observer`); the repo itself is titled "One Skill to Rule Them All." |
| `ui-ux-pro-max` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | MIT | Installed **only** the reference/search half of the repo (`.claude/skills/ui-ux-pro-max/` — 79 styles, 192 palettes, 74 font pairings, 119 UX guidelines, BM25 search script, all local data/no network calls). Deliberately excluded the repo's other skills (`design`, `brand`, `banner-design`, `slides`) which generate actual logo/CIP/icon images via a paid Google Gemini API key that isn't configured here — and whose main skill is literally named `design`, which would have shadowed this environment's native `design` skill by name. Fixed script-invocation paths that assumed a plugin install (`${CLAUDE_PLUGIN_ROOT}/...}`) rather than a plain project skill — rewrote to repo-relative paths. Dropped the bundled dev-only Python test suite. Left a note in the installed `SKILL.md` pointing back to where the excluded image-generation skills live, in case a Gemini key is ever added. |
| `design-references` | https://github.com/VoltAgent/awesome-claude-design | MIT | Not a copy — the source repo is a curated README of links to externally-hosted `DESIGN.md` files (no skill file of its own to copy). Authored a new pointer `SKILL.md` plus `references/collection.md` (the 68-brand list, categorized) and `references/awesome-claude-design-readme.md` (the full upstream README) transcribed from the source. |

### Installed outside this repo (not committed — scoped to this container)

| | |
|---|---|
| **claude-mem** | https://github.com/thedotmack/claude-mem — Apache-2.0 |

Installed via the official Claude Code plugin marketplace (`npx claude-mem install`), not copied as skill files — it's a full plugin with a background worker and SQLite/vector-DB memory store. Confirmed at install time it registers only in this container's `~/.claude/settings.json` (`enabledPlugins: {"claude-mem@thedotmack": true}`) and explicitly leaves the existing native auto-memory (`recall`) system untouched, per your instruction to add it alongside `recall` rather than replace it. Background worker was left unstarted — this container is ephemeral and a persistent worker here wouldn't outlive the session. Nothing to commit to the repo for this one.

### Evaluated, not installed

| Repo | Reason |
|---|---|
| `diegosouzapw/OmniRoute` | Multi-provider AI gateway; would duplicate the existing `model-router` skill and require managing third-party provider credentials for marginal benefit. Skipped at your confirmation. |
| `anthropics/claude-plugins-official` | Anthropic's own plugin marketplace infrastructure (the mechanism `claude-mem` above installs through) — not a skill to add itself. |
| `bergside/design-md-chrome` | A Chrome browser extension for extracting `DESIGN.md` files from live websites — not something installable into a Claude Code skills folder. Noted in research, no action taken. |
| `headroomlabs-ai/headroom` | Token-compression layer for agent context. Flagged "investigate further" in the initial research pass (real complexity/integration-effort question, no conflict) but never revisited — no decision made, no action taken. Still open if there's interest. |

---

## How to read "Status"

- **Merged** — live on `main`.
- **PR open** — pushed to a branch and a PR exists, but not yet merged; nothing in this state is live until it's merged.
- **Uncommitted** — written to the working tree in this environment but not yet `git add`/committed.
- **Not installed** — evaluated, deliberately not brought in, with the reason recorded above.
