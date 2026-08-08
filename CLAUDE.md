# Workspace routing

Check the auto-memory index (`MEMORY.md`, loaded automatically every session) and the table below before opening any root doc wholesale. Most questions are answered by one of those two without reading further.

## Deep lookups: use the recall script first

For anything not already answered by memory or the table below:

```bash
node .claude/scripts/recall.mjs "your question"
```

It scores every memory file and every heading-section of every doc below by keyword overlap — without opening any of them — and returns only the single best-matching section as JSON, evidence already attached. Read its output before reaching for `Read`/`Grep` on these files directly. If it returns nothing useful, fall back to a targeted `Grep` as normal.

To save a new memory (writes the file and updates `MEMORY.md`'s index in one atomic step, so the index can't drift):

```bash
node .claude/scripts/remember.mjs --name <kebab-slug> --title "<Index title>" --type <user|feedback|project|reference> --hook "<one-line index summary>" --content "<body>"
```
(pipe the body via stdin instead of `--content` for anything long)

## What's in the root docs

| File | ~Lines | What's in it |
|---|---|---|
| `CHANGELOG.md` | 2,443 | Dated log of every shipped change — source of truth for "when/how was X done" |
| `RUNBOOK.md` | 3,116 | Operational procedures — deploy, recover, recurring tasks |
| `ACE_MASTER_SPEC.md` | 402 | Canonical spec for Project A.C.E. (supersedes the older Word docs in `d:\Work\Website - Project A.C.E\`) |
| `ACE_PRD.md` | 299 | Product requirements doc for Project A.C.E., companion to the master spec |
| `IDEAS.md` | 151 | Open ideas log, not yet built |
| `CURRENT_STATE_AUDIT.md` | 124 | Point-in-time audit of what's actually built vs. planned |
| `IMPLEMENTATION_PLAN.md` | 98 | Active implementation plan |
| `BACKUP_AND_RECOVERY_GUIDE.md` | 72 | Backup/recovery steps |

Line counts are as of 2026-08-09 and will drift — read them as "which of these is worth skimming vs. which is huge," not as exact figures.
