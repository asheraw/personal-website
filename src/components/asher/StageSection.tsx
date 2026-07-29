"use client";

import { motion } from "framer-motion";
import { Drama, Crown, Users, ExternalLink } from "lucide-react";
import { Reveal, Eyebrow, StatValue } from "./primitives";
import { ROLES, STAGE_STATS, STAGE_PILLARS } from "./data";

export function StageSection() {
  return (
    <section id="stage" className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 50% 50% at 80% 30%, rgba(240,184,101,0.10) 0%, transparent 60%)" }} />
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal><Eyebrow index="01" label="The Stage · Theatre" /></Reveal>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <Reveal delay={0.05}>
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">The stage has been one of the defining parts of my life.</h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg">Ten years performing in Christian theatre productions. Roles that combine emotional depth, storytelling, and meaningful themes — the kind of work that asks something of you, not just the audience.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-amber-faint">
              <img src="/asher/stage-spotlight.png" alt="Vintage brass theatre spotlight in warm amber light" className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,8,7,0.0) 40%, rgba(10,8,7,0.7) 100%)" }} />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">/ scene_02 · spotlight</p>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">ACT I</span>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-amber-faint bg-amber-faint sm:grid-cols-4">
          {STAGE_STATS.map((stat, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="h-full bg-stage p-6 sm:p-8">
                <p className="font-display text-3xl font-semibold text-spotlight-gradient sm:text-4xl"><StatValue value={stat.value} /></p>
                <p className="mt-2 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/70">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-16">
          <Reveal>
            <h3 className="mb-6 font-display text-2xl font-semibold text-ivory sm:text-3xl">Selected Roles</h3>
          </Reveal>
          <div className="overflow-hidden rounded-2xl border border-amber-faint">
            <div className="hidden grid-cols-[60px_1fr_auto] gap-6 border-b border-amber-faint bg-stage/60 px-6 py-4 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/60 sm:grid">
              <span>#</span><span>Role</span><span className="text-right">Years</span>
            </div>
            {ROLES.map((r, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className="group hidden grid-cols-[60px_1fr_auto] items-center gap-6 border-b border-amber-faint/60 px-6 py-5 transition-colors last:border-b-0 hover:bg-spotlight/[0.04] sm:grid">
                  <span className="font-mono-stage text-xs text-spotlight/70">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg font-semibold text-ivory transition-colors group-hover:text-spotlight">{r.role}</p>
                      {r.ongoing && (<span className="inline-flex items-center gap-1 rounded-full border border-spotlight/40 bg-spotlight/10 px-2 py-0.5 font-mono-stage text-[9px] uppercase tracking-[0.18em] text-spotlight"><span className="h-1.5 w-1.5 animate-soft-blink rounded-full bg-spotlight" />Ongoing</span>)}
                      {r.link && (<a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-spotlight/70 transition-colors hover:text-spotlight" aria-label={r.linkLabel || "External link"} title={r.linkLabel || "External link"}><ExternalLink size={13} /></a>)}
                    </div>
                    <p className="mt-1 text-sm text-stone/70">{r.note}</p>
                  </div>
                  <p className="text-right font-mono-stage text-xs uppercase tracking-[0.15em] text-spotlight/70">{r.years}</p>
                </div>
                <div className="border-b border-amber-faint/60 px-5 py-5 transition-colors last:border-b-0 hover:bg-spotlight/[0.04] sm:hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-stage text-xs text-spotlight/70">{String(i + 1).padStart(2, "0")}</span>
                    <p className="font-display text-base font-semibold text-ivory">{r.role}</p>
                    {r.ongoing && (<span className="inline-flex items-center gap-1 rounded-full border border-spotlight/40 bg-spotlight/10 px-1.5 py-0.5 font-mono-stage text-[8px] uppercase tracking-[0.15em] text-spotlight"><span className="h-1 w-1 animate-soft-blink rounded-full bg-spotlight" />Ongoing</span>)}
                    {r.link && (<a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-spotlight/70 transition-colors hover:text-spotlight" aria-label={r.linkLabel || "External link"} title={r.linkLabel || "External link"}><ExternalLink size={12} /></a>)}
                  </div>
                  <p className="mt-2 text-sm text-stone/70">{r.note}</p>
                  <p className="mt-2 font-mono-stage text-[10px] uppercase tracking-[0.15em] text-spotlight/70">{r.years}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[{ icon: Drama, ...STAGE_PILLARS[0] }, { icon: Crown, ...STAGE_PILLARS[1] }, { icon: Users, ...STAGE_PILLARS[2] }].map((card, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="group h-full rounded-2xl border border-amber-faint bg-stage/40 p-6 transition-all hover:border-spotlight/30 hover:bg-spotlight/[0.03]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight"><card.icon size={18} /></div>
                <h4 className="font-display text-lg font-semibold text-ivory">{card.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-stone/75">{card.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
