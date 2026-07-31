"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalkingCharacter } from "@/components/asher/WalkingCharacter";

type Segment = { id: string; label: string; index: string };

const SEGMENTS: Segment[] = [
  { id: "three-pillars", label: "Premise", index: "00" },
  { id: "stage", label: "Stage", index: "01" },
  { id: "coaching", label: "Coaching", index: "02" },
  { id: "faith", label: "Faith", index: "03" },
  { id: "glance", label: "At a Glance", index: "04" },
  { id: "two-callings", label: "Two Callings", index: "05" },
  { id: "philosophy", label: "Philosophy", index: "06" },
  { id: "contact", label: "Contact", index: "07" },
];

export function ProgressionBar() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const premiseEl = document.getElementById("three-pillars");
      if (!premiseEl) return;
      const premiseTop = premiseEl.getBoundingClientRect().top;
      const shouldShow = premiseTop < window.innerHeight - 80;
      setVisible(shouldShow);
      if (!shouldShow) return;

      const contactEl = document.getElementById("contact");
      const startTop = premiseEl.getBoundingClientRect().top + scrollY;
      const endBottom = contactEl
        ? contactEl.getBoundingClientRect().bottom + scrollY
        : document.body.scrollHeight;
      const totalRange = endBottom - startTop - window.innerHeight;
      const current = scrollY - startTop;
      const p = Math.max(0, Math.min(1, current / Math.max(1, totalRange)));
      setProgress(p);

      const segments = SEGMENTS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return { top: 0, height: 0 };
        const rect = el.getBoundingClientRect();
        return { top: rect.top, height: rect.height };
      });
      const readingLine = window.innerHeight / 3;
      let active = 0;
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].top <= readingLine + 50) active = i;
      }
      setActiveIndex(active);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-faint bg-stage/90 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-[1500px] px-4 py-3 sm:px-6 lg:px-12">
            <div className="relative flex items-center">
              <div className="relative flex flex-1 items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-amber-faint" />
                <div
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-spotlight transition-[width] duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
                <WalkingCharacter progress={progress} />
                {SEGMENTS.map((seg, i) => (
                  <a
                    key={seg.id}
                    href={`#${seg.id}`}
                    className="group relative z-10 flex flex-col items-center"
                    aria-label={`Go to ${seg.label}`}
                  >
                    <span
                      className={`flex h-2.5 w-2.5 items-center justify-center rounded-full border transition-all ${
                        i <= activeIndex ? "border-spotlight bg-spotlight" : "border-amber-faint bg-stage"
                      } group-hover:scale-125`}
                    />
                    <span
                      className={`mt-2 hidden font-mono-stage text-[9px] uppercase tracking-[0.18em] transition-colors sm:block ${
                        i === activeIndex ? "text-spotlight" : i < activeIndex ? "text-ivory/70" : "text-stone/50"
                      }`}
                    >
                      <span className="mr-1 opacity-60">{seg.index}</span>
                      {seg.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
