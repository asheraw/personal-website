"use client";

import { motion } from "framer-motion";
import {
  Mic,
  PenLine,
  Sparkles,
  Camera,
  MessageSquare,
  Brain,
  Bot,
  Award,
  ChevronRight,
} from "lucide-react";
import { Reveal, Eyebrow } from "./primitives";

const TOPICS = [
  {
    icon: Award,
    title: "Personal Branding",
    body: "Building a brand voice that feels like you — not a louder version of someone else.",
  },
  {
    icon: PenLine,
    title: "Storytelling",
    body: "Structuring ideas as stories. Finding the hook, the turn, the line that lands.",
  },
  {
    icon: Sparkles,
    title: "Content Creation",
    body: "From idea to published. Practical systems for creators who want to ship consistently.",
  },
  {
    icon: MessageSquare,
    title: "Social Media Strategy",
    body: "Choosing platforms and formats that fit your voice — and ignoring the rest without guilt.",
  },
  {
    icon: Camera,
    title: "Confidence on Camera",
    body: "On-camera presence for introverts. Calm, grounded, and quietly magnetic.",
  },
  {
    icon: Mic,
    title: "Presentation Skills",
    body: "From boardroom to keynote. Owning the room without performing for it.",
  },
  {
    icon: Brain,
    title: "Authentic Communication",
    body: "Communicating in a way that feels natural, instead of imitating louder personalities.",
  },
  {
    icon: Bot,
    title: "AI-Assisted Content",
    body: "Using generative AI as a thinking partner — prompting, editing, scaling your voice.",
  },
];

const CREDENTIALS = [
  { label: "Former Trainer", value: "Nas Academy" },
  { label: "Corporate Trainer", value: "Workshops & Facilitation" },
  { label: "Content Creation Coach", value: "1:1 & Group" },
  { label: "Personal Branding Coach", value: "Founders & Creators" },
];

export function CoachingSection() {
  return (
    <section
      id="coaching"
      className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 20% 30%, rgba(217,152,70,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px]">
        <Reveal>
          <Eyebrow index="02" label="The Studio · Coaching & Training" />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
            <span className="font-mono-stage text-xs uppercase tracking-[0.3em] text-stone/60">
              The chain:
            </span>
            <span className="font-display text-3xl font-semibold text-spotlight sm:text-4xl">
              0 2
            </span>
            <span className="font-mono-stage text-xs text-stone/60">/</span>
            <span className="font-mono-stage text-xs text-stone/60">0 3</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
            Helping people become more confident communicators — without
            becoming someone else.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone/85 sm:text-lg">
            Asher coaches individuals who want to communicate ideas in ways that
            connect, inspire, and move others. His approach is practical and
            encouraging — the opposite of "fake it till you make it." You learn
            to communicate as yourself, only clearer.
          </p>
        </Reveal>

        {/* Topics grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((topic, i) => (
            <Reveal key={topic.title} delay={(i % 4) * 0.05}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-amber-faint bg-stage/40 p-6 transition-all hover:-translate-y-1 hover:border-spotlight/40 hover:bg-spotlight/[0.03]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/5 text-spotlight">
                    <topic.icon size={18} />
                  </div>
                  <span className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h4 className="font-display text-lg font-semibold text-ivory transition-colors group-hover:text-spotlight">
                  {topic.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-stone/75">
                  {topic.body}
                </p>
                <ChevronRight
                  size={14}
                  className="absolute bottom-5 right-5 text-spotlight/0 transition-all group-hover:translate-x-1 group-hover:text-spotlight/70"
                />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Coaching philosophy block */}
        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <Reveal>
            <div className="relative h-full rounded-2xl border border-amber-faint bg-stage/40 p-8 sm:p-10">
              <span className="absolute right-6 top-6 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/40">
                / coaching_philosophy
              </span>
              <p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-spotlight/80">
                Philosophy
              </p>
              <blockquote className="mt-5 font-display text-2xl font-medium leading-snug text-ivory sm:text-3xl">
                &ldquo;Communicate in a way that feels natural. Don&rsquo;t try
                to imitate louder personalities — find the version of you that
                the room actually wants to hear.&rdquo;
              </blockquote>
              <p className="mt-6 text-sm leading-relaxed text-stone/70">
                Coaching is grounded in three beliefs: stories connect people
                more deeply than information alone. Great communication is a
                skill that can be learned. And confidence grows through action
                and repetition — not through waiting until you feel ready.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex h-full flex-col justify-between rounded-2xl border border-amber-faint bg-stage/40 p-8 sm:p-10">
              <div>
                <p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-spotlight/80">
                  Credentials
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ivory">
                  Trainer · Facilitator · Coach
                </h3>
              </div>
              <ul className="mt-8 space-y-5">
                {CREDENTIALS.map((c, i) => (
                  <motion.li
                    key={c.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="flex items-baseline justify-between gap-4 border-b border-amber-faint/60 pb-4"
                  >
                    <span className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-stone/60">
                      {c.label}
                    </span>
                    <span className="text-right text-sm font-medium text-ivory">
                      {c.value}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
