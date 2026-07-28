# Backup & Recovery Guide

Plain-English guide to how your blog content is protected, and what to do if something goes wrong.

## What gets backed up

Every blog post, author, category, and image lives in **Sanity** — this is the one place you write and manage content. Once a day, a robot (a GitHub Action) makes a full copy of everything in Sanity and stores it separately, on GitHub's servers. This happens automatically, even if your computer is off.

## One-time setup (do this once)

The backup robot needs permission to read your Sanity content. This takes about 5 minutes and only needs to be done once.

1. **Create a Sanity access token**
   - Go to [sanity.io/manage](https://www.sanity.io/manage) and open your project (project ID `oj9eajjd`).
   - Click **API** in the left menu, then the **Tokens** tab.
   - Click **Add API token**.
   - Name it something like `GitHub Backup`.
   - Set permissions to **Viewer** (read-only — the backup only needs to read, never change, anything).
   - Click **Save**, then **copy the token** it shows you. You will not be able to see it again after you leave the page.

2. **Add the token to GitHub as a secret**
   - Go to your repository: [github.com/asheraw/personal-website](https://github.com/asheraw/personal-website)
   - Click **Settings** (top menu of the repo, not your account settings).
   - In the left sidebar: **Secrets and variables → Actions**.
   - Click **New repository secret**.
   - Name: `SANITY_API_TOKEN`
   - Value: paste the token you copied.
   - Click **Add secret**.

That's it. The backup will now run automatically every day at 9am UTC. You can also trigger it manually any time: go to the **Actions** tab on GitHub, click **Daily Content Backup** in the left list, then **Run workflow**.

## Does it save a new copy every day even if nothing changed?

No. Every day it checks your content, but it only actually saves a new backup copy if something is genuinely different from the last one (a new post, an edit, a deleted post, etc.). If nothing changed, it logs "no changes" and moves on — no clutter, nothing extra stored. You'll see this reflected in the Actions tab: some daily runs will show a backup file attached, others won't (because there was nothing new to save that day).

## Where to find a backup

- Go to the **Actions** tab on GitHub → **Daily Content Backup** → click any past run → scroll to **Artifacts** → download the `.tar.gz` file.
- Backups are kept for 30 days, then automatically removed (a new one is made every day, so you're always covered for the last month).

## How to restore content if something is lost or broken

**If you accidentally deleted or messed up a single post:**
Sanity keeps its own "trash"/history for a little while after a change — this is often the fastest fix and doesn't require a backup file at all. In Sanity Studio, open the post and look for a history/restore option, or contact Sanity support quickly (the recovery window is time-limited).

**If that doesn't work, or the damage is bigger (many posts, or the whole dataset):**
1. Download the most recent backup `.tar.gz` file (see above).
2. You'll need someone with the Sanity CLI installed to run one command to import it back in:
   `npx sanity dataset import sanity-backup-2026-07-28.tar.gz production`
3. This is a good moment to ask your developer/agent for help rather than doing it solo — restoring into the *wrong* dataset would overwrite live content.

## If a backup run fails with a permissions error

The backup remembers "yesterday's fingerprint" by saving a tiny text file back into your GitHub repo. If your repo's default settings don't allow that, you'll see a failed run mentioning permissions. To fix: on GitHub, go to **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions**, then **Save**. One-time fix, not something you'll need to touch again.

## What this does NOT yet cover

This is the first, essential layer of protection. Two more layers are planned but not built yet:
- **Before big changes** (like changing how content is structured), taking an extra "just in case" snapshot right before the change.
- **A tested restore drill** — actually practicing a restore once a month, so we know for certain the backups work, not just that they exist.

These will be added as the site develops further.
