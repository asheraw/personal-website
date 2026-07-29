import type { Metadata } from "next";
import Link from "next/link";
import { Instagram, Linkedin, Youtube, Mail, MessageCircle, Twitter, Music2, ArrowLeft, ArrowUpRight } from "lucide-react";
import { CONTACT_INFO } from "@/components/asher/data";

const SITE_URL = "https://asheraw.com";
const TITLE = "Connect with Asher Aw";
const DESCRIPTION = "All the ways to reach Asher Aw — WhatsApp, Instagram, YouTube, LinkedIn, TikTok, X, and email, all in one place.";

export const metadata: Metadata = {
  title: "Connect",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/connect` },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { type: "website", url: `${SITE_URL}/connect`, siteName: "Asher Aw", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", site: "@AsherAw", creator: "@AsherAw", title: TITLE, description: DESCRIPTION },
};

const LINKS = [
  { label: "WhatsApp", value: CONTACT_INFO.whatsapp, href: CONTACT_INFO.whatsappUrl, icon: MessageCircle, primary: true },
  { label: "Instagram", value: "@itsAsherAw", href: "https://www.instagram.com/itsAsherAw", icon: Instagram },
  { label: "YouTube", value: "@itsAsherAw", href: "https://www.youtube.com/@itsAsherAw", icon: Youtube },
  { label: "LinkedIn", value: "in/itsAsherAw", href: "https://www.linkedin.com/in/itsAsherAw", icon: Linkedin },
  { label: "TikTok", value: "@itsAsherAw", href: "https://www.tiktok.com/@itsAsherAw", icon: Music2 },
  { label: "X", value: "@AsherAw", href: "https://x.com/AsherAw", icon: Twitter },
  { label: "Email", value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}`, icon: Mail },
];

export default function ConnectPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-stage px-5 py-16 text-ivory sm:px-8 sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(240,184,101,0.16) 0%, rgba(240,184,101,0.05) 40%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" aria-hidden />
      <div className="relative mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Singapore · Actor · Coach · Storyteller</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
            Let&rsquo;s <span className="text-spotlight-gradient italic">connect</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone/75 sm:text-base">Every way to reach Asher, in one place. Pick whatever&rsquo;s easiest for you.</p>
        </div>

        <div className="mt-10 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noreferrer" : undefined}
              className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all ${l.primary ? "border-spotlight/40 bg-spotlight/10 hover:border-spotlight hover:bg-spotlight/20" : "border-amber-faint bg-stage/40 hover:border-spotlight/40 hover:bg-spotlight/[0.03]"}`}
            >
              <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-spotlight ${l.primary ? "border-spotlight/40 bg-spotlight/10" : "border-spotlight/30 bg-spotlight/5"}`}>
                <l.icon size={18} />
              </div>
              <div className="flex-1">
                <p className={`font-mono-stage text-[10px] uppercase tracking-[0.2em] ${l.primary ? "text-spotlight/80" : "text-stone/60"}`}>{l.label}</p>
                <p className="text-base font-medium text-ivory transition-colors group-hover:text-spotlight">{l.value}</p>
              </div>
              <ArrowUpRight size={16} className="text-stone/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-spotlight" />
            </a>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Link href="/" className="group inline-flex items-center gap-2 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/60 transition-colors hover:text-spotlight">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            asheraw.com
          </Link>
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/40">© {new Date().getFullYear()} Asher Aw</p>
        </div>
      </div>
    </div>
  );
}
