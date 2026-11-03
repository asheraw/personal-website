"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Hover-triggered hand-drawn underline -- same "line draws itself on hover"
// idea as the reference GSAP DrawSVG effect Asher pointed at, rebuilt with
// framer-motion's pathLength instead of adding a new animation library plus
// a paid GreenSock club plugin (DrawSVGPlugin isn't in free gsap) for one
// headline. Framer-motion is already the site's animation library, and
// pathLength is already used the same way for the comment bubble's progress
// ring in CommentSocialProof.tsx. Colour swapped from the reference's red
// to the site's own spotlight accent, per Asher's ask.
//
// The line also draws itself once, shortly after the page loads, and then
// stays: hover alone meant most visitors (and every phone) never saw it.
// Hovering afterwards just redraws it with a different wobble. Since nothing
// depends on :hover staying or leaving any more, a stuck touch-hover is
// harmless, so it shows on mobile too.
//
// -bottom-1 keeps the line tight under the text -- the headline's own
// tagline sits mt-4 (16px) below it, so there's real clearance before the
// line could ever run into it.
const WOBBLE_PATHS = [
  "M4,10 C60,4 140,14 220,7 C280,2 340,11 396,6",
  "M4,7 C70,13 130,3 200,10 C270,15 330,4 396,9",
  "M4,9 C80,3 150,12 230,5 C290,11 350,3 396,8",
];

export function HoverDrawHeadline({ text, className }: { text: string; className: string }) {
  const [drawn, setDrawn] = useState(false);
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <h1
      className={`relative inline-block ${className}`}
      onMouseEnter={() => {
        setVariant(Math.floor(Math.random() * WOBBLE_PATHS.length));
        setDrawn(true);
      }}
    >
      {text}
      <svg
        viewBox="0 0 400 16"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 left-0 h-3 w-full text-spotlight"
      >
        <AnimatePresence>
          {drawn && (
            <motion.path
              key={variant}
              d={WOBBLE_PATHS[variant]}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] } }}
              exit={{ pathLength: 0, transition: { duration: 0.3, ease: "easeIn" } }}
            />
          )}
        </AnimatePresence>
      </svg>
    </h1>
  );
}
