"use client";

import { Instagram, Linkedin, Youtube, Mail, MessageCircle, Twitter, Music2 } from "lucide-react";

type StoryNav = { title: string; links: { label: string; href: string }[] };

const STORY_NAV: StoryNav[] = [
  { title: "Stage", links: [{ label: "Theatre", href: "#stage" }, { label: "Selected Roles", href: "#stage" }, { label: "Directing", href: "#stage" }] },
  { title: "Coaching", links: [{ label: "Personal Branding", href: "#coaching" }, { label: "Storytelling", href: "#coaching" }, { label: "AI-Assisted Content", href: "#coaching" }, { label: "Workshops", href: "#contact" }] },
  { title: "More", links: [{ label: "At a Glance", href: "#glance" }, { label: "Two Callings", href: "#two-callings" }, { label: "Philosophy", href: "#philosophy" }, { label: "Faith", href: "#faith" }] },
  { title: "Connect", links: [{ label: "WhatsApp", href: "https://wa.me/6591881944" }, { label: "Email", href: "mailto:asher@asheraw.com" }, { label: "Book a Session", href: "#contact" }] },
];

const PLAY_NAV: StoryNav[] = [];

const SOCIALS = [
  { icon: Youtube, href: "https://www.youtube.com/@itsAsherAw", label: "YouTube" },
  { icon: Instagram, href: "https://www.instagram.com/itsAsherAw", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/itsAsherAw", label: "LinkedIn" },
  { icon: Music2, href: "https://www.tiktok.com/@itsAsherAw", label: "TikTok" },
  { icon: Twitter, href: "https://x.com/AsherAw", label: "X" },
  { icon: Mail, href: "mailto:asher@asheraw.com", label: "Email" },
  { icon: MessageCircle, href: "https://wa.me/6591881944", label: "WhatsApp" },
];

export function SiteFooter({ mode = "story" }: { mode?: "story" | "play" }) {
  const navGroups = mode === "play" ? PLAY_NAV : STORY_NAV;
  return (
    <footer className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-16 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(217,152,70,0.08) 0%, transparent 60%)" }} />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-6 border-b border-amber-faint pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Singapore · 1984</p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">Asher <span className="text-spotlight">Aw</span></h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone/75">Actor. Coach. Storyteller. Helping people communicate ideas that connect, inspire, and move others.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel={s.href.startsWith("http") ? "noreferrer" : undefined} aria-label={s.label} title={s.label} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:bg-spotlight/5 hover:text-spotlight">
                <s.icon size={18} />
              </a>
            ))}
          </div>
        </div>
        {navGroups.length > 0 && (
          <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/70">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noreferrer" : undefined} className="group inline-flex items-center text-sm text-stone/80 transition-colors hover:text-ivory">
                        <span className="mr-0 w-0 overflow-hidden text-spotlight transition-all group-hover:mr-2 group-hover:w-3">→</span>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4 border-t border-amber-faint pt-8 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2009 - {new Date().getFullYear()} Asher Aw · All rights reserved</p>
          <p>Crafted in Singapore · <span className="text-spotlight/60">Stories connect people</span></p>
        </div>
      </div>
    </footer>
  );
}
