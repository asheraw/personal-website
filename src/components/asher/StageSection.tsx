"use client";

import { motion } from "framer-motion";
import { Drama, Star, Crown, Users } from "lucide-react";
import { Reveal, Eyebrow, Counter } from "./primitives";

const ROLES = [
  {
    role: "Jesus Christ",
    production: "Easter Productions",
    years: "Multiple Years · 10+",
    note: "Portrayed across multiple years for live Easter audiences.",
  },
  {
    role: "Joseph",
    production: "Christmas Productions",
    years: "Recurring",
    note: "Christmas drama productions for church and public audiences.",
  },
  {
    role: "Lead Dramatic Roles",
    production: "Various Christian Theatre",
    years: "10+ Years",
    note: "Performing dramatic roles for live ensemble audiences.",
  },
  {
    role: "Director & Contributor",
    production: "Church Drama Productions",
    years: "Ongoing",
    note: "Directing and contributing to church drama productions.",
  },
];

export function StageSection() {
  return (
    <section
      id="stage"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      {/* Soft stage glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 80% 30%, rgba(240,184,101,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="01" label="The Stage · Theatre" />
        </Reveal>

        {/* Numbered chapter head */}
        <Reveal delay={0.05}>
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
            <span className="font-mono-stage text-xs uppercase tracking-[0.3em] text-stone/60">
              The chain:
            </span>
            <span className="font-display text-3xl font-semibold text-spotlight sm:text-4xl">
              0 1
            </span>
            <span className="font-mono-stage text-xs text-stone/60">/</span>
            <span className="font-mono-stage text-xs text-stone/60">0 3</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
            The stage has been one of the defining parts of my life.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone/85 sm:text-lg">
            Ten years performing in Christian theatre productions. Roles that
            combine emotional depth, storytelling, and meaningful themes — the
            kind of work that asks something of you, not just the audience.
          </p>
        </Reveal>

        {/* Stat row */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-amber-faint bg-amber-faint sm:grid-cols-4">
          {[
            { value: <Counter end={10} suffix="+" />, label: "Years on Stage" },
            { value: <Counter end={10} suffix="+" />, label: "Years as Jesus (Easter)" },
            { value: <Counter end={50} suffix="+" />, label: "Live Performances" },
            { value: "Multiple", label: "Productions Directed" },
          ].map((stat, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="h-full bg-stage p-6 sm:p-8">
                <p className="font-display text-3xl font-semibold text-spotlight-gradient sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/70">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Roles table */}
        <div className="mt-16">
          <Reveal>
            <div className="mb-6 flex items-end justify-between">
              <h3 className="font-display text-2xl font-semibold text-ivory sm:text-3xl">
                Selected Roles
              </h3>
              <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                / selected_credits
              </span>
            </div>
          </Reveal>

          <div className="overflow-hidden rounded-2xl border border-amber-faint">
            <div className="grid grid-cols-[60px_1fr_1fr_auto] gap-4 border-b border-amber-faint bg-stage/60 px-5 py-4 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/60 sm:px-6">
              <span>#</span>
              <span>Role</span>
              <span className="hidden sm:block">Production</span>
              <span>Years</span>
            </div>
            {ROLES.map((r, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className="group grid grid-cols-[60px_1fr_1fr_auto] items-center gap-4 border-b border-amber-faint/60 px-5 py-5 transition-colors last:border-b-0 hover:bg-spotlight/[0.04] sm:px-6">
                  <span className="font-mono-stage text-xs text-spotlight/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ivory transition-colors group-hover:text-spotlight">
                      {r.role}
                    </p>
                    <p className="mt-1 text-sm text-stone/70">{r.note}</p>
                  </div>
                  <p className="hidden text-sm text-stone/80 sm:block">
                    {r.production}
                  </p>
                  <p className="font-mono-stage text-xs uppercase tracking-[0.15em] text-spotlight/70">
                    {r.years}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Three pillars of stage work */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Drama,
              title: "Performance",
              body: "Stage roles combining emotional depth, storytelling, and meaningful themes for live audiences.",
            },
            {
              icon: Crown,
              title: "Portrayal",
              body: "Portraying Jesus Christ in Easter productions and Joseph in Christmas productions across multiple years.",
            },
            {
              icon: Users,
              title: "Direction",
              body: "Directing and contributing to church drama productions, leading ensembles from rehearsal to stage.",
            },
          ].map((card, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="group h-full rounded-2xl border border-amber-faint bg-stage/40 p-6 transition-all hover:border-spotlight/30 hover:bg-spotlight/[0.03]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                  <card.icon size={18} />
                </div>
                <h4 className="font-display text-lg font-semibold text-ivory">
                  {card.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-stone/75">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
