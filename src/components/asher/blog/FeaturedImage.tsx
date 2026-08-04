"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/asher/blog/ImageLightbox";

// The post's Featured Image, at the top of the article -- always full
// width (it's the hero, not a Display-size-able body image), but opens the
// full-size original in a lightbox on click, same as every image further
// down in the post body.
export function FeaturedImage({ src, fullSrc, alt }: { src: string; fullSrc: string; alt: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="View full size"
        className="block w-full cursor-zoom-in"
      >
        <Image src={src} alt={alt} width={1200} height={675} className="h-auto w-full" priority />
      </button>
      {lightboxOpen && <ImageLightbox src={fullSrc} alt={alt} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
