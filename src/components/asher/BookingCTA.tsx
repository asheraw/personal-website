"use client";

import { motion } from "framer-motion";
import { Calendar, MessageCircle, Mail, ChevronRight, ExternalLink } from "lucide-react";
import { Reveal, Eyebrow } from "./primitives";
import { ContactForm } from "./ContactForm";
import { CONTACT_INFO, SOCIALS } from "./data";
import { track } from "@/lib/analytics";

const OFFERINGS = [
  { icon: Calendar, title: "1:1 Coaching", body: "Personal branding, storytelling, and on-camera confidence — for founders, creators, and emerging communicators." },
  { icon: MessageCircle, title: "Workshops & Facilitation", body: "Corporate training in communication, content creation, and AI-assisted workflows. Practical, hands-on, repeatable." },
  { icon: Mail, title: "Speaking & Hosting", body: "Keynotes, panels, and faith-based events. Theatre-honed presence applied to the work you actually need done." },
];

export function BookingCTA() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(240,184,101,0.18) 0%, rgba(240,184,101,0.05) 40%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" aria-hidden />
      <div className="relative mx-auto max-w-[1500px]">
        <Reveal><Eyebrow index="07" label="Work With Asher" /></Reveal>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <h2 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-ivory sm:text-6xl lg:text-7xl">Let&rsquo;s find{" "}<span className="italic text-spotlight-gradient">your voice</span> — the one the room actually wants to hear.</h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/85 sm:text-lg">Whether you&rsquo;re preparing for a keynote, building a personal brand, learning to use AI without losing your voice, or putting together a production that has to mean something — drop Asher a message below.</p>
            <div className="mt-8 space-y-3">
              <a href={CONTACT_INFO.whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track({ action: "whatsapp_click", category: "contact", label: "contact_section" })} className="group flex items-center gap-4 rounded-2xl border border-spotlight/40 bg-spotlight/10 p-4 transition-all hover:border-spotlight hover:bg-spotlight/20">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-spotlight/40 bg-spotlight/10 text-spotlight"><MessageCircle size={18} /></div>
                <div className="flex-1">
                  <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight/80">WhatsApp · Fastest Reply</p>
                  <p className="text-base font-medium text-ivory transition-colors group-hover:text-spotlight">{CONTACT_INFO.whatsapp}</p>
                </div>
                <ExternalLink size={16} className="text-stone/40 group-hover:text-spotlight" />
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`} className="group flex items-center gap-4 rounded-2xl border border-amber-faint bg-stage/40 p-4 transition-all hover:border-spotlight/40 hover:bg-spotlight/[0.03]">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight"><Mail size={18} /></div>
                <div className="flex-1">
                  <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/60">Email</p>
                  <p className="text-base font-medium text-ivory transition-colors group-hover:text-spotlight">{CONTACT_INFO.email}</p>
                </div>
              </a>
            </div>
            <div className="mt-8 space-y-3">
              {OFFERINGS.map((o, i) => (
                <motion.a key={o.title} href="#contact" whileHover={{ y: -2 }} className="group flex items-start gap-5 rounded-2xl border border-amber-faint bg-stage/40 p-5 transition-colors hover:border-spotlight/40 hover:bg-spotlight/[0.03]">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight"><o.icon size={20} /></div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-ivory transition-colors group-hover:text-spotlight">{o.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone/75">{o.body}</p>
                  </div>
                  <ChevronRight size={16} className="mt-1 text-stone/40 transition-all group-hover:translate-x-1 group-hover:text-spotlight" />
                </motion.a>
              ))}
            </div>
            <div className="mt-8">
              <p className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/60">Find Asher on</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SOCIALS.map((s) => (<a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-full border border-amber-faint px-4 py-2 font-mono-stage text-xs uppercase tracking-[0.16em] text-ivory/90 transition-colors hover:border-spotlight/40 hover:text-spotlight">{s.label}</a>))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-amber-faint bg-stage/40 p-6 sm:p-8">
              <div className="mb-6">
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/70">/ send_a_message</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ivory sm:text-3xl">Send Asher a message</h3>
                <p className="mt-2 text-sm text-stone/70">Fill in the form and Asher will get back to you. For a faster reply, use WhatsApp.</p>
              </div>
              <ContactForm />
            </div>
          </Reveal>
        </div>
        <p className="mt-12 text-center font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">Based in Singapore · Available worldwide (online & in-person)</p>
      </div>
    </section>
  );
}
