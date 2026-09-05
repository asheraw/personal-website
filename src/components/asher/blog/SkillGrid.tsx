"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PortableText } from "@portabletext/react";
import { restrictedRichTextComponents } from "@/components/asher/blog/restrictedRichTextComponents";

export type SkillStatus = "installed" | "modified" | "custom" | "shelved" | "removed";
export type SkillCategory =
  | "coding-dev"
  | "design"
  | "writing"
  | "productivity"
  | "documents"
  | "memory-data"
  | "media"
  | "others";

export type SkillPlatform = "desktop" | "web";

export type SkillEntry = {
  _key: string;
  name: string;
  sourceUrl?: string;
  category?: SkillCategory;
  platform?: SkillPlatform[];
  installed?: string;
  // One rich-text field (where from / why installed / any clashes / how
  // it's changed since), not several separate plain-text fields -- Asher's
  // ask (2026-08-29): that many boxes to fill in felt like more overhead
  // than the content warranted. Same restricted shape as Accordion/
  // Callout's content.
  details?: unknown[];
  status?: SkillStatus;
};

// Shared between the card and table layouts so all five states always read
// the same way regardless of which view is showing. A real lifecycle, not
// just "how much did I touch this": Installed -> Modified -> Custom is how
// an active entry progresses; Shelved (considered, never installed) and
// Removed (installed once, taken out since) are the two ways an entry
// stops being active -- keeping both as a real reference means not having
// to re-research something already looked into once (Asher's ask,
// 2026-08-29).
export const SKILL_STATUS_LABEL: Record<SkillStatus, string> = {
  installed: "Installed",
  modified: "Modified",
  custom: "Custom",
  shelved: "Shelved",
  removed: "Removed",
};

export const SKILL_STATUS_CLASSES: Record<SkillStatus, string> = {
  installed: "bg-stone/10 text-stone/60",
  modified: "bg-amber-500/15 text-amber-400",
  custom: "bg-spotlight/15 text-spotlight",
  // Dashed, not filled -- reads as "not committed to" rather than a settled
  // state, distinct at a glance from the three active/solid badges.
  shelved: "border border-dashed border-amber-faint bg-transparent text-stone/60",
  // Faded and struck through -- reads as "gone," distinct from Installed's
  // plain neutral gray even though both are muted.
  removed: "bg-stone/5 text-stone/40 line-through",
};

// One flat word per category, not color-coded like Status above -- Category
// is grouping/context, not a "should I act on this" signal, so it doesn't
// need traffic-light colors competing with Origin's. Planned ahead of what's
// actually installed today (Asher's ask, 2026-08-29): Media has no entries
// yet, it's there for whenever a graphic/video/audio tool shows up; Others
// is a deliberate catch-all, not a sign the list is incomplete.
export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  "coding-dev": "Coding & Dev",
  design: "Design",
  writing: "Writing",
  productivity: "Productivity",
  documents: "Documents",
  "memory-data": "Memory & Data",
  media: "Media",
  others: "Others",
};

function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div>
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">{label}</p>
      <div className="mt-0.5 text-sm leading-relaxed text-ivory/90">{children}</div>
    </div>
  );
}

function CategoryBadge({ category }: { category?: SkillCategory }) {
  const cat = category ?? "others";
  return (
    <span className="shrink-0 rounded-full border border-amber-faint px-2.5 py-1 font-mono-stage text-[9px] uppercase tracking-[0.14em] text-stone/70">
      {SKILL_CATEGORY_LABEL[cat]}
    </span>
  );
}

// Shared with SkillTable's Platform column -- Asher's ask (2026-08-29) to
// show scope as checkboxes instead of a "Claude Code, this machine and the
// project itself" sentence.
export function ScopeCheck({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] leading-none ${
          checked ? "border-spotlight bg-spotlight/20 text-spotlight" : "border-amber-faint text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      {label}
    </span>
  );
}

// A card per skill, every field visible without a click -- the point is
// scanning the whole list and deciding keep/update/delete, which an
// Accordion Group (one click per entry to even see what's inside) fought
// against. See blockContentType.ts's skillGrid for why this exists.
export function SkillGrid({ entries }: { entries: SkillEntry[] }) {
  if (!entries?.length) return null;
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {entries.map((entry, i) => {
        const status = entry.status ?? "installed";
        return (
          <motion.div
            key={entry._key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3 rounded-2xl border border-amber-faint bg-stage/40 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-display text-base leading-snug text-ivory">
                {entry.sourceUrl ? (
                  <Link
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-spotlight underline underline-offset-2 hover:text-spotlight/80"
                  >
                    {entry.name}
                  </Link>
                ) : (
                  entry.name
                )}
              </h4>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <CategoryBadge category={entry.category} />
                <span
                  className={`rounded-full px-2.5 py-1 font-mono-stage text-[9px] uppercase tracking-[0.14em] ${SKILL_STATUS_CLASSES[status]}`}
                >
                  {SKILL_STATUS_LABEL[status]}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ivory/80">
              <ScopeCheck checked={entry.platform?.includes("desktop")} label="Desktop" />
              <ScopeCheck checked={entry.platform?.includes("web")} label="Web" />
            </div>

            <Field label="Installed">{entry.installed}</Field>

            {Array.isArray(entry.details) && entry.details.length > 0 && (
              <div className="space-y-2 text-sm leading-relaxed text-ivory/90">
                <PortableText value={entry.details as never} components={restrictedRichTextComponents} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
