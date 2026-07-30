import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { POST_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { ReadingProgressBar } from "@/components/asher/blog/ReadingProgressBar";
import { postBodyComponents } from "@/components/asher/blog/portableTextComponents";
import { CommentSection } from "@/components/asher/blog/CommentSection";
import { estimateReadingTimeMinutes } from "@/lib/portableText";

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
  seoTitle?: string;
  socialImage?: { asset?: { _ref: string } };
  noIndex?: boolean;
  tags?: string[];
  author?: { name: string; slug: string; image?: unknown } | null;
  categories?: { title: string; slug: string }[];
  primaryCategory?: { title: string; slug: string } | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  const { data } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } });
  return data as Post | null;
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
  const image = imageSource
    ? urlFor(imageSource).width(1200).height(630).fit("crop").format("jpg").quality(75).url()
    : undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
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

  const url = `${SITE_URL}/blog/${post.slug}`;
  const imageSource = post.socialImage ?? post.mainImage;
  const readingTime = estimateReadingTimeMinutes(post.body);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    author: post.author ? { "@type": "Person", name: post.author.name } : undefined,
    image: imageSource ? urlFor(imageSource).width(1200).height(630).fit("crop").format("jpg").quality(75).url() : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <BlogChrome>
      {/* Skipped while previewing a draft -- it would sit at the exact same
          top-16 offset as the "previewing a draft" banner below. */}
      {!isPreviewing && <ReadingProgressBar targetId="post-article" />}
      {isPreviewing && (
        <div className="sticky top-16 z-40 flex items-center justify-between gap-4 border-y border-spotlight/40 bg-spotlight/10 px-5 py-2 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-spotlight sm:px-8">
          <span>Previewing a draft — this may not be published yet</span>
          <a href="/api/draft-mode/disable" className="underline hover:no-underline">
            Exit preview
          </a>
        </div>
      )}
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav className="mb-6 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
          <Link href="/blog" className="transition-colors hover:text-spotlight">
            Blog
          </Link>
          {(() => {
            const breadcrumbCategory = post.primaryCategory ?? post.categories?.[0];
            if (!breadcrumbCategory) return null;
            return (
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
            );
          })()}
        </nav>

        <article id="post-article">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
            {post.title}
          </h1>

          {(post.publishedAt || readingTime) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              {post.publishedAt && <span aria-hidden="true">·</span>}
              <span>{readingTime} min read</span>
            </div>
          )}

          {post.mainImage && (
            <div className="mt-10">
              <Image
                src={urlFor(post.mainImage).width(1200).url()}
                alt={post.mainImage.alt ?? post.title}
                width={1200}
                height={675}
                className="h-auto w-full"
                priority
              />
            </div>
          )}

          <div className="mt-10 space-y-6 text-lg">
            <PortableText value={post.body as never} components={postBodyComponents} />
          </div>

          {(post.categories?.length || post.tags?.length) ? (
            <div className="mt-14 flex flex-wrap gap-2 border-t border-amber-faint pt-8">
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

          <div className="mt-14 border-t border-amber-faint pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-all hover:gap-2.5"
            >
              <span aria-hidden="true">←</span> Back to blog
            </Link>
          </div>
        </article>

        <CommentSection postId={post._id} />
      </div>
    </BlogChrome>
  );
}
