// Breaks a block out of the article's centered max-w-3xl column and
// re-centers it on the viewport at a wider (but still capped, not
// edge-to-edge) width -- for a photo gallery that feels cramped in the
// normal ~700px text column, not for body text (long paragraph lines
// across a full wide screen are measurably harder to read, which is
// exactly why that column is narrow in the first place). The
// `margin-left: calc(50% - 50vw)` trick re-centers on the viewport
// regardless of nesting depth or an ancestor's own padding, as long as
// everything above it is itself centered and symmetric -- true here (the
// article column is `mx-auto` with matching left/right `px-5`/`sm:px-8`).
const WIDE_MAX_WIDTH = 1400;

export function WideBreakout({ children }: { children: React.ReactNode }) {
  return (
    // overflow-x: hidden is a deliberate safeguard, not decoration -- on
    // some browsers `100vw` is very slightly wider than the true visible
    // viewport (it doesn't subtract the scrollbar's own width the way
    // `100%` does), which can otherwise introduce a sliver of page-wide
    // horizontal scroll on exactly the pages long enough to need one.
    // Nothing inside this block actually needs to render past the real
    // viewport edge, so clipping that sliver costs nothing visible.
    <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", overflowX: "hidden" }}>
      <div className="px-5 sm:px-8" style={{ maxWidth: WIDE_MAX_WIDTH, marginLeft: "auto", marginRight: "auto" }}>
        {children}
      </div>
    </div>
  );
}
