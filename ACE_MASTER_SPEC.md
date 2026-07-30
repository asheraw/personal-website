# A.C.E. — Asher's Content Engine — Master Specification

*Version 1.0 · Merged from five source documents · Companion to `ACE_PRD.md`*

> Write once. Refine intelligently. Publish everywhere. Build for five years.

This is the expanded specification behind `ACE_PRD.md` — same project, more detail: the exact publishing pipeline mechanics, the full ~40-field content model, the Studio UX spec, the Decision Authority Matrix, the Definition of Done, and the phase-by-phase deliverable table. Where the two documents overlap, they agree; this one goes deeper. Committed to the repo (not just Claude project knowledge) so any session — desktop or remote — reads the same source, per Rule #3: One Canonical Source.

---

## The direct answer

**Yes — you write at `/studio`. It publishes itself.** No code edits, no manual deploys, no babysitting the platform. Open `asheraw.com/studio`, write in the rich text editor. Slug generates itself. Author defaults to Asher Aw. Categories are checkboxes, not dialogs. Click Publish.

Sanity fires a webhook. Next.js rebuilds only the affected routes (ISR). RSS, sitemap, and structured data update automatically. The post is live within seconds. AI can assist — SEO titles, social copy, newsletter drafts, image prompts — but never publishes. Every AI output requires review and approval.

### The publishing pipeline — seven steps (~8–15s end-to-end)

1. **Write** — Sanity Studio rich text editor: headings, quotes, code, callouts, images, YouTube embeds.
2. **Auto-fill** — slug from title, author defaults to Asher Aw, reading time auto-calculated, categories via checkboxes.
3. **Preview** — live preview in STORY (desktop/tablet/mobile) and optional PLAY. Drafts never publicly exposed.
4. **Prepare** — "Prepare for Publish" button. AI pre-fills SEO title, meta description, Open Graph, X/Twitter, social card. Pre-publish checklist runs. Review screen shows everything. Reversible.
5. **Publish** — from the review screen only. Sanity transitions document state, webhook fires to the Next.js revalidate endpoint. The one-way door.
6. **Rebuild** — Next.js ISR rebuilds only affected routes (homepage, post page, category, tag, RSS, sitemap). ~5s typical.
7. **Live** — post is public, RSS updated, sitemap notifies search engines, structured data (Article schema) live, social cards ready.

```
Webhook flow:
┌─ Sanity document.publish
└─→ POST /api/revalidate
      ├─ revalidatePath('/blog')
      ├─ revalidatePath('/blog/[slug]')
      ├─ regenerate /rss.xml
      └─ regenerate /sitemap.xml
```

Two-step publish: **Prepare** pre-fills metadata via AI and runs the checklist (reversible, review everything first). **Publish** is the one-way door, available only from the review screen. AI-generated metadata is always a suggestion, never auto-published — every field stays editable.

---

## Part I — What ACE Is

### Mission & Vision

**Mission:** ACE is a unified publishing platform built around one canonical source of truth for every piece of content, powering multiple presentation modes (STORY, optional PLAY) and multiple distribution channels (website, newsletters, social, future formats) without duplicating work.

**Vision:** Not simply a blog or CMS — a long-term content engine that helps a creator produce, manage, distribute, measure, and continuously improve knowledge over time. Approachable for a non-developer, architecturally robust enough to evolve for years.

**The five-year question:** every architectural decision should answer: *will Future Asher appreciate this design five years from now?* If no, rethink the solution.

### Ten AI Agent Rules (apply regardless of model or tool)

**Understanding & structure**
1. **Understand before changing** — read the existing system, schemas, and content before proposing changes. Assume nothing about what already works.
2. **Preserve before replacing** — working functionality is precious. Repair weak parts; don't demolish what serves the editor.
3. **One canonical source of truth** — Sanity is the single source. No duplicate content stores, no shadow databases, no copy-paste between systems.
4. **Prefer simple, maintainable solutions** — boring and proven beats clever and fragile. Every shortcut is a debt Future Asher will pay.
5. **Do not invent requirements** — if the brief doesn't ask for it, don't build it. Document assumptions; surface them for review.

**Discipline & stewardship**
6. **Document assumptions** — every non-obvious choice recorded in `IMPLEMENTATION_PLAN.md` with reasoning. Future agents inherit context.
7. **Keep secrets out of source control** — API keys, tokens, credentials live in environment variables or server-side secret storage, never in Sanity fields or git.
8. **Implement in small, reversible phases** — each phase ships standalone value, is testable, can be rolled back independently.
9. **Never overwrite user work silently** — AI never replaces manual edits without confirmation. Approved copy is sacred. Manual overrides are preserved.
10. **Optimise for Future Asher** — not short-term convenience. Every decision answers the five-year question.

### Seven Pillars

