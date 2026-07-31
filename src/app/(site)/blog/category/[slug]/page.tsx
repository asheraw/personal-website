import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { CATEGORY_BY_SLUG_QUERY, POSTS_BY_CATEGORY_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { buildBreadcrumbSchema } from "@/lib/structuredData";

const SITE_URL = "https://asheraw.com";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getCategory(slug: string) {
  return client.fetch<{ title: string; description?: string } | null>(CATEGORY_BY_SLUG_QUERY, { slug });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: `${category.title} — Blog`,
    description: category.description || `Posts filed under ${category.title}.`,
    alternates: {
      canonical: `/blog/category/${slug}`,
      types: { "application/rss+xml": `${SITE_URL}/blog/category/${slug}/rss.xml` },
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, posts] = await Promise.all([
    getCategory(slug),
    client.fetch<PostSummary[]>(POSTS_BY_CATEGORY_QUERY, { categorySlug: slug }),
  ]);

  if (!category) {
    notFound();
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: category.title, url: `${SITE_URL}/blog/category/${slug}` },
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
          / {category.title}
        </nav>

        <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Category</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
          {category.title}
        </h1>
        {category.description && <p className="mt-4 max-w-xl leading-relaxed text-stone/80">{category.description}</p>}

        {posts.length === 0 ? (
          <p className="mt-16 text-stone/70">No posts in this category yet.</p>
        ) : (
          <div className="mt-16 space-y-16">
            {posts.map((post, index) => (
              <PostCard key={post._id} post={post} priority={index === 0} />
            ))}
          </div>
        )}
      </div>
    </BlogChrome>
  );
}
