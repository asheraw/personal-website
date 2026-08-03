"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/asher/blog/PostCard";
import type { PostSummary } from "@/sanity/lib/queries";

const PAGE_SIZE = 8;

// Infinite-scroll-feeling pagination, not numbered pages -- Asher's
// preference (IDEAS.md, 2026-07-31): readers are more used to scrolling
// than clicking through page numbers. Implemented as a hybrid rather than
// pure scroll-triggered loading: a real "Load more" button is always
// there (keyboard-focusable, works with JS but no IntersectionObserver
// support, and gives screen-reader users an actual control instead of
// content silently appearing), and an IntersectionObserver on that same
// button auto-triggers a load once it scrolls near the viewport -- so
// mouse/touch scrolling feels seamless without losing the accessible
// fallback.
export function BlogPostList({ initialPosts, totalCount }: { initialPosts: PostSummary[]; totalCount: number }) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false);
  const postsLenRef = useRef(initialPosts.length);
  postsLenRef.current = posts.length;

  const hasMore = posts.length < totalCount;

  // Ref-guarded (not just the `loading` state) so a click and the
  // IntersectionObserver firing in the same tick can't both start a
  // fetch -- state updates aren't synchronous, so a state-only guard
  // would still let both calls slip through before either re-render.
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/blog/posts?start=${postsLenRef.current}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("request failed");
      const data: { posts?: PostSummary[] } = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="mt-16 space-y-16">
        {posts.map((post, index) => (
          <PostCard key={post._id} post={post} priority={index === 0} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <button
            ref={sentinelRef}
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full border border-amber-faint px-6 py-2.5 font-mono-stage text-xs uppercase tracking-[0.18em] text-spotlight transition-colors hover:border-spotlight/50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
          {error && (
            <p className="text-xs text-stone/60">Something went wrong loading more posts — try again.</p>
          )}
        </div>
      )}
    </>
  );
}
