import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { Toaster } from "@/components/ui/toaster";
import { SiteProviders } from "@/components/asher/SiteProviders";
import { SiteHeader } from "@/components/asher/SiteHeader";
import { SiteFooter } from "@/components/asher/SiteFooter";
import { CursorTracker } from "@/components/asher/CursorTracker";
import { Analytics } from "@/components/asher/Analytics";
import { CookieConsent } from "@/components/asher/CookieConsent";
import { StructuredData } from "@/components/asher/StructuredData";
import { SkipToContentLink } from "@/components/asher/SkipToContentLink";

const SITE_URL = "https://asheraw.com";
// Fallbacks only -- used if Site Settings (Studio) has no value set yet,
// e.g. a fresh dataset. The real, editable source is the Sanity singleton.
const FALLBACK_TITLE = "Asher Aw — Actor. Coach. Storyteller.";
const FALLBACK_DESCRIPTION = "Asher Aw is a Singapore-based theatre actor, communications coach, and storyteller. 15+ years in marketing. 10+ years on stage. Helping people communicate ideas that connect, inspire, and move others.";
const FALLBACK_OG_IMAGE = `${SITE_URL}/asher/hero-stage.png`;

// Homepage and other (site) pages are otherwise statically generated --
// without this, a Site Settings change in Studio wouldn't actually show up
// live until the next deploy. Matches the same 60s window already used for
// the blog list/post pages, for consistency.
export const revalidate = 60;

// Site title/description/social image are editable in Studio -> Site
// Settings (siteSettingsType.ts) instead of hardcoded here, per Asher's
// request 2026-07-30. Falls back to the constants above if that document
// or its fields aren't set -- keeps this from ever rendering broken/empty
// metadata on a fresh dataset.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await client.fetch<{
    siteTitle?: string;
    siteDescription?: string;
    defaultSocialImage?: { asset?: { _ref: string } };
  } | null>(`*[_type == "siteSettings"][0]{siteTitle, siteDescription, defaultSocialImage}`);

  const title = settings?.siteTitle || FALLBACK_TITLE;
  const description = settings?.siteDescription || FALLBACK_DESCRIPTION;
  const ogImage = settings?.defaultSocialImage
    ? urlFor(settings.defaultSocialImage).width(1344).height(768).fit("crop").format("jpg").quality(75).url()
    : FALLBACK_OG_IMAGE;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · Asher Aw" },
    description,
    keywords: ["Asher Aw", "Singapore actor", "theatre actor Singapore", "communications coach", "personal branding coach", "storytelling trainer", "Christian theatre", "corporate trainer Singapore", "content creation coach"],
    authors: [{ name: "Asher Aw", url: SITE_URL }],
    creator: "Asher Aw",
    publisher: "Asher Aw",
    alternates: {
      canonical: SITE_URL,
      types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
    },
    openGraph: { type: "website", locale: "en_SG", url: SITE_URL, siteName: "Asher Aw", title, description, images: [{ url: ogImage, width: 1344, height: 768, alt: title }] },
    twitter: { card: "summary_large_image", site: "@AsherAw", creator: "@AsherAw", title, description, images: [ogImage] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    verification: {},
    icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-touch-icon.png" }] },
  };
}

// This layout covers the marketing site + blog only (everything under
// the (site) route group) -- NOT /studio, which sits outside this
// group and only gets the minimal true-root layout. Keeps Sanity
// Studio isolated from analytics, the cookie banner, the custom
// cursor, and the live-preview connection, none of which belong there.
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const { isEnabled: isPreviewing } = await draftMode();

  return (
    <>
      <SkipToContentLink />
      <StructuredData />
      <Analytics />
      <SiteProviders>
        <CursorTracker />
        <SiteHeader />
        {children}
        <SiteFooter />
        <Toaster />
        <CookieConsent />
      </SiteProviders>
      {/* Lets Sanity Studio's Presentation tool establish its live
          connection (click-to-edit overlays, instant updates) when
          viewing a draft through Preview. Invisible otherwise. */}
      {isPreviewing && <VisualEditing />}
      {/* Keeps pages that use sanityFetch() updated in real time. */}
      <SanityLive />
    </>
  );
}
