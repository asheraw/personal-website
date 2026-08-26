"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

export type SearchablePost = {
  _id: string;
  title: string;
  slug: string;
  blurb?: string;
  tags?: string[];
  categoryTitles?: string[];
};

const MAX_RESULTS = 6;

function normalize(text: string): string {
  return text.toLowerCase();
}

// Instant, on-site search over posts already loaded on the /blog page --
// no separate index to fetch, no server round trip per keystroke, and
// nothing leaves the site for the common case (searching by title, topic,
// tag, or category). A post's own summary text is already capped short in
// its GROQ projection (SEARCH_INDEX_QUERY's blurb), so passing
// every post's searchable fields down here stays lightweight even with a
// few dozen posts. Doesn't reach into full post bodies, though -- a "search
// the wider web" fallback link covers anything buried in body text that
// this shallow index can't see.
// Debounce before logging a query -- long enough that a query still being
// typed ("h", "he", "hel"...) never gets logged as its own thing, short
// enough to still catch someone who paused to read the results before
// giving up and typing something else.
const LOG_DEBOUNCE_MS = 800;
const MIN_LOGGABLE_LENGTH = 2;

export function BlogSearch({ posts }: { posts: SearchablePost[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Guards against logging the exact same settled query twice in a row --
  // e.g. clicking back into the box without changing anything shouldn't
  // count as a second search.
  const lastLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const trimmed = query.trim();

  // Title matches first, then anything only matching in the summary/tags/
  // categories -- a title hit is almost always what someone meant.
  // matchCount is the true total (before the MAX_RESULTS slice) -- kept
  // separately so query logging below reports how many posts actually
  // matched, not just how many the dropdown had room to show.
  const { results, matchCount } = useMemo(() => {
    if (!trimmed) return { results: [] as SearchablePost[], matchCount: 0 };
    const q = normalize(trimmed);
    const titleMatches: SearchablePost[] = [];
    const otherMatches: SearchablePost[] = [];
    for (const post of posts) {
      if (normalize(post.title).includes(q)) {
        titleMatches.push(post);
        continue;
      }
      const haystack = normalize(
        [post.blurb, ...(post.tags ?? []), ...(post.categoryTitles ?? [])].filter(Boolean).join(" ")
      );
      if (haystack.includes(q)) otherMatches.push(post);
    }
    const all = [...titleMatches, ...otherMatches];
    return { results: all.slice(0, MAX_RESULTS), matchCount: all.length };
  }, [trimmed, posts]);

  // Logs a settled query as a future-content signal (see /api/track-search)
  // -- debounced so only a query someone actually paused on gets logged,
  // never every intermediate keystroke. Runs regardless of analytics
  // cookie consent, same as 404-hit and share tracking: anonymous,
  // first-party, no visitor-identifying data, not a third-party script.
  useEffect(() => {
    if (trimmed.length < MIN_LOGGABLE_LENGTH) return;
    const timer = setTimeout(() => {
      if (lastLoggedRef.current === trimmed) return;
      lastLoggedRef.current = trimmed;
      fetch("/api/track-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, resultCount: matchCount }),
      }).catch(() => {
        // Best-effort -- a missed log entry isn't worth surfacing to the
        // visitor or retrying.
      });
    }, LOG_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed, matchCount]);

  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:asheraw.com ${trimmed}`)}`;

  return (
    <div ref={containerRef} className="relative max-w-sm grow print:hidden">
      <div className="flex items-center gap-2 rounded-full border border-amber-faint bg-stage/40 px-4 py-2.5 transition-colors focus-within:border-spotlight/50">
        <Search size={14} className="shrink-0 text-stone/50" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search the blog"
          aria-label="Search the blog"
          className="w-full bg-transparent text-sm text-ivory placeholder:text-stone/40 focus:outline-none"
        />
        {trimmed && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="shrink-0 text-stone/50 transition-colors hover:text-ivory"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && trimmed && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-amber-faint bg-stage shadow-xl">
          {results.length > 0 ? (
            <ul>
              {results.map((post) => (
                <li key={post._id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    onClick={() => setOpen(false)}
                    className="block border-b border-amber-faint/60 px-4 py-3 transition-colors last:border-none hover:bg-secondary/40"
                  >
                    <p className="text-sm font-medium text-ivory">{post.title}</p>
                    {post.blurb && <p className="mt-0.5 line-clamp-1 text-xs text-stone/70">{post.blurb}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-stone/70">No matches on the blog for &ldquo;{trimmed}&rdquo;.</p>
          )}
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-amber-faint px-4 py-2.5 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-spotlight/80 transition-colors hover:text-spotlight"
          >
            Search the wider web for &ldquo;{trimmed}&rdquo; →
          </a>
        </div>
      )}
    </div>
  );
}
