"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";
import { PRINCIPLES, PERSONALITY, PHILOSOPHY_CLOSING_NOTE } from "./data";

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="06" label="Personal Philosophy" />
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
            Six quiet convictions.
          </h2>
        </Reveal>

        {/* Two-column layout: principles (left, larger) + personality (right) */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          {/* Principles script window */}
          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/60">
              <div className="flex items-center justify-between border-b border-amber-faint px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-spotlight/40" />
                  <span className="h-2 w-2 rounded-full bg-spotlight/30" />
                  <span className="h-2 w-2 rounded-full bg-spotlight/20" />
                </div>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">
                  / philosophy.txt
                </span>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">
                  v.1.0
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <p className="mb-4 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                  {"/* principles that hold, in any room */"}
                </p>
                <ul className="grid gap-0 sm:grid-cols-2">
                  {PRINCIPLES.map((text, i) => (
                    <motion.li
                      key={text}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.5 }}
                      className="group flex gap-4 border-b border-amber-faint/40 px-2 py-4 sm:border-r sm:border-amber-faint/30 sm:last:border-r-0 sm:[&:nth-child(2n)]:border-r-0"
                    >
                      <span className="font-mono-stage text-xs text-spotlight/70 sm:text-sm">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="font-display text-base font-medium leading-snug text-ivory transition-colors group-hover:text-spotlight">
                        {text}
                      </p>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-4 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                  {"/* end of file */"}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Personality tags + intro */}
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col justify-between rounded-2xl border border-amber-faint bg-stage/40 p-8">
              <div>
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                  People often describe Asher as
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PERSONALITY.map((p, i) => (
                    <motion.span
                      key={p}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="rounded-full border border-amber-faint/60 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/85"
                    >
                      {p}
                    </motion.span>
                  ))}
                </div>
              </div>

              <p className="mt-8 border-t border-amber-faint/60 pt-6 text-xs leading-relaxed text-stone/60">
                {PHILOSOPHY_CLOSING_NOTE}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
