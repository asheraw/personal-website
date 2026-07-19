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
} from "lucide-react";
import { Reveal, Eyebrow } from "./primitives";

const TOPICS = [
  { icon: Award, title: "Personal Branding", body: "A brand voice that feels like you." },
  { icon: PenLine, title: "Storytelling", body: "The hook, the turn, the line that lands." },
  { icon: Sparkles, title: "Content Creation", body: "Practical systems for consistent shipping." },
  { icon: MessageSquare, title: "Social Media Strategy", body: "Platforms that fit your voice." },
  { icon: Camera, title: "Confidence on Camera", body: "On-camera presence for introverts." },
  { icon: Mic, title: "Presentation Skills", body: "Owning the room without performing for it." },
  { icon: Brain, title: "Authentic Communication", body: "Communicate as yourself, only clearer." },
  { icon: Bot, title: "AI-Assisted Content", body: "Generative AI as a thinking partner." },
];

const CREDENTIALS = [
  { label: "Current Trainer", value: "Nas Academy" },
  { label: "Multiple Winner", value: "Trainer of the Month" },
  { label: "Corporate Trainer", value: "Workshops & Facilitation" },
  { label: "1:1 Coach", value: "Founders & Creators" },
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

        {/* Chapter head + visual */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          {/* Visual side panel — first on desktop */}
          <Reveal delay={0.05} className="order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-amber-faint">
              <img
                src="/asher/coaching-mic.png"
                alt="Vintage chrome microphone in warm spotlight"
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,8,7,0.0) 40%, rgba(10,8,7,0.7) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/80">
                  / scene_03 · the studio
                </p>
                <span className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60">
                  ACT II
                </span>
              </div>
            </div>

            {/* Credentials strip below image */}
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-amber-faint bg-amber-faint">
              {CREDENTIALS.map((c) => (
                <div key={c.label} className="bg-stage p-4">
                  <p className="font-mono-stage text-[9px] uppercase tracking-[0.22em] text-stone/60">
                    {c.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ivory">{c.value}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Text */}
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
              Helping people become more confident communicators — without
              becoming someone else.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone/85 sm:text-lg">
              You learn to communicate as yourself, only clearer. Practical,
              encouraging, and grounded in three beliefs: stories connect people
              more deeply than information alone. Great communication is a skill
              that can be learned. And confidence grows through action and
              repetition.
            </p>
          </Reveal>
        </div>

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
              </div>
            </Reveal>
          ))}
        </div>

        {/* Coaching philosophy block */}
        <Reveal delay={0.05}>
          <div className="mt-16 relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/40 p-8 sm:p-12">
            <span className="absolute right-6 top-6 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/40">
              / coaching_philosophy
            </span>
            <p className="font-mono-stage text-xs uppercase tracking-[0.25em] text-spotlight/80">
              Philosophy
            </p>
            <blockquote className="mt-5 max-w-4xl font-display text-2xl font-medium leading-snug text-ivory sm:text-3xl lg:text-4xl">
              &ldquo;Communicate in a way that feels natural. Don&rsquo;t try to
              imitate louder personalities — find the version of you that the
              room actually wants to hear.&rdquo;
            </blockquote>
            <p className="mt-6 font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/70">
              — Asher Aw
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
