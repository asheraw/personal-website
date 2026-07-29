"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";
import { useTheme } from "./ThemeProvider";

const VALUES = ["Integrity", "Humility", "Service", "Compassion", "Excellence"];

export function FaithSection() {
  const { theme } = useTheme();
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

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          {/* Quote block */}
          <Reveal>
            <div>
              <p className="font-mono-stage text-xs uppercase tracking-[0.3em] text-spotlight/80">
                Faith in the work
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
                Values that influence{" "}
                <span className="italic text-spotlight-gradient">
                  how he performs, teaches, and serves.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-stone/85">
                Rather than separating faith from work, Asher sees integrity,
                humility, service, compassion, and excellence as principles
                that shape everything — on stage, in workshops, and in the
                in-between moments where most of life actually happens.
              </p>
            </div>
          </Reveal>

          {/* Visual + values side-by-side */}
          <Reveal delay={0.08}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {/* Light beam image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-amber-faint sm:col-span-2 lg:col-span-1">
                <img
                  src="/asher/faith-light.png"
                  alt="A single ray of warm golden light in a dark space"
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      theme === "dark"
                        ? "linear-gradient(180deg, rgba(10,8,7,0.0) 50%, rgba(10,8,7,0.75) 100%)"
                        : "linear-gradient(180deg, rgba(250,246,238,0.0) 50%, rgba(250,246,238,0.75) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">
                    / scene_04 · light
                  </p>
                  <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                    ACT III
                  </span>
                </div>
              </div>

              {/* Values list — compact */}
              <div className="rounded-2xl border border-amber-faint bg-stage/40 p-5">
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">
                  Values in practice
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VALUES.map((v, i) => (
                    <motion.span
                      key={v}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      className="rounded-full border border-amber-faint/60 px-3 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-ivory/90"
                    >
                      {v}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
