import Link from "next/link";
import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { POSTS_BY_TAG_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";

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
    alternates: { canonical: `/blog/tag/${tag}` },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await client.fetch<PostSummary[]>(POSTS_BY_TAG_QUERY, { tag: decoded });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>{" "}
        / #{decoded}
      </nav>

      <h1 className="mb-12 text-4xl font-bold">#{decoded}</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts tagged #{decoded} yet.</p>
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
