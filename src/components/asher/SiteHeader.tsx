"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Stage", href: "#stage", index: "01" },
  { label: "Coaching", href: "#coaching", index: "02" },
  { label: "Faith", href: "#faith", index: "03" },
  { label: "At a Glance", href: "#glance" },
  { label: "Reflections", href: "#reflections" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-stage/85 backdrop-blur-xl border-b border-amber-faint"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#top" className="group flex items-center gap-3">
            <span
              className="font-display text-xl font-semibold tracking-tight text-ivory"
              style={{ letterSpacing: "-0.01em" }}
            >
              Asher<span className="text-spotlight">.</span>Aw
            </span>
            <span className="hidden font-mono-stage text-[10px] uppercase tracking-[0.3em] text-stone/70 sm:inline-block">
              Actor · Coach · Storyteller
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative font-mono-stage text-xs uppercase tracking-[0.18em] text-stone transition-colors hover:text-ivory"
              >
                {item.index && (
                  <span className="mr-1 text-spotlight/60">{item.index}</span>
                )}
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-spotlight transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="#contact"
              className="group relative overflow-hidden rounded-full border border-spotlight/40 bg-spotlight/10 px-5 py-2 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-all hover:bg-spotlight hover:text-stage"
            >
              <span className="relative z-10">Book a Session</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-ivory transition-colors hover:bg-spotlight/10 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-amber-faint bg-stage/95 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto max-w-[1500px] px-5 py-4">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-amber-faint/60 py-3 font-mono-stage text-sm uppercase tracking-[0.18em] text-ivory"
                >
                  <span>
                    {item.index && (
                      <span className="mr-2 text-spotlight/60">{item.index}</span>
                    )}
                    {item.label}
                  </span>
                  <span className="text-spotlight/60">→</span>
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-4 block rounded-full bg-spotlight px-5 py-3 text-center font-mono-stage text-xs uppercase tracking-[0.2em] text-stage"
              >
                Book a Session
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
