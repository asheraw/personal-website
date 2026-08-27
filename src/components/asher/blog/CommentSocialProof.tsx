"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { truncateText } from "@/lib/text";
import { track } from "@/lib/analytics";

export type CommentStats = { totalComments: number; authorReplies: number };
export type Testimonial = { _id: string; name: string; message: string | null; createdAt: string; postTitle: string; postSlug: string };

const MESSAGE_MAX_LENGTH = 160;
// Tighter than the desktop bubble's 160 -- this card sits in normal
// document flow on mobile (unlike the bubble, which floats free via
// `position: absolute`), so its own box height has to stay genuinely fixed
// across every rotation, not just capped. A short enough message reliably
// fits 2 lines at a phone's usable text width; combined with the
// `min-h-[7.5rem]` on the card below, a shorter message just leaves a
// little empty space rather than the box ever growing or shrinking.
const MOBILE_MESSAGE_MAX_LENGTH = 80;
const ROTATE_MS = 7000;
const CARD_RADIUS = 16;
// A tail is a 16px square (`h-4 w-4`) rotated 45deg, which turns it into a
// diamond whose point sits this far out from its own center along either
// axis -- (half the square's side) * sqrt(2). Tracing a ring straight
// across the box edge at the tail's center cuts right through this
// diamond's widest cross-section, which is exactly the "cuts through the
// tail" look reported from a live screenshot -- see ringPath/ringPathTop
// below, which detour the ring out around the tail's actual V-shaped
// outline (its two visible border edges) instead of through its middle.
const TAIL_DIAGONAL = 8 * Math.SQRT2;
// The desktop tail's own span is `-left-[9px] h-4 w-4`, so its center sits
// 1px inside the box edge (-9 + 8), not exactly on it.
const DESKTOP_TAIL_REACH = 1 + TAIL_DIAGONAL;
// The mobile tail's own span is `-top-2 h-4 w-4` (-8px + 8 = 0), so its
// center sits exactly on the box edge -- no extra offset needed.
const MOBILE_TAIL_REACH = TAIL_DIAGONAL;
// Matches the mobile tail's own `left-6` position (24px) plus half its own
// width (8px), so the ring's notch lines up with the tail.
const MOBILE_TAIL_ANCHOR_X = 32;

// Full rounded-rect perimeter as one path, detouring out around the tail
// instead of cutting straight across it. Used by the desktop bubble, whose
// tail attaches partway down the left edge -- `anchorY` is the tail's own
// vertical center, `reach` how far its point sits outside the box. The
// path starts and ends at that point, so the ring visibly grows out of the
// tail and sweeps back to it.
function ringPath(width: number, height: number, anchorY: number, reach: number): string {
  const r = CARD_RADIUS;
  const half = TAIL_DIAGONAL;
  return [
    `M ${-reach},${anchorY}`,
    `L 0,${anchorY - half}`,
    `L 0,${r}`,
    `A ${r},${r} 0 0 1 ${r},0`,
    `L ${width - r},0`,
    `A ${r},${r} 0 0 1 ${width},${r}`,
    `L ${width},${height - r}`,
    `A ${r},${r} 0 0 1 ${width - r},${height}`,
    `L ${r},${height}`,
    `A ${r},${r} 0 0 1 0,${height - r}`,
    `L 0,${anchorY + half}`,
    `L ${-reach},${anchorY}`,
  ].join(" ");
}

// Same idea, but detouring out around a tail on the top edge instead --
// used by the mobile card, whose tail points up at the comment-count pill
// sitting directly above it rather than out to the side. `anchorX` is the
// tail's own horizontal center, `reach` how far its point sits above the
// box.
function ringPathTop(width: number, height: number, anchorX: number, reach: number): string {
  const r = CARD_RADIUS;
  const half = TAIL_DIAGONAL;
  return [
    `M ${anchorX},${-reach}`,
    `L ${anchorX + half},0`,
    `L ${width - r},0`,
    `A ${r},${r} 0 0 1 ${width},${r}`,
    `L ${width},${height - r}`,
    `A ${r},${r} 0 0 1 ${width - r},${height}`,
    `L ${r},${height}`,
    `A ${r},${r} 0 0 1 0,${height - r}`,
    `L 0,${r}`,
    `A ${r},${r} 0 0 1 ${r},0`,
    `L ${anchorX - half},0`,
    `L ${anchorX},${-reach}`,
  ].join(" ");
}

