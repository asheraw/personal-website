"use client";

import { motion } from "framer-motion";
import {
  Mail, MessageCircle, Drama, GraduationCap, Church, BarChart3,
  Sparkles, BookOpen, PenLine, ChevronRight, ExternalLink,
} from "lucide-react";
import {
  ROLES, GLANCE_STATS, BRANDS, COACHING_TOPICS, COACHING_CREDENTIALS,
  FAITH_VALUES, PRINCIPLES, PERSONALITY, COACHING_PHILOSOPHY_QUOTE,
  CONTACT_INFO, SOCIALS, STAGE_PILLARS,
} from "../data";

type IconType = React.ComponentType<{ size?: number; className?: string }>;
const ICONS: Record<string, IconType> = {
  sparkles: Sparkles, drama: Drama, graduation: GraduationCap, church: Church,
  chart: BarChart3, masks: Drama, book: BookOpen, pen: PenLine,
};

function Section({ id, eyebrow, title, iconKey, children }: { id: string; eyebrow: string; title: string; iconKey: string; children: React.ReactNode; }) {
  const Icon = ICONS[iconKey] || Sparkles;
  return (
    <section id={`play-${id}`} data-section-id={id} className="flex min-h-[60vh] flex-col justify-center scroll-mt-4 border-b border-amber-faint px-8 py-14 sm:px-10 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight"><Icon size={18} /></div>
          <p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-spotlight/70">{eyebrow}</p>
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.01em] text-ivory sm:text-4xl">{title}</h2>
        <div className="mt-6">{children}</div>
      </motion.div>
    </section>
  );
}

