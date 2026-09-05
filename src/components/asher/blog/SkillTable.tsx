"use client";

import { useState, Fragment, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PortableText } from "@portabletext/react";
import { restrictedRichTextComponents } from "@/components/asher/blog/restrictedRichTextComponents";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cycleSort, sortByRank, type SortState } from "@/lib/sortableTable";
import { SortableTableHead } from "@/components/asher/blog/SortableTableHead";
import {
  ScopeCheck,
  SKILL_CATEGORY_LABEL,
  SKILL_STATUS_CLASSES,
  SKILL_STATUS_LABEL,
  type SkillEntry,
} from "@/components/asher/blog/SkillGrid";

const COLUMN_COUNT = 5;

type SortKey = "name" | "category" | "platform" | "installed" | "status";

// Lifecycle order, not alphabetical -- active states first (how far from
// "untouched" an entry is), then the two inactive states.
const STATUS_RANK: Record<string, number> = { installed: 0, modified: 1, custom: 2, shelved: 3, removed: 4 };
const INSTALLED_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "08 Aug 2026" -> a timestamp to sort by. Returns null for anything that
// doesn't match that exact shape (e.g. claude-mem's "Not sure") -- sortByRank
// always pushes a null rank to the end, regardless of sort direction.
function parseInstalledDate(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const monthIndex = INSTALLED_MONTHS.indexOf(match[2]);
  if (monthIndex === -1) return null;
  return new Date(Number(match[3]), monthIndex, Number(match[1])).getTime();
}

function getRank(entry: SkillEntry, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return entry.name?.toLowerCase() ?? null;
    case "category":
      return SKILL_CATEGORY_LABEL[entry.category ?? "others"];
    case "platform":
      return entry.platform?.length ?? 0;
    case "installed":
      return parseInstalledDate(entry.installed);
    case "status":
      return STATUS_RANK[entry.status ?? "installed"] ?? 0;
  }
}

// Same data as SkillGrid's card layout, laid out as rows instead -- built
// after the card grid still made comparing several skills at once slow (see
// RUNBOOK.md/CHANGELOG.md, 2026-08-29). 5 columns -- Skill (now the link
// itself), Category (a flat one-word badge, not color-coded like Status --
// grouping/context, not a "should I act on this" signal), Platform (a
// checkbox multi-select, same list-driven pattern as Category, not two
// separately-titled booleans -- Desktop = installed at the user level,
// works in any project on this machine; Web = installed at the project
// level, also reaches the browser-based session for this repo), Installed
// (date only, DD MMM YYYY -- same as formatPostDate elsewhere on the
// site), Status (a real lifecycle, 5 states: Installed -> Modified ->
// Custom for active entries, Shelved/Removed for the two ways an entry
// stops being active -- briefly relabeled "Origin" the same day, then
// reverted once it turned out "Status" was fine all along and it was the
// "Off the shelf" *value* that read wrong, not the column). Source used
// to be its own column, but on a narrow screen its one genuinely variable-
// length field squeezed into a tall, word-per-line strip fighting the other
// columns for width -- it's since been folded into the `details` rich-text
// field entirely (no longer a separate schema field), shown as part of the
// same expand-in-place row as the rest of Details. The whole row is the
// click target, not a dedicated button or column. Every column header is
// click-to-sort (see sortableTable.ts / SortableTableHead.tsx, both
// generic -- no skill-specific knowledge in either, reusable by any future
// table block, not just this one).
function SkillNameCell({ entry }: { entry: SkillEntry }) {
  if (entry.sourceUrl) {
    return (
      <Link
        href={entry.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        // Row itself toggles Details on click -- without this, clicking the
        // link to actually visit it would also expand/collapse the row.
        onClick={(e: MouseEvent) => e.stopPropagation()}
        className="font-medium text-spotlight underline underline-offset-2"
      >
        {entry.name}
      </Link>
    );
  }
  return <span className="font-medium text-ivory">{entry.name}</span>;
}

export function SkillTable({ entries }: { entries: SkillEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<SortKey>>(null);
  if (!entries?.length) return null;

  const sortedEntries = sortByRank(entries, sort, getRank);
  const onSort = (key: SortKey) => setSort((current) => cycleSort(current, key));

  return (
    <div className="my-8 overflow-x-auto rounded-2xl border border-amber-faint bg-stage/40">
      <Table>
        <TableHeader>
          <TableRow className="border-amber-faint hover:bg-transparent">
            <SortableTableHead label="Skill" sortKey="name" sort={sort} onSort={onSort} />
            <SortableTableHead label="Category" sortKey="category" sort={sort} onSort={onSort} />
            <SortableTableHead label="Platform" sortKey="platform" sort={sort} onSort={onSort} />
            <SortableTableHead label="Installed" sortKey="installed" sort={sort} onSort={onSort} />
            <SortableTableHead label="Status" sortKey="status" sort={sort} onSort={onSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry) => {
            const isOpen = expanded === entry._key;
            const hasDetails = Array.isArray(entry.details) && entry.details.length > 0;
            const status = entry.status ?? "installed";
            const category = entry.category ?? "others";
            const toggle = () => hasDetails && setExpanded(isOpen ? null : entry._key);
            const onKeyDown = (e: KeyboardEvent) => {
              if (!hasDetails) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            };
            return (
              <Fragment key={entry._key}>
                <TableRow
                  onClick={toggle}
                  onKeyDown={onKeyDown}
                  role={hasDetails ? "button" : undefined}
                  tabIndex={hasDetails ? 0 : undefined}
                  aria-expanded={hasDetails ? isOpen : undefined}
                  className={cn(
                    "border-amber-faint/50",
                    hasDetails && "cursor-pointer hover:bg-spotlight/10",
                    isOpen && "bg-spotlight/5"
                  )}
                >
                  <TableCell className="whitespace-nowrap">
                    <SkillNameCell entry={entry} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="border-amber-faint text-stone/70">
                      {SKILL_CATEGORY_LABEL[category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs text-ivory/80">
                      <ScopeCheck checked={entry.platform?.includes("desktop")} label="Desktop" />
                      <ScopeCheck checked={entry.platform?.includes("web")} label="Web" />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-ivory/80">{entry.installed || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className={cn("border-transparent", SKILL_STATUS_CLASSES[status])}>
                      {SKILL_STATUS_LABEL[status]}
                    </Badge>
                  </TableCell>
                </TableRow>
                <AnimatePresence initial={false}>
                  {isOpen && hasDetails && (
                    <TableRow className="border-amber-faint/50 hover:bg-transparent">
                      <TableCell colSpan={COLUMN_COUNT} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 whitespace-normal px-3 py-4 text-sm leading-relaxed text-ivory/90">
                            <PortableText value={entry.details as never} components={restrictedRichTextComponents} />
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
