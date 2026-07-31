"use client";

import { useState } from "react";
import { Search } from "lucide-react";

// Per the PRD: no custom search index to build or maintain -- hand the
// query to Google, restricted to this site with a "site:" prefix, and let
// Google's own (already-complete, via the sitemap) index do the work.
// Opens in a new tab since it leaves the site entirely.
export function BlogSearch() {
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(`site:asheraw.com ${q}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="mt-8 flex max-w-sm items-center gap-2 rounded-full border border-amber-faint bg-stage/40 px-4 py-2.5 transition-colors focus-within:border-spotlight/50 print:hidden"
    >
      <Search size={14} className="shrink-0 text-stone/50" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the blog"
        aria-label="Search the blog (opens Google results in a new tab)"
        className="w-full bg-transparent text-sm text-ivory placeholder:text-stone/40 focus:outline-none"
      />
    </form>
  );
}