1. **Canonical First** — one authoritative source of truth per piece of content. Everything else derives from it.
2. **Presentation Is Separate** — content and presentation stay decoupled. STORY, PLAY, newsletters, social — all derived, never duplicated.
3. **AI Assists, Humans Decide** — AI packages and amplifies ideas; it does not replace authentic thinking. Never auto-publishes.
4. **Human Approval** — AI-generated work is always reviewable and never auto-published. The editor stays the editor.
5. **Portable Architecture** — avoid vendor lock-in. Keep data exportable. Providers can be replaced. The mailing list is portable.
6. **Progressive Enhancement** — STORY always works. PLAY is optional. Graceful degradation everywhere.
7. **Build For Five Years** — optimise for maintainability over shortcuts.

---

## Part II — Canonical Content Architecture

### The publication document model — one Sanity schema, ~40 fields

Powers every presentation and every channel. Shared metadata lives in one place — no re-entry for STORY vs. PLAY.

- **§01 Identity** — internal title, public headline, alternative headline, auto-generated slug (optional custom slug), excerpt/short summary, estimated reading time.
- **§02 Authorship** — default author (auto-assigned Asher Aw), optional guest author/bio reference, categories (multi-select, primary category), tags (token-style autocomplete).
- **§03 Lifecycle** — draft/scheduled/published/archived state, publication date, updated date, last reviewed date.
- **§04 Content** — STORY content (rich Portable Text), optional PLAY configuration, optional alternative versions, embedded media/YouTube/code blocks, one-sentence summary, key takeaways, callouts/quotes/galleries/downloads, questions answered, topics, people/organisations mentioned, references/sources.
- **§05 Imagery** — featured image + alt text, caption, attribution, focal point controls (for social crops).
- **§06 SEO & Social** — SEO title, meta description, canonical URL, index/no-index, Open Graph title/description/image, X/Twitter title/description/image, Article/Author/Breadcrumb/Video structured data.
- **§07 Distribution** — newsletter settings, conversion settings, AI-generated derivative assets (review queue), analytics identifiers where needed.
- **§08 Machine-readable (optional)** — one-sentence summary, key takeaways, questions answered, topics, related publications, people/organisations mentioned, references/sources.

The editor never re-enters title, author, categories, featured image, SEO, or publication dates separately for STORY and PLAY. Once is enough.

### STORY — the default presentation

A polished long-scrolling editorial layout. Highly readable, responsive, fast, search-engine friendly, accessible. Suitable for essays, articles, case studies, tutorials, announcements, visual stories.

**Page supports:** strong hero presentation, featured image, headline/excerpt/author/dates/reading time, categories and tags, table of contents, **reading-progress indicator**, rich typography, responsive images, code highlighting, quotes/callouts/YouTube embeds, image galleries, downloads, references, related publications, previous/next navigation, newsletter CTAs, social sharing, copy-link, optional comments, alternative-version navigation, STORY/PLAY mode switching when PLAY is available.

**The rule:** STORY must remain usable even when JavaScript fails, where practical. Progressive enhancement — STORY is the floor, PLAY is the ceiling. Every visitor gets STORY.

### PLAY & alternative versions — optional, interactive, never required

PLAY is an optional interactive presentation of the same publication. A publication may have STORY only, STORY + PLAY, or STORY + alternative presentations (Version 2, Visual edition, Condensed edition, Interactive edition, Experimental edition, Case-study layout, Audio-led version).

- PLAY must be **independently disableable on mobile**: don't load PLAY JS, don't load large assets, don't initialise PLAY analytics when disabled. Use server-aware/rendering-aware logic — never rely on browser width after downloading the whole PLAY application.
- **PLAY component safety:** no arbitrary JavaScript in Sanity. Approved registry of interactive components only. Each module: known component type, validated configuration, predictable data, error boundaries, loading states, mobile rules, accessibility fallbacks, analytics hooks, graceful failure.
- Editor controls (PLAY): enabled/disabled, label, introduction, theme/template, desktop/tablet/mobile availability, mobile fallback behaviour, default presentation, search-engine discoverability, separate share image, specific analytics events.
- Editor controls (alternative versions): canonical version selection, index/no-index, canonical URL, site navigation visibility, search visibility, sitemap inclusion, own social metadata.
- Avoid duplicate-content SEO problems — the canonical version always wins. Alternatives are derivatives, never rivals.

---

## Part III — The Studio Experience

A publishing application, not a database editor. Routine tasks automated. Editor never touches source code.

### Studio navigation
Publications · Drafts · Scheduled · Published · Archived · Authors · Categories · Tags · Media · Newsletter · Comments/Responses · Redirects · Site Settings · Navigation · Analytics · SEO Defaults · AI Workspace. Singletons for Site Settings, SEO Defaults, Analytics, Newsletter, Navigation.

### Category selection
Replace the reference-dialog experience with a convenient selector: practical category list visible immediately, multi-select via checkboxes, selected categories clearly visible, search when the list grows large, avoid repeated dialog-opening, optionally mark one category as primary.

