"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { urlFor } from "@/sanity/lib/image";
import type { PostSummary } from "@/sanity/lib/queries";
import { truncateText } from "@/lib/text";
import { formatPostDateRelative } from "@/lib/formatDate";
import { portableTextToPlainText, estimateReadingTimeFromText, hasVideoEmbed } from "@/lib/portableText";
import { CommentCountBadge } from "@/components/asher/blog/CommentCountBadge";
import { VideoTag } from "@/components/asher/blog/VideoTag";

// Matches the excerpt field's own 160-character guidance in Studio, so
// a manually-written excerpt basically never needs trimming here -- this
// mainly kicks in for the auto-generated fallback pulled from post body.
const CARD_BLURB_LENGTH = 160;

// Hand-drawn wobble outline around the text block only (title through
// blurb) -- open along the top, so it starts flush at the image's bottom
// edge instead of wrapping the photo too.
//
// Built as 3 independent strips (bottom, left, right), not one box path
// stretched to fill the block -- a single path stretched non-uniformly via
// preserveAspectRatio="none" reads fine on a roughly-square 3-column tile,
// but on the category page's much wider, shorter single-column tile the
// same vertical wobble gets squashed almost flat and the horizontal one
// gets stretched thin, so the bottom edge reads as a straight line. Each
// strip instead pins its short axis to a fixed pixel size that matches its
// own viewBox exactly (so that axis never stretches) and only scales along
// its long axis -- the same trick SketchyDivider.tsx already uses (its
// viewBox height 8 = rendered h-2). A few fixed path variants (never
// Math.random(), which would mismatch between server and client render and
// break hydration), cycled by card index. The right strip reuses the left
// strip's path mirrored via CSS instead of a separate hand-authored path.
const EDGE_STROKE = 1.6;

const BOTTOM_PATHS = [
  "M2,7 C60,3 120,10 180,5 C220,9 260,3 298,7",
  "M2,5 C55,9 115,2 175,8 C215,4 265,9 298,5",
  "M2,8 C58,4 118,9 178,4 C222,8 262,4 298,8",
];

const SIDE_PATHS = [
  "M7,2 C3,60 11,140 6,220 C10,260 3,290 7,298",
  "M5,2 C10,60 3,140 9,220 C4,260 10,290 5,298",
  "M8,2 C4,60 10,140 5,220 C9,260 4,290 8,298",
];

function RoughFrame({ variant }: { variant: number }) {
  const i = variant % BOTTOM_PATHS.length;
  return (
    <>
      <svg
        viewBox="0 0 300 10"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2.5 w-full text-amber-faint-stroke"
      >
        <path d={BOTTOM_PATHS[i]} fill="none" stroke="currentColor" strokeWidth={EDGE_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg
        viewBox="0 0 14 300"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 h-full w-3.5 text-amber-faint-stroke"
      >
        <path d={SIDE_PATHS[i]} fill="none" stroke="currentColor" strokeWidth={EDGE_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg
        viewBox="0 0 14 300"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-3.5 scale-x-[-1] text-amber-faint-stroke"
      >
        <path d={SIDE_PATHS[i]} fill="none" stroke="currentColor" strokeWidth={EDGE_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
}

export function PostCard({
  post,
  priority = false,
  index = 0,
}: {
  post: PostSummary;
  priority?: boolean;
  // Picks which hand-drawn frame variant this card gets -- pass the card's
  // position in its list so neighbouring cards don't all wobble identically.
  index?: number;
}) {
  // Both derived from the same plain-text pass over post.bodyBlocks, so a
  // Quote-Grid-heavy post's blurb and reading time stay consistent with
  // each other and with the post page's own count (see bodyBlocks' comment
  // in queries.ts for why this isn't GROQ's pt::text() instead).
  const bodyPlainText = post.bodyBlocks ? portableTextToPlainText(post.bodyBlocks) : "";
  const blurbSource = post.excerpt || bodyPlainText;
  const blurb = blurbSource ? truncateText(blurbSource, CARD_BLURB_LENGTH) : undefined;
  const readingTime = bodyPlainText ? estimateReadingTimeFromText(bodyPlainText) : undefined;
  const hasVideo = post.bodyBlocks ? hasVideoEmbed(post.bodyBlocks) : false;
  const postUrl = `/blog/${post.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col"
    >
      {/* Stretched link -- makes the whole tile clickable without nesting
          an <a> inside another <a>. It's a sibling of the comment badge
          below, not an ancestor, so that badge can still carry its own,
          different href (straight to #comments) and resolve clicks on
          top of this one via z-index. Explicit z-20 (not the default
          z-index:auto) -- the image and text-block wrappers below are also
          `relative` (needed for the fill image and the frame svg), and as
          later, equally-positioned siblings they'd otherwise win every
          click over this link regardless of DOM order. */}
      <Link href={postUrl} aria-label={post.title} className="absolute inset-0 z-20" />

      {post.mainImage && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-sm">
          {hasVideo && <VideoTag />}
          <Image
            src={urlFor(post.mainImage).width(800).height(500).fit("crop").crop("focalpoint").format("jpg").quality(75).url()}
            alt={post.mainImageAlt ?? post.mainImage.alt ?? post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            // Only the first card on a page loads immediately (it's the one
            // visible without scrolling) -- every other card's image loads
            // lazily as the visitor scrolls down to it.
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Frame wraps only this block -- its top edge sits flush with the
          image's bottom edge instead of enclosing the photo too. */}
      <div className="relative flex flex-1 flex-col p-5">
        <RoughFrame variant={index} />

        <h2 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ivory transition-colors group-hover:text-spotlight lg:text-[26px]">
          {post.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-stage text-xs uppercase tracking-[0.16em] text-stone/70">
          {post.publishedAt && (
            <time dateTime={post.publishedAt} suppressHydrationWarning>
              {formatPostDateRelative(post.publishedAt)}
            </time>
          )}
          {post.publishedAt && readingTime && <span aria-hidden="true">·</span>}
          {readingTime && <span>{readingTime} min read</span>}
          {hasVideo && !post.mainImage && <VideoTag variant="inline" />}
          {/* Above the stretched link's z-20, not the whole row -- only the
              comment icon itself should win against it; date/read-time
              stay part of the clickable tile. */}
          <span className="relative z-30">
            <CommentCountBadge slug={post.slug} count={post.commentCount} />
          </span>
        </div>

        {blurb && <p className="mt-3 flex-1 text-[15px] leading-relaxed text-stone/85">{blurb}</p>}
      </div>
    </motion.article>
  );
}
