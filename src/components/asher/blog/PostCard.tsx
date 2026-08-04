import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { PostSummary } from "@/sanity/lib/queries";
import { truncateText } from "@/lib/text";
import { estimateReadingTimeFromText } from "@/lib/portableText";
import { CommentCountBadge } from "@/components/asher/blog/CommentCountBadge";

// Matches the excerpt field's own 160-character guidance in Studio, so
// a manually-written excerpt basically never needs trimming here -- this
// mainly kicks in for the auto-generated fallback pulled from post body.
const CARD_BLURB_LENGTH = 160;

export function PostCard({ post, priority = false }: { post: PostSummary; priority?: boolean }) {
  const blurbSource = post.excerpt || post.autoExcerpt;
  const blurb = blurbSource ? truncateText(blurbSource, CARD_BLURB_LENGTH) : undefined;
  const readingTime = post.bodyPlainText ? estimateReadingTimeFromText(post.bodyPlainText) : undefined;

  return (
    <article className="border-b border-amber-faint pb-12 last:border-none">
      {post.mainImage && (
        <Link href={`/blog/${post.slug}`} className="block mb-5">
          <Image
            src={urlFor(post.mainImage).width(1200).height(630).fit("crop").crop("focalpoint").format("jpg").quality(75).url()}
            alt={post.mainImageAlt ?? post.mainImage.alt ?? post.title}
            width={1200}
            height={630}
            // Only the first card on a page loads immediately (it's the one
            // visible without scrolling) -- every other card's image loads
            // lazily as the visitor scrolls down to it.
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
        </Link>
      )}

      <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
        <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-spotlight">
          {post.title}
        </Link>
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
        {post.publishedAt && (
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        {post.publishedAt && readingTime && <span aria-hidden="true">·</span>}
        {readingTime && <span>{readingTime} min read</span>}
        {post.categories?.map((category) => (
          <Link
            key={category.slug}
            href={`/blog/category/${category.slug}`}
            className="rounded-full border border-amber-faint px-2.5 py-1 transition-colors hover:border-spotlight/50 hover:text-spotlight"
          >
            {category.title}
          </Link>
        ))}
        <CommentCountBadge slug={post.slug} count={post.commentCount} />
      </div>

      {blurb && <p className="mt-4 leading-relaxed text-stone/85">{blurb}</p>}

      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 inline-flex items-center gap-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-all hover:gap-2.5"
      >
        Read more <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