// Shared by the desktop bubble and the mobile card below -- both rotate
// through the same featured-testimonial pool on the same timer and need
// the same live-measured size for their progress ring (see the
// clientWidth/clientHeight comment further down for why it's measured this
// specific way). What differs between them is presentation only: the
// bubble is a narrow, tailed, absolutely-positioned aside; the card is a
// full-width, tail-less block sitting in normal document flow.
function useRotatingTestimonial(testimonials: Testimonial[]) {
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
  // -- the ring path is only ever as accurate as this measurement. Reads
  // clientWidth/clientHeight directly rather than trusting the observer
  // entry's own contentRect -- contentRect excludes padding, but the
  // ring's <svg> spans inset-0 (the padding box, i.e. content + padding),
  // so using contentRect drew a ring consistently narrower/shorter than
  // the real card, cutting across the text instead of tracing its actual
  // border. clientWidth/clientHeight are the padding box by spec, which is
  // exactly what inset-0 fills.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const testimonial = withMessage.length > 0 ? withMessage[index % withMessage.length] : null;
  return { testimonial, rotates: withMessage.length > 1, cardRef, size, reduceMotion };
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
        // Hidden below sm -- this pill is a rounded-full shape, built for
        // one line; wrapping the reply-count clause onto a second line
        // inside it looks broken rather than intentional, so on a narrow
        // phone it's dropped instead, keeping the pill a clean single line.
        <span className="hidden sm:inline">
          {" "}
          · <span className="text-spotlight">{stats.authorReplies.toLocaleString()}</span> replies by Asher
        </span>
      )}
    </p>
  );
}

// The mobile equivalent of the speech bubble below -- shown directly under
// the comment-count pill (rather than beside it, since there's no open
// margin on a phone), with its own tail pointing straight up at that pill
// so the two visibly belong together, same idea as the desktop bubble's
// sideways tail. Rotates and shows the same progress ring as the desktop
// bubble -- Asher's own call, after an earlier static-per-load version gave
// up the rotation entirely to dodge a real concern (a taller/shorter
// testimonial reflowing the page under it every 7s, since this card sits in
// normal document flow, unlike the bubble). Fixed instead: a tighter
// message cap (MOBILE_MESSAGE_MAX_LENGTH) that reliably fits 2 lines, plus
// a fixed `min-h-[7.5rem]` on the message area -- the box's own footprint
// stays constant across every rotation regardless of which testimonial is
// showing; a shorter message just leaves a little empty space rather than
// the card ever changing size.
export function MobileTestimonialCard({ testimonials }: { testimonials: Testimonial[] }) {
  const { testimonial, rotates, cardRef, size, reduceMotion } = useRotatingTestimonial(testimonials);
  if (!testimonial) return null;

  return (
    <div className="relative mt-6 2xl:hidden">
      <span
        aria-hidden="true"
        className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-amber-faint bg-card"
      />
      <div ref={cardRef} className="relative rounded-2xl border border-amber-faint bg-card px-5 py-4">
        {rotates && size && !reduceMotion && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <motion.path
              key={testimonial._id}
              d={ringPathTop(size.width, size.height, MOBILE_TAIL_ANCHOR_X, MOBILE_TAIL_REACH)}
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
            <p className="min-h-[3.5rem] text-sm leading-relaxed text-stone/85">
              &ldquo;{truncateText(testimonial.message, MOBILE_MESSAGE_MAX_LENGTH)}&rdquo;
            </p>
            <p className="mt-2 font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">
              — {testimonial.name}
            </p>
            <Link
              href={`/blog/${testimonial.postSlug}#comments`}
              onClick={() => track({ action: "testimonial_join_conversation", category: "engagement", label: "mobile_card" })}
              className="mt-3 inline-flex items-center gap-1 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-spotlight transition-colors hover:text-spotlight/80"
            >
              Join the conversation →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
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
  const { testimonial, rotates, cardRef, size, reduceMotion } = useRotatingTestimonial(testimonials);
  // The tail sits at the bubble's own vertical center (see the tail span's
  // `top-1/2` below) rather than a fixed offset, so it stays lined up with
  // the ring regardless of how tall the current testimonial's text makes
  // the bubble. `size` isn't measured yet on the very first render; the
  // ring itself is gated on `size` below, so this fallback is never drawn.
  const tailAnchorY = size ? size.height / 2 : 0;
  if (!testimonial) return null;

  return (
    <aside className="absolute left-full top-1/2 ml-8 hidden w-64 -translate-y-1/2 2xl:block">
      <div ref={cardRef} className="relative rounded-2xl border border-amber-faint bg-card px-5 py-4">
        <span
          aria-hidden="true"
          className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-amber-faint bg-card"
        />

        {rotates && size && !reduceMotion && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <motion.path
              key={testimonial._id}
              d={ringPath(size.width, size.height, tailAnchorY, DESKTOP_TAIL_REACH)}
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
              onClick={() => track({ action: "testimonial_join_conversation", category: "engagement", label: "desktop_bubble" })}
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
