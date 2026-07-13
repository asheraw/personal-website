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
  // After boot completes, fade out the terminal block entirely.
  const [hideTerminal, setHideTerminal] = useState(false);

  // Boot line reveal
  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 320);
    return () => clearTimeout(t);
  }, [visibleLines]);

  // Progress bar
  useEffect(() => {
    if (booted) return;
    const start = performance.now();
    const duration = 2600;
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
      else {
        setBooted(true);
        // After boot, hide the terminal block shortly after
        setTimeout(() => setHideTerminal(true), 700);
      }
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
        asheraw.com · v.1.0
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        {/* Boot terminal — auto-hides after completion */}
        <AnimatePresence>
          {!hideTerminal && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: booted ? 0.4 : 1 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="mb-10 overflow-hidden sm:mb-12"
            >
              <div className="mb-3 flex items-center gap-3 font-mono-stage text-[10px] uppercase tracking-[0.28em] text-stone/70">
                <span
                  className={`inline-flex h-2 w-2 rounded-full bg-spotlight ${
                    !booted ? "animate-soft-blink" : ""
                  }`}
                />
                <span>{stepLabel}</span>
                <span className="text-stone/40">·</span>
                <span className="text-spotlight/70">{progress}%_COMPLETE</span>
              </div>

              {/* Boot lines — single condensed line */}
              <div className="flex min-h-[28px] flex-wrap items-center gap-x-5 gap-y-1">
                {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                  <motion.span
                    key={line}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="font-mono-stage text-xs text-stone/70 sm:text-sm"
                  >
                    <span className="text-spotlight/70">{">"}</span> {line}
                  </motion.span>
                ))}
                {!booted && (
                  <span className="ml-1 inline-block h-4 w-2 animate-soft-blink bg-spotlight align-middle" />
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 max-w-md">
                <div className="h-px w-full bg-spotlight/15">
                  <motion.div
                    className="h-px bg-spotlight"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero — text + visual */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={booted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12"
        >
          {/* Left: copy */}
          <div>
            <p className="mb-4 font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">
              Asher Aw · Singapore
            </p>

            <h1 className="font-display text-[10vw] font-semibold leading-[0.92] tracking-[-0.02em] text-ivory sm:text-[8vw] lg:text-[clamp(48px,6.2vw,96px)]">
              An actor who
              <br />
              <span className="italic font-medium text-spotlight-gradient">teaches.</span>{" "}
              <span className="italic font-medium text-ivory-gradient">A teacher</span>
              <br />
              who{" "}
              <span className="italic font-medium text-spotlight-gradient">acts.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-stone/90 sm:text-lg">
              Theatre actor, communications coach, and storyteller based in
              Singapore. 15+ years in marketing. 10+ years on stage. One quiet
              conviction — that{" "}
              <span className="text-spotlight">everyone has a story worth telling</span>,
              and that authenticity moves people further than volume ever will.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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

          {/* Right: hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={booted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-amber-faint">
              {/* Image */}
              <img
                src="/asher/hero-stage.png"
                alt="Empty theatre stage with a single dramatic spotlight"
                className="h-full w-full object-cover"
              />
              {/* Gradient overlays */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,8,7,0.0) 0%, rgba(10,8,7,0.25) 60%, rgba(10,8,7,0.85) 100%)",
                }}
              />
              {/* Caption strip */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <p className="font-mono-stage text-[10px] uppercase tracking-[0.28em] text-spotlight/80">
                    / scene_01
                  </p>
                  <p className="mt-1 font-display text-lg italic text-ivory">
                    The story begins.
                  </p>
                </div>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                  LIVE
                </span>
              </div>
              {/* Corner brackets */}
              <span className="absolute left-3 top-3 h-5 w-5 border-l border-t border-spotlight/40" />
              <span className="absolute right-3 top-3 h-5 w-5 border-r border-t border-spotlight/40" />
              <span className="absolute left-3 bottom-3 h-5 w-5 border-b border-l border-spotlight/40" />
              <span className="absolute right-3 bottom-3 h-5 w-5 border-b border-r border-spotlight/40" />
            </div>

            {/* Floating tag */}
            <div className="absolute -left-4 top-6 hidden rounded-full border border-amber-faint bg-stage/85 px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/80 backdrop-blur-sm xl:block">
              ● Now Performing
            </div>
          </motion.div>
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
