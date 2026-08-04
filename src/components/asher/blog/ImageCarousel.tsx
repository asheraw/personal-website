"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import AutoScroll from "embla-carousel-auto-scroll";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

const SLIDESHOW_INTERVAL_MS = 5000;
const SCROLL_STRIP_HEIGHT = 280;

export type GalleryImage = {
  _key: string;
  asset?: { _ref: string };
  alt?: string;
  caption?: string;
};

export type DisplayStyle = "carousel" | "slideshow" | "scroll-strip";

// Renders every multi-photo Image block. "Carousel" and "Slideshow" show
// one photo at a time (arrows, dots) -- the only difference between them is
// whether Embla's Autoplay plugin is attached. "Scrolling strip" instead
// shows every photo at once, each at its own natural width, continuously
// auto-scrolling via Embla's Auto Scroll plugin. Both plugins pause on
// hover/touch through their own stopOnMouseEnter/stopOnInteraction options.
export function ImageCarousel({ images, mode }: { images: GalleryImage[]; mode: DisplayStyle }) {
  if (!images?.length) return null;
  if (mode === "scroll-strip") return <ScrollStrip images={images} />;
  return <SlideCarousel images={images} mode={mode} />;
}

function SlideCarousel({ images, mode }: { images: GalleryImage[]; mode: "carousel" | "slideshow" }) {
  const count = images.length;

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

function ScrollStrip({ images }: { images: GalleryImage[] }) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, dragFree: true, containScroll: false },
    [AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  return (
    <div className="my-8 overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {images.map((img) =>
          img.asset ? (
            <figure key={img._key} className="shrink-0 grow-0">
              {/* Plain <img>, not next/image -- these need their natural
                  aspect ratio at a fixed height, and no image dimensions
                  are fetched for post-body images, so there's nothing to
                  hand next/image's width/height (or fill's aspect box). */}
              <img
                src={urlFor(img).height(SCROLL_STRIP_HEIGHT).fit("max").url()}
                alt={img.alt ?? ""}
                className="block h-[280px] w-auto rounded-lg border border-amber-faint object-cover"
                loading="lazy"
              />
              {img.caption && (
                <figcaption className="mt-1.5 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ) : null
        )}
      </div>
    </div>
  );
}
