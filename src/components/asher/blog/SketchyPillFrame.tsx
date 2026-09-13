// Hand-drawn wobble outline for pill-shaped chips (search box, the
// comment-stats badge, topic tags) -- same convention as SketchyDivider.tsx
// and PostCard.tsx's RoughFrame: a few fixed closed-loop path variants
// (never Math.random(), which would mismatch between server and client
// render and break hydration), stretched to each pill's real size via
// preserveAspectRatio="none". Pills vary a lot in width but stay a fairly
// constant height, so unlike PostCard's frame this doesn't need separate
// fixed-axis strips -- the stretch mostly just changes how "wide" the same
// wobble reads, which suits a loose sketch look fine.
const PILL_PATHS = [
  "M9,2 C40,-1 65,3 91,2 C96,6 97,18 95,27 C93,32 88,34 84,34 C55,36 30,32 8,34 C2,31 1,18 3,10 C4,5 6,3 9,2 Z",
  "M7,3 C38,0 68,5 93,3 C98,9 96,20 97,28 C95,32 90,33 85,35 C56,33 28,35 7,33 C1,29 2,17 4,9 C5,5 5,4 7,3 Z",
  "M10,1 C42,3 62,-1 90,3 C95,7 99,19 94,29 C91,33 87,32 82,34 C52,32 32,36 6,32 C1,28 3,15 5,8 C6,4 7,2 10,1 Z",
];

export function SketchyPillFrame({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-amber-faint-stroke"
    >
      <path
        d={PILL_PATHS[variant % PILL_PATHS.length]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
