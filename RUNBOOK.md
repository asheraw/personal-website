# Runbook

What to do when something breaks. Written in plain English for a non-developer site owner, with enough
detail for a developer (human or AI) picking this up cold.

This file grows over time — every new feature should add its own troubleshooting entry here when it ships,
not after something has already gone wrong with it.

---

## How urgent is it? (severity levels)

- **P0 — Site down, or content lost.** Act immediately.
- **P1 — Publishing or a core flow is broken** (e.g. new posts don't appear, contact form silently fails). Act within the day.
- **P2 — Something's degraded but there's a workaround.** Fix soon, not urgent.
- **P3 — Cosmetic / doesn't affect visitors.** Fix whenever convenient.

---

## Publishing: "I published a post but it's not showing up"

**Symptoms:** A post is published in Sanity Studio (asheraw.com/studio) but doesn't appear on asheraw.com/blog.

**Checks, in order:**
1. **Wait a minute.** The blog re-checks Sanity for changes at most once every 60 seconds (not instantly). If it's been under a minute, just wait.
2. **Confirm it's actually published, not just saved as a draft.** In Studio, open the post — if there's a "Publish" button still showing, it's a draft. Click Publish.
3. **Confirm the post has a slug.** Every post needs its own URL slug (auto-generated from the title). If the title field was left blank at some point, the slug might never have generated. Open the post and check the Slug field has a value.
4. **Check the live site directly:** visit `asheraw.com/blog` and hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) to rule out your browser showing you an old cached copy.
5. **If none of that explains it,** the site's connection to Sanity itself may be misconfigured (this happened once — see "History" below). That needs a developer to check the Sanity project ID/dataset environment variables on Vercel.

**History:** On 2026-07-28, the live site was frozen on whatever content existed at the last deploy — new posts added in Sanity simply never appeared, because the blog pages had no instruction to ever re-check Sanity. Fixed by adding a 60-second revalidation window to `/blog` and `/blog/[slug]`. If this exact symptom reappears (posts genuinely never show, not even after minutes), check that `export const revalidate = 60` is still present near the top of `src/app/blog/page.tsx` and `src/app/blog/[slug]/page.tsx` — it may have been accidentally removed in a later edit.

---

## Live preview: one-time setup, and "Preview shows an error"

Studio has a "Preview" feature (look for it in the top navigation) that shows exactly how a draft will look on
the real site — including unpublished changes — with buttons to check desktop, tablet, and mobile sizes.

**One-time setup required before this works** -- two separate steps, both done as of 2026-07-28:

1. **A read token**, so the website is allowed to read draft content:
   - [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**.
   - Name it something like `Preview`. Permissions: **Viewer** (read-only, never write).
   - Copy the token, add it to **Vercel** (Settings → Environment Variables) as `SANITY_API_READ_TOKEN` → redeploy.

2. **A CORS origin**, so the browser is allowed to make the live preview connection at all:
   - [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **CORS Origins** → **Add CORS origin**.
   - Origin: `https://asheraw.com`. Check **"Allow credentials"** (required -- the preview connection is
     authenticated, not anonymous). Save. Takes effect immediately, no redeploy needed.

**If Preview shows an error or blank page:** almost always one of the two steps above wasn't done, or step 1
was only set for the wrong Vercel environment (Preview/Development vs Production).

**If Presentation crashes after sitting idle for a while** with `CorsOriginError` / "The current origin is
not allowed to connect to the Live Content API": this is step 2 above -- the CORS origin is missing or
doesn't have "Allow credentials" checked. The initial preview view still works even without this (confirmed
2026-07-28); it's specifically the ongoing real-time connection that fails without it.

---

## Backups: "The daily backup failed" / "Where's my content backed up?"

See **BACKUP_AND_RECOVERY_GUIDE.md** for the full explanation and the one-time setup steps. Quick reference:

- Backups run automatically every day via a GitHub Action (`.github/workflows/backup.yml`), and only actually save a new copy when content changed.
- **If a run shows a red X in GitHub's Actions tab:** click into the run, expand the failed step, and read the actual error text (don't just look at the red X — the summary line is often generic). Common causes seen so far:
  - `npm error ... Missing: <package> from lock file` — the project's dependency lock file drifted out of sync. A developer needs to run `npm install` locally and commit the updated `package-lock.json`. (This shouldn't recur for the backup job specifically anymore — it was changed to install only the one small tool it needs, instead of the whole website's dependencies, specifically to avoid this class of failure.)
  - `Error: Nonexistent flag: --token` — the Sanity CLI's export command takes the access token via the `SANITY_AUTH_TOKEN` environment variable, not a command-line flag. If this reappears, check `.github/workflows/backup.yml` still sets `SANITY_AUTH_TOKEN` under the export step's `env:`.
  - `SANITY_API_TOKEN secret is not set` — the one-time GitHub secret setup wasn't completed, or the token expired/was revoked in Sanity's dashboard. Redo the "One-time setup" steps in BACKUP_AND_RECOVERY_GUIDE.md.
- **To restore from a backup:** see the "How to restore" section of BACKUP_AND_RECOVERY_GUIDE.md.

---

## Contact form: "A visitor said the form didn't work" / "I'm not getting notification emails"

- The form saves every submission as a **Contact Submission** document in Sanity (visible in Studio's left
  sidebar) *and* tries to send you a notification email via Resend. If Resend isn't configured, the
  submission is still saved — you just don't get an email about it. So: if someone says they submitted the
  form but you got no email, check Studio → Contact Submissions before assuming it's lost.
- Required for the notification email to work: `RESEND_API_KEY` and `CONTACT_NOTIFICATION_EMAIL` environment
  variables must be set in Vercel's project settings (not just a local `.env` file, which never reaches
  production).
