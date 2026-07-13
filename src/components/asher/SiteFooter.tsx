"use client";

import { Instagram, Linkedin, Youtube, Mail } from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Stage",
    links: [
      { label: "Theatre", href: "#stage" },
      { label: "Selected Roles", href: "#stage" },
      { label: "Directing", href: "#stage" },
    ],
  },
  {
    title: "Coaching",
    links: [
      { label: "Personal Branding", href: "#coaching" },
      { label: "Storytelling", href: "#coaching" },
      { label: "AI-Assisted Content", href: "#coaching" },
      { label: "Workshops", href: "#contact" },
    ],
  },
  {
    title: "Reflections",
    links: [
      { label: "Latest Essays", href: "#reflections" },
      { label: "Storytelling", href: "#reflections" },
      { label: "AI & Creativity", href: "#reflections" },
      { label: "Faith & Theatre", href: "#faith" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Book a Session", href: "#contact" },
      { label: "Workshops", href: "#contact" },
      { label: "Speaking", href: "#contact" },
      { label: "Email", href: "mailto:hello@asheraw.sg" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-amber-faint bg-stage px-5 py-16 sm:px-8 lg:px-12">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(217,152,70,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1500px]">
        {/* Top — name + tagline */}
        <div className="flex flex-col gap-6 border-b border-amber-faint pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">
              Singapore · Est. MMXXVI
            </p>
            <h3 className="mt-3 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
              Asher<span className="text-spotlight">.</span>Aw
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone/75">
              Actor. Coach. Storyteller. Helping people communicate ideas that
              connect, inspire, and move others.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[
              { icon: Mail, href: "mailto:hello@asheraw.sg", label: "Email" },
              { icon: Instagram, href: "#", label: "Instagram" },
              { icon: Linkedin, href: "#", label: "LinkedIn" },
              { icon: Youtube, href: "#", label: "YouTube" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:bg-spotlight/5 hover:text-spotlight"
              >
                <s.icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Middle — nav columns */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-spotlight/70">
                {group.title}
              </p>
              <ul className="mt-4 space-y-3">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="group inline-flex items-center text-sm text-stone/80 transition-colors hover:text-ivory"
                    >
                      <span className="mr-0 w-0 overflow-hidden text-spotlight transition-all group-hover:mr-2 group-hover:w-3">
                        →
                      </span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom — meta */}
        <div className="flex flex-col gap-4 border-t border-amber-faint pt-8 font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Asher Aw · All rights reserved</p>
          <p>
            Crafted in Singapore ·{" "}
            <span className="text-spotlight/60">Stories connect people</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
