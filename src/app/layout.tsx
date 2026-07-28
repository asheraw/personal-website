import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/asher/ThemeProvider";
import { CursorTracker } from "@/components/asher/CursorTracker";
import { Analytics } from "@/components/asher/Analytics";
import { StructuredData } from "@/components/asher/StructuredData";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700", "800", "900"], style: ["normal", "italic"] });

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
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><StructuredData /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
        <Analytics />
        <ThemeProvider>
          <CursorTracker />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
