"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
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
// same markup and controls either way, the only difference is whether
// Embla's Autoplay plugin is attached. Built on embla-carousel-react
// (https://github.com/davidjerleke/embla-carousel), which also gives touch
// swipe and drag for free -- no manual touch handlers needed here.
export function ImageCarousel({ images, mode }: { images: GalleryImage[]; mode: "carousel" | "slideshow" }) {
  const count = images?.length ?? 0;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: count > 1 },
    mode === "slideshow"
      ? [Autoplay({ delay: SLIDESHOW_INTERVAL_MS, stopOnInteraction: false, stopOnMouseEnter: true })]
      : []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (count === 0) return null;
  const current = images[selectedIndex] ?? images[0];

  return (
    <figure className="my-8">
      <div className="group relative overflow-hidden rounded-lg border border-amber-faint bg-stage/40">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((img) => (
              <div key={img._key} className="relative aspect-[3/2] w-full shrink-0 grow-0 basis-full">
                {img.asset && (
                  <Image
                    src={urlFor(img).width(1400).url()}
                    alt={img.alt ?? ""}
                    fill
                    loading="lazy"
                    className="object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-stage/70 p-1.5 text-ivory opacity-0 transition-opacity hover:bg-stage focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
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
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to image ${i + 1} of ${count}`}
                  aria-current={i === selectedIndex}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === selectedIndex ? "bg-spotlight" : "bg-ivory/40 hover:bg-ivory/70"
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
