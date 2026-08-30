"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/asher/blog/ImageLightbox";
import { WideBreakout } from "@/components/asher/blog/WideBreakout";
import { isAnimatedGifUrl } from "@/lib/isAnimatedGif";

export type DisplaySize = "small" | "medium" | "original" | "wide";
export type FloatDirection = "none" | "left" | "right";

// Percentage of the article column's width, not a fixed pixel cap -- the
// column itself (max-w-3xl, minus padding) works out to ~704px on desktop,
// so a hardcoded "medium: 720px" cap used to never actually bind (720 >
// 704), making Medium visually identical to Original at every viewport
// size. Percentages stay correct if the column width class ever changes,
// and scale proportionally at any width instead of targeting one specific
// screen size. Only applied from `sm:` up -- below that, the column is
// already narrower than either cap would meaningfully shrink it to, so
// Small/Medium would otherwise pointlessly shrink an already-small photo
// on a phone for no readability benefit. "Wide" isn't a percentage of this
// column at all -- it breaks out of it entirely (see WideBreakout), so it
// deliberately has no entry here.
const WIDTH_CLASSES: Record<"small" | "medium" | "original", string> = {
  small: "sm:w-1/2",
  medium: "sm:w-3/4",
  original: "w-full",
};

// The plain single-Image renderer. Shows a container-width-capped preview
// (per the Display size field), and always opens the untouched full-size
// original in a lightbox on click/tap -- "Small"/"Medium" only affects how
// much of the page the photo takes up, never what a reader can actually see.
export function SizedImage({
  src,
  fullSrc,
  alt,
  caption,
  size = "original",
  float = "none",
}: {
  src: string;
  fullSrc: string;
  alt: string;
  caption?: string;
  size?: DisplaySize;
  float?: FloatDirection;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isGif = isAnimatedGifUrl(src);
  const isWide = size === "wide";
  // Only Small/Medium float -- Wide/Original already fill or exceed the
  // column, nothing left to wrap text around. Re-checked here independently
  // of Studio's own hidden-field gate (blockContentType.ts) so a stale
  // `float` value left over from switching away from Small/Medium can never
  // visually apply. `sm:` only -- same breakpoint every other size class
  // already uses, so a floated photo with wrapping text doesn't show up
  // cramped on a phone; it just stacks full-width there like anything else.
  const canFloat = float !== "none" && (size === "small" || size === "medium");
  const floatClass = canFloat ? (float === "left" ? "sm:float-left sm:mr-6 sm:mb-4" : "sm:float-right sm:ml-6 sm:mb-4") : "";
  const widthClass = isWide || size === "original" ? "" : WIDTH_CLASSES[size];

  const figure = (
    <figure className={`my-8 w-full ${widthClass} ${canFloat ? floatClass : widthClass ? "sm:mx-auto" : ""}`}>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="View full size"
        className="block w-full cursor-zoom-in"
      >
        {isGif ? (
          // eslint-disable-next-line @next/next/no-img-element -- animated GIF, not safe to route through next/image's optimizer (see isAnimatedGif.ts)
          <img src={src} alt={alt} loading="lazy" className="h-auto w-full" />
        ) : (
          <Image src={src} alt={alt} width={1200} height={800} loading="lazy" className="h-auto w-full" />
        )}
      </button>
      {caption && (
        <figcaption className="mt-2 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
          {caption}
        </figcaption>
      )}
      {lightboxOpen && <ImageLightbox src={fullSrc} alt={alt} onClose={() => setLightboxOpen(false)} />}
    </figure>
  );

  return isWide ? <WideBreakout>{figure}</WideBreakout> : figure;
}
