"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ChevronRight } from "lucide-react";
import { SpotlightBeam } from "./primitives";

const BOOT_LINES = [
  "/ entering_stage",
  "/ lights_dimming",
  "/ script_loaded",
  "/ finding_your_voice",
  "/ taking_a_breath",
  "/ the_story_begins",
];

const PROGRESS_STEPS = [
  "INITIALISING SCENE",
  "PREPARING SCROLL VECTOR",
  "AUTHENTICATING RUNTIME",
  "LOADING CHARACTER",
  "SEQUENCE INITIATED",
];

export function BootHero() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [booted, setBooted] = useState(false);
  const [stepLabel, setStepLabel] = useState(PROGRESS_STEPS[0]);

  // Boot line reveal
  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 380);
    return () => clearTimeout(t);
  }, [visibleLines]);

  // Progress bar
  useEffect(() => {
    if (booted) return;
    const start = performance.now();
    const duration = 3200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.round(eased * 100));
      const stepIdx = Math.min(
        PROGRESS_STEPS.length - 1,
        Math.floor(eased * PROGRESS_STEPS.length)
      );
      setStepLabel(PROGRESS_STEPS[stepIdx]);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setBooted(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [booted]);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-stage px-5 pt-20 sm:px-8 lg:px-12"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid-paper opacity-60" aria-hidden />
      <SpotlightBeam />
      <div
        className="pointer-events-none absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay"
        aria-hidden
      />

      {/* Top corner labels */}
      <div className="pointer-events-none absolute left-5 top-20 hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60 sm:left-8 sm:block lg:left-12">
        Singapore · 1.3521° N, 103.8198° E
      </div>
      <div className="pointer-events-none absolute right-5 top-20 hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60 sm:right-8 sm:block lg:right-12">
        Est. MMXXVI / v.1.0
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        {/* Boot terminal */}
        <div className="mb-10 sm:mb-14">
          <div className="mb-4 flex items-center gap-3 font-mono-stage text-[10px] uppercase tracking-[0.28em] text-stone/70">
            <span className="inline-flex h-2 w-2 animate-soft-blink rounded-full bg-spotlight" />
            <span>{stepLabel}</span>
            <span className="text-stone/40">·</span>
            <span className="text-spotlight/70">{progress}%_COMPLETE</span>
          </div>

          {/* Boot lines */}
          <div className="min-h-[180px] sm:min-h-[200px]">
            <AnimatePresence>
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="font-mono-stage text-sm text-stone/80 sm:text-base"
                >
                  <span className="text-spotlight/70">{">"}</span>{" "}
                  <span>{line}</span>
                  {i === visibleLines - 1 && (
                    <span className="ml-1 inline-block h-4 w-2 animate-soft-blink bg-spotlight align-middle" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="mt-2 max-w-md">
            <div className="h-px w-full bg-spotlight/15">
              <motion.div
                className="h-px bg-spotlight"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">
              <span>0%</span>
              <span className="text-spotlight/70">{progress}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={booted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl"
        >
          <p className="mb-5 font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">
            Asher Aw · Singapore
          </p>

          <h1 className="font-display text-[12vw] font-semibold leading-[0.92] tracking-[-0.02em] text-ivory sm:text-[10vw] lg:text-[8.5vw] xl:text-[140px]">
            An actor who
            <br />
            <span className="italic font-medium text-spotlight-gradient">teaches.</span>{" "}
            <span className="italic font-medium text-ivory-gradient">A teacher</span>
            <br />
            who <span className="italic font-medium text-spotlight-gradient">acts.</span>
          </h1>

          <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-base leading-relaxed text-stone/90 sm:text-lg">
              Theatre actor, communications coach, and storyteller based in
              Singapore. Fifteen years in marketing. Ten years on stage. One
              quiet conviction — that{" "}
              <span className="text-spotlight">everyone has a story worth telling</span>,
              and that authenticity moves people further than volume ever will.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.03]"
              >
                Work with Asher
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="#stage"
                className="inline-flex items-center gap-2 rounded-full border border-amber-faint px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-spotlight/50 hover:text-spotlight"
              >
                Enter the Stage
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={booted ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="mb-2 font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60">
          Scroll · The story continues
        </p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto text-spotlight/70"
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  );
}
