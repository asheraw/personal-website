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
