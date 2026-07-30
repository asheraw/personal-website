"use client";

import { useEffect, useState } from "react";

// A thin bar fixed just under the site header, filling from 0 to 100% as
// the reader scrolls through the article -- reaches full width when the
// article's bottom edge reaches the bottom of the viewport, not just
// whenever the page itself finishes scrolling (which would also count the
// footer, category/tag chips, etc. as "more reading").
export function ReadingProgressBar({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    console.log("[DEBUG mount]", { targetId, elFound: !!el });
    if (!el) return;

    // Same start/end-element formula as the homepage's ProgressionBar, just
    // against a single article element instead of a first/last section id.
    const onScroll = () => {
      const scrollY = window.scrollY;
      const startTop = el.getBoundingClientRect().top + scrollY;
      const endBottom = startTop + el.offsetHeight;
      const totalRange = endBottom - startTop - window.innerHeight;
      const current = scrollY - startTop;
      const p = Math.max(0, Math.min(1, current / Math.max(1, totalRange)));
      console.log("[DEBUG progress]", { scrollY, startTop, endBottom, totalRange, current, p });
      setProgress(p);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-amber-faint/40" aria-hidden>
      <div
        className="h-full bg-spotlight transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
