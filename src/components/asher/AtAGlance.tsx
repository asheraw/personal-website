"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow, Counter } from "./primitives";

const STATS = [
  {
    value: <Counter end={15} suffix="+" />,
    label: "Years in Marketing & Communications",
    detail: "Branding, digital marketing, content strategy, storytelling.",
  },
  {
    value: <Counter end={10} suffix="+" />,
    label: "Years on Stage",
    detail: "Christian theatre productions, dramatic roles, ensemble work.",
  },
  {
    value: <Counter end={10} suffix="+" />,
    label: "Years Portraying Jesus",
    detail: "Easter productions across multiple years for live audiences.",
  },
  {
    value: <Counter end={50} suffix="+" />,
    label: "Workshops Facilitated",
    detail: "Corporate training, content coaching, personal branding.",
  },
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
          <Reveal>
            <Eyebrow index="04" label="At a Glance" />
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
              Built to be used like a craft — practised, lived, and shared.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone/80">
              A quick snapshot of the work so far. Marketing and theatre,
              running in parallel for more than a decade and a half — both
              pointing at the same instinct: communicate ideas that move people.
            </p>

            {/* Brands */}
            <div className="mt-10 border-t border-amber-faint pt-6">
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

          {/* Stats grid */}
          <div className="grid gap-px overflow-hidden rounded-2xl border border-amber-faint bg-amber-faint sm:grid-cols-2">
            {STATS.map((s, i) => (
              <Reveal key={i} delay={(i % 2) * 0.05}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="group relative h-full bg-stage p-8 transition-colors hover:bg-spotlight/[0.03]"
                >
                  <span className="absolute right-6 top-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/40">
                    {String(i + 1).padStart(2, "0")} / 04
                  </span>
                  <p className="font-display text-5xl font-semibold text-spotlight-gradient sm:text-6xl">
                    {s.value}
                  </p>
                  <p className="mt-3 font-display text-base font-medium text-ivory">
                    {s.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone/70">
                    {s.detail}
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
