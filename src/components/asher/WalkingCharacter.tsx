"use client";

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
  return (
    <motion.div
      className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${leftPct}%` }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
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
      </div>
    </motion.div>
  );
}
