# AGENTS.md

Lean, tool-agnostic primer for any AI coding assistant working in this repo — Claude Code, Cursor, Aider,
Codex CLI, or otherwise. Points at the real depth rather than duplicating it; read the linked docs for
anything beyond the rules below.

## What this project is

asheraw.com — a personal site (blog, theatre/coaching portfolio, an interactive "PLAY" mode) built on
Next.js, with Sanity Studio as the CMS, hosted on **Netlify** (not Vercel — the site moved hosts on
2026-08-30; stale Vercel references in older comments/docs are leftover, not current fact). Deployed via
git push, described below.

## Hard rules — read before touching git or the dev server

1. **Never push to `main` without fresh, explicit go-ahead for *that specific change*.** Default every
   push to the `pending-deploy` branch instead (a running backup/staging branch, safe to push to freely
   once local verification passes). Netlify's continuous deployment only watches `main`, and every push to
   it burns real, limited deploy credits (300/month, 15/deploy, resets ~5th of each month) — there is no
   API to check the live balance, so this has to hold as a hard rule, not something monitored. **An earlier
   "deploy to production" instruction does not carry forward** to later, different work in the same
   session — each push to `main` needs its own confirmation, no matter how recently permission was given
   for something else. After any push to `main`, ask the user to check the live site/Studio themselves —
   there's no way to preview a deploy from here.

2. **Don't run `npm run build` while `npm run dev` is running against the same project.** They share
   `.next/`, and running both corrupts the cache and serves stale content on localhost. Use
   `npx tsc --noEmit` to verify while the dev server is live; save a real `npm run build` for right before
   a push, with the dev server stopped (or use a separate working tree).

3. **This repo may be edited elsewhere between sessions** (another AI session, or the user directly). Run
   `git fetch && git status` and skim recent `git log`/`CHANGELOG.md` entries before assuming local state
   matches what's live — don't trust a stale mental model of "what's already done."

4. **Sanity Studio's login can't be automated.** Google blocks automated OAuth against Studio even from a
   real browser session — don't spend time trying to script a Studio login for testing; verify Studio
   changes by reading the schema/component code and, where possible, testing the equivalent public-facing
   page instead.

## Where the real depth lives

| File | What's in it |
|---|---|
| `CHANGELOG.md` | Dated log of every shipped change — the source of truth for "when/how was X done, and why" |
| `RUNBOOK.md` | Operational procedures: deploy, recover, recurring tasks, past incidents and their root causes |
| `ACE_MASTER_SPEC.md` / `ACE_PRD.md` | Spec + product requirements for Project A.C.E. (a sub-project inside this repo) |
| `IDEAS.md` | Open ideas, deliberately not yet built |
| `CURRENT_STATE_AUDIT.md` | Point-in-time snapshot of what's actually built vs. planned |
| `IMPLEMENTATION_PLAN.md` | Active implementation plan |
| `BACKUP_AND_RECOVERY_GUIDE.md` | Backup/recovery steps |

These are large and grow over time — grep/search for a specific term rather than reading one wholesale,
same as you would any other big reference doc.

## Verifying a change before it's considered done

- Typecheck: `npx tsc --noEmit`
- Full build (only with the dev server stopped, see rule 2): `npm run build`
- For UI changes: actually load the page (dev server + a real browser or headless check) rather than
  trusting a type-check alone — this project has repeatedly shipped visually-broken-but-type-correct code
  when that step was skipped.
