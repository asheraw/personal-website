import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700", "800", "900"], style: ["normal", "italic"] });

// Deliberately minimal -- this is the ONE layout shared by both the
// marketing/blog site AND Sanity Studio (/studio), since Next.js only
// allows a single root layout. Everything site-specific (analytics,
// cookie banner, theme toggle, and especially the Sanity live-preview
// connection) lives in src/app/(site)/layout.tsx instead, so Studio
// never loads any of it. Mounting the live-preview connection here
// was causing every content edit -- even in Structure, unrelated to
// Presentation -- to force-refresh the Studio page itself, since it's
// also a "page using live content" as far as that connection is
// concerned.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
