"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSummary } from "@/sanity/lib/queries";

// A persistent "jump to another post in this category" list, shown in the
// open left margin on wide screens only -- a category can hold dozens of
// posts, so a reader partway down the page can browse without scrolling
// back to the top. Scrollable from the start (its own max-height + overflow
// below) rather than a "+N more" that had to be clicked open first --
// Asher's own call once he saw the capped height itself already looked
// fine. Sticky (stays put while scrolling through a much taller post list
// next to it -- needs a normal-flow, equally-tall flex sibling to have
// room to "stick" within, which is why this and the post list stay
// siblings rather than the sidebar breaking out via absolute positioning).
// Shifted further left via a pure CSS transform (paint-time only, doesn't
// touch layout or the sticky calculation) so it sits further into the open
// margin instead of hugging the reading column.
//
// Highlights whichever post is currently in view, scrollspy-style --
// watches every post-card wrapper element in the DOM directly (`#post-{id}`,
// added in the page itself) via IntersectionObserver, rather than the main
// content needing to be a client component too.
export function CategoryPostList({ posts }: { posts: PostSummary[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.replace(/^post-/, "");
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        // Whichever visible card sits closest to (or just past) the top of
        // the viewport is the one actually being read right now.
        const topmost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        setActiveId(topmost ? topmost[0] : null);
      },
      // A thin band starting just below the fixed header -- a card only
      // counts as "active" once it's actually near the top of the reading
      // area, not merely anywhere on screen.
      { rootMargin: "-112px 0px -75% 0px", threshold: 0 }
    );

    for (const post of posts) {
      const el = document.getElementById(`post-${post._id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `posts` is stable for the lifetime of this page
  }, []);

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 overflow-y-auto 2xl:block 2xl:-translate-x-20">
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.24em] text-stone/60">
        {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
      </p>
      <ul className="mt-4 space-y-1">
        {posts.map((post) => {
          const isActive = post._id === activeId;
          return (
            <li key={post._id}>
              <Link
                href={`/blog/${post.slug}`}
                className={`block rounded-md px-2 py-1.5 text-sm leading-snug transition-colors ${
                  isActive ? "bg-card/50 text-spotlight" : "text-stone/80 hover:text-spotlight"
                }`}
              >
                {post.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
