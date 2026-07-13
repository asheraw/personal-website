"use client";

import { motion } from "framer-motion";
import { Drama, GraduationCap, Church } from "lucide-react";
import { Reveal, Eyebrow, fadeUp, staggerParent } from "./primitives";

const PILLARS = [
  {
    n: "01",
    icon: Drama,
    label: "Theatre",
    body: "10+ years on the Christian theatre stage.",
  },
  {
    n: "02",
    icon: GraduationCap,
    label: "Coaching",
    body: "Helping communicators find their own voice.",
  },
  {
    n: "03",
    icon: Church,
    label: "Faith",
    body: "Values that shape how the work is done.",
  },
];

export function ThreePillars() {
  return (
    <section
      id="three-pillars"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="00" label="The Premise" />
        </Reveal>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* Left — headline */}
          <Reveal>
            <p className="font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">
              Finding Your Voice
            </p>
            <h2 className="mt-4 font-display text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-ivory sm:text-6xl lg:text-7xl">
              a story
              <br />
              worth telling
              <br />
              <span className="italic text-spotlight-gradient">a voice</span> worth
              hearing
            </h2>
          </Reveal>

          {/* Right — three pillar cards */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col justify-end gap-3"
          >
            {PILLARS.map((p) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className="group flex items-center gap-5 rounded-2xl border border-amber-faint bg-stage/40 p-5 transition-all hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
              >
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                  <p.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                      {p.n}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-ivory">
                      {p.label}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-stone/75">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