### Default author
Asher Aw auto-assigned to every new publication, no manual selection required. Changeable per post. Supports guest authors. Default author configurable in Site Settings.

### Tags
Quick autocomplete/token-style interface. Add by typing. Avoid free-text duplicates. Suggest from existing tag library.

### Automatic slug
Generates from title as you type. No "Generate" button needed. Continues updating while the publication is new; preserves manual customisations; never overwrites an explicit custom slug; stops changing silently once published; validates uniqueness; warns about unusual slugs; handles non-Latin characters; creates redirects when a published slug changes.

### Rich-text editing
Paragraphs, headings, bold, italics, underline (editorial justification only), bulleted/numbered lists, blockquotes, links, dividers, inline code, code blocks with language selection, callouts, quotes, buttons, images with alt text + focal-point controls, galleries, captions, downloads, YouTube embeds, reusable content modules, references, footnotes. Field labels understandable to non-developers.

### Editorial workflow & writing experience

- **Distraction-free writing mode** — full-screen editor with focus mode (fade non-active paragraph), document outline panel (live heading hierarchy, click to jump), typewriter scrolling (active line stays centered), word count, session timer, optional daily writing-goal tracking with streak counter.
- **Editorial calendar** — calendar view of scheduled/published posts, drag to reschedule, filter by author/category/status, visualise publishing cadence and gaps, drafts appear as ghost entries, newsletter issues and social auto-shares appear on the same calendar.
- **Revision history & autosave** — autosave every 10 seconds, every save creates a named revision, compare any two revisions side-by-side with diff highlighting, restore any previous revision, named checkpoints ("before major edit", "v2 draft"), AI edits always create a separate revision, never overwriting manual work.
- **Series & collections** — group posts into ordered series, series landing page with introduction and full table of contents, previous/next navigation within the series, auto-add new posts to an existing series, "read in order" mode, series can have their own RSS feed and newsletter section.
- **Pre-publish checklist & review screen** — two-step publish. "Prepare for Publish" triggers the checklist (featured image set? excerpt written? slug unique? all images have alt text? no broken internal links? SEO title/meta description present? reading time reasonable? categories/tags assigned?) AND pre-fills metadata via AI. Opens a review screen: SEO preview, social-card preview, mobile/desktop preview, character guidance, missing-field warnings. Reversible. The Publish button only appears on this review screen. Warns, never blocks.
- **Bulk operations & search-replace** — bulk edit (add tag, change category/author, reassign to series), bulk publish/unpublish/archive, search & replace across all content with a preview of every affected passage before commit, link URL migration tool (e.g. domain change across every post). Every bulk action creates an undo log.

### Preview system
Preview modes for STORY desktop/tablet/mobile, PLAY desktop/tablet/mobile, alternative versions. Mobile preview is a required capability, not an option. Real frontend rendering, not a mockup — draft content, responsive viewport switching, STORY/PLAY switching, click-to-edit where supported. Clear draft-vs-published indication. Rapid propagation to preview within seconds.

**Auth rule:** preview routes require a Sanity auth session. Draft content is gated server-side. Drafts are never indexed.

### The AI Workspace — never auto-publish

From one publication, generate drafts for every channel. Every output requires human review, surfaced in pre-publish review.

**Outputs:** SEO title, meta description, short summary, key takeaways, FAQ suggestions, pull quotes, alternative headlines, STORY summary · internal-link suggestions, related-publication suggestions, promotional CTA, curiosity-driven blurbs, author bio variation · LinkedIn/X/X-thread/Facebook/Instagram/Threads/TikTok social copy (platform-aware) · newsletter subject line, preview text, full edition · DreamLab image prompt, social-image text treatment, suggested crops, branded social-card templates · YouTube title/description/chapters, podcast show notes, video script outline · PLAY concept outline, STORY summary.

**Curatorial styles (per generation):** Direct · Curious · Contrarian · Educational · Reflective · Story-driven · Benefit-led · Urgent · Playful.

**Voice profile (editable):** preferred tone, words/phrases to avoid, punctuation preferences, humour preferences, sentence style, brand themes, audience description, preferred CTAs, examples of strong previous writing, examples of unwanted writing.

**Content integrity — AI must never invent:** quotes, sources, testimonials, statistics, experiences, credentials, dates, product claims, research findings. When source material is insufficient, the system must say so.

**Workflow controls:** show source content used, show generation purpose, allow custom guidance, generate multiple distinct options, allow regeneration (full or partial), save approved content, preserve manual edits, never overwrite approved copy silently, record whether content was AI-assisted, track model + prompt version, handle failures clearly, enforce rate limits, keep API keys server-side, show estimated cost if billable.

### Content hygiene & platform tooling
The infrastructure that keeps a publication healthy at 50 → 500 → 5,000 posts. Without it, content decays silently.

