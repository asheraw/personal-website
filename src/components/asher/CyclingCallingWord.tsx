"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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

// Purely presentational: only the ACTIVE word is ever in the document at
// once (AnimatePresence handles the outgoing one exiting), which is what
// makes this correct rather than the two earlier approaches:
//
// v1 (position:absolute + a guessed min-w-[Nch]) left a visible gap before
// whatever followed the slot on the same line, since the box was sized to
// the WIDEST possible word, not whichever word was actually showing.
//
// v2 (CSS Grid stacking all 4 words in one cell) fixed the width guess by
// measuring real content, but stacking all 4 words simultaneously meant
// the grid cell's height came from whichever word rendered tallest under
// `overflow-hidden` -- and since every word inherited the surrounding
// heading's own (sometimes quite tight, e.g. leading-[0.98]) line-height,
// a descender like the "y" in "Storyteller" or the "g" in "telling" could
// get visibly clipped by that same overflow-hidden boundary that was
// needed to hide the sliding neighbors.
//
// This version renders exactly one word at a time, in completely normal
// inline flow -- no overflow-hidden, no manual height/width reservation.
// It behaves exactly like any other word in the sentence (same line-height,
// same baseline, glyphs never clipped) because, at rest, it IS just plain
// text. `layout` on the wrapper smoothly animates the width change as
// shorter/longer words swap in; `AnimatePresence mode="popLayout"` lets the
// outgoing word slide/fade away without holding up the incoming word's
// layout. Inspired by a cycling-word hero effect Asher found on 21st.dev,
// adapted to this site's actual visual language rather than copied
// wholesale. Takes `index` as a prop rather than owning its own timer, so
// multiple slots (ThreePillars.tsx's story/voice + telling/hearing pair)
// can be driven by the SAME index and stay in sync.
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
  const word = words[index];
  const rendered = transform ? transform(word) : word;
  return (
    <motion.span layout="size" className="relative inline-block">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          className={`inline-block ${wordClassName}`}
          initial={reduceMotion ? false : {y: "0.4em", opacity: 0}}
          animate={{y: "0em", opacity: 1}}
          exit={reduceMotion ? {opacity: 0} : {y: "-0.4em", opacity: 0}}
          transition={reduceMotion ? {duration: 0} : {type: "spring", stiffness: 300, damping: 28}}
        >
          {rendered}
        </motion.span>
      </AnimatePresence>
    </motion.span>
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
