import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { CATEGORY_BY_SLUG_QUERY, POSTS_BY_CATEGORY_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";

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
    alternates: { canonical: `/blog/category/${slug}` },
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>{" "}
        / {category.title}
      </nav>

      <h1 className="mb-3 text-4xl font-bold">{category.title}</h1>
      {category.description && <p className="mb-12 text-muted-foreground">{category.description}</p>}

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts in this category yet.</p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
