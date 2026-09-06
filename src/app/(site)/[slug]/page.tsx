import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { postBodyComponents } from "@/components/asher/blog/portableTextComponents";

// A generic content page living directly at the site root
// (asheraw.com/<slug>) -- Studio's `page` document type (pageType.ts).
// This only ever renders when no more specific route matches the same
// segment first: Next.js always resolves a literal folder (blog, connect,
// link, privacy, studio, api) before falling back to this catch-all, so
// nothing here can shadow an existing page -- pageType.ts's own slug
// validation blocks the reverse case (a new Page trying to claim an
// already-real route) at the Studio end instead.

const SITE_URL = "https://asheraw.com";

type Page = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  seoTitle?: string;
  noIndex?: boolean;
  body?: unknown;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPage(slug: string) {
  const { data } = await sanityFetch({ query: PAGE_BY_SLUG_QUERY, params: { slug } });
  return data as Page | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  const title = page.seoTitle || page.title;
  const description = page.excerpt || undefined;
  const url = `${SITE_URL}/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: page.noIndex ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main id="main-content" className="relative min-h-screen bg-stage px-5 pt-28 pb-24 text-ivory sm:px-8 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(240,184,101,0.12) 0%, transparent 60%)" }}
      />
      <div className="relative mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
          {page.title}
        </h1>
        {Array.isArray(page.body) && page.body.length > 0 && (
          <div className="prose-invert mt-10 space-y-6 text-base leading-8 text-ivory/90">
            <PortableText value={page.body as never} components={postBodyComponents} />
          </div>
        )}
      </div>
    </main>
  );
}
