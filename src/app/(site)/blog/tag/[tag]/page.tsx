import Link from "next/link";
import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { POSTS_BY_TAG_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { buildBreadcrumbSchema } from "@/lib/structuredData";

const SITE_URL = "https://asheraw.com";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded} — Blog`,
    description: `Posts tagged #${decoded}.`,
    alternates: {
      canonical: `/blog/tag/${tag}`,
      types: { "application/rss+xml": `${SITE_URL}/blog/tag/${tag}/rss.xml` },
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await client.fetch<PostSummary[]>(POSTS_BY_TAG_QUERY, { tag: decoded });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: `#${decoded}`, url: `${SITE_URL}/blog/tag/${tag}` },
  ]);

  return (
    <BlogChrome>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <nav className="mb-6 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
          <Link href="/blog" className="transition-colors hover:text-spotlight">
            Blog
          </Link>{" "}
          / #{decoded}
        </nav>

        <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Tag</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
          #{decoded}
        </h1>

        {posts.length === 0 ? (
          <p className="mt-16 text-stone/70">No posts tagged #{decoded} yet.</p>
        ) : (
          <div className="mt-16 space-y-16">
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                priority={index === 0}
                index={index}
                isLast={index === posts.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </BlogChrome>
  );
}
