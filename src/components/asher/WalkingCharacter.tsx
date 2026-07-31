"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// The little character that tracks progress along a bottom bar -- shared
// between the homepage's ProgressionBar and the blog's reading progress bar
// so the two stay visually identical instead of drifting apart as separate
// copies. Was a generic drawn stick figure; now Asher's own 8-bit pixel-art
// avatar (cropped tighter to the head, per his request), riding along as a
// small bouncing medallion rather than a walking sprite -- there's no body
// to animate a walk cycle with, just the bob, which was already doing most
// of the "alive" feeling before.
export function WalkingCharacter({ progress }: { progress: number }) {
  const leftPct = 2 + progress * 96;
  const [facingLeft, setFacingLeft] = useState(false);
  const lastY = useRef(0);

  // Faces the direction of travel: right while scrolling down (the normal
  // "reading forward" direction, and the default), left when scrolling back
  // up. Tracked here (not by the parent bars) so both get this for free.
  // Small deltas are ignored so it doesn't flicker back and forth from
  // sub-pixel jitter around a near-stationary scroll position.
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 2) {
        setFacingLeft(delta < 0);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${leftPct}%` }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        animate={{ scaleX: facingLeft ? -1 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden rounded-full border-2 border-spotlight shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
        style={{ width: 26, height: 26 }}
      >
        <Image
          src="/asher/avatar-8bit.png"
          alt=""
          width={26}
          height={26}
          className="h-full w-full object-cover"
          style={{ imageRendering: "pixelated" }}
          priority
        />
      </motion.div>
    </motion.div>
  );
}