export function PlaySections() {
  return (
    <div className="divide-y divide-amber-faint">
      <Section id="hero" eyebrow="00 · Welcome" title="An actor who teaches. A teacher who acts." iconKey="sparkles">
        <p className="text-base leading-relaxed text-stone/85">Theatre actor, communications coach, and storyteller based in Singapore. 15+ years in marketing. 10+ years on stage. One quiet conviction — that <span className="text-spotlight">everyone has a story worth telling</span>, and that authenticity moves people further than volume ever will.</p>
        <div className="mt-5 flex flex-wrap gap-2">{["Singapore", "15+ yrs marketing", "10+ yrs stage"].map((t) => (<span key={t} className="rounded-full border border-amber-faint/60 px-3 py-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-stone/80">{t}</span>))}</div>
        <p className="mt-6 text-base leading-relaxed text-stone/70">Across theatre, coaching, marketing, and ministry — the work has always been the same. To help someone say the truest thing in the clearest way. To find the line that makes a room lean in. To perform not for applause, but for connection.</p>
        <p className="mt-4 text-base leading-relaxed text-stone/70">Asher believes effective communication comes from authenticity, not volume. That introverts can become outstanding communicators without pretending to be extroverts. That every individual has experiences that can positively impact others.</p>
      </Section>

      <Section id="stage" eyebrow="01 · The Stage" title="The stage has been one of the defining parts of my life." iconKey="drama">
        <p className="text-base leading-relaxed text-stone/85">Ten years performing in Christian theatre productions. Roles that combine emotional depth, storytelling, and meaningful themes — the kind of work that asks something of you, not just the audience.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">{[{v:"10+",l:"Years on Stage"},{v:"10+",l:"Years as Jesus"},{v:"50+",l:"Performances"}].map((s) => (<div key={s.l} className="rounded-xl border border-amber-faint bg-stage/40 p-3 text-center"><p className="font-display text-3xl font-semibold text-spotlight-gradient">{s.v}</p><p className="mt-1 font-mono-stage text-xs uppercase tracking-[0.18em] text-stone/60">{s.l}</p></div>))}</div>
        <div className="mt-6"><p className="mb-3 font-mono-stage text-xs uppercase tracking-[0.22em] text-stone/60">/ selected_credits</p>
          <div className="space-y-2">{ROLES.map((r, i) => (<div key={r.role} className="flex items-start gap-3 rounded-lg border border-amber-faint/40 p-3"><span className="font-mono-stage text-sm text-spotlight/70 pt-0.5">{String(i+1).padStart(2,"0")}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="font-display text-base font-semibold text-ivory">{r.role}</p>{r.ongoing && (<span className="inline-flex items-center gap-1 rounded-full border border-spotlight/40 bg-spotlight/10 px-2 py-0.5 font-mono-stage text-xs uppercase tracking-[0.15em] text-spotlight"><span className="h-1 w-1 animate-soft-blink rounded-full bg-spotlight" /> Ongoing</span>)}{r.link && (<a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-spotlight/70 transition-colors hover:text-spotlight" aria-label={r.linkLabel} title={r.linkLabel}><ExternalLink size={14} /></a>)}</div><p className="mt-1 text-base text-stone/70">{r.note}</p><p className="mt-1 font-mono-stage text-xs uppercase tracking-[0.15em] text-spotlight/70">{r.years}</p></div></div>))}</div>
        </div>
        <div className="mt-6 space-y-3">{STAGE_PILLARS.map((p, i) => (<div key={i} className="rounded-lg border border-amber-faint/40 p-3"><p className="font-display text-base font-semibold text-ivory">{p.title}</p><p className="mt-1 text-base text-stone/70">{p.body}</p></div>))}</div>
      </Section>

      <Section id="coaching" eyebrow="02 · The Studio" title="Helping people become more confident communicators." iconKey="graduation">
        <p className="text-base leading-relaxed text-stone/85">You learn to communicate as yourself, only clearer. Practical, encouraging, and grounded in the belief that confidence grows through action and repetition.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">{COACHING_TOPICS.map((t) => (<div key={t.title} className="rounded-lg border border-amber-faint/40 px-3 py-2"><p className="text-base font-semibold text-ivory">{t.title}</p><p className="mt-0.5 text-sm text-stone/60 leading-snug">{t.body}</p></div>))}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">{COACHING_CREDENTIALS.map((c) => (<div key={c.label} className="rounded-lg border border-amber-faint bg-stage/40 p-3"><p className="font-mono-stage text-xs uppercase tracking-[0.2em] text-stone/60">{c.label}</p><p className="mt-1 text-base font-medium text-ivory">{c.value}</p></div>))}</div>
        <blockquote className="mt-5 border-l-2 border-spotlight/40 pl-4 font-display text-lg italic leading-snug text-ivory">&ldquo;{COACHING_PHILOSOPHY_QUOTE}&rdquo;</blockquote>
      </Section>

      <Section id="faith" eyebrow="03 · The Heart" title="Values that influence how he performs, teaches, and serves." iconKey="church">
        <p className="text-base leading-relaxed text-stone/85">Rather than separating faith from work, Asher sees values as principles that shape everything — on stage, in workshops, and in the in-between moments.</p>
        <p className="mt-4 text-base leading-relaxed text-stone/70">His theatre work has often been an extension of that faith — not through preaching from the stage, but through storytelling that holds truth, grace, and human dignity at its centre.</p>
        <div className="mt-5 flex flex-wrap gap-2">{FAITH_VALUES.map((v) => (<span key={v} className="rounded-full border border-amber-faint/60 px-3 py-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-ivory/90">{v}</span>))}</div>
        <p className="mt-6 text-base leading-relaxed text-stone/60">These are not slogans. They are the everyday principles that shape how Asher performs, teaches, writes, and interacts with others — on stage, in workshops, and in the in-between moments where most of life actually happens.</p>
      </Section>

      <Section id="glance" eyebrow="04 · At a Glance" title="Built to be used like a craft — practised, lived, shared." iconKey="chart">
        <div className="grid grid-cols-2 gap-2">{GLANCE_STATS.map((s) => (<div key={s.label} className="rounded-xl border border-amber-faint bg-stage/40 p-4"><p className="font-display text-4xl font-semibold text-spotlight-gradient">{s.value}</p><p className="mt-1 font-mono-stage text-xs uppercase tracking-[0.18em] text-stone/60">{s.label}</p></div>))}</div>
        <div className="mt-5"><p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-stone/60">Brands worked with</p><div className="mt-2 flex flex-wrap gap-2">{BRANDS.map((b) => (<span key={b} className="rounded-full border border-amber-faint px-3 py-1.5 font-mono-stage text-xs uppercase tracking-[0.16em] text-ivory/90">{b}</span>))}</div></div>
        <p className="mt-6 text-base leading-relaxed text-stone/70">Marketing and theatre, running in parallel for more than a decade and a half — both pointing at the same instinct: communicate ideas that move people. A quick snapshot of the work so far.</p>
      </Section>

      <Section id="callings" eyebrow="05 · Two Callings" title="Many roles, one craft." iconKey="drama">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-xl border border-amber-faint bg-stage/40 p-4 text-center"><Drama size={24} className="mx-auto text-spotlight" /><p className="mt-2 font-display text-base font-semibold text-ivory">The Stage</p><p className="mt-1 text-sm text-stone/60">10+ years of theatre</p></div>
          <span className="font-display text-xl font-semibold text-spotlight">&amp;</span>
          <div className="rounded-xl border border-amber-faint bg-stage/40 p-4 text-center"><GraduationCap size={24} className="mx-auto text-spotlight" /><p className="mt-2 font-display text-base font-semibold text-ivory">The Studio</p><p className="mt-1 text-sm text-stone/60">15+ years of marketing</p></div>
        </div>
        <p className="mt-5 text-center font-display text-lg italic leading-snug text-ivory">&ldquo;Stories connect people more deeply than information alone.&rdquo;</p>
        <p className="mt-4 text-base leading-relaxed text-stone/70">Actor, coach, marketer, storyteller. Each role informs the next. Each role makes the others sharper. Nothing is wasted. Theatre taught presence, timing, and emotional truth. Marketing taught clarity, positioning, and audience. Coaching is where they meet.</p>
        <p className="mt-3 text-base leading-relaxed text-stone/70">Whether the audience is a thousand-seat auditorium or a one-to-one Zoom call, the conviction doesn&rsquo;t change. Authenticity creates more lasting influence than performance ever will.</p>
      </Section>

      <Section id="philosophy" eyebrow="06 · Philosophy" title="Six quiet convictions." iconKey="book">
        <ul className="space-y-2">{PRINCIPLES.map((p, i) => (<li key={i} className="flex gap-3 border-b border-amber-faint/40 pb-2"><span className="font-mono-stage text-sm text-spotlight/70">{String(i+1).padStart(2,"0")}</span><p className="flex-1 text-base leading-relaxed text-ivory">{p}</p></li>))}</ul>
        <div className="mt-5"><p className="font-mono-stage text-xs uppercase tracking-[0.22em] text-stone/60">Often described as</p><div className="mt-2 flex flex-wrap gap-2">{PERSONALITY.map((t) => (<span key={t} className="rounded-full border border-amber-faint/60 px-3 py-1.5 font-mono-stage text-xs uppercase tracking-[0.16em] text-stone/80">{t}</span>))}</div></div>
        <p className="mt-6 text-base leading-relaxed text-stone/60">He enjoys understanding why people think the way they do, and finding better ways to communicate complex ideas simply. Not rules. Not a manifesto. Just the beliefs that quietly shape how Asher chooses projects, runs workshops, and answers the question every coach gets asked sooner or later — &ldquo;What should I say?&rdquo;</p>
      </Section>

      <Section id="contact" eyebrow="07 · Work With Asher" title="Let's find your voice." iconKey="pen">
        <p className="text-base leading-relaxed text-stone/85">Whether you&rsquo;re preparing for a keynote, building a personal brand, or putting together a production that has to mean something — Asher would love to hear from you. WhatsApp is the fastest way to reach him.</p>
        <div className="mt-5 space-y-2">
          <a href={CONTACT_INFO.whatsappUrl} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-spotlight/40 bg-spotlight/10 p-3 transition-colors hover:bg-spotlight/20"><div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/40 bg-spotlight/10 text-spotlight"><MessageCircle size={16} /></div><div className="flex-1"><p className="font-mono-stage text-xs uppercase tracking-[0.2em] text-spotlight/80">WhatsApp · Fastest Reply</p><p className="text-base font-medium text-ivory group-hover:text-spotlight">{CONTACT_INFO.whatsapp}</p></div><ChevronRight size={16} className="text-stone/40 group-hover:text-spotlight" /></a>
          <a href={`mailto:${CONTACT_INFO.email}`} className="group flex items-center gap-3 rounded-xl border border-amber-faint bg-stage/40 p-3 transition-colors hover:border-spotlight/40 hover:bg-spotlight/[0.03]"><div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight"><Mail size={16} /></div><div className="flex-1"><p className="font-mono-stage text-xs uppercase tracking-[0.2em] text-stone/60">Email</p><p className="text-base font-medium text-ivory group-hover:text-spotlight">{CONTACT_INFO.email}</p></div><ChevronRight size={16} className="text-stone/40 group-hover:text-spotlight" /></a>
        </div>
        <div className="mt-5"><p className="font-mono-stage text-xs uppercase tracking-[0.22em] text-stone/60">Find Asher on</p><div className="mt-2 flex flex-wrap gap-2">{SOCIALS.map((s) => (<a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-full border border-amber-faint px-3 py-1.5 font-mono-stage text-xs uppercase tracking-[0.16em] text-ivory/90 transition-colors hover:border-spotlight/40 hover:text-spotlight">{s.label}</a>))}</div></div>
        <a href={CONTACT_INFO.whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-spotlight px-5 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.02]">WhatsApp Asher<ChevronRight size={14} /></a>
        <p className="mt-4 text-center font-mono-stage text-xs uppercase tracking-[0.25em] text-stone/50">Based in Singapore · Available worldwide</p>
      </Section>
    </div>
  );
}