- **Media library & image management** — searchable/filterable, tag by post/topic/type, reuse tracking (which posts use each image), alt text managed at library level (inherited everywhere the image is used), bulk upload and bulk alt-text editing, auto-generated variants (OG/Twitter/square/vertical) with focal-point preservation.
- **Content audit & stale detection** — stale flags (configurable 6/12/24 month threshold), "needs review" status separate from draft/published/archived, content-decay dashboard (declining traffic, broken links, outdated references), evergreen vs. time-sensitive tagging, last-reviewed date distinct from last-updated date.
- **Import & export** — import from WordPress (XML), Medium (zip), Substack (CSV), Ghost (JSON), Markdown. Export to Markdown, EPUB, PDF (per post + full collection), JSON (full backup), static HTML. Migrates content, images, metadata, slugs, generates redirects automatically. Mailing list always exportable as CSV.
- **Reusable content blocks** — save any block as a snippet (pull quote, callout, CTA, author bio, recurring disclaimer). Insert into any post. Update the snippet once, every post using it updates. Snippet library with categories/search, versioned/rollback-able.
- **References, footnotes & citations** — academic-style, auto-numbered, hover-to-preview. Citation manager with optional BibTeX/Zotero. Auto-generated "References" section. Backlinks panel ("what links here"). Per-author/category/tag RSS feeds.
- **Link management** — weekly automated broken-link scan with email report, external link monitoring (dead links, redirect changes), affiliate link registry with auto-disclosure badge, internal-link suggestions while editing.

---

## Part IV — Frontend & Discovery

### Blog frontend — the public publication
Replace the barebones blog with a polished editorial publication, visually connected to asheraw.com.

- **Pages:** blog homepage, featured publication, recent publications, category/tag/author pages, archive, search interface, related publications, pagination or progressive loading, newsletter areas, custom empty states, custom 404 page.
- **Discovery feeds:** RSS feed (validates), XML sitemap (validates), robots configuration, structured metadata (Article/Person/Organization/Breadcrumb/Video schemas), canonical URLs, clean URL structures, indexing controls.
- **Search:** prefer low-maintenance — primary option is Google-powered site search constrained to the relevant domain (site-restricted search link, Programmable Search Engine, or similar zero-maintenance approach). Keep architecture open to lightweight local search later. No paid external search service without clear need.
- **Theme & modes:** dark mode, light mode, strong typography, responsive layouts, breadcrumbs, accessible navigation, sensible caching/revalidation, fast loading.
- **Standards (a11y):** semantic HTML, clear heading hierarchy, meaningful alt text, structured internal linking, related-content relationships, mobile touch target sizing, reduced-motion support, visible focus states, skip links, accessible forms/dialogs.
- **Identity:** public site favicon, Apple touch icon, web app icons, browser manifest icons, Sanity Studio favicon, default social-sharing image, light and dark brand assets — CMS-controlled where safe.

### SEO / AEO / GEO, social images, DreamLab
Optimise for traditional search, AI-assisted search, and machine interpretation. No vague AI-SEO tricks.

- **Technical structure:** semantic HTML, clear heading hierarchy, descriptive titles, concise summaries, canonical URLs, Article/Person/Organization/WebSite/Breadcrumb/Video schema, FAQ schema only when a real FAQ exists.
- **Editor choices for images:** reuse main featured image, automatically crop (preserve focal point, avoid cutting faces/text, preview each crop, allow manual replacement, never overwrite original), select a focal point, upload custom image, generate branded/AI-prompted image, future image-generation integration.
- **Image variants:** default featured, Open Graph, X/Twitter, LinkedIn-compatible, Facebook-compatible, optional vertical/square.
- **Editorial fields (optional, machine-readable):** one-sentence summary, key takeaways, questions answered, people/organisations mentioned, topics, references, sources, last reviewed date.
- **SEO editor experience:** comparable to a high-quality WordPress SEO plugin — intelligent defaults with optional overrides, approximate search-result preview, social-card preview, mobile/desktop preview, character guidance, missing-field/alt-text/canonical/slug warnings, structured-data validation guidance.
- **Branded social cards:** optional templates (title, shorter social headline, category, author, logo, featured image, brand typography, brand-safe background). Small set of controlled templates — no unrestricted design editor inside Sanity.
- **Canva DreamLab workflow:** investigate a supported integration first. Do not use browser automation, credential scraping, or unofficial private APIs. If a secure integration isn't straightforward: generate an image prompt in Sanity → copy it → open DreamLab separately → generate → download → upload into Sanity → preview social crops. Don't automate a &lt;1-minute manual workflow unless a stable official API exists with clear long-term value.

---

## Part V — Growth & Measurement

### Email collection & conversion tools
Provider decoupled from Sanity — the mailing list stays portable.

