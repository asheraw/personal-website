"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import AutoScroll from "embla-carousel-auto-scroll";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import { ImageLightbox } from "@/components/asher/blog/ImageLightbox";
import { WideBreakout } from "@/components/asher/blog/WideBreakout";
import { isAnimatedGifUrl } from "@/lib/isAnimatedGif";
import type { DisplaySize } from "@/components/asher/blog/SizedImage";

const SLIDESHOW_INTERVAL_MS = 5000;
// A fixed row height for the scroll-strip, not a share of the column width
// -- this is genuinely a different kind of "size" (how tall one row of
// auto-scrolling photos is), not "how much of the text column this takes
// up," so a pixel value is the right unit here, unlike SLIDE_WIDTH_CLASSES below.
// "Wide" keeps the same height as "original" -- the benefit there is a wider
// viewport showing more of the strip at once (see WideBreakout below), not
// a taller row.
const SCROLL_STRIP_HEIGHT: Record<DisplaySize, number> = { small: 180, medium: 280, original: 380, wide: 380 };
// Embla's loop mode clones slides onto the opposite end to fake a seamless
// wrap, which only works when the *other* slides already cover the full
// viewport width on their own -- with too few images that's rarely true
// (2 images at a fixed height almost never add up to a whole viewport width
// between them), so Embla silently falls back to loop: false and the strip
// just stops dead at the end instead of wrapping. Repeating the image set
// below this count sidesteps that by giving Embla enough total width to
// loop with, regardless of each photo's actual aspect ratio -- and doubles
// as the correct visual for a 1-2 photo marquee anyway (cycling the same
// couple of photos is the only sensible "auto-scroll forever" for so few).
const MIN_SCROLL_STRIP_SLIDES = 6;
// Percentage of the article column's width, same reasoning as SizedImage.tsx's
// WIDTH_CLASSES -- a fixed pixel cap here had the same bug (720px never
// actually bound against the ~704px real column width, so Medium and
// Original always rendered identically). "Wide" breaks out of the column
// entirely instead (see WideBreakout), so it has no entry here, same as
// SizedImage.tsx's WIDTH_CLASSES.
const SLIDE_WIDTH_CLASSES: Record<"small" | "medium" | "original", string> = {
  small: "sm:w-1/2",
  medium: "sm:w-3/4",
  original: "w-full",
};

export type GalleryImage = {
  _key: string;
  asset?: { _ref: string };
  alt?: string;
  caption?: string;
};

export type DisplayStyle = "carousel" | "slideshow" | "scroll-strip" | "masonry";

// Renders every multi-photo Image block. "Carousel" and "Slideshow" show
// one photo at a time (arrows, dots) -- the only difference between them is
// whether Embla's Autoplay plugin is attached. "Scrolling strip" instead
// shows every photo at once, each at its own natural width, continuously
// auto-scrolling via Embla's Auto Scroll plugin. Both plugins pause on
// hover/touch through their own stopOnMouseEnter/stopOnInteraction options.
// Every photo opens the untouched full-size original in a lightbox on
// click/tap, in every mode -- "size" only ever affects the preview.
export function ImageCarousel({
  images,
  mode,
  size = "original",
}: {
  images: GalleryImage[];
  mode: DisplayStyle;
  size?: DisplaySize;
}) {
  if (!images?.length) return null;
  if (mode === "scroll-strip") return <ScrollStrip images={images} size={size} />;
  if (mode === "masonry") return <MasonryGrid images={images} size={size} />;
  return <SlideCarousel images={images} mode={mode} size={size} />;
}

