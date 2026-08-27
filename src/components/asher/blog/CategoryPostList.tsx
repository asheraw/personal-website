"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSummary } from "@/sanity/lib/queries";

// A persistent "jump to another post in this category" list, shown in the
// open left margin on wide screens only -- a category can hold dozens of
// posts, so a reader partway down the page can browse without scrolling
// back to the top. Scrollable from the start (its own max-height + overflow
// below), capped at a fixed 42rem rather than the full viewport height --
// Asher's own call: the box should read as a compact panel, not stretch to
// fill however tall the screen happens to be. Sticky (stays put while
// scrolling through a much taller post list next to it -- needs a
// normal-flow, equally-tall flex sibling to have room to "stick" within,
// which is why this and the post list stay siblings rather than the
// sidebar breaking out via absolute positioning). Shifted further left via
// a pure CSS transform (paint-time only, doesn't touch layout or the
// sticky calculation) so it sits further into the open margin instead of
// hugging the reading column.
//
// Highlights whichever post is currently in view, scrollspy-style --
// watches every post-card wrapper element in the DOM directly (`#post-{id}`,
// added in the page itself) via IntersectionObserver, rather than the main
// content needing to be a client component too -- and auto-scrolls itself
// to keep that highlighted entry actually visible within its own capped
// height as the reader scrolls further down the post list (see the
// `scrollIntoView` effect below).
//
// Desktop only -- see CategoryPostListMobile below for the small-screen
// equivalent (a collapsed-by-default accordion, no scrollspy).
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

  // Keeps the highlighted entry actually visible -- without this, once a
  // reader scrolls the main content past whichever posts are currently
  // showing in the sidebar's own (shorter, capped) scroll window, the
  // active class still lands on the right <li>, but it's scrolled out of
  // view inside the sidebar itself, so nothing visibly changes. `"nearest"`
  // only scrolls the minimum needed to bring it into view -- does nothing
  // if it's already visible, rather than re-centering it every time.
  useEffect(() => {
    if (!activeId) return;
    document.getElementById(`sidebar-post-${activeId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  return (
    <aside className="sticky top-28 hidden max-h-[42rem] w-64 shrink-0 overflow-y-auto 2xl:block 2xl:-translate-x-20">
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.24em] text-stone/60">
        {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
      </p>
      <ul className="mt-4 space-y-1">
        {posts.map((post) => {
          const isActive = post._id === activeId;
          return (
            <li key={post._id} id={`sidebar-post-${post._id}`}>
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

// Mobile equivalent -- no persistent sidebar makes sense without a margin
// to put it in, so this is a collapsed-by-default accordion instead: tap
// to reveal the same list of posts, scrollable within a capped height. No
// scrollspy here -- meaningfully more complex to keep correct against a
// collapsed, tap-to-open list, and much lower value when the reader isn't
// simultaneously scrolling past it the way the persistent sidebar assumes.
export function CategoryPostListMobile({ posts }: { posts: PostSummary[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 rounded-2xl border border-amber-faint 2xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-mono-stage text-[10px] uppercase tracking-[0.24em] text-stone/70"
      >
        <span>
          Browse {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
        </span>
        <span aria-hidden="true" className="text-base leading-none">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <ul className="max-h-80 space-y-1 overflow-y-auto border-t border-amber-faint px-4 py-3">
          {posts.map((post) => (
            <li key={post._id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-md px-2 py-1.5 text-sm leading-snug text-stone/80 transition-colors hover:text-spotlight"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
