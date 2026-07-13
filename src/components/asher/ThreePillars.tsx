"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow, fadeUp, staggerParent } from "./primitives";

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

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
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
              <br />
              hearing
              <br />
              <span className="italic text-ivory-gradient">a life</span> worth
              living
            </h2>
          </Reveal>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col justify-end gap-6"
          >
            <motion.p
              variants={fadeUp}
              className="max-w-md text-base leading-relaxed text-stone/90 sm:text-lg"
            >
              Across theatre, coaching, marketing, and ministry — the work has
              always been the same. To help someone say the truest thing in the
              clearest way. To find the line that makes a room lean in. To
              perform not for applause, but for connection.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="max-w-md text-base leading-relaxed text-stone/70"
            >
              Asher believes effective communication comes from{" "}
              <span className="text-ivory">authenticity, not volume</span>. That
              introverts can become outstanding communicators without pretending
              to be extroverts. That every individual has experiences that can
              positively impact others.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-4 border-t border-amber-faint pt-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/60"
            >
              <div>
                <p className="text-spotlight/70">01</p>
                <p className="mt-1 text-ivory/80">Theatre</p>
              </div>
              <div>
                <p className="text-spotlight/70">02</p>
                <p className="mt-1 text-ivory/80">Coaching</p>
              </div>
              <div>
                <p className="text-spotlight/70">03</p>
                <p className="mt-1 text-ivory/80">Faith</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
