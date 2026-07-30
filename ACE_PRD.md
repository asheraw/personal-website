# ACE — Asher's Content Engine

### TL;DR

ACE is a unified, AI-assisted publishing platform designed for creator-owned, canonical content workflows. Built for non-developers and technical creators, ACE enables multi-channel distribution (web, newsletter, social, avatar, more) from a single source—no code edits, no content duplication. Every AI output requires human approval. The platform's architecture and resilience are driven by a "five-year question": will Future Asher appreciate every decision and be able to recover, adapt, or migrate, free from vendor lock-in?

---

## Guiding Principles & Agent Rules

* **Write Once, Refine Intelligently, Publish Everywhere**: One canonical source powers all outputs. No duplicate stores or inconsistent content.
* **Seven Pillars:**
  * Canonical First: Single source of truth in Sanity.
  * Presentation Is Separate: All modes, one source.
  * AI Assists, Humans Decide: AI proposes; humans approve/reject.
  * Human Approval: No auto-publish.
  * Portable Architecture: Easily migrate/export.
  * Progressive Enhancement: Works without JS; graceful degradation.
  * Built For Five Years: Prioritize maintainability, resilience.
* **Agent Rules** (AI/workflow governance):
  1. Understand Before Changing—always review existing system/data first.
  2. Preserve Before Replacing—repair unless replacement truly needed.
  3. One Canonical Source—no content copying.
  4. Prefer Maintainable Simplicity—no clever fragility.
  5. Do Not Invent Requirements—capture/document all assumptions.
  6. Document Assumptions—reasoning is always explicit.
  7. No Secrets in Source—environment variables only.
  8. Implement in Small, Reversible Phases—testable, safe rollbacks.
  9. Never Overwrite Manual Work—human edits preserved.
  10. Optimize for Future Asher—every decision answers "five-year question."

---

## Goals

### Business Goals

* Eliminate code-driven publishing; enable non-technical operation for content updates (measured: % of posts with no code required).
* Multi-channel, multi-format distribution from one canonical source; maximize reach and editorial leverage.
* Architect for long-term stability, low vendor lock-in, testable recoverability, and export readiness.
* Transparent analytics, auditability, and real-time health monitoring.
* Minimize SaaS cost, maximize open/free tier usage and decoupled integration.

### User Goals

* Create, revise, and distribute everywhere—web, newsletter, social, avatar—with no redundant workflows.
* Intuitive authoring: distraction-free writing, autosave, rich revision history, inline and batch asset management.
* Pre-publish assurance: checklists, AI-suggested metadata, approval-driven automation.
* Bulk operations, audit dashboards, and content hygiene tools to manage large archives without data loss.
* Full control: always portable data, ability to export/migrate.

### Non-Goals

* No proprietary silos; never lose the option to migrate.
* No paid modules or SaaS-only solutions for core editorial/publishing unless justified after open/free options.
* No automated distribution without reviewer approval.

---

## User Stories

**Persona: Creator (Asher, primary author)**

* As a creator, I want distraction-free writing and robust revision controls, so my creative flow is uninterrupted and recoverable.
* As a creator, I want to distribute everywhere from a single source, so I can serve diverse audiences without duplicative work.
* As a creator, I want AI to provide draft metadata, summaries, and distribution blurbs—but always with my review and approval.
* As a creator, I want focused hygiene tools (link checker, stale content flags, asset management), so my archive maintains quality at scale.

**Persona: Technical Collaborator/New Engineer**

* As an engineer joining the project, I want runbooks, incident logs, and onboarding designed for "future contributors," so I can restore, fix, or extend ACE without prior domain context.
* As a technical collaborator, I want clear phase exit criteria—backups, recovery runs, and documentation—to verify system health before every change.

---

## Functional Requirements

* **Studio & Editorial Core (Priority: Highest)**

  * Distraction-free rich text editor; live autosave, revision history with diff/restore.
  * Automatic slug, author, reading time, categories (checkbox, not modal), tags (autocomplete); override supported; manual assignment never lost.
  * One canonical content schema (~40 fields), powering all outputs, with legacy import/export (WordPress, Medium, Substack, Ghost, Markdown, etc.).
  * Editorial runbook entries for every feature/flow (must ship with build).

* **Publishing & Distribution Pipeline (Priority: Highest)**

  * Two-step publish: Prepare (AI suggestion/checklist/review), then irreversible Publish (webhook to ISR, RSS, sitemap, etc.).
  * Live preview: desktop, tablet, mobile; draft never public; scheduled/bulk publish.
  * Social/canonical/SEO metadata auto-generated but always reviewed; social image variants (open graph, Twitter, etc.).
  * Dashboard for publication health: errors, audit flags, asset issues, stale content.

* **Presentation Layer (Priority: High)**

  * STORY: SEO/print-optimized, mobile-first, accessible editorial layouts.
  * PLAY: Optional interactive mode, registered/approved components, disable-by-device and opt-in control without code deploys; fallback to STORY always enabled.
  * Archive: powerful search; author, tag, category, series/collections; "read in order" mode, series RSS.
  * Bulk operations: search/replace/undo, asset management, and content audit.

