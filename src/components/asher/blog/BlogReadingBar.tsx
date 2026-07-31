"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalkingCharacter } from "@/components/asher/WalkingCharacter";
import type { HeadingCheckpoint } from "@/lib/portableText";

const MILESTONE_MESSAGES: { max: number; text: string }[] = [
  { max: 0.06, text: "" },
  { max: 0.45, text: "Hope you're enjoying the read" },
  { max: 0.65, text: "You're halfway to finishing it" },
  { max: 0.97, text: "Almost to the end, you're doing great" },
  { max: 1.01, text: "You've finished it! Thanks~ Got any comments?" },
];

const FAST_SCROLL_MESSAGES = [
  "Woah, slow down.",
  "Are you a world record speedreader? You're going so fast!",
  "Easy there, speed racer!",
];

// Fast-scroll detection is an easter egg, not something safety-critical, so
// these thresholds are a reasonable starting guess rather than anything
// rigorously tuned -- worth revisiting once there's real reader behavior
// to check them against.
const FAST_SCROLL_PX_PER_MS = 3.2;
const SAMPLE_INTERVAL_MS = 120;
// Anchor-link jumps (this bar's own checkpoint dots, the "finished" message
// linking to comments, or any future in-post link) trigger the page's own
// scroll-behavior: smooth, covering a large distance in a way that looks
// identical to "reading really fast" by pure speed alone. Rather than try
// to guess at the animation's exact duration, any click on an on-page hash
// link (or any hashchange, from the keyboard or elsewhere) buys a grace
// window where fast-scroll detection is simply switched off.
const PROGRAMMATIC_SCROLL_GRACE_MS = 900;
const FAST_SCROLL_MESSAGE_DURATION_MS = 2500;
const FAST_SCROLL_COOLDOWN_MS = 6000;
// The bar stays off-screen until the reader has actually scrolled down a
// bit -- showing it immediately at the very top of the page just covers
// the title/hero image for no reason before there's any progress to show.
const VISIBLE_AFTER_SCROLL_PX = 220;

function milestoneMessage(progress: number): string {
  return MILESTONE_MESSAGES.find((m) => progress < m.max)?.text ?? "";
}

// The blog equivalent of the homepage's ProgressionBar: fixed to the
// bottom instead of a thin line under the header, checkpoints from the
// post's own h2 headings instead of hardcoded sections, and a small
// rotating line of encouragement (or, if you're scrolling suspiciously
// fast, a nudge to slow down) above the bar itself.
export function BlogReadingBar({
  targetId,
  headings,
  commentsId = "comments",
}: {
  targetId: string;
  headings: HeadingCheckpoint[];
  commentsId?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fastScrollMessage, setFastScrollMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Core progress + active-checkpoint tracking -- same start/end formula
  // the old top bar and the homepage's ProgressionBar both use, just
  // against the article element instead of a first/last section id.
  // Checkpoints are spaced evenly across the bar by order, not by their
  // exact scroll-fraction position, matching how the homepage bar already
  // treats its own (also unevenly spaced) named sections.
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const startTop = el.getBoundingClientRect().top + scrollY;
      const endBottom = startTop + el.offsetHeight;
      const totalRange = endBottom - startTop - window.innerHeight;
      const current = scrollY - startTop;
      const p = Math.max(0, Math.min(1, current / Math.max(1, totalRange)));
      setProgress(p);
      setVisible(scrollY > VISIBLE_AFTER_SCROLL_PX);

      const readingLine = window.innerHeight / 3;
      let active = -1;
      headings.forEach((h, i) => {
        const headingEl = document.getElementById(h.id);
        if (headingEl && headingEl.getBoundingClientRect().top <= readingLine + 50) active = i;
      });
      setActiveIndex(active);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId, headings]);

  // Fast-scroll easter egg, deliberately kept in its own effect/loop so
  // its "ignore window after a hash jump" logic never has to interact
  // with the progress math above.
  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    let ignoreUntil = performance.now() + PROGRAMMATIC_SCROLL_GRACE_MS;
    let lastTriggerAt = 0;
    let rafId: number;
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;

    const markProgrammatic = () => {
      ignoreUntil = performance.now() + PROGRAMMATIC_SCROLL_GRACE_MS;
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('a[href*="#"]')) markProgrammatic();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", markProgrammatic);

    const tick = (now: number) => {
      const dt = now - lastT;
      if (dt >= SAMPLE_INTERVAL_MS) {
        const y = window.scrollY;
        const speed = Math.abs(y - lastY) / dt;
        if (
          now > ignoreUntil &&
          speed > FAST_SCROLL_PX_PER_MS &&
          now - lastTriggerAt > FAST_SCROLL_COOLDOWN_MS
        ) {
          lastTriggerAt = now;
          setFastScrollMessage(FAST_SCROLL_MESSAGES[Math.floor(Math.random() * FAST_SCROLL_MESSAGES.length)]);
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => setFastScrollMessage(null), FAST_SCROLL_MESSAGE_DURATION_MS);
        }
        lastY = y;
        lastT = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hideTimeout);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", markProgrammatic);
    };
  }, []);

  const finished = progress >= 0.97;
  const message = fastScrollMessage ?? milestoneMessage(progress);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-faint bg-stage/90 backdrop-blur-xl print:hidden"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="flex min-h-[1.5rem] items-center justify-center pt-1.5">
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    key={message}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    {finished && !fastScrollMessage ? (
                      <a
                        href={`#${commentsId}`}
                        className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-spotlight underline decoration-spotlight/40 underline-offset-2 hover:decoration-spotlight"
                      >
                        {message}
                      </a>
                    ) : (
                      <span
                        className={`font-mono-stage text-[10px] uppercase tracking-[0.18em] ${
                          fastScrollMessage ? "text-spotlight" : "text-stone/60"
                        }`}
                      >
                        {message}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center py-3">
              <div className="relative flex flex-1 items-center">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-amber-faint" />
                <div
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-spotlight transition-[width] duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
                <WalkingCharacter progress={progress} />
                {headings.length > 0 && (
                  <div className="relative flex w-full items-center justify-between">
                    {headings.map((h, i) => (
                      <a
                        key={h.key}
                        href={`#${h.id}`}
                        className="group relative z-10 flex items-center justify-center py-1"
                        aria-label={`Jump to "${h.text}"`}
                      >
                        <span
                          className={`flex h-2.5 w-2.5 items-center justify-center rounded-full border transition-all group-hover:scale-125 ${
                            i <= activeIndex ? "border-spotlight bg-spotlight" : "border-amber-faint bg-stage"
                          }`}
                        />
                        <span className="pointer-events-none absolute bottom-full mb-2 hidden max-w-[10rem] -translate-x-1/2 whitespace-nowrap rounded border border-amber-faint bg-stage px-2 py-1 font-mono-stage text-[9px] uppercase tracking-[0.14em] text-ivory/80 group-hover:block">
                          {h.text}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
