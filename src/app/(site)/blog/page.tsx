import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { BlogSearch } from "@/components/asher/blog/BlogSearch";

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
    <BlogChrome>
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">
          Asher Aw
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.01em] text-ivory sm:text-6xl">
          Dig The Mind of Asher
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-stone/80">
          Welcome to my blog, I&apos;m currently going through a revamp so there&apos;s many things that are still a Work-In-Progress.
        </p>

        <BlogSearch />

        {posts.length === 0 && (
          <p className="mt-16 text-stone/70">Nothing published yet — check back soon.</p>
        )}

        <div className="mt-16 space-y-16">
          {posts.map((post, index) => (
            <PostCard key={post._id} post={post} priority={index === 0} />
          ))}
        </div>
      </div>
    </BlogChrome>
  );
}
