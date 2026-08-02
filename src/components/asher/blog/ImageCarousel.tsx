"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

const SLIDESHOW_INTERVAL_MS = 5000;

type GalleryImage = {
  _key: string;
  asset?: { _ref: string };
  alt?: string;
  caption?: string;
};

// Renders both the "Carousel" and "Slideshow" imageGallery block types --
// same markup and controls either way, the only difference is whether an
// interval auto-advances the index. Deliberately shows one image at a time
// (not a horizontal strip) so it reads the same as a single Image block
// visually, just with next/prev navigation added.
export function ImageCarousel({ images, mode }: { images: GalleryImage[]; mode: "carousel" | "slideshow" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = images?.length ?? 0;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Paused on hover (mouse) and while a touch drag is in progress -- an
  // auto-advancing slideshow that yanks the image out from under a reader
  // mid-swipe, or mid-look, is worse than one that just holds still until
  // they move on.
  useEffect(() => {
    if (mode !== "slideshow" || paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(id);
  }, [mode, paused, count]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 40) (delta > 0 ? prev : next)();
    }
    touchStartX.current = null;
    setPaused(false);
  }

  if (count === 0) return null;
  const current = images[index];

  return (
    <figure className="my-8">
      <div
        className="group relative overflow-hidden rounded-lg border border-amber-faint bg-stage/40"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative aspect-[3/2] w-full">
          {current.asset && (
            <Image
              key={current._key}
              src={urlFor(current).width(1400).url()}
              alt={current.alt ?? ""}
              fill
              loading="lazy"
              className="object-contain"
            />
          )}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-stage/70 p-1.5 text-ivory opacity-0 transition-opacity hover:bg-stage focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-stage/70 p-1.5 text-ivory opacity-0 transition-opacity hover:bg-stage focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img._key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to image ${i + 1} of ${count}`}
                  aria-current={i === index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === index ? "bg-spotlight" : "bg-ivory/40 hover:bg-ivory/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {current.caption && (
        <figcaption className="mt-2 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
          {current.caption}
        </figcaption>
      )}
    </figure>
  );
}
