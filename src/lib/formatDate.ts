// One fixed "DD MMM YYYY" format (e.g. "10 Aug 2026") for every post date on
// the site -- plain and unambiguous regardless of a reader's own locale. A
// fixed locale under the hood ("en-GB") also keeps server and client output
// identical; letting this resolve to the runtime's ambient locale (what a
// bare .toLocaleDateString(undefined, ...) does) previously caused a real
// hydration mismatch (see RUNBOOK.md, 2026-08-26).
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
