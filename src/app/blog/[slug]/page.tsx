import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { POST_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { postBodyComponents } from "@/components/asher/blog/portableTextComponents";

// Re-check Sanity for new or edited posts at most once per minute,
// instead of only ever showing what existed at the last deploy.
export const revalidate = 60;

const SITE_URL = "https://asheraw.com";

type Post = {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  _updatedAt: string;
  body: unknown;
  mainImage?: { asset?: { _ref: string }; alt?: string };
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: { asset?: { _ref: string } };
  noIndex?: boolean;
  tags?: string[];
  author?: { name: string; slug: string; image?: unknown } | null;
  categories?: { title: string; slug: string }[];
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  return client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;
  const imageSource = post.socialImage ?? post.mainImage;
  const image = imageSource ? urlFor(imageSource).width(1200).height(630).fit("crop").url() : undefined;
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
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const imageSource = post.socialImage ?? post.mainImage;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    url,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    author: post.author ? { "@type": "Person", name: post.author.name } : undefined,
    image: imageSource ? urlFor(imageSource).width(1200).height(630).fit("crop").url() : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <BlogChrome>
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
          {post.categories?.[0] && (
            <>
              {" "}
              /{" "}
              <Link
                href={`/blog/category/${post.categories[0].slug}`}
                className="transition-colors hover:text-spotlight"
              >
                {post.categories[0].title}
              </Link>
            </>
          )}
        </nav>

        <article>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            {post.author && (
              <>
                <span aria-hidden="true">·</span>
                <Link href={`/blog/author/${post.author.slug}`} className="transition-colors hover:text-spotlight">
                  {post.author.name}
                </Link>
              </>
            )}
          </div>

          {post.mainImage && (
            <div className="mt-10 overflow-hidden rounded-lg">
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
      </div>
    </BlogChrome>
  );
}