- **Provider preferences:** sustainable free tier, simple API, exportable subscribers, reliable double opt-in, clear privacy controls, good deliverability, server-side submission support, webhook support. Never expose provider secrets in the browser.
- **Placement options:** blog homepage, article header, inline article block, after a selected section, after a % of reading progress, sticky desktop sidebar, floating button, end of article, footer, exit intent (desktop), returning-visitor prompt, publication/category-specific CTA, sidebar widget.
- **Engagement-aware prompts:** delayed/progress-triggered, not purely time-based. Prefer meaningful signals — reaching a section, reading %, scroll progress, returning to the page, reaching the end, completing a PLAY interaction. Avoid triggering merely because a tab stayed open while inactive.
- **Popup requirements:** dismissible, keyboard accessible, traps and restores focus correctly, avoids repeated appearance, respects frequency caps and consent, avoids appearing immediately or during critical interactions, disableable globally/per-publication/on mobile. "Unblockable" must not mean hostile.
- **Form states:** idle, loading, success, duplicate subscriber, invalid email, provider error, offline error, rate limit, consent error. Never claim success until the provider confirms.
- **Tracking:** form impression/location/variant, submission, confirmed subscription where available, error type, dismissal, trigger condition.

### Newsletter, membership & monetization
- **Newsletter archive** — public archive at `/newsletter`, per-issue landing page with its own social card, issue categories/sections, subscribe-from-archive, RSS for the newsletter itself, back-issue search.
- **Membership & paid content** — free vs. paid tiers, paywalled *sections* within a post (not just whole-post paywalls), member-only posts, one-time single-essay purchase, tiered pricing (monthly/annual/founding), Stripe integration decoupled and portable (member list always exportable).
- **Monetisation tools** — lead magnets/content upgrades, sponsored content flag with auto-disclosure, affiliate link registry with auto-disclosure, tip jar (Buy Me A Coffee/Ko-fi style), merchandise/product links.
- **Distribution & growth** — auto-share on publish (X/LinkedIn/Facebook/Threads) using reviewed AI copy, cross-posting with canonical pointing back to ACE, built-in UTM link builder, A/B testing (headlines/images/CTAs), referral program.
- **Email subscription preferences** — per-category preferences, frequency options (instant/daily/weekly digest), welcome sequence, unsubscribe-to-reduce-frequency option, re-engagement campaigns.
- **Reader experience** — audio narration (auto TTS, Substack-style), reading-progress sync across devices for logged-in readers, print stylesheet, dark mode reader toggle (respects `prefers-color-scheme` with manual override), aggregated reading time per visitor.

### Content distribution & engagement tracking

**Distribution workflow (possible, low complexity):** one-click AI-generated blurbs per platform (X, LinkedIn, Facebook, Threads) — each stands on its own (hook + highlight). Link lives in the **comment**, not the blurb body (common practice, improves algorithmic reach). Per-platform character limits respected automatically. Copy-to-clipboard + quick-open-post buttons. Optional direct API posting for X v2 and LinkedIn Marketing API (pay-per-use).

**Engagement tracking — the honest assessment (decision, ACE 1.5+):**

| Platform | Feasibility |
|---|---|
| X / Twitter | paid API since 2023 ($100+/mo for engagement) |
| YouTube | Data API v3 — free quota, sufficient at low volume |
| LinkedIn | very limited — company pages only, not personal |
| Facebook Pages | Graph API — possible, requires app review |
| Instagram | business accounts only — limited comment access |
| Threads | emerging API — engagement endpoints still limited |
| TikTok | no public comment API for non-business |

**The plan — two tiers, capped:**
- **Tier 1 (ACE 1.5)** — distribution only: blurbs, copy, open-post buttons. Zero engagement tracking. Highest value, lowest cost.
- **Tier 2 (ACE 1.5+)** — manual engagement log: "mark as responded" toggle per channel, "log a reply" manual entry. No API polling. Forces discipline without infrastructure.
- **Deferred, not recommended:** automated multi-platform engagement tracking (Tier 3/4) and third-party tools (Buffer/Hootsuite/Sprout Social). Ongoing API fees, platform API churn, and subscription lock-in aren't justified for a solo creator. Revisit only if usage volume ever makes the manual log a real burden.

### The standard analytics event model
GTM as the orchestration layer. No scattered tracking scripts. Consent-aware loading.

**Reading & navigation:** `page_view`, `publication_view`, `story_view`, `play_available`, `play_started`, `play_completed`, `play_exited`, `mode_switched`, `scroll_25/50/75/90`, `article_completed`, `table_of_contents_click`, `alternative_version_view`.

**Interaction & conversion:** `related_publication_click`, `outbound_link_click`, `download_click`, `video_impression/started/progress/completed`, `newsletter_form_view/submit`, `newsletter_signup_confirmed`, `newsletter_form_error`, `share_click`, `copy_link`, `social_profile_click`, `search_started`, `search_result_click`, `comment_opened`, `response_click`.

