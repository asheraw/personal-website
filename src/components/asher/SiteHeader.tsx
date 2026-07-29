"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { track } from "@/lib/analytics";

const NAV = []; // No nav links — hamburger menu removed

// Once-per-day nudge pointing at the theme toggle -- same storage pattern as
// BootHero's once-a-day boot animation (a plain date-string comparison,
// not a session flag, so it persists across refreshes and resets itself
// the moment a new calendar day starts).
const HINT_STORAGE_KEY = "asheraw-theme-hint-shown-date";

function hasHintShownToday(): boolean {
  try {
    return window.localStorage.getItem(HINT_STORAGE_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
}

function markHintShownToday() {
  try {
    window.localStorage.setItem(HINT_STORAGE_KEY, new Date().toDateString());
  } catch {
    // ignore -- nothing to persist to
  }
}

export type Mode = "story" | "play";

export function SiteHeader({
  mode = "story",
  setMode,
  context = "home",
}: {
  mode?: Mode;
  setMode?: (m: Mode) => void;
  // Which page this header is rendering on -- included in tracked click
  // events so header WhatsApp clicks on the blog can be told apart from
  // ones on the homepage, instead of all landing under one "header" label.
  context?: "home" | "blog";
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // useLayoutEffect (not useEffect) so this resolves before first paint --
  // otherwise a visitor who's already dismissed the hint today would still
  // see it flash for a frame on every page load. Same reasoning as
  // BootHero's boot-overlay check.
  useLayoutEffect(() => {
    if (!hasHintShownToday()) setShowHint(true);
  }, []);

  function dismissHint() {
    if (!showHint) return;
    setShowHint(false);
    markHintShownToday();
  }

  useEffect(() => {
    if (!showHint) return;
    const onScrollDismiss = () => {
      if (window.scrollY > 120) dismissHint();
    };
    window.addEventListener("scroll", onScrollDismiss, { passive: true });
    return () => window.removeEventListener("scroll", onScrollDismiss);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHint]);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", scrolled ? "bg-stage/85 backdrop-blur-xl border-b border-amber-faint" : "bg-transparent")}>
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/#top" className="group flex items-center gap-3">
              <span className="font-display text-xl font-semibold tracking-tight text-ivory" style={{ letterSpacing: "-0.01em" }}>Asher <span className="text-spotlight">Aw</span></span>
              <span className="hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/70 sm:inline-block">Actor · Coach · Storyteller</span>
            </a>
            {setMode && (
              <div className="hidden sm:flex items-center rounded-full border border-amber-faint bg-stage/40 p-0.5">
                <button type="button" onClick={() => setMode("story")} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] transition-all", mode === "story" ? "bg-spotlight text-stage" : "text-stone/70 hover:text-ivory")} aria-pressed={mode === "story"}>
                  <BookOpen size={11} /> Story
                </button>
                <button type="button" onClick={() => setMode("play")} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] transition-all", mode === "play" ? "bg-spotlight text-stage" : "text-stone/70 hover:text-ivory")} aria-pressed={mode === "play"}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor"><path d="M1 0.5L8 4.5L1 8.5V0.5Z"/></svg> Play
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a href="/blog" onClick={() => track({ action: "nav_click", category: "navigation", label: "blog" })} className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70 transition-colors hover:text-spotlight">
              Blog
            </a>
            <div className="relative">
              <button type="button" onClick={() => { track({ action: "theme_toggle", category: "ui", label: `${theme === "dark" ? "dark_to_light" : "light_to_dark"}_${context}` }); toggleTheme(); dismissHint(); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:text-spotlight" aria-label={theme === "dark" ? "Turn on the lights" : "Turn off the lights"} title={theme === "dark" ? "Turn on the lights" : "Turn off the lights"}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                    className="pointer-events-none absolute right-0 top-full mt-2 flex flex-col items-end"
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="mr-3 text-spotlight/80"
                      aria-hidden
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: "rotate(180deg)" }}>
                        <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                    <span className="mt-1 whitespace-nowrap rounded-full border border-amber-faint bg-stage/90 px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/80 backdrop-blur-sm">
                      Try {theme === "dark" ? "light" : "dark"} mode
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <a href="https://wa.me/6591881944" target="_blank" rel="noreferrer" onClick={() => track({ action: "whatsapp_click", category: "contact", label: `header_${context}` })} className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-5 py-2 font-mono-stage text-xs uppercase tracking-[0.18em] text-stage transition-all hover:scale-[1.03]">WhatsApp</a>
          </div>
        </div>
      </div>
    </header>
  );
}
