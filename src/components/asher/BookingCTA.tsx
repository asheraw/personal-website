"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, MessageCircle, ChevronRight, Globe } from "lucide-react";
import { Reveal, Eyebrow } from "./primitives";

const OFFERINGS = [
  {
    icon: Calendar,
    title: "1:1 Coaching",
    body: "Personal branding, storytelling, and on-camera confidence — for founders, creators, and emerging communicators.",
  },
  {
    icon: MessageCircle,
    title: "Workshops & Facilitation",
    body: "Corporate training in communication, content creation, and AI-assisted workflows. Practical, hands-on, repeatable.",
  },
  {
    icon: Mail,
    title: "Speaking & Hosting",
    body: "Keynotes, panels, and faith-based events. Theatre-honed presence applied to the work you actually need done.",
  },
];

export function BookingCTA() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      {/* Hero glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(240,184,101,0.18) 0%, rgba(240,184,101,0.05) 40%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="07" label="Work With Asher" />
        </Reveal>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Left — big invitation */}
          <Reveal>
            <h2 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-ivory sm:text-6xl lg:text-7xl">
              Let&rsquo;s find{" "}
              <span className="italic text-spotlight-gradient">your voice</span>{" "}
              — the one the room actually wants to hear.
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-stone/85 sm:text-lg">
              Whether you&rsquo;re preparing for a keynote, building a personal
              brand, learning to use AI without losing your voice, or putting
              together a production that has to mean something — Asher would
              love to hear from you.
            </p>

            {/* Contact channels — visual */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <a
                href="mailto:asher@asheraw.com"
                className="group flex items-center gap-3 rounded-2xl border border-amber-faint bg-stage/40 p-4 transition-all hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                  <Mail size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-stage text-[9px] uppercase tracking-[0.22em] text-stone/60">
                    Email
                  </p>
                  <p className="truncate text-sm font-medium text-ivory transition-colors group-hover:text-spotlight">
                    asher@asheraw.com
                  </p>
                </div>
              </a>

              <a
                href="https://wa.me/6591881944"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-amber-faint bg-stage/40 p-4 transition-all hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                  <MessageCircle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-stage text-[9px] uppercase tracking-[0.22em] text-stone/60">
                    WhatsApp
                  </p>
                  <p className="truncate text-sm font-medium text-ivory transition-colors group-hover:text-spotlight">
                    +65 9188 1944
                  </p>
                </div>
              </a>

              <a
                href="https://asheraw.com"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-amber-faint bg-stage/40 p-4 transition-all hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                  <Globe size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono-stage text-[9px] uppercase tracking-[0.22em] text-stone/60">
                    Web
                  </p>
                  <p className="truncate text-sm font-medium text-ivory transition-colors group-hover:text-spotlight">
                    asheraw.com
                  </p>
                </div>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:asher@asheraw.com"
                className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-7 py-4 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.03]"
              >
                Start a Conversation
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="https://wa.me/6591881944"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-amber-faint px-7 py-4 font-mono-stage text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-spotlight/50 hover:text-spotlight"
              >
                WhatsApp Asher
              </a>
            </div>

            <p className="mt-8 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">
              Based in Singapore · Available worldwide (online & in-person)
            </p>
          </Reveal>

          {/* Right — offerings */}
          <div className="grid gap-4">
            {OFFERINGS.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.08}>
                <motion.a
                  href="mailto:asher@asheraw.com"
                  whileHover={{ y: -2 }}
                  className="group flex items-start gap-5 rounded-2xl border border-amber-faint bg-stage/40 p-6 transition-colors hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
                >
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                    <o.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-ivory transition-colors group-hover:text-spotlight">
                      {o.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone/75">
                      {o.body}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="mt-1 text-stone/40 transition-all group-hover:translate-x-1 group-hover:text-spotlight"
                  />
                </motion.a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
