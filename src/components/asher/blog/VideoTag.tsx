import { Play } from "lucide-react";

// "overlay" sits on a card's thumbnail, top-left -- same "small pill, stage
// background, spotlight border, backdrop-blur" treatment PlayMode.tsx's own
// 2D/3D toggle already uses over the 3D world canvas, reused here rather
// than inventing a second overlay style. Placed on the image itself (not
// folded into the metadata row under the title) so it reads at a glance
// while skimming thumbnails, not only after actually reading a card's text.
// "inline" drops the absolute positioning/backdrop for the rare card with no
// mainImage to overlay onto -- same pill shape the category links already
// use in that row, just in spotlight instead of amber-faint so it still
// reads as a different kind of thing, not another category.
export function VideoTag({ variant = "overlay" }: { variant?: "overlay" | "inline" }) {
  return (
    <span
      className={
        variant === "overlay"
          ? "absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-spotlight/50 bg-stage/80 px-2.5 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-spotlight backdrop-blur-sm"
          : "inline-flex items-center gap-1 rounded-full border border-spotlight/50 px-2.5 py-1 text-spotlight"
      }
    >
      <Play size={10} className="fill-spotlight" />
      Video
    </span>
  );
}
