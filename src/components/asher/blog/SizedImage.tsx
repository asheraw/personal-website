"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/asher/blog/ImageLightbox";

export type DisplaySize = "small" | "medium" | "original";

const MAX_WIDTH: Record<DisplaySize, string> = {
  small: "max-w-[420px]",
  medium: "max-w-[720px]",
  original: "max-w-full",
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
}: {
  src: string;
  fullSrc: string;
  alt: string;
  caption?: string;
  size?: DisplaySize;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <figure className={`my-8 ${MAX_WIDTH[size]} ${size === "original" ? "" : "mx-auto"}`}>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="View full size"
        className="block w-full cursor-zoom-in"
      >
        <Image src={src} alt={alt} width={1200} height={800} loading="lazy" className="h-auto w-full" />
      </button>
      {caption && (
        <figcaption className="mt-2 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
          {caption}
        </figcaption>
      )}
      {lightboxOpen && <ImageLightbox src={fullSrc} alt={alt} onClose={() => setLightboxOpen(false)} />}
    </figure>
  );
}