- As of 2026-07-28 the contact form was confirmed working in production (tested, notification email
  received) — if it breaks later, the first thing to check is whether those two environment variables are
  still correctly set in Vercel.

**One-time setup for saving submissions (do this once):** the form needs a Sanity token that can *write*
content, not just read it — different from every other token set up so far in this guide, which are all
read-only.
1. [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens** → **Add API token**.
2. Name it something like `Contact Form Writer`. Permissions: **Editor** (needs to create and update
   submission records — Viewer alone won't work here).
3. Copy the token, add it to **Vercel** (Settings → Environment Variables) as `SANITY_API_WRITE_TOKEN` →
   redeploy.

**If submissions stop saving:** almost always this token — expired, revoked, or never set for the right
Vercel environment. The error in Vercel's logs will say something like `Insufficient permissions; permission
"create" required`, which confirms it's this token, not something else.

**History:** originally used a separate Postgres database (via Supabase) for this. Migrated to Sanity on
2026-07-28 after Supabase's free tier auto-paused the project from inactivity (it pauses after ~1 week with
no activity, and needs a manual unpause). Storing submissions in Sanity instead means no second service that
can silently go to sleep, and submissions are automatically swept up by the same daily backup that covers
blog content.

---

## Database: "Something about Prisma/Post/database errors"

- The actual blog content lives entirely in **Sanity** — that's the one and only source of truth. A separate Postgres database (via Prisma) exists only for contact form submissions.
- A leftover, unused `Post` table used to exist in that Postgres database from the original site template. It was removed from the app's schema on 2026-07-28 because it was a second, disconnected place blog content *could* have been stored, which risks confusion later. Nothing in the app ever read from it. If you ever see a database error mentioning a `Post` table, that's a sign someone (or some AI-generated code) is trying to reintroduce it — don't; use Sanity instead.
- If you ever see `@prisma/client did not initialize yet`, the database client wasn't generated after installing dependencies. This should self-heal automatically now (`"postinstall": "prisma generate"` runs after every install), but if it reappears, running `npx prisma generate` fixes it immediately.

---

## Analytics / cookie consent

- Google Tag Manager (GTM) only loads after a visitor clicks "Accept" on the cookie banner — it does not load at all otherwise, by design (added 2026-07-28, previously it loaded unconditionally for every visitor with no opt-out).
- The visitor's choice is remembered in their browser (`localStorage`), not sent anywhere else. There's currently no way for *you* to see aggregate consent accept/decline rates — that would be a future addition if it becomes useful.
- If analytics numbers look unexpectedly low, the most likely explanation is simply that visitors are declining or not yet answering the consent banner (expected/normal), not a tracking bug.

---

## Before any schema change, bulk edit, or deploy

1. Check the daily backup ran successfully recently (GitHub → Actions → Daily Content Backup).
2. If you're about to do something to Sanity content that would be painful to redo by hand (bulk edits, restructuring fields), consider manually running the backup workflow first (Actions → Daily Content Backup → Run workflow) so you have a fresh copy from right before the change.
3. For code changes: this project now checks that things actually build (`npm run build`) before anything gets pushed live — but always worth a sanity check that the live site looks right shortly after a deploy.

---

## Contacts / where things live

- **Code:** github.com/asheraw/personal-website (public repo)
- **Content:** Sanity project `oj9eajjd`, dataset `production` — manage at sanity.io/manage, edit at asheraw.com/studio
- **Hosting:** Vercel, connected to the GitHub repo (pushes to `main` auto-deploy)
- **Email notifications:** Resend
- **Backups:** GitHub Actions artifacts (Actions tab → Daily Content Backup), 30-day retention

---

## First 24 hours for a new developer (or AI agent)

- **Never** write blog content anywhere except Sanity. If you're tempted to add a database table for content, stop — that's the exact mistake that was already cleaned up once.
- The site auto-deploys on every push to `main` via Vercel. There is no staging environment yet — treat `main` as production.
- Before touching `prisma/schema.prisma`, know that only `ContactSubmission` (and `User`, currently unused/dormant) exist there on purpose. Content does not belong here.
- Read `BACKUP_AND_RECOVERY_GUIDE.md` before doing anything with Sanity content structure.
- If unsure whether a change is safe to make without asking the site owner first, it probably needs asking — see the Decision Authority guidance in the project's master spec (ACE — Asher's Content Engine).

---

## Incident log

Record every real incident here — what happened, why, how it was fixed. Future entries should follow this
format:

```
### YYYY-MM-DD — Short title
**Symptom:** what was observed
**Root cause:** what actually caused it
**Fix:** what was changed
**Follow-up:** anything still worth doing because of this
```

### 2026-07-28 — Blog frozen on stale content
**Symptom:** Only 1 of 7 published posts appeared on asheraw.com/blog.
**Root cause:** Blog pages fetched from Sanity once at deploy time and never rechecked afterward.
**Fix:** Added `export const revalidate = 60` to the blog list and post pages.
**Follow-up:** None currently — working as intended.

### 2026-07-28 — Backup workflow's first three runs failed
**Symptom:** GitHub Action for daily backups failed with, in order: a generic `npm ci` failure, an
out-of-sync-lockfile error, and a `--token` flag error.
**Root cause:** (1) The main project's `package-lock.json` had drifted out of sync with `package.json`.
(2) The backup job installed the *entire* website's dependencies just to get one CLI tool, tying its
reliability to an unrelated file. (3) Wrong method used to pass the Sanity access token to the export
command.
**Fix:** Regenerated the lockfile; changed the backup job to install only the Sanity CLI directly instead
of the whole project; switched to the `SANITY_AUTH_TOKEN` environment variable.
**Follow-up:** None — confirmed working end-to-end with a real successful backup afterward.