* **AI Workspace (Priority: Medium)**

  * Curatorial queues for AI outputs across all output types (SEO, social, newsletter, podcast, video, image prompt, etc.).
  * Never overwrite manual edits; all suggestions logged.
  * Style/tone presets, voice protection.
  * Approval-driven workflow; never auto-publish.

* **Growth, Analytics, Engagement (Priority: Medium)**

  * Decoupled email model (multiple provider support), engagement-aware forms, newsletter archive, membership/paywall (Stripe tiers), analytics event taxonomy (30+ key events, no PII, GTM/GA4 portable), consent mode, A/B friendly, open export.
  * Distribution dashboard: AI/social copy, open-post, engagement tracking, archive/reply log.
  * Audio narration (TTS per post), accessibility overlays, multi-device notification.

* **Resilience, Backups, and Recovery (Priority: Critical)**

  * Daily off-platform backup (Sanity JSON/assets), pre-change snapshot, full disaster recovery drill monthly (target RTO <2 hours).
  * Incident log template and incident logging required after every event; runbook.md section per feature.
  * "First 24 hours for a new developer" onboarding/checklist.
  * No phase closes until runbook and backup/recovery artifacts are validated.

---

## User Experience

**Entry Point & First-Time User Experience**

* Users enter via /studio. On first visit: onboarding tour for compositional editor, schedule, AI, review flow.
* No setup or infra barriers; all managed in Studio UI.
* Autosave, revision restore, onboarding tooltips by default.

**Core Experience**

* **Step 1:** Compose/post in distraction-free rich text editor.
  * All formatting/media; editor states (focus, outline, typewriter scroll).
  * Autosave, version history, side-by-side diff, restore.
* **Step 2:** Assign/override metadata (slug, author, categories, tags).
  * Auto-fill by default; validations for uniqueness, reserved words, etc.
* **Step 3:** Preview in STORY (desktop, tablet, mobile) and optionally PLAY.
  * Clear visibility for draft, scheduled, or published states; show all display variants.
* **Step 4:** Prepare for Publish (runs AI suggestions, checklist, social/SEO warnings, approval cycle).
  * All fields editable; no irreversible publishing without review.
* **Step 5:** Publish (runs site update, triggers incremental static regen, syndicates to RSS/sitemap, logs action and snapshot).
* **Step 6:** Health, hygiene, recovery tools in dashboard (link checker, audit flags, stale post indicators, asset reuse/A/B test overlays, runbook links).

**Advanced Features & Edge Cases**

* PLAY opt-in/opt-out per post; mobile disable; always guarantees fallback to SEO/story presentation.
* AI outputs never overwrite user copy (manual changes are sacred); logs maintained for audit/reversal.
* Bulk import/export with undo; cross-platform migration support.
* Affiliate registry, link management (broken-link checker, auto-disclosure, external monitoring).
* Advanced citation/footnote/endnote tools; academic support.

**UI/UX Highlights**

* Accessibility (dark/light theme, contrast, font control, ARIA/keyboard compliance).
* Responsive layout; semantic HTML; error cues and social/SEO warnings prior to publish.
* Guided onboarding; runbook/help links integrated with major workflows.
* Import/export: all legacy platforms supported; live migration logs for every event.

---

## Narrative

Asher, a detail-oriented creator, needed a publishing engine that harmonized robust editorial craft and rigorous operational discipline. Mismatched CMSs forced a binary choice: developer-focused power with high labor overhead, or low-friction SaaS that traded flexibility, future-proofing, and data ownership for convenience. ACE fuses deep resilience with flexibility, enabling creators to write once in an elegant, distraction-free studio, benefit from AI-accelerated—but never uncontrolled—drafting, and distribute everywhere, all without ceding control or portability. Every major workflow is documented, every feature's workflow has a troubleshooting tree, and each phase ends only when backup, runbook, onboarding, and recovery drills pass. When the unexpected happens, Asher and future contributors alike can self-serve from runbook.md—rolling back, restoring, and migrating with minimal friction, never trapped by last year's "easy solution."

---

## Success Metrics

### User-Centric Metrics

* % of posts published with zero code intervention (target: 100%)
* Number of autosave/recovery incidents resulting in "zero data loss" events
* Time to publish to all channels (<15s avg)
* User feedback (editor NPS/satisfaction, onboarding friction, content health checks)
* AI workflow adoption: % of posts using and approving AI suggestions

### Business Metrics

* Growth in email subscribers, RSS, social, paid memberships
* % of historic content migrated/imported without errors
* Ongoing cost containment: % of features run with open/free-tier or easy-port backends
* Publishing latency (webhook to live): <10s avg; rollback success without content loss

### Technical Metrics

* Publication uptime (99.99%+); accessibility/SEO scores (95+ Lighthouse)
* Backup/restore event pass rate; time to full recovery (RTO <2h)
* Bulk undo operation success; incident logs completed for all live incidents
* Coverage of incident runbook per-feature; onboarding completion success (for new devs)

### Tracking Plan

