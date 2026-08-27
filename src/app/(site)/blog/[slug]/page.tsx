import Link from "next/link";
import type { Metadata } from "next";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import { draftMode, headers } from "next/headers";
import { isMobileUserAgent } from "@/lib/device";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY, type RelatedPost } from "@/sanity/lib/queries";
import { Reveal } from "@/components/asher/primitives";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { BlogReadingBar } from "@/components/asher/blog/BlogReadingBar";
import { createPostBodyComponents } from "@/components/asher/blog/portableTextComponents";
import { CommentSection } from "@/components/asher/blog/CommentSection";
import { CommentCountBadge } from "@/components/asher/blog/CommentCountBadge";
import { FeaturedImage } from "@/components/asher/blog/FeaturedImage";
import { RelatedPosts } from "@/components/asher/blog/RelatedPosts";
import { ShareBar } from "@/components/asher/blog/ShareBar";
import { AffiliateDisclosure } from "@/components/asher/blog/AffiliateDisclosure";
import { bodyHasAffiliateLinks, estimateReadingTimeMinutes, extractH2Checkpoints } from "@/lib/portableText";
import { formatPostDate } from "@/lib/formatDate";
import { buildBreadcrumbSchema } from "@/lib/structuredData";

// No time-based revalidate here anymore -- sanityFetch() (via Sanity's
// Live Content API) keeps this page fresh on its own, both for normal
// visitors and for the live preview connection. Having both a fixed
// revalidate timer AND live tag-based updates active on the same page
// is the likely cause of every keystroke in Presentation forcing a full
// page reload instead of a smooth in-place update.

const SITE_URL = "https://asheraw.com";

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  _updatedAt: string;
  body: unknown;
  mainImage?: { asset?: { _ref: string }; alt?: string };
  mainImageAlt?: string;
  seoTitle?: string;
  socialImage?: { asset?: { _ref: string } };
  useBrandedSocialCard?: boolean;
  noIndex?: boolean;
  commentsLocked?: boolean;
  play?: {
    enabled?: boolean;
    mobileEnabled?: boolean;
    presentation?: unknown[];
  };
  tags?: string[];
  author?: { name: string; slug: string; image?: unknown } | null;
  categories?: { title: string; slug: string }[];
  primaryCategory?: { title: string; slug: string } | null;
  commentCount?: number;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  const { data } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } });
  return data as Post | null;
}