**Consistent parameters:** publication ID/title/slug, category, author, presentation mode, device class, CTA placement/variant, traffic source, referrer, campaign parameters. **No PII sent into analytics systems.**

**Providers (GTM-orchestrated):** Google Tag Manager (central), GA4, Google Ads, Meta Pixel, TikTok Pixel, Microsoft Clarity, LinkedIn Insight, Pinterest Tag. Consent categories: Necessary / Analytics / Advertising / Personalisation. Documented in `ANALYTICS_GUIDE.md`.

---

## Part VI — The Avatar Door (ACE 3.0 preview)

Three doors into the same garden. The blog stays the source of truth; the interface adapts to the device. Ships in Phase 7+ only, after the publishing foundation is stable.

1. **Desktop 3D avatar (full immersion)** — a talking 3D head greets the visitor: "Want to read my latest thoughts?" / "What do you want to know?" First question routes to the most recent post; second triggers AI search + TTS playback. Source: existing 2D NFT portrait → low-poly 3D head. (three.js, GLTF, web-audio, viseme morph.)
2. **Mobile lightweight avatar (pocket edition)** — same conversation tree, lighter payload: a 2D animated sprite (Lottie/SVG) instead of the 3D model, no WebGL, ~30KB vs ~150KB, lower-bitrate TTS. Reduced-motion users get a static sepia portrait with typewriter text reveal.
3. **Traditional blog (the reading room)** — standard blog index at `/blog`, the ACE STORY presentation. Required from launch, for SEO/RSS/accessibility/no-JS/link-sharing. The avatar doors layer *on top*, never replace it.

All three modes share the same Sanity content source and the same AI search backend.

---

## Part VII — Working Method

### Decision Authority Matrix

**Agent decides alone, documents reasoning:** styling system choice, component library selection, caching strategy/revalidation windows, image optimisation provider, code structure/file organisation, TypeScript strictness, test framework selection, linting/formatting rules, default reading-time algorithm, slug sanitisation rules (within published spec), error boundary placement, loading skeleton design, accessibility ARIA patterns (within WCAG AA), RSS feed item limits, sitemap change-frequency heuristics.

**Ask Asher — blocked until confirmed:** missing credentials, an irreversible data migration, a business decision with meaningful cost, a decision that significantly changes public URLs, conflicting requirements that can't be resolved safely, provider selection introducing ongoing cost above free tier, choice of email provider, choice of AI provider, moving hosting providers, changing the canonical author record, adding a third-party comment system, anything affecting the existing published posts' public URLs, deletion of any existing content, anything contradicting the 10 AI Agent Rules.

### Cost & vendor lock-in
The project should remain as close to free as practical. For every external service, document: free-tier limits, current paid thresholds, usage-based fees, vendor lock-in, export options, privacy implications, what breaks if the service is removed.

**Portability rules:** Sanity is the canonical source (exportable). Email provider is decoupled from Sanity (subscribers exportable). Analytics is GTM-orchestrated (providers swappable without code changes). No proprietary data formats or query languages beyond GROQ. No vendor-specific deployment config that can't be ported.

**AI usage (variable cost):** usage limits, clear error handling, provider abstraction where practical, optional disabling, cost visibility, no automatic uncontrolled generation. Show estimated cost if billable. Keep API keys server-side. Enforce reasonable rate limits.

> Note (kept current in `RUNBOOK.md`, not here): the original stack-cost table in this spec listed OpenAI/Anthropic and a "Z.ai SDK" for AI usage, and floated a possible Vercel→Netlify migration. In practice the project stayed on **Vercel** and settled on **Gemini** (`gemini-3.6-flash`) for AI suggestions specifically because it has a genuine permanent free tier — Claude Pro subscription credit doesn't cover API usage. Treat `RUNBOOK.md` as the source of truth for current provider/hosting decisions; this file records the original spec's reasoning, not necessarily the final call.

### Backup & disaster recovery
The single biggest gap in the original spec. Sanity is the canonical source — if it fails, the platform fails. Vendor redundancy is not a backup strategy (it protects against hardware failure, not account issues, billing lapses, accidental deletion, schema-change corruption, or bulk-operation errors).

**Recovery objectives:**
- **RPO** (data loss tolerance): daily export → max 24h loss; pre-change snapshot → zero loss for that change; target no more than 1 day's writing lost in any scenario.
- **RTO** (recovery time): single post restore &lt;15 min; full dataset restore &lt;2h; full platform rebuild &lt;1 business day (fresh Sanity project + DNS cutover).

**Backup strategy — three layers:**
1. Daily automated Sanity export → JSON + assets, stored off-Sanity, 30-day rolling retention.
2. Pre-change snapshots before any schema change/bulk op/deployment, tagged with the change description, retained 90 days.
3. Git-versioned schema + content model — Sanity schemas live in the repo; content exports committed weekly to a private backup branch. The platform can be rebuilt on a fresh Sanity project if the original becomes unavailable.

