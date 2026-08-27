"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow, StatValue } from "./primitives";
import { CyclingWordSlot, useCyclingIndex } from "./CyclingCallingWord";
import { GLANCE_STATS, BRANDS } from "./data";

// Matches the real stat tiles below it verbatim -- "on Stage" and "in
// Marketing" are the exact labels on two of the four GLANCE_STATS entries
// (see data.ts), and "as Jesus" pulls the third. Deliberately excludes the
// fourth stat ("100+ Workshops Facilitated") since it doesn't fit this
// "Years ___" sentence shape. Same cycling pattern as ThreePillars/
// TwoCallings rather than a new one-off, so the headline is a live
// pointer at the actual numbers instead of a vague standalone line.
const GLANCE_YEARS_WORDS = ["on Stage", "in Marketing", "as Jesus"];
const GLANCE_INTERVAL_MS = 1800;

export function AtAGlance() {
  const {index, reduceMotion} = useCyclingIndex(GLANCE_YEARS_WORDS.length, GLANCE_INTERVAL_MS);
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
            <Eyebrow index="04" label="At a Glance" />
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
              Years{" "}
              <CyclingWordSlot
                words={GLANCE_YEARS_WORDS}
                index={index}
                reduceMotion={reduceMotion}
                wordClassName="italic text-spotlight-gradient"
              />
              .
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
            {GLANCE_STATS.map((s, i) => (
              <Reveal key={i} delay={(i % 2) * 0.05}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="group relative h-full bg-stage p-8 transition-colors hover:bg-spotlight/[0.03] sm:p-10"
                >
                  <span className="absolute right-6 top-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/40">
                    {String(i + 1).padStart(2, "0")} / 04
                  </span>
                  <p className="font-display text-6xl font-semibold leading-[1.05] text-spotlight-gradient sm:text-7xl">
                    <StatValue value={s.value} />
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
