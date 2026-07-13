"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";

const PRINCIPLES = [
  {
    n: "01",
    text: "Stories connect people more deeply than information alone.",
  },
  {
    n: "02",
    text: "Great communication is a skill that can be learned.",
  },
  {
    n: "03",
    text: "Authenticity creates more lasting influence than performance alone.",
  },
  {
    n: "04",
    text: "Every individual has experiences that can positively impact others.",
  },
  {
    n: "05",
    text: "Confidence grows through action and repetition.",
  },
  {
    n: "06",
    text: "Lifelong learning is essential for personal and professional growth.",
  },
];

const PERSONALITY = [
  "Calm",
  "Thoughtful",
  "Curious",
  "Analytical",
  "Creative",
  "Approachable",
  "Patient",
  "Encouraging",
  "Observant",
  "Reflective",
];

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

        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          {/* Left — heading */}
          <Reveal>
            <div>
              <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
                Six quiet convictions.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-stone/85">
                Not rules. Not a manifesto. Just the beliefs that quietly shape
                how Asher chooses projects, runs workshops, and answers the
                question every coach gets asked sooner or later — &ldquo;What
                should I say?&rdquo;
              </p>

              <div className="mt-10 border-t border-amber-faint pt-6">
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
                      className="rounded-full border border-amber-faint/60 px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/80"
                    >
                      {p}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right — script-style principles list */}
          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/60">
              {/* Window chrome */}
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

              {/* Script body */}
              <div className="p-6 sm:p-8">
                <p className="mb-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                  {"/* principles that hold, in any room */"}
                </p>
                <ul className="space-y-1">
                  {PRINCIPLES.map((p, i) => (
                    <motion.li
                      key={p.n}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="group flex gap-5 border-b border-amber-faint/40 py-5 last:border-b-0"
                    >
                      <span className="font-mono-stage text-xs text-spotlight/70 sm:text-sm">
                        {p.n}
                      </span>
                      <p className="font-display text-lg font-medium leading-snug text-ivory transition-colors group-hover:text-spotlight sm:text-xl">
                        {p.text}
                      </p>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                  {"/* end of file */"}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
