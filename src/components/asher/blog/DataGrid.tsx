"use client";

import { useState } from "react";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { restrictedRichTextComponents } from "@/components/asher/blog/restrictedRichTextComponents";
import { urlFor } from "@/sanity/lib/image";

export type DataGridCellType = "text" | "richText" | "checkbox" | "select" | "image" | "date";

export type DataGridCell = {
  _key: string;
  type: DataGridCellType;
  text?: string;
  richText?: unknown[];
  checked?: boolean;
  selectValue?: string;
  image?: { asset?: { _ref: string }; alt?: string };
};

export type DataGridRow = {
  _key: string;
  cells: DataGridCell[];
};

export type DataGridValue = {
  headerMode?: "row" | "column" | "none";
  rows?: DataGridRow[];
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// Sort compares each row's plain-text reading of the sorted column --
// richText flattened to its text, checkbox as 0/1, date as its raw ISO
// string (sorts correctly as text), everything else its stored string.
// Client-side only: never mutates the underlying data, just render order.
function cellSortValue(cell: DataGridCell | undefined): string | number {
  if (!cell) return "";
  switch (cell.type) {
    case "checkbox":
      return cell.checked ? 1 : 0;
    case "select":
      return cell.selectValue ?? "";
    case "date":
      return cell.text ?? "";
    case "richText":
      return Array.isArray(cell.richText)
        ? (cell.richText as { children?: { text?: string }[] }[])
            .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
            .join(" ")
        : "";
    case "image":
      return "";
    default:
      return cell.text ?? "";
  }
}

function CellContent({ cell }: { cell: DataGridCell | undefined }) {
  if (!cell) return null;
  switch (cell.type) {
    case "checkbox":
      return (
        <span
          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[9px] leading-none ${
            cell.checked ? "border-spotlight bg-spotlight/20 text-spotlight" : "border-amber-faint text-transparent"
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    case "select":
      return cell.selectValue ? (
        <span className="rounded-full border border-amber-faint px-2 py-0.5 font-mono-stage text-[10px] uppercase tracking-[0.1em] text-stone/70">
          {cell.selectValue}
        </span>
      ) : null;
    case "date":
      return cell.text ? <span className="text-sm text-ivory/90">{formatDate(cell.text)}</span> : null;
    case "richText":
      return Array.isArray(cell.richText) && cell.richText.length > 0 ? (
        <div className="text-sm leading-relaxed text-ivory/90">
          <PortableText value={cell.richText as never} components={restrictedRichTextComponents} />
        </div>
      ) : null;
    case "image":
      return cell.image ? (
        <Image
          src={urlFor(cell.image).width(320).url()}
          alt=""
          width={320}
          height={200}
          className="h-auto w-full rounded-lg object-cover"
        />
      ) : null;
    default:
      return <span className="text-sm text-ivory/90">{cell.text}</span>;
  }
}

function flattenRichText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return (blocks as { children?: { text?: string }[] }[]).map((b) => (b.children ?? []).map((c) => c.text ?? "").join("")).join(" ");
}

// The row's normal, always-collapsed cell -- text/richText render as flat
// plain text here, never the real PortableText tree. `-webkit-line-clamp`
// only clamps cleanly across a single text node; PortableText's multiple
// per-paragraph <p> elements clamp into overlapping, garbled text instead.
// Full formatting only ever renders in the expanded full-width panel below.
function CellPreview({ cell }: { cell: DataGridCell | undefined }) {
  if (!cell) return null;
  if (cell.type === "richText") {
    return <span className="line-clamp-2 text-sm text-ivory/90">{flattenRichText(cell.richText)}</span>;
  }
  if (cell.type === "text") {
    return <span className="line-clamp-2 text-sm text-ivory/90">{cell.text}</span>;
  }
  return <CellContent cell={cell} />;
}

// A generic spreadsheet-shaped block -- every cell carries its own type,
// stored per-cell in Studio (blockContentType.ts's dataGrid, edited via
// DataGridInput.tsx). CSS grid, not a literal <table>, so it can collapse
// to stacked rows on narrow screens; header cells (first row or first
// column, per headerMode) get distinct styling and, when they're the
// sortable row header, toggle client-side sort on click.
//
// Rows collapse to a 2-line preview by default and expand on click (a
// chevron gutter column marks each row as expandable) -- same "click a row
// to see the long fields" pattern the old Skill Grid Table view had, just
// generalized: any row can be long here, not just one named column.
export function DataGrid({ value }: { value: DataGridValue }) {
  const rows = value.rows ?? [];
  const headerMode = value.headerMode ?? "row";
  const [sort, setSort] = useState<{ colIndex: number; dir: "asc" | "desc" } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (rows.length === 0) return null;

  const columnCount = Math.max(1, ...rows.map((r) => r.cells.length));
  const bodyRows = headerMode === "row" ? rows.slice(1) : rows;
  const headerRow = headerMode === "row" ? rows[0] : null;

  const sortedBodyRows =
    sort && headerMode === "row"
      ? [...bodyRows].sort((a, b) => {
          const av = cellSortValue(a.cells[sort.colIndex]);
          const bv = cellSortValue(b.cells[sort.colIndex]);
          const dir = sort.dir === "asc" ? 1 : -1;
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        })
      : bodyRows;

  function toggleSort(colIndex: number) {
    setSort((prev) => {
      if (!prev || prev.colIndex !== colIndex) return { colIndex, dir: "asc" };
      if (prev.dir === "asc") return { colIndex, dir: "desc" };
      return null;
    });
  }

  function toggleRow(rowKey: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  return (
    <div className="my-8 max-h-[70vh] overflow-auto rounded-2xl border border-amber-faint bg-stage/40">
      <div
        className="grid min-w-[520px] gap-px"
        style={{ gridTemplateColumns: `20px repeat(${columnCount}, minmax(120px, 1fr))` }}
        role="table"
      >
        {headerRow && (
          <div className="contents" role="row">
            <div className="sticky top-0 z-10 border-b border-amber-faint bg-stage/95 backdrop-blur" aria-hidden="true" />
            {headerRow.cells.map((cell, colIndex) => (
              <div
                key={cell._key}
                role="columnheader"
                className="sticky top-0 z-10 border-b border-amber-faint bg-stage/95 p-3 font-mono-stage text-[10px] uppercase tracking-[0.12em] text-stone/70 backdrop-blur"
              >
                <button
                  type="button"
                  onClick={() => toggleSort(colIndex)}
                  className="flex items-center gap-1 text-left hover:text-ivory"
                >
                  <CellContent cell={cell} />
                  {sort?.colIndex === colIndex && <span aria-hidden="true">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                </button>
              </div>
            ))}
          </div>
        )}

        {sortedBodyRows.map((row) => {
          const isOpen = expanded.has(row._key);
          // A column only gets a breakout panel row if it's actually long
          // enough to have been clamped -- a short richText cell (a name,
          // say) already shows in full at 2 lines and doesn't need
          // repeating below; only genuinely long content (like Details)
          // does.
          const LONG_THRESHOLD = 80;
          const expandableColumns = Array.from({ length: columnCount })
            .map((_, i) => i)
            .filter((i) => {
              const cell = row.cells[i];
              if (cell?.type === "richText") return flattenRichText(cell.richText).length > LONG_THRESHOLD;
              if (cell?.type === "text") return (cell.text ?? "").length > LONG_THRESHOLD;
              return false;
            });
          return (
            <div
              key={row._key}
              className="contents cursor-pointer"
              role="row"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) return;
                toggleRow(row._key);
              }}
            >
              <div className="flex items-start justify-center border-b border-amber-faint/40 p-3 text-stone/50">
                <span
                  className={`inline-block text-[10px] transition-transform ${isOpen ? "rotate-90" : ""}`}
                  aria-hidden="true"
                >
                  ▸
                </span>
              </div>
              {Array.from({ length: columnCount }).map((_, colIndex) => {
                const cell = row.cells[colIndex];
                const isHeaderCol = headerMode === "column" && colIndex === 0;
                return (
                  <div
                    key={cell?._key ?? `${row._key}-${colIndex}`}
                    role={isHeaderCol ? "rowheader" : "cell"}
                    className={`border-b border-amber-faint/40 p-3 last:border-b-0 ${
                      isHeaderCol ? "bg-stage/70 font-medium text-ivory" : ""
                    }`}
                  >
                    <CellPreview cell={cell} />
                  </div>
                );
              })}

              {/* Expanded detail panel -- breaks out to the full row width
                  instead of squeezing long text/richText content back into
                  its own narrow column, same as the old Skill Grid table's
                  click-to-expand Details behavior, generalized to any long
                  column instead of one hardcoded field. */}
              {isOpen && expandableColumns.length > 0 && (
                <div
                  className="col-span-full space-y-4 border-b border-amber-faint/40 bg-stage/60 p-4"
                  style={{ gridColumn: "1 / -1" }}
                >
                  {expandableColumns.map((colIndex) => (
                    <div key={colIndex}>
                      {headerRow?.cells[colIndex]?.text && (
                        <p className="mb-1 font-mono-stage text-[10px] uppercase tracking-[0.12em] text-stone/60">
                          {headerRow.cells[colIndex].text}
                        </p>
                      )}
                      <CellContent cell={row.cells[colIndex]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
