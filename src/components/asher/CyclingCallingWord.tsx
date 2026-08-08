"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The same four roles named in both Story mode's TwoCallings.tsx and Play
// mode's equivalent section ("Actor, coach, marketer, storyteller"), shown
// one at a time instead of as a static list -- inspired by a cycling-word
// hero effect Asher found on 21st.dev, adapted to this site's actual
// visual language rather than copied wholesale (the reference used
// shadcn's Button and generic Tailwind, neither of which exist here).
// Shared between both modes rather than duplicated, the same lesson as
// the PRINCIPLES/PERSONALITY drift fixed earlier -- one component, one
// word list, can't quietly diverge between Story and Play.
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
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return; // stays on the first word, no motion at all
    const id = setTimeout(() => {
      setIndex((prev) => (prev + 1) % CALLING_WORDS.length);
    }, CALLING_WORD_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, reduceMotion]);

  // "a Storyteller" (13 chars incl. article) is meaningfully wider than
  // bare "Storyteller" -- reserving more room when an article is shown
  // keeps whatever follows this span from shifting as the word cycles.
  const minWidthClass = withArticle ? "min-w-[13ch]" : "min-w-[8ch]";

  // Matches the surrounding text's natural line height as closely as
  // possible -- an earlier version reserved 1.3em "for descenders," but
  // that made the box meaningfully taller than one line of text, and since
  // each word renders flush to the box's top while align-bottom anchors
  // the box's BOTTOM to the surrounding line, the extra height pushed the
  // visible word noticeably out of vertical alignment with static text
  // beside it (e.g. "Asher is" sitting higher than the cycling word).
  return (
    <span className={`relative inline-block h-[1em] ${minWidthClass} align-bottom overflow-hidden`}>
      {CALLING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className={`absolute inset-x-0 left-0 ${wordClassName}`}
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
          {withArticle ? `${articleFor(word)} ${word}` : word}
        </motion.span>
      ))}
    </span>
  );
}