function SlideCarousel({
  images,
  mode,
  size,
}: {
  images: GalleryImage[];
  mode: "carousel" | "slideshow";
  size: DisplaySize;
}) {
  const count = images.length;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: count > 1 },
    mode === "slideshow"
      ? [Autoplay({ delay: SLIDESHOW_INTERVAL_MS, stopOnInteraction: false, stopOnMouseEnter: true })]
      : []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

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

  // A click that ends a drag shouldn't also open the lightbox.
  const openIfNotDragging = useCallback(
    (img: GalleryImage) => {
      if (emblaApi?.internalEngine().dragHandler.pointerDown()) return;
      setLightboxImage(img);
    },
    [emblaApi]
  );

  const current = images[selectedIndex] ?? images[0];
  const isWide = size === "wide";

  const figure = (
    <figure className={`my-8 w-full ${isWide || size === "original" ? "" : `${SLIDE_WIDTH_CLASSES[size]} sm:mx-auto`}`}>
      <div className="group relative overflow-hidden rounded-lg border border-amber-faint bg-stage/40">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((img) => (
              <button
                key={img._key}
                type="button"
                onClick={() => openIfNotDragging(img)}
                aria-label="View full size"
                className="relative aspect-[3/2] w-full shrink-0 grow-0 basis-full cursor-zoom-in"
              >
                {img.asset && (
                  isAnimatedGifUrl(urlFor(img).url()) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- animated GIF, not safe to route through next/image's optimizer (see isAnimatedGif.ts)
                    <img
                      src={urlFor(img).width(1400).url()}
                      alt={img.alt ?? ""}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={urlFor(img).width(1400).url()}
                      alt={img.alt ?? ""}
                      fill
                      loading="lazy"
                      className="object-contain"
                    />
                  )
                )}
              </button>
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
      {lightboxImage?.asset && (
        <ImageLightbox
          src={urlFor(lightboxImage).width(2400).url()}
          alt={lightboxImage.alt ?? ""}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </figure>
  );

  return isWide ? <WideBreakout>{figure}</WideBreakout> : figure;
}

// "Masonry grid" -- for a genuinely large batch of photos (a post with
// dozens of them) shown all at once rather than one-at-a-time through a
// carousel. Pure CSS multi-column layout (`columns-*` + `break-inside-avoid`
// per item), not a JS layout library -- the browser handles the staggered
// Pinterest-style flow on its own, which is both the simplest correct way
// to do this and the lightest: no layout-measurement JS running on scroll
// or resize. Each photo keeps its own natural aspect ratio (unlike a
// uniform cropped grid), same "show the photo as taken" spirit as every
// other display mode on this block. Opens the same single-image
// ImageLightbox as every other mode on click -- no next/prev arrows added
// inside the lightbox itself, consistent with how Carousel/Slideshow/
// Scrolling strip already only ever show one enlarged photo at a time too.
function MasonryGrid({ images, size }: { images: GalleryImage[]; size: DisplaySize }) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const isWide = size === "wide";

  // Widening the container alone wouldn't shorten a long masonry scroll --
  // `columns-N` fixes the column COUNT, so a wider box with the same count
  // just makes each existing column (and photo) bigger, not more photos
  // per row. "Wide" adds real extra columns at wider breakpoints instead,
  // on top of the wider box from WideBreakout -- that's what actually
  // turns into fewer rows. Mobile stays exactly as it was (2 columns,
  // unaffected by this field either way).
  const columnsClassName = isWide
    ? "columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5"
    : "columns-2 gap-3 sm:columns-3";

  const grid = (
    <div className={`my-8 ${columnsClassName}`}>
      {images.map((img) =>
        img.asset ? (
          <figure key={img._key} className="mb-3 break-inside-avoid">
            <button type="button" onClick={() => setLightboxImage(img)} aria-label="View full size" className="block w-full cursor-zoom-in">
              <img
                src={urlFor(img).width(800).url()}
                alt={img.alt ?? ""}
                className="w-full rounded-lg border border-amber-faint object-cover"
                loading="lazy"
              />
            </button>
            {img.caption && (
              <figcaption className="mt-1.5 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ) : null
      )}
      {lightboxImage?.asset && (
        <ImageLightbox
          src={urlFor(lightboxImage).width(2400).url()}
          alt={lightboxImage.alt ?? ""}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );

  return isWide ? <WideBreakout>{grid}</WideBreakout> : grid;
}

function ScrollStrip({ images, size }: { images: GalleryImage[]; size: DisplaySize }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: true, containScroll: false },
    [AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const height = SCROLL_STRIP_HEIGHT[size];
  const isWide = size === "wide";

  const openIfNotDragging = useCallback(
    (img: GalleryImage) => {
      if (emblaApi?.internalEngine().dragHandler.pointerDown()) return;
      setLightboxImage(img);
    },
    [emblaApi]
  );

  const withAssets = images.filter((img) => img.asset);
  const repeats = withAssets.length > 0 ? Math.ceil(MIN_SCROLL_STRIP_SLIDES / withAssets.length) : 1;
  const slides =
    withAssets.length < MIN_SCROLL_STRIP_SLIDES
      ? Array.from({ length: repeats }, (_, copy) =>
          withAssets.map((img) => ({ ...img, _key: `${img._key}-copy${copy}` }))
        ).flat()
      : withAssets;

  const strip = (
    <div className="my-8 overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {slides.map((img) =>
          img.asset ? (
            <figure key={img._key} className="shrink-0 grow-0">
              <button type="button" onClick={() => openIfNotDragging(img)} aria-label="View full size" className="block cursor-zoom-in">
                {/* Plain <img>, not next/image -- these need their natural
                    aspect ratio at a fixed height, and no image dimensions
                    are fetched for post-body images, so there's nothing to
                    hand next/image's width/height (or fill's aspect box). */}
                <img
                  src={urlFor(img).height(height).fit("max").url()}
                  alt={img.alt ?? ""}
                  style={{ height }}
                  className="block w-auto rounded-lg border border-amber-faint object-cover"
                  loading="lazy"
                />
              </button>
              {img.caption && (
                <figcaption className="mt-1.5 text-center font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ) : null
        )}
      </div>
      {lightboxImage?.asset && (
        <ImageLightbox
          src={urlFor(lightboxImage).width(2400).url()}
          alt={lightboxImage.alt ?? ""}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );

  return isWide ? <WideBreakout>{strip}</WideBreakout> : strip;
}
