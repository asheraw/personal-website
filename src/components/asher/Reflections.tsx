"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Reveal, Eyebrow, Marquee } from "./primitives";

const REFLECTIONS = [
  {
    date: "July 13, 2026",
    category: "Storytelling",
    title: "The Introvert on Stage: Why Quiet Performers Move Rooms",
    excerpt:
      "Volume is not presence. The introvert who learns to use silence, breath, and intention often reaches an audience more deeply than the loudest voice in the cast.",
    read: "6 min",
  },
  {
    date: "June 2, 2026",
    category: "AI & Creativity",
    title: "Prompting Is a Performance: AI as Your Scene Partner",
    excerpt:
      "Generative AI is not a replacement for craft. Used well, it becomes a thinking partner — a scene partner that holds the other end of the line until you find yours.",
    read: "8 min",
  },
  {
    date: "April 18, 2026",
    category: "Faith & Theatre",
    title: "Playing Jesus for a Decade: What the Role Taught Me About Silence",
    excerpt:
      "Ten years of Easter productions. Ten years of a role that asks more of you than lines and blocking. What it taught me about pause, weight, and showing up without performing.",
    read: "10 min",
  },
];

const MARQUEE_ITEMS = [
  "Public Speaking",
  "Theatre Acting",
  "Character Performance",
  "Storytelling",
  "Coaching",
  "Corporate Training",
  "Workshop Facilitation",
  "Personal Branding",
  "Content Strategy",
  "Copywriting",
  "Marketing Strategy",
  "Brand Positioning",
  "Social Media Marketing",
  "Video Content Creation",
  "AI Prompting",
  "Communication Skills",
];

export function Reflections() {
  return (
    <section
      id="reflections"
      className="relative border-t border-amber-faint bg-stage"
    >
      {/* Marquee strip */}
      <Marquee items={MARQUEE_ITEMS} />

      <div className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Eyebrow index="07" label="Reflections & Writing" />
                <h2 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
                  Notes from the wings.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-stone/80">
                  Essays on storytelling, performance, AI, and faith — written
                  between rehearsals, workshops, and the quiet moments in
                  between.
                </p>
              </div>
              <a
                href="#reflections"
                className="group inline-flex items-center gap-2 self-start font-mono-stage text-xs uppercase tracking-[0.2em] text-spotlight sm:self-auto"
              >
                View all reflections
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            </div>
          </Reveal>

          {/* Cards */}
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {REFLECTIONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.08}>
                <a
                  href="#reflections"
                  className="group flex h-full flex-col rounded-2xl border border-amber-faint bg-stage/40 p-7 transition-all hover:-translate-y-1 hover:border-spotlight/40 hover:bg-spotlight/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-spotlight/30 bg-spotlight/5 px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/90">
                      {r.category}
                    </span>
                    <ArrowUpRight
                      size={16}
                      className="text-stone/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-spotlight"
                    />
                  </div>

                  <h3 className="mt-6 font-display text-xl font-semibold leading-snug text-ivory transition-colors group-hover:text-spotlight sm:text-2xl">
                    {r.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-stone/75">
                    {r.excerpt}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-amber-faint/60 pt-4 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/50">
                    <span>{r.date}</span>
                    <span>{r.read}</span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
