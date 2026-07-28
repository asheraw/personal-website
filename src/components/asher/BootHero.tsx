"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightBeam } from "./primitives";
import { useTheme } from "./ThemeProvider";
import { track } from "@/lib/analytics";

const BOOT_LINES = ["/ entering_stage", "/ lights_dimming", "/ script_loaded", "/ finding_your_voice", "/ the_story_begins"];
const PROGRESS_STEPS = ["INITIALISING SCENE", "PREPARING SCROLL VECTOR", "AUTHENTICATING RUNTIME", "LOADING CHARACTER", "SEQUENCE INITIATED"];

// Once-per-day, not once-per-session -- persists across refreshes and new
// visits (unlike a plain in-memory flag, which resets on every reload),
// and resets naturally once a new calendar day starts. Same component
// renders at every screen size, so this covers mobile automatically too.
const BOOT_STORAGE_KEY = "asheraw-boot-shown-date";

function hasBootedToday(): boolean {
  try {
    return window.localStorage.getItem(BOOT_STORAGE_KEY) === new Date().toDateString();
  } catch {
    return false; // private browsing / storage blocked -- just replays each time
  }
}

function markBootedToday() {
  try {
    window.localStorage.setItem(BOOT_STORAGE_KEY, new Date().toDateString());
  } catch {
    // ignore -- nothing to persist to
  }
}

