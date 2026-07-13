"use client";

import { motion } from "framer-motion";
import { Reveal, Eyebrow } from "./primitives";
import { Drama, GraduationCap, ArrowRight } from "lucide-react";

const PARALLELS = [
  {
    n: "0 1",
    title: "Two stages, one story",
    body: "Theatre and coaching aren't separate careers. They're two expressions of the same instinct — finding the truest line and delivering it with intention. On stage, you do it for an audience. In a workshop, you teach others to do it for theirs.",
  },
  {
    n: "0 2",
    title: "Two crafts, one discipline",
    body: "Marketing taught the work of clarity, positioning, and audience. Theatre taught presence, timing, and emotional truth. Coaching is where they meet — turning craft into a teachable, repeatable practice others can use.",
  },
  {
    n: "0 3",
    title: "Two audiences, one conviction",
    body: "Whether the audience is a thousand-seat auditorium or a one-to-one Zoom call, the conviction doesn't change. Stories connect people more deeply than information alone. Authenticity creates more lasting influence than performance ever will.",
  },
];

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
            <Eyebrow index="05" label="Two Callings, One Story" />
            <h2 className="max-w-5xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-7xl">
              Many roles, <span className="italic text-spotlight-gradient">one</span>{" "}
              <span className="italic text-ivory-gradient">craft.</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-stone/85 sm:text-lg">
              Asher links many parts of his work together so they function as one
              — actor, coach, marketer, storyteller. Each role informs the next.
              Each role makes the others sharper. Nothing is wasted.
            </p>
          </div>
        </Reveal>

        {/* Two-callings visual */}
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
                Ten years of theatre. Easter productions as Jesus. Christmas
                productions as Joseph. Live audiences, ensemble work,
                directing — performance as an act of service.
              </p>
            </div>
          </Reveal>

          {/* Connector */}
          <Reveal delay={0.05}>
            <div className="flex items-center justify-center py-4 lg:py-0">
              <div className="relative flex h-px w-full items-center justify-center bg-gradient-to-r from-transparent via-spotlight/40 to-transparent lg:w-24">
                <span className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-spotlight/40 bg-stage text-spotlight">
                  <ArrowRight size={14} className="lg:hidden" />
                  <span className="hidden font-display text-base font-semibold text-spotlight lg:block">
                    &amp;
                  </span>
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
                Fifteen years of marketing. Former trainer at Nas Academy.
                Corporate workshops, 1:1 coaching, content and personal
                branding — communication as a teachable, repeatable craft.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Parallels */}
        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {PARALLELS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl border border-amber-faint bg-stage/40 p-8">
                <div className="mb-6 flex items-baseline justify-between">
                  <span className="font-display text-3xl font-semibold text-spotlight">
                    {p.n}
                  </span>
                  <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/40">
                    / 0 3
                  </span>
                </div>
                <h4 className="font-display text-xl font-semibold text-ivory">
                  {p.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-stone/75">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
