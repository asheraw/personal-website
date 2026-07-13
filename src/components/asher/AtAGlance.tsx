"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow, Counter } from "./primitives";

const STATS = [
  { value: <Counter end={15} suffix="+" />, label: "Years in Marketing" },
  { value: <Counter end={10} suffix="+" />, label: "Years on Stage" },
  { value: <Counter end={10} suffix="+" />, label: "Years as Jesus" },
  { value: <Counter end={50} suffix="+" />, label: "Workshops Facilitated" },
];

const BRANDS = ["Lexus", "OCBC", "Bayer", "Nas Academy"];

export function AtAGlance() {
  return (
    <section
      id="glance"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid-paper opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* Left — heading + brands */}
          <Reveal>
            <Eyebrow index="05" label="At a Glance" />
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
              Built to be used like a craft — practised, lived, shared.
            </h2>

            {/* Brands */}
            <div className="mt-10">
              <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                Brands worked with
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {BRANDS.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-amber-faint px-4 py-2 font-mono-stage text-xs uppercase tracking-[0.18em] text-ivory/90 transition-colors hover:border-spotlight/40 hover:text-spotlight"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Stats grid — large visual numbers, minimal text */}
          <div className="grid gap-px overflow-hidden rounded-2xl border border-amber-faint bg-amber-faint sm:grid-cols-2">
            {STATS.map((s, i) => (
              <Reveal key={i} delay={(i % 2) * 0.05}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="group relative h-full bg-stage p-8 transition-colors hover:bg-spotlight/[0.03] sm:p-10"
                >
                  <span className="absolute right-6 top-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/40">
                    {String(i + 1).padStart(2, "0")} / 04
                  </span>
                  <p className="font-display text-6xl font-semibold text-spotlight-gradient sm:text-7xl">
                    {s.value}
                  </p>
                  <p className="mt-3 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/70">
                    {s.label}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
