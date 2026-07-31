// The one accessibility feature this site was missing: without it,
// keyboard/screen-reader users have to tab through the entire header
// (logo, every nav link, theme toggle) on *every single page* before
// reaching actual content. This is the first focusable element on the
// page -- invisible until it receives focus (Tab, once), at which point
// it becomes a normal visible button jumping straight to #main-content.
// Mouse/touch visitors never see it. No visual impact otherwise.
export function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-spotlight focus:px-5 focus:py-2.5 focus:font-mono-stage focus:text-xs focus:font-semibold focus:uppercase focus:tracking-[0.18em] focus:text-stage focus:outline-none focus:ring-2 focus:ring-ivory"
    >
      Skip to content
    </a>
  );
}
