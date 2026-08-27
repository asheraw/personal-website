import Link from "next/link";
import type { PostSummary } from "@/sanity/lib/queries";

// A persistent "jump to another post in this category" list, shown in the
// open left margin on wide screens only -- a category can hold dozens of
// posts, so a reader partway down the page can browse the full list
// without scrolling back to the top. Sticky, with its own scroll, so it
// never grows taller than the viewport on a long category. Scoped to the
// category page only, not individual posts -- RelatedPosts.tsx already
// covers "find more to read" there, in a different (end-of-article) form.
export function CategoryPostList({ posts }: { posts: PostSummary[] }) {
  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 overflow-y-auto 2xl:block">
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.24em] text-stone/60">
        {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
      </p>
      <ul className="mt-4 space-y-1">
        {posts.map((post) => (
          <li key={post._id}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-md px-2 py-1.5 text-sm leading-snug text-stone/80 transition-colors hover:bg-card/30 hover:text-spotlight"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