**Mandatory:** backups that have never been restored are unverified. Monthly restore drill — pick a random daily export, restore to a staging Sanity project, verify content integrity (post count, image count, schema validity, sample content). Document in `BACKUP_AND_RECOVERY_GUIDE.md`.

**Recovery procedures (belong in `RUNBOOK.md`):** single post restore from Sanity trash, single post restore from daily export, bulk-operation undo via pre-change snapshot, schema-change rollback, full dataset restore to a fresh Sanity project, deployment rollback, DNS rollback.

### The editorial runbook
The only artifact that serves Future Asher directly. `RUNBOOK.md` required sections: per-feature troubleshooting trees (symptoms → checks → resolution), recovery procedures, pre-change checklist (mandatory gate — no change ships without it), contact escalation, "first 24 hours for a new developer," incident log template.

**Incident severity:** P0 site down/data loss (act now) · P1 publishing broken (act within the hour) · P2 feature degraded (act within the day) · P3 cosmetic (batch with next release).

**Build cadence:** the runbook ships *with* features, not retroactively — every new feature introduces new failure modes and needs its own "what to do when this breaks" entry. No phase closes without its runbook section committed.

---

## Part VIII — Phased Delivery

### Four milestones

- **1.0 Publishing Engine** (brief Phases 0–3) — Sanity schemas repaired, default author, auto-slug, category selector, rich text, Site Settings, STORY frontend live, SEO/AEO/GEO foundations, RSS/sitemap/structured data.
- **1.5 Distribution Engine** (brief Phases 4–7) — PLAY architecture (optional, mobile-aware), email capture/conversion, analytics/event taxonomy, social image variants + DreamLab workflow.
- **2.0 Knowledge Engine** (brief Phases 8–9) — AI-assisted editorial workspace (30+ outputs), voice profile, approval workflow, cost controls, comments/response system evaluation.
- **3.0 Experience Engine** (brief Phase 10) — avatar door folded in, final hardening: full QA, accessibility, performance, documentation, deployment verification, rollback testing.

### The eleven phases, mapped

| Phase | ACE | Title | Key deliverables |
|---|---|---|---|
| 0 | 1.0 | Audit & Protection | Inspect repository · document architecture · run baseline · back up Sanity content · identify risks · create `IMPLEMENTATION_PLAN.md` · confirm rollback path · **no implementation during this phase** · RESILIENCE: `BACKUP_AND_RECOVERY_GUIDE.md` drafted · daily automated Sanity export set up (off-platform, 30-day retention) · initial pre-change snapshot workflow established |
| 1 | 1.0 | Core Publishing Foundation | Repair content schemas · default author · automatic slug · category selector · rich-text structure · Site Settings · basic preview · existing-content compatibility · NEW: distraction-free writing mode · autosave & revision history with diff · pre-publish checklist · media library with reuse tracking · reusable content blocks (snippets) · RESILIENCE: `RUNBOOK.md` initialized with publishing-pipeline troubleshooting tree · pre-change snapshot workflow made **mandatory gate** for all schema changes |
| 2 | 1.0 | STORY Frontend | Blog homepage · publication pages · categories · tags · authors · archive · related content · theme · dark mode · RSS · sitemap · metadata · NEW: series & collections with series RSS · footnotes/endnotes/citations · per-author/category/tag RSS feeds · print stylesheet |
| 3 | 1.0 | SEO & Machine Readability | SEO editor · search preview · social preview · structured data · canonicals · AEO/GEO-supporting fields · redirect handling · NEW: link management (broken-link checker, external monitoring, affiliate registry with auto-disclosure) |
| 4 | 1.5 | PLAY Architecture | Optional PLAY · approved component registry · STORY/PLAY switching · mobile disabling · conditional loading · alternative versions · preview modes |
| 5 | 1.5 | Email & Conversion | Provider integration · inline forms · sidebar widget · engagement-based prompt · frequency controls · consent support · conversion events · NEW: newsletter archive & issue pages · email subscription preferences · membership & paid content (Stripe, paywalled sections, tiers) · lead magnets & content upgrades · RESILIENCE: RUNBOOK section for newsletter/email troubleshooting and subscription-recovery |
| 6 | 1.5 | Analytics | GTM · GA4 · Meta · TikTok · Clarity · event taxonomy · consent-aware loading · debug documentation · RESILIENCE: RUNBOOK section for analytics troubleshooting |
| 7 | 1.5 | Social Images | Crop previews · focal points · platform image variants · branded social cards · DreamLab workflow |
| 8 | 2.0 | AI Workspace | Voice profile · server-side AI integration · repurposed-content generation · social/newsletter copy · SEO suggestions · image prompts · approval workflow · cost/usage controls · NEW: distribution dashboard Tier 1 (AI blurbs, link-in-comment, copy/open-post) · Tier 2 (manual engagement log) · RESILIENCE: RUNBOOK sections for AI Workspace and distribution-dashboard troubleshooting |
| 9 | 2.0 | Comments / Response System | Evaluate need · recommend solution · implement only if justified · moderation and spam protection · keep disableable |
| 10 | 3.0 | Final Hardening + Avatar Door | Full QA · accessibility · performance · documentation · deployment verification · rollback testing · Avatar Door layered on top · NEW: editorial calendar · bulk operations & search-replace · content audit & stale detection · import/export tools · audio narration · RESILIENCE: monthly restore drill documented and first drill completed · full dataset restore tested end-to-end (&lt;2h RTO verified) · `RUNBOOK.md` complete · "first 24 hours" onboarding complete · incident log template in place |

