"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type Moment = { quote: string; caption?: string };

// The first (and, for now, only) entry in the PLAY presentation registry --
// a click-through carousel of a post's own key quotes, as an alternative
// to reading the full prose. Deliberately simple: no heavy assets, no 3D,
// just keyboard/click/swipe navigation through a handful of moments
// someone already wrote (often copy-pasted straight from "Suggest SEO &
// Excerpt"'s pull-quote suggestions).
export function KeyMomentsPlay({
  postTitle,
  postSlug,
  introText,
  moments,
}: {
  postTitle: string;
  postSlug: string;
  introText?: string;
  moments: Moment[];
}) {
  // -1 is the intro screen (only reachable if introText was actually
  // written) -- otherwise everything starts at the first real moment.
  const [index, setIndex] = useState(introText ? -1 : 0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const canGoBack = index > (introText ? -1 : 0);
  const canGoForward = index < moments.length - 1;

  const goNext = useCallback(() => {
    if (index < moments.length - 1) setIndex((i) => i + 1);
  }, [index, moments.length]);

  const goBack = useCallback(() => {
    if (index > (introText ? -1 : 0)) setIndex((i) => i - 1);
  }, [index, introText]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goBack();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goBack]);

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext();
      else goBack();
    }
    setTouchStartX(null);
  }

  const current = index >= 0 ? moments[index] : null;

  return (
    <div
      // pt-28 matches BlogChrome's own offset for the same fixed, always-
      // present site header (SiteHeader.tsx, position: fixed, z-50) --
      // without it, this page's own "Back to the full post" bar renders
      // directly underneath and overlaps the real one.
      className="flex min-h-screen flex-col bg-stage pt-28 text-ivory"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href={`/blog/${postSlug}`}
          className="inline-flex items-center gap-2 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70 transition-colors hover:text-spotlight"
        >
          <ArrowLeft size={14} />
          Back to the full post
        </Link>
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/50">Key Moments</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-16">
        {index === -1 ? (
          <div className="max-w-2xl space-y-6">
            <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight">{postTitle}</p>
            <p className="font-display text-2xl leading-snug text-ivory sm:text-3xl">{introText}</p>
          </div>
        ) : (
          current && (
            <div className="max-w-2xl space-y-6">
              <p className="font-display text-3xl italic leading-snug text-ivory sm:text-4xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              {current.caption && <p className="text-sm text-stone/70">{current.caption}</p>}
            </div>
          )
        )}
      </div>

      <div className="flex flex-col items-center gap-5 px-6 py-8">
        <div className="flex items-center gap-2">
          {introText && (
            <button
              type="button"
              aria-label="Intro"
              onClick={() => setIndex(-1)}
              className={`h-1.5 w-6 rounded-full transition-colors ${index === -1 ? "bg-spotlight" : "bg-stone/30"}`}
            />
          )}
          {moments.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Moment ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-6 rounded-full transition-colors ${index === i ? "bg-spotlight" : "bg-stone/30"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Previous"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-faint text-ivory transition-colors hover:border-spotlight/60 hover:text-spotlight disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          {canGoForward ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-spotlight px-8 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.02]"
            >
              Next
            </button>
          ) : (
            <Link
              href={`/blog/${postSlug}`}
              className="rounded-full bg-spotlight px-8 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.02]"
            >
              Read the full post
            </Link>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoForward}
            aria-label="Next"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-faint text-ivory transition-colors hover:border-spotlight/60 hover:text-spotlight disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
