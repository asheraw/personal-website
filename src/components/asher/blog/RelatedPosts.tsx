import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { RelatedPost } from "@/sanity/lib/queries";
import { truncateText } from "@/lib/text";

const BLURB_LENGTH = 110;

// Shown when the current post shares at least one category or tag with
// something else on the site (see RELATED_POSTS_QUERY) -- a post with no
// categories or tags has nothing to relate on, and the caller just skips
// rendering this section entirely rather than falling back to "recent
// posts," which would stop meaning "related."
export function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-14 border-t border-amber-faint pt-10 print:hidden">
      <h2 className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
        Related Reading
      </h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        {posts.map((post) => {
          const blurbSource = post.excerpt || post.autoExcerpt;
          const blurb = blurbSource ? truncateText(blurbSource, BLURB_LENGTH) : undefined;
          return (
            <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
              {post.mainImage && (
                <div className="mb-3 overflow-hidden rounded-lg">
                  <Image
                    src={urlFor(post.mainImage).width(500).height(300).fit("crop").crop("focalpoint").format("jpg").quality(75).url()}
                    alt={post.mainImage.alt ?? post.title}
                    width={500}
                    height={300}
                    loading="lazy"
                    className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <h3 className="font-display text-base font-semibold leading-snug text-ivory transition-colors group-hover:text-spotlight">
                {post.title}
              </h3>
              {blurb && <p className="mt-1.5 text-sm leading-relaxed text-stone/75">{blurb}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