* Key user events: page_view, publication_view, publish, play_started/completed, newsletter_form_submit, share_click, copy_link, edit, AI output (accept/reject), backup/snapshot/restore, link checker/bulk op, onboarding completion, runbook usage

---

## Technical Considerations

### Technical Needs

* Canonical Sanity schema (~40 fields, fully normalized)
* Incremental static site (Next.js/ISR or equivalent); decoupled editorial (Studio), presentation, and distribution layers
* Audit and monitoring hooks for all major workflows; backup pipelines automated and testable

### Integration Points

* Sanity CMS, decoupled mailing provider(s), analytics (GTM/GA4), newsletter archive, backup destinations, AI APIs (pluggable), Stripe (membership/paywall), social image generator, legacy import/export pipelines

### Data Storage & Privacy

* Sanity as canonical data source; assets/media offsite backups; email/comments/analytics stored in export-friendly providers
* No PII in analytics; all backups exportable and documented
* All import/export events logged and auditable

### Scalability & Performance

* 1–2k posts supported (rapid full-text search, bulk publish); publish latency <15s average
* System designed for future channel integrations and format evolution (podcast/video, avatar/future UI)
* Editorial dashboard performant for large archives (>1k posts)

### Potential Challenges

* Vendor risk; mitigated by tested backup/runbook per-feature
* Rate/cost limitations on 3rd-party APIs; alert/warning/approval for overages
* Platform drift; actively enforced drills and audits, backup/restore tested every phase
* Accessibility as code and content—every phase must meet a11y, device, and performance coverage

---

## Milestones & Sequencing

### Project Estimate

* Full roadmap (Phases 0–10, see below): 6–12 months (lean, milestone-by-milestone value; each phase = stand-alone deliverable; resilience checks are phase-exit criteria)

### Team Size & Composition

* Small team startup: 1–2 core (Product + Engineering); add 1 Design/QA flexibly. No unnecessary roles; bias to speed and autonomy.

### Suggested Phases & Milestones

* **ACE 1.0: Publishing Engine**

  * **Phase 0: Audit & Protection (1 week)**
    * Repo/code audit, backup systems, backup validation, runbook.md started, implementation planning. No code changes.
    * Exit: backup/restore tested, onboarding draft delivered.
  * **Phase 1: Publishing Foundation (2–4 weeks)**
    * Schema repair, autosave/revision, editorial runbook for every workflow, pre-change snapshot, draft focus editor.
    * Exit: backup, runbook.md, onboarding drills pass prior to phase closure.
  * **Phase 2: STORY Frontend (2–4 weeks)**
    * Blog, archive, series, collections; print CSS, RSS/sitemap/metadata, a11y design system foundation.
    * Exit: runbook, recovery drill, onboarding updated.
  * **Phase 3: SEO & Machine Readability (1–2 weeks)**
    * SEO/social editor, all preview types, link manager (broken-link, affiliate, external), structured data, error handling.
    * Exit: updated backups, updated runbook section, checklist verified.

* **ACE 1.5: Distribution Engine**

  * **Phase 4: PLAY & Presentation Variants (2 weeks)**
    * PLAY interactive infra, opt-in/out, device toggle, component registry.
    * Exit: test fallbacks, validate story/PLAY switching, a11y checks.
  * **Phase 5: Email & Newsletter (2 weeks)**
    * Email subscriptions, forms, full archive, membership tier infra.
    * Exit: migration/backup test, onboarding updated.
  * **Phase 6: Analytics & Event Taxonomy (1 week)**
    * Consent-aware, portable analytics instrumentation, event export.
    * Exit: all events logged, all dashboards functional.
  * **Phase 7: Social/Media Integration (2–3 weeks)**
    * Social image gen, per-author/category feeds, distribution dashboard, archive/reply tracking.

* **ACE 2.0: Knowledge Engine**

  * **Phase 8: AI Workspace (2–3 weeks)**
    * AI/curatorial tools, tone/voice controls, review queue, output logs, cost controls.
  * **Phase 9: Comments/Engagement (1–2 weeks)**
    * Comments, response system, engagement logs.

* **ACE 3.0: Experience Engine**

  * **Phase 10: Avatar Door & Hardening (3–4 weeks)**
    * Avatar integration (3D/2D/blog), final QA/accessibility/performance/documentation.
    * Runbook.md and onboarding completed, all backup/restore/incident logging drilled and validated.

**No phase closes until:**

* Editorial runbook with troubleshooting trees shipped for all new features.
* Backup/restore and onboarding drills completed and documented as "definition of done" exit criteria.
* All critical edge cases, failures, and rollback paths tested, onboarded, and logged per incident log template.

---

**Definition of Done (Non-negotiable/Checklist Reference):**

* Full coverage of publishing/editorial features listed above
* Every mode of presentation has runbook entry/troubleshooting tree
* Disaster recovery process tested and documented (incl. monthly restore drill, RTO <2h)
* Onboarding for new contributors ("first 24 hours" doc) included
* All import/export, affiliate, and citation tools live and well documented
* All accessibility, mobile/responsive, and bulk operation scenarios validated
* No declared completion with incomplete docs, untested restore, or missing rollback paths