async function getRelatedPosts(post: Post): Promise<RelatedPost[]> {
  const categorySlugs = post.categories?.map((c) => c.slug) ?? [];
  const tags = post.tags ?? [];
  // Nothing to relate on -- skip the query rather than send empty arrays
  // that would just filter out every candidate anyway.
  if (categorySlugs.length === 0 && tags.length === 0) return [];

  // Related Reading is a nice-to-have section, not core to the page --
  // any hiccup fetching it (a Sanity error, an unexpected dataset shape)
  // should just mean the section doesn't show, never take down the whole
  // post.
  try {
    const { data } = await sanityFetch({
      query: RELATED_POSTS_QUERY,
      params: { excludeId: post._id, categorySlugs, tags },
    });
    const candidates = (data ?? []) as (RelatedPost & { matchScore: number })[];
    return candidates
      .slice()
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  } catch (error) {
    console.error("[related-posts] Failed to fetch:", error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.excerpt || undefined;
  const imageSource = post.socialImage ?? post.mainImage;
  // .format("jpg").quality(75): social crawlers (WhatsApp especially) are
  // known to silently drop the preview image if it's too large/slow to
  // fetch. Without an explicit format, Sanity serves the source file as-is
  // -- a source PNG can come out at 1-2MB+ at this crop size, well past
  // what WhatsApp reliably handles. JPG at this quality looks the same for
  // a photo-style crop and comes out at a fraction of the size.
  //
  // useBrandedSocialCard skips the photo entirely in favor of a generated
  // title/category/author card (src/app/api/og/[slug]/route.tsx) -- opt-in
  // per post, off by default, so every existing post keeps using its real
  // photo unless this is deliberately turned on.
  const image = post.useBrandedSocialCard
    ? `${SITE_URL}/api/og/${post.slug}`
    : imageSource
      ? urlFor(imageSource).width(1200).height(630).fit("crop").crop("focalpoint").format("jpg").quality(75).url()
      : undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    // types.rss+xml re-declared here (not just inherited from the root
    // layout) -- metadata doesn't deep-merge across nested layouts, so
    // defining `alternates` at all on this page would otherwise silently
    // drop the root layout's feed discovery link.
    alternates: {
      canonical: url,
      types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
    },
    robots: post.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: image ? [{ url: image, width: 1200, height: 630, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const { isEnabled: isPreviewing } = await draftMode();
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);
  const url = `${SITE_URL}/blog/${post.slug}`;
  // Server-aware, matching the PLAY page's own check -- don't show an
  // entry point that would just redirect a mobile visitor straight back
  // here anyway.
  const hasPlay = Boolean(post.play?.enabled && post.play.presentation?.length);
  const showPlayLink =
    hasPlay && (post.play?.mobileEnabled !== false || !isMobileUserAgent((await headers()).get("user-agent")));
  const imageSource = post.socialImage ?? post.mainImage;
  const readingTime = estimateReadingTimeMinutes(post.body);
  const headings = extractH2Checkpoints(post.body);
  const headingIds = new Map(headings.map((h) => [h.key, h.id]));
  const postBodyComponents = createPostBodyComponents(headingIds);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    author: post.author ? { "@type": "Person", name: post.author.name } : undefined,
    image: post.useBrandedSocialCard
      ? `${SITE_URL}/api/og/${post.slug}`
      : imageSource
        ? urlFor(imageSource).width(1200).height(630).fit("crop").crop("focalpoint").format("jpg").quality(75).url()
        : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
  const breadcrumbCategory = post.primaryCategory ?? post.categories?.[0];
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    ...(breadcrumbCategory
      ? [{ name: breadcrumbCategory.title, url: `${SITE_URL}/blog/category/${breadcrumbCategory.slug}` }]
      : []),
    { name: post.title, url },
  ]);

  return (
    <BlogChrome>
      {/* Skipped while previewing a draft -- there's no reliable "end of
          article" scroll math to trust while Presentation can rewrite the
          body under it, and the "previewing a draft" banner already gives
          this space its own meaning. */}
      {!isPreviewing && <BlogReadingBar targetId="post-article" headings={headings} />}
      {isPreviewing && (
        <div className="sticky top-16 z-40 flex items-center justify-between gap-4 border-y border-spotlight/40 bg-spotlight/10 px-5 py-2 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-spotlight sm:px-8 print:hidden">
          <span>Previewing a draft — this may not be published yet</span>
          <a href="/api/draft-mode/disable" className="underline hover:no-underline">
            Exit preview
          </a>
        </div>
      )}
      {/* Extra bottom clearance (beyond BlogChrome's own pb-16) so the
          fixed reading bar above never sits on top of the footer or the
          tail end of the comment section. */}
      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        <nav className="mb-6 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70 print:hidden">
          <Link href="/blog" className="transition-colors hover:text-spotlight">
            Blog
          </Link>
          {breadcrumbCategory && (
            <>
              {" "}
              /{" "}
              <Link
                href={`/blog/category/${breadcrumbCategory.slug}`}
                className="transition-colors hover:text-spotlight"
              >
                {breadcrumbCategory.title}
              </Link>
            </>
          )}
        </nav>

        <article id="post-article">
          <Reveal y={16}>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
              {post.title}
            </h1>

            {(post.publishedAt || readingTime) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                )}
                {post.publishedAt && <span aria-hidden="true">·</span>}
                <span>{readingTime} min read</span>
                {!!post.commentCount && <span aria-hidden="true" className="print:hidden">·</span>}
                <CommentCountBadge slug={post.slug} count={post.commentCount} />
              </div>
            )}
          </Reveal>

          {showPlayLink && (
            <Link
              href={`/blog/${post.slug}/play`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-spotlight/40 bg-spotlight/5 px-4 py-2 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight transition-colors hover:bg-spotlight/10 print:hidden"
            >
              ▶ Key Moments — an interactive way through this post
            </Link>
          )}

          {post.mainImage && (
            <Reveal delay={0.1}>
              <FeaturedImage
                src={urlFor(post.mainImage).width(1200).url()}
                fullSrc={urlFor(post.mainImage).width(2400).url()}
                alt={post.mainImageAlt ?? post.mainImage.alt ?? post.title}
              />
            </Reveal>
          )}

          {bodyHasAffiliateLinks(post.body) && <AffiliateDisclosure />}

          <div className="mt-10 space-y-6 text-lg">
            <PortableText value={post.body as never} components={postBodyComponents} />
          </div>

          {(post.categories?.length || post.tags?.length) ? (
            <div className="mt-14 flex flex-wrap gap-2 border-t border-amber-faint pt-8 print:hidden">
              {post.categories?.map((category) => (
                <Link
                  key={category.slug}
                  href={`/blog/category/${category.slug}`}
                  className="rounded-full border border-amber-faint px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/80 transition-colors hover:border-spotlight/50 hover:text-spotlight"
                >
                  {category.title}
                </Link>
              ))}
              {post.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-secondary px-3 py-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/80 transition-colors hover:text-spotlight"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-10">
            <ShareBar url={url} title={post.title} slug={post.slug} />
          </div>
        </article>

        <div className="print:hidden">
          <CommentSection postId={post._id} commentsLocked={post.commentsLocked} />
        </div>

        {/* Marks where the reading bar should disappear -- always rendered,
            even if there are no related posts to show, so BlogReadingBar
            has a reliable anchor regardless of RelatedPosts' own content. */}
        <div id="reading-bar-boundary" aria-hidden />
        <RelatedPosts posts={relatedPosts} />

        <div className="mt-14 border-t border-amber-faint pt-8 print:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-all hover:gap-2.5"
          >
            <span aria-hidden="true">←</span> Back to blog
          </Link>
        </div>
      </div>
    </BlogChrome>
  );
}
