"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/asher/SiteHeader";
import { SiteFooter } from "@/components/asher/SiteFooter";
import { SiteProviders } from "@/components/asher/SiteProviders";
import { ConfigureSiteChrome } from "@/components/asher/SiteChromeConfig";
import { SkipToContentLink } from "@/components/asher/SkipToContentLink";
import { track } from "@/lib/analytics";

// One picked at random per page load -- purely for a bit of variety on a
// page people otherwise only ever see once by accident.
const NOT_FOUND_ILLUSTRATIONS = [
  {
    src: "/asher/404-stage.png",
    alt: "Illustration of a Victorian stage actor announcing “Well, this is awkward. We lost something,” surrounded by scattered pages on an empty theatre stage.",
  },
  {
    src: "/asher/404-squirrel.png",
    alt: "Comic-panel illustration of a squirrel, the Time Squirrel, hoarding old computer parts and broken web pages in its tree-hollow nest.",
  },
  {
    src: "/asher/404-hamster.png",
    alt: "Comic-panel illustration of Timo the Time Hamster eating torn pages labelled 404 amid a tangle of cables.",
  },
];

export function NotFoundContent() {
  const pathname = usePathname();

  // Chosen once per mount (not on every render) via useState's lazy
  // initializer -- a fresh visit to a broken link gets a fresh pick.
  const [illustration] = useState(
    () => NOT_FOUND_ILLUSTRATIONS[Math.floor(Math.random() * NOT_FOUND_ILLUSTRATIONS.length)]
  );

  useEffect(() => {
    // Belt-and-suspenders for the browser tab title: `not-found.tsx`'s
    // `metadata` export (in the sibling not-found.tsx file) is a known,
    // long-standing Next.js App Router bug (vercel/next.js#61236, #49030,
    // #46619) -- it doesn't reliably render a <title> tag, especially for
    // a truly unmatched URL (as opposed to a matched route calling
    // notFound() itself). Without any <title> at all, browsers fall back
    // to showing the raw URL in the tab -- exactly the "asheraw.com/404"
    // Asher reported. Setting it directly here is what actually works.
    document.title = "Page Not Found · Asher Aw";
  }, []);

  useEffect(() => {
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    // Same consent-gated pipeline as the rest of the site's analytics.
    track({ action: "404_hit", category: "navigation", label: pathname, referrer: referrer || undefined });

    // Also logged into Sanity as its own browsable list (Studio → 404
    // Hits) -- easier for Asher to actually look through than a GA4
    // report, and the whole reason this page tracks anything at all is so
    // repeat misses can turn into a redirect or a new post.
    fetch("/api/track-404", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: referrer || undefined }),
    }).catch(() => {
      // A missed data point is fine; a broken 404 page is not.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <SiteProviders>
      {/* Same SiteHeader/SiteFooter as every other page -- this file has to
          live at the true app root (Next.js requires that for the global
          not-found boundary to catch genuinely unmatched URLs), so it can't
          share the (site) layout's providers, but it mounts the identical
          components rather than a bespoke copy. Same reasoning for the skip
          link -- (site)/layout.tsx's own copy doesn't reach this page. */}
      <SkipToContentLink />
      <ConfigureSiteChrome context="404" />
      <div className="min-h-screen bg-stage text-ivory">
        <SiteHeader />
        <main id="main-content" className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-5 pt-16 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-grid-paper opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(240,184,101,0.12) 0%, transparent 65%)" }}
          />
          <div className="relative mx-auto max-w-lg text-center">
            <div className="mx-auto overflow-hidden rounded-lg border border-amber-faint bg-stage/40">
              <Image
                src={illustration.src}
                alt={illustration.alt}
                width={1408}
                height={768}
                priority
                className="h-auto w-full"
              />
            </div>
            <p className="mt-8 font-mono-stage text-xs uppercase tracking-[0.3em] text-spotlight/70">
              / act_404 · missing_scene
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.01em] text-ivory sm:text-6xl">
              Oops, Something&rsquo;s <span className="italic text-spotlight-gradient">Missing</span>
            </h1>
            <p className="mt-6 leading-relaxed text-stone/80">
              Whatever you were looking for is somewhere else — maybe a wrong link, it got cut, or it just
              never made it. Either way, there&rsquo;s other stuff to check out.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.03]"
              >
                Back to the Story
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-amber-faint px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-spotlight/50 hover:text-spotlight"
              >
                Read the Blog
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </SiteProviders>
  );
}
