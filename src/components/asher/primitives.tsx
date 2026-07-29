"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------- Motion variants ---------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/* ---------- Reveal wrapper ---------- */

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Mono label (terminal-style chip) ---------- */

export function MonoLabel({
  children,
  className,
  prefix = "/",
}: {
  children: ReactNode;
  className?: string;
  prefix?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono-stage text-[11px] sm:text-xs uppercase tracking-[0.22em] text-spotlight/80",
        className
      )}
    >
      <span className="text-stone/60 mr-1">{prefix}</span>
      {children}
    </span>
  );
}

/* ---------- Section heading eyebrow ---------- */

export function Eyebrow({
  index,
  label,
  className,
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono-stage text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone",
        className
      )}
    >
      {index && <span className="text-spotlight/80">{index}</span>}
      <span className="h-px w-8 bg-spotlight/40" />
      <span>{label}</span>
    </div>
  );
}

/* ---------- Marquee strip ---------- */

export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-amber-faint bg-stage/60 py-3",
        className
      )}
    >
      <div className="flex w-max animate-marquee-x gap-12 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-mono-stage text-xs uppercase tracking-[0.28em] text-stone/80"
          >
            <span className="text-spotlight/70 mr-3">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Spotlight beam background ---------- */

export function SpotlightBeam({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {/* Main spotlight beam */}
      <div
        className="absolute left-1/2 top-[-20%] h-[120vh] w-[80vw] -translate-x-1/2 animate-beam-pan"
        style={{
          background:
            "conic-gradient(from 270deg at 50% 0%, transparent 0deg, rgba(240,184,101,0.10) 8deg, transparent 16deg, transparent 360deg)",
          filter: "blur(28px)",
        }}
      />
      {/* Soft top glow */}
      <div
        className="absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(240,184,101,0.22) 0%, rgba(240,184,101,0.06) 35%, transparent 70%)",
        }}
      />
      {/* Floor pool */}
      <div
        className="absolute bottom-[-10%] left-1/2 h-[40vh] w-[60vw] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(217,152,70,0.15) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}

/* ---------- StatValue (number-or-word stat, gradient-text-safe) ---------- */

// Renders a stat's value ("20+", "100+", "Multiple"...) -- animates the count
// up if it starts with a digit, otherwise just prints the word as-is. Always
// wrapped in inline-block + pb-1: text-spotlight-gradient's background-clip:
// text can clip descenders/lowercase letters (e.g. the "e" in "Multiple")
// right at the box edge without that padding.
export function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  return (
    <span className="inline-block pb-1">
      {match ? <Counter end={parseInt(match[1], 10)} suffix={match[2]} /> : value}
    </span>
  );
}

/* ---------- Counter (animated number) ---------- */

export function Counter({
  end,
  duration = 1.6,
  prefix = "",
  suffix = "",
  className,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <AnimatedNumber end={end} duration={duration} prefix={prefix} suffix={suffix} />
    </motion.span>
  );
}

function AnimatedNumber({
  end,
  duration,
  prefix,
  suffix,
}: {
  end: number;
  duration: number;
  prefix: string;
  suffix: string;
}) {
  // Use framer-motion's useMotionValue + animate via a small inline effect-free approach
  // We'll keep it simple with useState + requestAnimationFrame
  return (
    <ClientCounter end={end} duration={duration} prefix={prefix} suffix={suffix} />
  );
}

import { useState, useEffect, useRef } from "react";

function ClientCounter({
  end,
  duration,
  prefix,
  suffix,
}: {
  end: number;
  duration: number;
  prefix: string;
  suffix: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / (duration * 1000));
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(Math.round(eased * end));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}