*Use this order unless a repository audit reveals a safer one. Do not begin expensive or optional phases before the publishing foundation is stable.*

---

## Definition of Done (~60 items)

The project is not complete merely because files or components exist.

**Publishing & editorial**
- The live blog looks like a professionally designed publication, visually connected to asheraw.com
- Publish without touching code; author defaults correctly; slug generates automatically; manual slugs preserved
- Categories easy to select; rich content easy to create; rich media (images, PDFs, videos, external links) easily inserted, not just YouTube
- Font sizes/formatting consistently displayed, with optional inline override
- Published date shown; "last updated on" appears alongside "first published on" when edited
- External links open in a new window by default, with per-link override
- Distraction-free writing mode available (focus mode, typewriter scroll, document outline)
- Autosave & revision history with side-by-side diff and restore
- Pre-publish checklist auto-runs and warns (never blocks)
- Two-step publish works: Prepare pre-fills metadata, review screen shows everything, Publish is the one-way door
- Editorial calendar with drag-to-reschedule visible
- Series & collections work with series RSS and "read in order" mode
- Bulk operations and search-replace available with undo log

**Presentation & SEO**
- Desktop, mobile, and PLAY preview all work; PLAY is optional and disableable on mobile; disabled PLAY code is not unnecessarily loaded
- STORY and PLAY share canonical content; alternative versions work safely
- SEO fields are understandable; search and social previews exist; social-image crops can be previewed
- Footnotes/endnotes/citations work academic-style
- Per-author/category/tag RSS feeds available
- Broken-link checker runs weekly and emails a report
- Media library searchable with reuse tracking and library-level alt text
- Reusable content blocks (snippets) update everywhere when edited
- Import/export tools work (WordPress, Medium, Substack, Ghost, Markdown)
- Content audit dashboard flags stale posts for review
- Favicons correctly configured; RSS validates; sitemap validates; structured data is valid

**Growth, AI, distribution, resilience**
- Email collection works; subscription prompts respect user experience
- Newsletter archive and issue pages live at `/newsletter`
- Membership and paid content work (Stripe, paywalled sections, tiers)
- Analytics events work; GTM is documented; consent behaviour is correct
- AI outputs require approval, preserve editorial voice, never silently overwrite manual work
- Distribution dashboard Tier 1 (AI blurbs, copy, open-post) and Tier 2 (manual engagement log) both work
- Audio narration (auto TTS) available per post
- Existing content remains accessible; production builds successfully; tests pass; no secrets exposed
- Daily automated Sanity export runs and verifies (off-platform copy)
- Pre-change snapshots taken before every schema change, bulk op, deploy
- Monthly restore drill completed and documented; full dataset restore tested in &lt;2 hours
- `RUNBOOK.md` exists with per-feature troubleshooting trees
- Recovery procedures documented and tested (single post, bulk undo, schema rollback, deploy rollback, DNS rollback)
- "First 24 hours for a new developer" onboarding section exists
- Documentation is understandable to a non-developer
- The system has a clear rollback path

**Do not declare completion while major errors, broken builds, missing documentation, or unverified production behaviour remain.**

---

## Closing — three things to do at kickoff (historical, kept for context)

1. Hand this spec to a developer/agency for **Phase 0** — read-only discovery, no code changes: produce `CURRENT_STATE_AUDIT.md`, `IMPLEMENTATION_PLAN.md`, `BACKUP_AND_RECOVERY_GUIDE.md`.
2. Confirm the Vercel → Netlify migration decision before Phase 1 begins. *(Superseded in practice — see the note under Part VII. The project stayed on Vercel.)*
3. Gather credentials: Sanity project ID + token, AI provider API key, GitHub repo access, 2D portrait source (for the Avatar Door), hosting account, optional existing email provider credentials.

---

*Source: merged from five original spec documents, provided as a 37-slide deck ("A.C.E. — Asher's Content Engine — Master Specification, Version 1.0"). Converted to Markdown and committed here on 2026-07-30 so this specification is readable by any Claude Code session — desktop or remote — working on this repository, instead of living only in Claude.ai project knowledge. See `ACE_PRD.md` for the companion (shorter) PRD.*
