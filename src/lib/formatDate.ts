const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Hand-built, not Intl/toLocaleDateString -- "en-GB" gives the day-month-year
// ordering this format wants ("10 Aug 2026" rather than "Aug 10, 2026"), but
// its own short-month data abbreviates September as "Sept" (4 letters)
// while every other month is 3 -- a genuine quirk of en-GB's locale data
// specifically ("en-US" gives "Sep", but flips the day/month order back).
// Building the string by hand sidesteps relying on any locale's own
// abbreviation table. Uses the UTC getters, not the local-time ones, so a
// post published near midnight renders the same date on the server and in
// the reader's browser regardless of which timezone each one is in --
// getDate()/getMonth() would reintroduce the same kind of server/client
// mismatch the locale-based version was fixed for (see RUNBOOK.md,
// 2026-08-26).
export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = SHORT_MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

// "X hours ago" for anything published in the last day, matching the
// content.game reference Asher pointed at -- falls back to the plain
// formatPostDate() once a post is a day old, same as that reference does.
// Computed from the caller's own clock (not UTC-pinned like formatPostDate
// above), so it can drift by a few minutes between server render and
// client hydration right at an hour boundary -- caller should mark the
// element `suppressHydrationWarning` to accept that known, harmless drift.
export function formatPostDateRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return diffMin <= 1 ? "just now" : `${diffMin} minutes ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  return formatPostDate(iso);
}
