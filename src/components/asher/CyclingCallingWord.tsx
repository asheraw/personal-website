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

export function CyclingCallingWord() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return; // stays on the first word, no motion at all
    const id = setTimeout(() => {
      setIndex((prev) => (prev + 1) % CALLING_WORDS.length);
    }, CALLING_WORD_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, reduceMotion]);

  return (
    <span className="relative inline-block h-[1.3em] min-w-[8ch] align-bottom overflow-hidden">
      {CALLING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className="absolute inset-x-0 left-0 font-medium text-spotlight-gradient"
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
          {word}
        </motion.span>
      ))}
    </span>
  );
}
