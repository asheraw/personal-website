import type { Metadata } from "next";
import { Facebook, Instagram, Linkedin, Youtube, Twitter, Music2, ArrowUpRight } from "lucide-react";
import { ConfigureSiteChrome } from "@/components/asher/SiteChromeConfig";
import { ContactPills } from "@/components/asher/ContactPills";

const SITE_URL = "https://asheraw.com";
const TITLE = "Connect with Asher Aw";
const DESCRIPTION = "All the ways to reach Asher Aw — Facebook, Instagram, YouTube, LinkedIn, X, TikTok, and email, all in one place.";

export const metadata: Metadata = {
  title: "Connect",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/connect` },
  openGraph: { type: "website", url: `${SITE_URL}/connect`, siteName: "Asher Aw", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", site: "@AsherAw", creator: "@AsherAw", title: TITLE, description: DESCRIPTION },
};

const LINKS = [
  { label: "Facebook", value: "facebook.com/AsherAw", href: "https://facebook.com/AsherAw", icon: Facebook, primary: true, note: "Most active here — best place to send a friend request or follow." },
  { label: "Instagram", value: "@itsAsherAw", href: "https://instagram.com/itsAsherAw", icon: Instagram },
  { label: "YouTube", value: "@itsAsherAw", href: "https://youtube.com/@itsAsherAw", icon: Youtube },
  { label: "LinkedIn", value: "linkedin.com/in/itsasheraw", href: "https://linkedin.com/in/itsasheraw", icon: Linkedin, note: "If you're a student or attendee at one of my sessions, please leave a recommendation or testimonial." },
  { label: "X (Twitter)", value: "@AsherAw", href: "https://twitter.com/AsherAw", icon: Twitter, note: "Fun fact — President Barack Obama follows me (for real)." },
  { label: "TikTok", value: "@itsAsherAw", href: "https://tiktok.com/@itsAsherAw", icon: Music2 },
  { label: "Facebook Page", value: "facebook.com/itsAsherAw", href: "https://facebook.com/itsAsherAw", icon: Facebook },
];

export default function ConnectPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-stage px-5 pt-28 pb-16 text-ivory sm:px-8 sm:pt-32 sm:pb-24">
      {/* The global SiteHeader/SiteFooter cover the theme toggle, site nav,
          and full footer now -- /connect used to opt out of the shared
          footer in favour of its own minimal one, but keeping the same
          footer as every other page reads as more consistent. */}
      <ConfigureSiteChrome context="connect" />
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(240,184,101,0.16) 0%, rgba(240,184,101,0.05) 40%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" aria-hidden />
      <div className="relative mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-full overflow-hidden rounded-2xl border border-amber-faint">
            <img src="/asher/connect-hero.jpg" alt="Connect with Asher Aw — Facebook, Instagram, Twitter, YouTube, LinkedIn, Messenger, and TikTok" className="w-full" />
          </div>
          <p className="mt-6 font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Singapore · Actor · Coach · Storyteller</p>
          <h1 className="sr-only">Connect with Asher Aw</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone/75 sm:text-base">Every way to reach Asher, in one place. Pick whatever&rsquo;s easiest for you.</p>
        </div>

        <div className="mt-10 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-start gap-4 rounded-2xl border p-4 transition-all ${l.primary ? "border-spotlight/40 bg-spotlight/10 hover:border-spotlight hover:bg-spotlight/20" : "border-amber-faint bg-stage/40 hover:border-spotlight/40 hover:bg-spotlight/[0.03]"}`}
            >
              <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-spotlight ${l.primary ? "border-spotlight/40 bg-spotlight/10" : "border-spotlight/30 bg-spotlight/5"}`}>
                <l.icon size={18} />
              </div>
              <div className="flex-1">
                <p className={`font-mono-stage text-[10px] uppercase tracking-[0.2em] ${l.primary ? "text-spotlight/80" : "text-stone/60"}`}>{l.label}</p>
                <p className="text-base font-medium text-ivory transition-colors group-hover:text-spotlight">{l.value}</p>
                {l.note && <p className="mt-1.5 text-xs leading-relaxed text-stone/60">{l.note}</p>}
              </div>
              <ArrowUpRight size={16} className="mt-1 shrink-0 text-stone/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-spotlight" />
            </a>
          ))}
        </div>

        <div className="mt-4">
          <ContactPills />
        </div>

      </div>
    </main>
  );
}
