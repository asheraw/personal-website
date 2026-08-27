"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { urlFor } from "@/sanity/lib/image";
import type { PostSummary } from "@/sanity/lib/queries";
import { truncateText } from "@/lib/text";
import { formatPostDate } from "@/lib/formatDate";
import { portableTextToPlainText, estimateReadingTimeFromText } from "@/lib/portableText";

const BLURB_LENGTH = 200;

// Set from Studio -> Site Settings -> Featured post (siteSettingsType.ts).
// A deliberate, editorially-chosen first thing a visitor sees at the top
// of /blog, rather than always whatever's chronologically newest -- the
// regular PostCard feed already covers "newest first" on its own.
// Visually distinct from every other card in the feed (bigger image, a
// bordered/tinted card treatment, an eyebrow label) specifically so it
// reads as a deliberate pick, not just the top of a list.
export function FeaturedPostCard({ post }: { post: PostSummary }) {
  const bodyPlainText = post.bodyBlocks ? portableTextToPlainText(post.bodyBlocks) : "";
  const blurbSource = post.excerpt || bodyPlainText;
  const blurb = blurbSource ? truncateText(blurbSource, BLURB_LENGTH) : undefined;
  const readingTime = bodyPlainText ? estimateReadingTimeFromText(bodyPlainText) : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-amber-faint bg-card/40"
    >
      <p className="px-6 pt-6 font-mono-stage text-[10px] uppercase tracking-[0.24em] text-spotlight sm:px-8 sm:pt-8">
        Featured
      </p>

      {post.mainImage && (
        <Link href={`/blog/${post.slug}`} className="mt-4 block">
          <Image
            src={urlFor(post.mainImage).width(1600).height(900).fit("crop").crop("focalpoint").format("jpg").quality(78).url()}
            alt={post.mainImageAlt ?? post.mainImage.alt ?? post.title}
            width={1600}
            height={900}
            priority
            className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.015]"
          />
        </Link>
      )}

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ivory sm:text-4xl">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-spotlight">
            {post.title}
          </Link>
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          )}
          {post.publishedAt && readingTime && <span aria-hidden="true">·</span>}
          {readingTime && <span>{readingTime} min read</span>}
        </div>

        {blurb && <p className="mt-4 max-w-2xl leading-relaxed text-stone/85">{blurb}</p>}

        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-all hover:gap-2.5"
        >
          Read more <span aria-hidden="true">→</span>
        </Link>
      </div>
    </motion.article>
  );
}
