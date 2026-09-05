/**
 * Generic click-to-sort mechanics for any table rendered from portable
 * text -- no skill-specific knowledge here, deliberately, so any future
 * table block (a different content type entirely) can reuse this instead
 * of re-deriving the same asc/desc/clear cycle and null-handling logic.
 * Pair with SortableTableHead.tsx for the clickable header UI.
 */

export type SortDirection = "asc" | "desc";
export type SortState<K extends string> = { key: K; direction: SortDirection } | null;

/** Click cycle: unsorted -> asc -> desc -> unsorted (clicking a different column always starts at asc). */
export function cycleSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

/**
 * Sorts `items` by a rank derived per-item via `getRank` -- string ranks
 * compare alphabetically, number ranks numerically. An item whose rank is
 * `null` (nothing to sort by, e.g. a missing/unparseable date) always sorts
 * to the end regardless of direction, and ties keep their original relative
 * order (stable).
 */
export function sortByRank<T, K extends string>(
  items: T[],
  sort: SortState<K>,
  getRank: (item: T, key: K) => string | number | null
): T[] {
  if (!sort) return items;
  const { key, direction } = sort;
  return items
    .map((item, i) => ({ item, i, rank: getRank(item, key) }))
    .sort((a, b) => {
      if (a.rank === null && b.rank === null) return a.i - b.i;
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      if (typeof a.rank === "string" && typeof b.rank === "string") {
        const cmp = a.rank.localeCompare(b.rank);
        return direction === "asc" ? cmp : -cmp;
      }
      const cmp = (a.rank as number) - (b.rank as number);
      return direction === "asc" ? cmp : -cmp;
    })
    .map((w) => w.item);
}
