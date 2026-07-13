"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";
import { Drama, GraduationCap, ArrowRight } from "lucide-react";

export function TwoCallings() {
  return (
    <section
      id="two-callings"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(217,152,70,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-amber-faint pb-12">
            <Eyebrow index="04" label="Two Callings, One Story" />
            <h2 className="max-w-5xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-7xl">
              Many roles, <span className="italic text-spotlight-gradient">one</span>{" "}
              <span className="italic text-ivory-gradient">craft.</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-stone/85 sm:text-lg">
              Actor, coach, marketer, storyteller. Each role informs the next.
              Each role makes the others sharper. Nothing is wasted.
            </p>
          </div>
        </Reveal>

        {/* Two-callings visual diagram */}
        <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <div className="group relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/40 p-8 transition-all hover:border-spotlight/40">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                <Drama size={22} />
              </div>
              <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">
                Calling 01
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory sm:text-3xl">
                The Stage
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone/75">
                Ten years of theatre. Easter productions as Jesus. Live
                audiences, ensemble work, directing — performance as an act of
                service.
              </p>
            </div>
          </Reveal>

          {/* Connector */}
          <Reveal delay={0.05}>
            <div className="flex items-center justify-center py-4 lg:py-0">
              <div className="relative flex h-px w-full items-center justify-center bg-gradient-to-r from-transparent via-spotlight/40 to-transparent lg:w-24">
                <span className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/40 bg-stage font-display text-base font-semibold text-spotlight">
                  <span className="hidden lg:block">&amp;</span>
                  <ArrowRight size={14} className="lg:hidden" />
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="group relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/40 p-8 transition-all hover:border-spotlight/40">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                <GraduationCap size={22} />
              </div>
              <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">
                Calling 02
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ivory sm:text-3xl">
                The Studio
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone/75">
                Fifteen years of marketing. Current trainer at Nas Academy.
                Corporate workshops, 1:1 coaching — communication as a
                teachable, repeatable craft.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Single conviction line — replaces the 3 parallels blocks */}
        <Reveal delay={0.1}>
          <div className="mt-12 mx-auto max-w-3xl text-center">
            <p className="font-display text-2xl italic leading-snug text-ivory sm:text-3xl">
              &ldquo;Whether the audience is a thousand-seat auditorium or a
              one-to-one Zoom call —{" "}
              <span className="text-spotlight-gradient not-italic font-medium">
                stories connect people more deeply than information alone.
              </span>
              &rdquo;
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
