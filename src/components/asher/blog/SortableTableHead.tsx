"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortState } from "@/lib/sortableTable";

// Generic clickable column header -- takes any string-literal sort key, no
// skill-specific knowledge, so a future table block can reuse this as-is.
export function SortableTableHead<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  return (
    <TableHead className={cn("whitespace-nowrap text-stone/60", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className="inline-flex items-center gap-1 transition-colors hover:text-ivory"
      >
        {label}
        {active ? (
          sort!.direction === "asc" ? (
            <ChevronUp className="h-3 w-3 text-spotlight" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3 text-spotlight" aria-hidden="true" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 text-stone/30" aria-hidden="true" />
        )}
      </button>
    </TableHead>
  );
}
