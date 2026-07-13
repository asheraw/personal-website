import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Asher Aw — Actor. Coach. Storyteller.",
  description:
    "Asher Aw is a Singapore-based theatre actor, communications coach, and storyteller. 15+ years in marketing. 10+ years on stage. Helping people communicate ideas that connect, inspire, and move others.",
  keywords: [
    "Asher Aw",
    "Singapore actor",
    "theatre actor Singapore",
    "communications coach",
    "personal branding coach",
    "storytelling trainer",
    "Christian theatre",
    "corporate trainer Singapore",
    "content creation coach",
  ],
  authors: [{ name: "Asher Aw" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Asher Aw — Actor. Coach. Storyteller.",
    description:
      "Singapore-based theatre actor, communications coach, and storyteller. Helping people communicate with authenticity.",
    siteName: "Asher Aw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asher Aw — Actor. Coach. Storyteller.",
    description:
      "Singapore-based theatre actor, communications coach, and storyteller.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