export function BootHero() {
  // Always start "not booted" -- matches what the server renders, so
  // hydration doesn't mismatch. If it already ran today, a useEffect below
  // (client-only, where localStorage actually exists) skips straight to
  // the finished state right after mount.
  const [booted, setBooted] = useState(false);
  const [hideOverlay, setHideOverlay] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState(PROGRESS_STEPS[0]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (hasBootedToday()) {
      setBooted(true);
      setHideOverlay(true);
      setVisibleLines(BOOT_LINES.length);
      setProgress(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (booted) return;
    if (visibleLines >= BOOT_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 360);
    return () => clearTimeout(t);
  }, [visibleLines, booted]);

  useEffect(() => {
    if (booted) return;
    const start = performance.now();
    const duration = 2800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.round(eased * 100));
      const stepIdx = Math.min(PROGRESS_STEPS.length - 1, Math.floor(eased * PROGRESS_STEPS.length));
      setStepLabel(PROGRESS_STEPS[stepIdx]);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { setBooted(true); markBootedToday(); setTimeout(() => setHideOverlay(true), 600); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [booted]);

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-stage px-5 pt-20 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-grid-paper opacity-60" aria-hidden />
      <SpotlightBeam />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay" aria-hidden />
      <div className="pointer-events-none absolute left-5 top-20 hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60 sm:left-8 sm:block lg:left-12">Singapore · 1.3521° N, 103.8198° E</div>
      <div className="pointer-events-none absolute right-5 top-20 hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60 sm:right-8 sm:block lg:right-12">asheraw.com · v.1.0</div>
      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={booted ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <p className="mb-4 font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">Asher Aw · Singapore</p>
            <h1 className="font-display text-[10vw] font-semibold leading-[0.95] tracking-[-0.01em] text-ivory pr-2 sm:text-[8vw] lg:text-[clamp(48px,6.2vw,96px)]">
              An actor who<br />
              <span className="italic font-medium text-spotlight-gradient">teaches.</span>{" "}
              <span className="font-medium text-ivory">A teacher</span><br />
              who{" "}
              <span className="italic font-medium text-spotlight-gradient">acts.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/85 sm:text-lg">
              Theatre actor, communications coach, and storyteller based in Singapore. 15+ years in marketing. 10+ years on stage. One quiet conviction — that{" "}
              <span className="text-spotlight font-medium">everyone has a story worth telling</span>, and that authenticity moves people further than volume ever will.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="https://wa.me/6591881944" target="_blank" rel="noreferrer" onClick={() => track({ action: "whatsapp_click", category: "contact", label: "hero" })} className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.03]">WhatsApp Asher</a>
              <a href="#stage" className="inline-flex items-center gap-2 rounded-full border border-amber-faint px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-spotlight/50 hover:text-spotlight">Enter the Stage</a>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={booted ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="relative hidden lg:block">
            <button type="button" onClick={() => { track({ action: "theme_toggle", category: "ui", label: theme === "dark" ? "dark_to_light" : "light_to_dark" }); toggleTheme(); }} className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-amber-faint text-left transition-all hover:border-spotlight/50" aria-label={theme === "dark" ? "Turn on the lights" : "Turn off the lights"} title={theme === "dark" ? "Turn on the lights" : "Turn off the lights"}>
              <img src="/asher/hero-stage.png" alt="Empty theatre stage with a single dramatic spotlight — click to toggle lights" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 transition-opacity" style={{ background: theme === "dark" ? "linear-gradient(180deg, rgba(10,8,7,0.0) 0%, rgba(10,8,7,0.25) 60%, rgba(10,8,7,0.85) 100%)" : "linear-gradient(180deg, rgba(250,246,238,0.0) 0%, rgba(250,246,238,0.15) 60%, rgba(250,246,238,0.65) 100%)" }} />
              <div className="absolute inset-x-0 top-6 flex flex-col items-center gap-1.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-spotlight/40 bg-stage/70 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight backdrop-blur-sm transition-all group-hover:bg-spotlight group-hover:text-stage">
                  {theme === "dark" ? "☀ Turn on the lights" : "☾ Turn off the lights"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <p className="font-mono-stage text-[10px] uppercase tracking-[0.28em] text-spotlight/80">/ scene_01</p>
                  <p className="mt-1 font-display text-lg italic text-ivory">The story begins.</p>
                </div>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">LIVE</span>
              </div>
              <span className="absolute left-3 top-3 h-5 w-5 border-l border-t border-spotlight/40" />
              <span className="absolute right-3 top-3 h-5 w-5 border-r border-t border-spotlight/40" />
              <span className="absolute left-3 bottom-3 h-5 w-5 border-b border-l border-spotlight/40" />
              <span className="absolute right-3 bottom-3 h-5 w-5 border-b border-r border-spotlight/40" />
            </button>
            <div className="absolute -left-4 top-6 hidden rounded-full border border-amber-faint bg-stage/85 px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/80 backdrop-blur-sm xl:block">● Now Performing</div>
          </motion.div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={booted && !hideOverlay ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.6 }} className="absolute bottom-8 left-5 sm:left-8 lg:left-12">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="h-8 w-px bg-gradient-to-b from-spotlight/60 to-transparent" />
            <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="text-spotlight/70">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.div>
          </div>
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/60">Scroll · The story continues</p>
        </div>
      </motion.div>
      <AnimatePresence>
        {!hideOverlay && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stage px-5">
            <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(240,184,101,0.12) 0%, transparent 60%)" }} />
            <div className="pointer-events-none absolute inset-0 bg-grid-paper opacity-40" aria-hidden />
            <div className="relative w-full max-w-3xl">
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center font-mono-stage text-xs uppercase tracking-[0.4em] text-spotlight/80 sm:text-sm">Asher Aw · Singapore</motion.p>
              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} className="mt-5 text-center font-display text-[12vw] font-semibold leading-[0.95] tracking-[-0.01em] text-ivory sm:text-[8vw] lg:text-[80px]">The story{" "}<span className="italic text-spotlight-gradient">begins.</span></motion.h1>
              <div className="mt-12 flex min-h-[120px] flex-col items-center justify-center gap-2">
                {BOOT_LINES.slice(0, visibleLines).map((line) => (
                  <motion.div key={line} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="font-mono-stage text-base text-stone/80 sm:text-xl"><span className="text-spotlight/70">{">"}</span> {line}</motion.div>
                ))}
                {!booted && <span className="ml-1 mt-1 inline-block h-5 w-2.5 animate-soft-blink bg-spotlight" />}
              </div>
              <div className="mt-10">
                <div className="mb-3 flex items-center justify-center gap-3 font-mono-stage text-[11px] uppercase tracking-[0.28em] text-stone/70 sm:text-xs">
                  <span className={`inline-flex h-2 w-2 rounded-full bg-spotlight ${!booted ? "animate-soft-blink" : ""}`} />
                  <span>{stepLabel}</span>
                  <span className="text-stone/40">·</span>
                  <span className="text-spotlight/70">{progress}%_COMPLETE</span>
                </div>
                <div className="mx-auto h-px w-full max-w-lg bg-spotlight/15">
                  <motion.div className="h-px bg-spotlight" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.1 }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
