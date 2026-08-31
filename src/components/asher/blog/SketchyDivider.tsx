// A hand-drawn-feeling divider, not a ruled line -- the "grid of hairline
// borders" idea Asher liked from a design reference, adapted rather than
// copied straight: a perfectly straight/crosshair grid reads as a technical
// SaaS product, but this site runs a stage/theatre metaphor (spotlight,
// amber-faint borders, curtain), so the line gets a slight hand-drawn wobble
// instead -- more "chalk line on a stage floor" than "CSS ruler." Three
// fixed path variants (not randomized -- a `Math.random()` path would
// mismatch between server and client render and break hydration) cycled by
// index, so a long list of these doesn't read as one line stamped
// repeatedly.
const PATHS = [
  "M0,4.5 C20,2 35,6.5 55,3.5 C78,1 95,7 118,4 C140,1.5 158,6 180,3 C205,0.5 222,6.5 248,4 C270,2 288,6 310,3.5 C332,1 350,6.5 372,4 C385,2.5 395,5 400,4",
  "M0,3.5 C18,6 38,1.5 58,4.5 C80,7 100,2 122,5 C145,7.5 162,2.5 185,5.5 C208,7 228,2 250,5 C272,1.5 292,6.5 315,4 C338,1 358,6 378,3.5 C390,2 396,5 400,4",
  "M0,4 C22,1.5 40,6.5 62,4 C85,2 105,6 128,3.5 C150,1 170,6.5 192,4 C215,2 235,6 258,3.5 C280,1.5 300,6.5 322,4 C345,2 365,6 385,3.5 C393,3 397,4.5 400,4",
];

export function SketchyDivider({ index = 0, className = "" }: { index?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 400 8"
      preserveAspectRatio="none"
      className={`h-2 w-full text-amber-faint-stroke ${className}`}
      aria-hidden="true"
    >
      <path
        d={PATHS[index % PATHS.length]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
