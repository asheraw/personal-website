import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/lib/live";
import { Toaster } from "@/components/ui/toaster";
import { SiteProviders } from "@/components/asher/SiteProviders";
import { SiteHeader } from "@/components/asher/SiteHeader";
import { SiteFooter } from "@/components/asher/SiteFooter";
import { CursorTracker } from "@/components/asher/CursorTracker";
import { Analytics } from "@/components/asher/Analytics";
import { CookieConsent } from "@/components/asher/CookieConsent";
import { StructuredData } from "@/components/asher/StructuredData";

const SITE_URL = "https://asheraw.com";
const TITLE = "Asher Aw — Actor. Coach. Storyteller.";
const DESCRIPTION = "Asher Aw is a Singapore-based theatre actor, communications coach, and storyteller. 15+ years in marketing. 10+ years on stage. Helping people communicate ideas that connect, inspire, and move others.";
const OG_IMAGE = `${SITE_URL}/asher/hero-stage.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Asher Aw" },
  description: DESCRIPTION,
  keywords: ["Asher Aw", "Singapore actor", "theatre actor Singapore", "communications coach", "personal branding coach", "storytelling trainer", "Christian theatre", "corporate trainer Singapore", "content creation coach"],
  authors: [{ name: "Asher Aw", url: SITE_URL }],
  creator: "Asher Aw",
  publisher: "Asher Aw",
  alternates: {
    canonical: SITE_URL,
    types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
  },
  openGraph: { type: "website", locale: "en_SG", url: SITE_URL, siteName: "Asher Aw", title: TITLE, description: DESCRIPTION, images: [{ url: OG_IMAGE, width: 1344, height: 768, alt: "Asher Aw — Actor, Coach, Storyteller" }] },
  twitter: { card: "summary_large_image", site: "@AsherAw", creator: "@AsherAw", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {},
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-touch-icon.png" }] },
};

// This layout covers the marketing site + blog only (everything under
// the (site) route group) -- NOT /studio, which sits outside this
// group and only gets the minimal true-root layout. Keeps Sanity
// Studio isolated from analytics, the cookie banner, the custom
// cursor, and the live-preview connection, none of which belong there.
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const { isEnabled: isPreviewing } = await draftMode();

  return (
    <>
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
