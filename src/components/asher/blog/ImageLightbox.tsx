"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Rendered via a portal so it always sits above everything else,
// regardless of overflow/transform on whatever container (a carousel's
// Embla viewport, in particular) happens to trigger it.
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  // On mobile, a reader's instinct to leave the lightbox is an edge-swipe
  // "back" gesture, same as leaving any full-screen view -- without this,
  // that gesture falls straight through to the browser's real back
  // navigation and dumps them off the article entirely. Pushing a dummy
  // history entry on open gives that gesture somewhere to land first: the
  // popstate it fires closes the lightbox instead of leaving the page.
  const closedByPopStateRef = useRef(false);

  useEffect(() => {
    history.pushState({ lightbox: true }, "", location.href);
    const onPopState = () => {
      closedByPopStateRef.current = true;
      onClose();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Closed via the X button, Escape, or backdrop click rather than a
      // back gesture -- the dummy entry above is still sitting in history
      // and needs clearing out, or the *next* back gesture would just hit
      // that instead of actually leaving the page. Skipped when a real
      // popstate already consumed it (the branch above), since going back
      // a second time would then skip past the page the reader meant to
      // land on.
      if (!closedByPopStateRef.current) history.back();
    };
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-stage/80 p-2 text-ivory transition-colors hover:bg-stage"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- the point is the untouched original, not a next/image-resized copy */}
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
