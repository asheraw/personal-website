import Link from "next/link";
import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import {
  PAGINATED_POSTS_QUERY,
  POSTS_COUNT_QUERY,
  SEARCH_INDEX_QUERY,
  FEATURED_POST_QUERY,
  BLOG_CATEGORIES_WITH_POSTS_QUERY,
  type PostSummary,
} from "@/sanity/lib/queries";
import { BlogPostList } from "@/components/asher/blog/BlogPostList";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { BlogSearch, type SearchablePost } from "@/components/asher/blog/BlogSearch";
import { FeaturedPostCard } from "@/components/asher/blog/FeaturedPostCard";
import { buildBreadcrumbSchema } from "@/lib/structuredData";

const SITE_URL = "https://asheraw.com";
// Matches BlogPostList's own PAGE_SIZE -- kept as a separate constant here
// (rather than importing a client component's internals into a server
// component) since it's only used once, for the very first page.
const FIRST_PAGE_SIZE = 8;
// Fallbacks only -- used if Site Settings (Studio) has no value set yet,
// e.g. a fresh dataset. The real, editable source is the same siteSettings
// singleton generateMetadata() in the root (site) layout already reads.
const FALLBACK_BLOG_HEADING = "Dig The Mind of Asher";
const FALLBACK_BLOG_TAGLINE =
  "Welcome to my blog, I'm currently going through a revamp so there's many things that are still a Work-In-Progress.";

// Re-check Sanity for new or edited posts at most once per minute,
// instead of only ever showing what existed at the last deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Essays, stories, and lessons from Asher Aw — actor, coach, and storyteller.",
  // Metadata objects don't deep-merge across nested layouts -- defining
  // `alternates` here without `types` would otherwise silently drop the
  // root layout's rss+xml discovery link on this specific page.
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "https://asheraw.com/rss.xml" },
  },
};

export default async function BlogPage() {
  // Only the first page of full summaries (image, comment count, etc.) is
  // fetched here -- BlogPostList fetches the rest itself, on demand, as
  // the reader scrolls or clicks "Load more". The search index is a
  // separate, deliberately unpaginated, much lighter query (see
  // SEARCH_INDEX_QUERY) so search can still find a post that hasn't been
  // scrolled into view yet.
  // Featured post and categories don't depend on pagination, so they're
  // fetched first -- the featured post's own _id then feeds into the
  // exclude filter below, so it doesn't also show up a second time
  // further down the regular feed.
  const [featuredPost, categories, settings] = await Promise.all([
    client.fetch<PostSummary | null>(FEATURED_POST_QUERY),
    client.fetch<{ title: string; slug: string }[]>(BLOG_CATEGORIES_WITH_POSTS_QUERY),
    client.fetch<{ blogHeading?: string; blogTagline?: string } | null>(
      `*[_type == "siteSettings"][0]{blogHeading, blogTagline}`
    ),
  ]);
  const blogHeading = settings?.blogHeading || FALLBACK_BLOG_HEADING;
  const blogTagline = settings?.blogTagline || FALLBACK_BLOG_TAGLINE;
  const excludeId = featuredPost?._id ?? "";

  const [initialPosts, totalCount, searchIndex] = await Promise.all([
    client.fetch<PostSummary[]>(PAGINATED_POSTS_QUERY, { start: 0, end: FIRST_PAGE_SIZE, excludeId }),
    client.fetch<number>(POSTS_COUNT_QUERY, { excludeId }),
    client.fetch<SearchablePost[]>(SEARCH_INDEX_QUERY),
  ]);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
  ]);

  return (
    <BlogChrome>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">
          Asher Aw
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.01em] text-ivory sm:text-6xl">
          {blogHeading}
        </h1>
        <p className="mt-4 max-w-xl whitespace-pre-wrap leading-relaxed text-stone/80">{blogTagline}</p>

        <BlogSearch posts={searchIndex} />

        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/blog/category/${category.slug}`}
                className="rounded-full border border-amber-faint px-3.5 py-1.5 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone/80 transition-colors hover:border-spotlight/50 hover:text-spotlight"
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}

        {featuredPost && (
          <div className="mt-10">
            <FeaturedPostCard post={featuredPost} />
          </div>
        )}

        {totalCount === 0 ? (
          featuredPost ? null : (
            <p className="mt-16 text-stone/70">Nothing published yet — check back soon.</p>
          )
        ) : (
          <BlogPostList initialPosts={initialPosts} totalCount={totalCount} excludeId={excludeId} />
        )}
      </div>
    </BlogChrome>
  );
}
