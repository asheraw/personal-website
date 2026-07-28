import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";

// Re-check Sanity for new or edited posts at most once per minute,
// instead of only ever showing what existed at the last deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Essays, stories, and lessons from Asher Aw — actor, coach, and storyteller.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await client.fetch<PostSummary[]>(ALL_POSTS_QUERY);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-3 text-4xl font-bold">Blog</h1>
      <p className="mb-12 text-muted-foreground">
        Essays, stories, and lessons on acting, coaching, and communicating ideas that connect.
      </p>

      {posts.length === 0 && (
        <p className="text-muted-foreground">Nothing published yet — check back soon.</p>
      )}

      <div className="space-y-12">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </main>
  );
}
