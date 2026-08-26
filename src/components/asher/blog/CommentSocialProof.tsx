"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { truncateText } from "@/lib/text";

export type CommentStats = { totalComments: number; authorReplies: number };
export type Testimonial = { _id: string; name: string; message: string | null; createdAt: string; postTitle: string; postSlug: string };

const MESSAGE_MAX_LENGTH = 160;
const ROTATE_MS = 7000;
// Matches the tail's own `top-7` position (1.75rem, assuming the default
// 16px root) and the card's `rounded-2xl` radius -- both feed into the ring
// path below so it traces the card's actual rendered outline, not a guess.
const TAIL_ANCHOR_Y = 28;
const CARD_RADIUS = 16;

// Full rounded-rect perimeter as one path, starting and ending at the
// tail's attachment point on the left edge (rather than a <rect>'s fixed
// top-left start) -- so the progress ring visibly grows out from the tail
// and sweeps all the way back to it, matching the speech bubble's own
// "this is where it's speaking from" anchor instead of an arbitrary corner.
function ringPath(width: number, height: number): string {
  const r = CARD_RADIUS;
  const y = TAIL_ANCHOR_Y;
  return [
    `M 0,${y}`,
    `L 0,${r}`,
    `A ${r},${r} 0 0 1 ${r},0`,
    `L ${width - r},0`,
    `A ${r},${r} 0 0 1 ${width},${r}`,
    `L ${width},${height - r}`,
    `A ${r},${r} 0 0 1 ${width - r},${height}`,
    `L ${r},${height}`,
    `A ${r},${r} 0 0 1 0,${height - r}`,
    `L 0,${y}`,
  ].join(" ");
}

// The plain-number half of the comment social-proof concept -- sits inline
// next to the search box, on every screen size. Deliberately just text in a
// pill, not a claim about "trending" or "popular": these are the same two
// honest, live counts (see COMMENT_STATS_QUERY) shown everywhere else this
// concept appears.
export function CommentStatsBadge({ stats }: { stats: CommentStats }) {
  if (stats.totalComments === 0) return null;

  return (
    <p className="rounded-full border border-amber-faint bg-card/30 px-4 py-2.5 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone/70">
      <span className="text-spotlight">{stats.totalComments.toLocaleString()}</span> comment
      {stats.totalComments === 1 ? "" : "s"} from readers
      {stats.authorReplies > 0 && (
        <>
          {" "}
          · <span className="text-spotlight">{stats.authorReplies.toLocaleString()}</span> replies by Asher
        </>
      )}
    </p>
  );
}

// The quote half -- a speech bubble in the open margin beside the reading
// column, desktop only (see CommentStatsBadge above for why the count alone
// is fine on every size, but a whole quote card felt like clutter on
// mobile). Rotates through every comment Asher has marked "Feature" in
// Studio's Comments tool -- there's no ranking/scoring involved, this is
// pure manual curation; the widget's only job is to cycle through Asher's
// picks on a timer so more than one gets seen, with a thin ring tracing the
// border as a plain "moving to the next one soon" signal -- a fixed-size
// indicator regardless of how many comments end up featured, unlike a row
// of dots which would eventually overflow the card.
export function CommentTestimonialBubble({ testimonials }: { testimonials: Testimonial[] }) {
  const withMessage = testimonials.filter((t): t is Testimonial & { message: string } => !!t.message);
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (withMessage.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % withMessage.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [withMessage.length]);

  // Re-measures on mount and whenever the card's own rendered size changes
  // (a shorter/longer name between rotations can shift its height by a few
  // px even with the message itself capped) -- the ring path is only ever
  // as accurate as this measurement. Reads clientWidth/clientHeight
  // directly rather than trusting the observer entry's own contentRect --
  // contentRect excludes padding, but the ring's <svg> spans inset-0 (the
  // padding box, i.e. content + padding), so using contentRect drew a ring
  // consistently ~40px narrower and ~32px shorter than the real card,
  // cutting across the text instead of tracing its actual border.
  // clientWidth/clientHeight are the padding box by spec, which is exactly
  // what inset-0 fills.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (withMessage.length === 0) return null;
  const testimonial = withMessage[index % withMessage.length];

  return (
    <aside className="absolute left-full top-0 ml-12 hidden w-64 2xl:block">
      <div ref={cardRef} className="relative rounded-2xl border border-amber-faint bg-card px-5 py-4">
        <span
          aria-hidden="true"
          className="absolute -left-[9px] top-7 h-4 w-4 rotate-45 border-b border-l border-amber-faint bg-card"
        />

        {withMessage.length > 1 && size && !reduceMotion && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <motion.path
              key={testimonial._id}
              d={ringPath(size.width, size.height)}
              fill="none"
              className="stroke-spotlight/50"
              strokeWidth={1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
            />
          </svg>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial._id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm leading-relaxed text-stone/85">
              &ldquo;{truncateText(testimonial.message, MESSAGE_MAX_LENGTH)}&rdquo;
            </p>
            <p className="mt-2 font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">
              — {testimonial.name}
            </p>
            <Link
              href={`/blog/${testimonial.postSlug}#comments`}
              className="mt-3 inline-flex items-center gap-1 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-spotlight transition-colors hover:text-spotlight/80"
            >
              Join the conversation →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
