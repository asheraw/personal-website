"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

// Catches any uncaught error thrown while rendering a page under (site)
// (a bad Sanity query, a data-shape surprise, anything) and shows this
// instead of the blank "server error" page visitors saw before this
// existed. Still wrapped by (site)/layout.tsx's own SiteHeader/SiteFooter
// -- Next only skips the layout at the SAME segment an error boundary
// throws in, not the ones above it -- so this only needs its own content.
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error]", error);
    // GTM/GA4 event -- only ever reaches Asher if he goes looking for a
    // custom event in a GA4 report, and only for visitors who've granted
    // consent. The fetch below is the reliable half: unconditional, and
    // shows up in Studio -> Site Admin -> Error Log, the same place he
    // already checks for 404s.
    track({ action: "page_error", category: "reliability", label: error.digest ?? error.message });
    fetch("/api/track-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "Unknown render error",
        stack: error.stack,
        source: "render",
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <main id="main-content" className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pt-16 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid-paper opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(240,184,101,0.12) 0%, transparent 65%)" }}
      />
      <div className="relative mx-auto max-w-lg text-center">
        <p className="font-mono-stage text-xs uppercase tracking-[0.3em] text-spotlight/70">
          / act_500 · dropped_cue
        </p>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.01em] text-ivory sm:text-6xl">
          Something went <span className="italic text-spotlight-gradient">wrong.</span>
        </h1>
        <p className="mt-6 leading-relaxed text-stone/80">
          This page hit a snag loading — it&rsquo;s been logged. Try again, or head back and pick up somewhere
          else on the site.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.03]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-amber-faint px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-spotlight/50 hover:text-spotlight"
          >
            Back to the Story
          </Link>
        </div>
      </div>
    </main>
  );
}
