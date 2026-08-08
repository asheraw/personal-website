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
// makes the WIDTH correct -- the box sizes to whichever word is actually
// showing, not the widest of every possible word, so nothing that follows
// the slot on the same line (e.g. a trailing period) ever sits with an
// odd gap in front of it.
//
// Two earlier versions got this far but not further: v1 (position:absolute
// + a guessed min-w-[Nch]) had exactly that gap problem. v2 (CSS Grid
// stacking all 4 words in one cell) fixed the width, but stacking every
// word simultaneously under `overflow-hidden` meant the box's height came
// from whichever word rendered tallest under the surrounding heading's own
// (sometimes tight, e.g. leading-[0.98]) line-height -- clipping a
// descender like the "y" in "Storyteller" against that same boundary.
//
// This version still masks the slide with `overflow-hidden` (needed for
// the scrolling-reel look, not a plain cross-fade), but gives the box
// `pb-[0.28em]` genuine extra room below the text for descenders, then
// cancels that same amount with `-mb-[0.28em]` so the box's OUTER edge --
// what the surrounding line actually aligns against -- lands exactly where
// it would with no padding at all. The descender gets real, unclipped
// room; the alignment with sibling text (e.g. "Asher is") is unaffected.
// `layout="size"` on the wrapper animates the width smoothly as shorter/
// longer words swap in. Inspired by a cycling-word hero effect Asher found
// on 21st.dev, adapted to this site's actual visual language rather than
// copied wholesale. Takes `index` as a prop rather than owning its own
// timer, so multiple slots (ThreePillars.tsx's story/voice +
// telling/hearing pair) can be driven by the SAME index and stay in sync.
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
    <motion.span
      layout="size"
      className="relative inline-block align-bottom overflow-hidden pb-[0.28em] -mb-[0.28em]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          className={`inline-block ${wordClassName}`}
          initial={reduceMotion ? false : {y: "100%", opacity: 0}}
          animate={{y: "0%", opacity: 1}}
          exit={reduceMotion ? {opacity: 0} : {y: "-100%", opacity: 0}}
          transition={reduceMotion ? {duration: 0} : {type: "spring", stiffness: 200, damping: 24}}
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
