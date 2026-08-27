"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSummary } from "@/sanity/lib/queries";

// Collapsed to the most recent N by default -- keeps the sidebar's own
// height predictable and scroll-free on a large category, rather than a
// list that keeps growing forever. "+N more" expands the rest in place
// (see `expanded` below) rather than being a dead-end label -- Asher's own
// pushback on the first version: capping it is fine, but readers need an
// actual way to reach the rest, not just a count of what's hidden.
const MAX_LISTED = 15;

// A persistent "jump to another post in this category" list, shown in the
// open left margin on wide screens only -- a category can hold dozens of
// posts, so a reader partway down the page can browse without scrolling
// back to the top. Sticky (stays put while scrolling through a much taller
// post list next to it -- needs a normal-flow, equally-tall flex sibling
// to have room to "stick" within, which is why this and the post list stay
// siblings rather than the sidebar breaking out via absolute positioning).
// Shifted further left via a pure CSS transform (paint-time only, doesn't
// touch layout or the sticky calculation) so it sits further into the open
// margin instead of hugging the reading column -- Asher's own feedback,
// after the first version felt "congested."
//
// Highlights whichever post is currently in view, scrollspy-style --
// watches every post-card wrapper element in the DOM directly (`#post-{id}`,
// added in the page itself) via IntersectionObserver, rather than the main
// content needing to be a client component too. Watches all of them from
// mount regardless of the collapsed/expanded state below, so the highlight
// is still correct the moment the list expands.
export function CategoryPostList({ posts }: { posts: PostSummary[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const listed = expanded ? posts : posts.slice(0, MAX_LISTED);
  const remaining = posts.length - MAX_LISTED;

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
        {listed.map((post) => {
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
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 block px-2 font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone/50 transition-colors hover:text-spotlight"
        >
          {expanded ? "Show fewer" : `+${remaining} more →`}
        </button>
      )}
    </aside>
  );
}
