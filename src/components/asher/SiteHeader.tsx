"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { track } from "@/lib/analytics";

const NAV = [
  { label: "At a Glance", href: "#glance" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Contact", href: "#contact" },
];

export type Mode = "story" | "play";

export function SiteHeader({ mode = "story", setMode }: { mode?: Mode; setMode?: (m: Mode) => void; }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", scrolled ? "bg-stage/85 backdrop-blur-xl border-b border-amber-faint" : "bg-transparent")}>
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#top" className="group flex items-center gap-3">
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
            <button type="button" onClick={() => { track({ action: "theme_toggle", category: "ui", label: theme === "dark" ? "dark_to_light" : "light_to_dark" }); toggleTheme(); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:text-spotlight" aria-label={theme === "dark" ? "Turn on the lights" : "Turn off the lights"} title={theme === "dark" ? "Turn on the lights" : "Turn off the lights"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://wa.me/6591881944" target="_blank" rel="noreferrer" onClick={() => track({ action: "whatsapp_click", category: "contact", label: "header" })} className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-5 py-2 font-mono-stage text-xs uppercase tracking-[0.18em] text-stage transition-all hover:scale-[1.03]">WhatsApp Asher</a>
            {mode === "story" && (
              <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-md p-2 text-ivory transition-colors hover:bg-spotlight/10 lg:hidden" aria-label="Toggle menu">
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {open && mode === "story" && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden border-t border-amber-faint bg-stage/95 backdrop-blur-xl lg:hidden">
            <div className="mx-auto max-w-[1500px] px-5 py-4">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-amber-faint/60 py-3 font-mono-stage text-sm uppercase tracking-[0.18em] text-ivory">
                  <span>{item.label}</span>
                  <span className="text-spotlight/60">→</span>
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
