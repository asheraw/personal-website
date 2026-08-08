"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Advances an index through `length` values on a timer, freezing at 0 with
// zero motion when the visitor prefers reduced motion. Shared by every
// cycling-word usage on the site (CyclingCallingWord below, and the
// synced story/voice pair in ThreePillars.tsx) so there's exactly one
// place that owns "advance on a timer, respect reduced motion" -- not one
// copy per usage that could quietly diverge.
export function useCyclingIndex(length: number, intervalMs: number): {index: number; reduceMotion: boolean} {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return; // stays on the first value, no motion at all
    const id = setTimeout(() => {
      setIndex((prev) => (prev + 1) % length);
    }, intervalMs);
    return () => clearTimeout(id);
  }, [index, reduceMotion, length, intervalMs]);

  return {index, reduceMotion: !!reduceMotion};
}

// Purely presentational: every word occupies the SAME CSS grid cell
// (`grid-area: slot` on each), which makes the container auto-size to
// whichever word is actually widest/tallest -- real rendered glyph
// metrics, not a guessed `Nch`/`Nem` value. An earlier version reserved
// width via `min-w-[Nch]` and height via `h-[1.3em]`, both hand-guessed:
// the width guess left a visible empty gap next to a shorter word when
// something followed the slot on the same line (e.g. "voice⟨gap⟩worth"),
// and the height guess (over-generous "room for descenders") pushed the
// visible word out of baseline alignment with static text beside it,
// since align-bottom anchors the box's bottom edge to the line. Grid
// stacking sidesteps both failure modes at once, sized correctly for any
// font or word list without hand-tuning. Only the ACTIVE word's opacity/
// position actually animates; every span still renders (so the grid can
// measure all of them), with `transform: translateY` (paint-time, not
// layout) sliding the inactive ones out of the clipped, overflow-hidden
// box. Inspired by a cycling-word hero effect Asher found on 21st.dev,
// adapted to this site's actual visual language rather than copied
// wholesale (the reference used shadcn's Button and generic Tailwind,
// neither of which exist here). Takes `index` as a prop rather than
// owning its own timer, so multiple slots (see ThreePillars.tsx's
// story/voice + telling/hearing pair) can be driven by the SAME index and
// stay in sync -- two independently-timed slots would drift almost
// immediately.
export function CyclingWordSlot({
  words,
  index,
  reduceMotion,
  wordClassName = "font-medium text-spotlight-gradient",
  transform,
}: {
  words: string[];
  index: number;
  reduceMotion: boolean;
  /** Styles the animated word to match its surrounding text (headline vs. body copy). */
  wordClassName?: string;
  /** Transforms each word before rendering, e.g. prefixing "a"/"an". */
  transform?: (word: string) => string;
}) {
  return (
    <span className="relative inline-grid align-bottom overflow-hidden" style={{gridTemplateAreas: '"slot"'}}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className={wordClassName}
          style={{gridArea: "slot"}}
          initial={false}
          animate={
            reduceMotion
              ? { y: "0%", opacity: index === i ? 1 : 0 }
              : index === i
                ? { y: "0%", opacity: 1 }
                : { y: index > i ? "-100%" : "100%", opacity: 0 }
          }
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 14 }}
        >
          {transform ? transform(word) : word}
        </motion.span>
      ))}
    </span>
  );
}

// The same four roles named in both Story mode's TwoCallings.tsx and Play
// mode's equivalent section ("Actor, coach, marketer, storyteller"), shown
// one at a time instead of as a static list. Shared between both modes
// rather than duplicated, the same lesson as the PRINCIPLES/PERSONALITY
// drift fixed earlier -- one component, one word list, can't quietly
// diverge between Story and Play.
export const CALLING_WORDS = ["Actor", "Coach", "Marketer", "Storyteller"];
const CALLING_WORD_INTERVAL_MS = 1800;

// Only "Actor" needs "an" out of the current word list, but computed
// rather than hardcoded so a future word list edit can't silently leave
// the wrong article in place.
function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function CyclingCallingWord({
  withArticle = false,
  wordClassName = "font-medium text-spotlight-gradient",
}: {
  /** Prefixes each word with "a"/"an" as one animated unit -- used for "Asher is a/an Actor" headline-style copy. */
  withArticle?: boolean;
  /** Overrides the animated word's own classes -- callers style it to match their own surrounding text (headline vs. body copy). */
  wordClassName?: string;
} = {}) {
  const {index, reduceMotion} = useCyclingIndex(CALLING_WORDS.length, CALLING_WORD_INTERVAL_MS);

  return (
    <CyclingWordSlot
      words={CALLING_WORDS}
      index={index}
      reduceMotion={reduceMotion}
      wordClassName={wordClassName}
      transform={withArticle ? (word) => `${articleFor(word)} ${word}` : undefined}
    />
  );
}
