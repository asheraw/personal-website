"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";

const VALUES = [
  "Integrity",
  "Humility",
  "Service",
  "Compassion",
  "Excellence",
];

export function FaithSection() {
  return (
    <section
      id="faith"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      {/* Cathedral-like vertical beam */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 30% 70% at 50% 0%, rgba(240,184,101,0.16) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-px -translate-x-1/2 bg-gradient-to-b from-spotlight/30 via-spotlight/10 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="03" label="The Heart · Faith" />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
            <span className="font-mono-stage text-xs uppercase tracking-[0.3em] text-stone/60">
              The chain:
            </span>
            <span className="font-display text-3xl font-semibold text-spotlight sm:text-4xl">
              0 3
            </span>
            <span className="font-mono-stage text-xs text-stone/60">/</span>
            <span className="font-mono-stage text-xs text-stone/60">0 3</span>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          {/* Quote block */}
          <Reveal>
            <div>
              <p className="font-mono-stage text-xs uppercase tracking-[0.3em] text-spotlight/80">
                Faith in the work
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
                Rather than separating faith from work, he sees values as
                principles that influence{" "}
                <span className="italic text-spotlight-gradient">
                  how he performs, teaches, and serves.
                </span>
              </h2>

              <p className="mt-8 max-w-lg text-base leading-relaxed text-stone/85">
                Asher is a Christian, and his faith has played an important role
                throughout his life. His theatre work has often been an extension
                of that faith — not through preaching from the stage, but through
                storytelling that holds truth, grace, and human dignity at its
                centre.
              </p>
            </div>
          </Reveal>

          {/* Values list — script style */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-amber-faint bg-stage/40 p-8 sm:p-10">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-spotlight/80">
                  Values in practice
                </p>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/40">
                  / values.cfg
                </span>
              </div>

              <ul className="space-y-3">
                {VALUES.map((v, i) => (
                  <motion.li
                    key={v}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="group flex items-center gap-4 rounded-lg border border-amber-faint/40 px-5 py-4 transition-colors hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
                  >
                    <span className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-xl font-medium text-ivory transition-colors group-hover:text-spotlight">
                      {v}
                    </span>
                    <span className="ml-auto font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/40">
                      active
                    </span>
                  </motion.li>
                ))}
              </ul>

              <p className="mt-6 border-t border-amber-faint/60 pt-6 text-xs leading-relaxed text-stone/60">
                These are not slogans. They are the everyday principles that
                shape how Asher performs, teaches, writes, and interacts with
                others — on stage, in workshops, and in the in-between moments
                where most of life actually happens.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
