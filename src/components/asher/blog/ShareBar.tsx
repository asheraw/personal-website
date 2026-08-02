"use client";

import { useEffect, useState } from "react";
import { Twitter, Facebook, Linkedin, MessageCircle, Mail, Link2, Check, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

type LinkTarget = {
  label: string;
  icon: typeof Twitter;
  href: string;
};

// One central place a reader is nudged to actually reshare a post, rather
// than needing to copy the URL out of the address bar by hand. Every link
// here just opens the target platform's own share-intent URL -- no SDKs,
// no third-party embeds, nothing that phones home before a reader has
// actually clicked anything.
function buildTargets(url: string, title: string): LinkTarget[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return [
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];
}

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  // Checked only after mount, not inline during render -- navigator.share
  // exists on the client but not during server rendering, so testing it
  // directly in the render body would make the very first client render
  // (hydration) disagree with the server-rendered HTML.
  const [canNativeShare, setCanNativeShare] = useState(false);
  const targets = buildTargets(url, title);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track({ action: "share_click", category: "engagement", label: "copy_link" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable (some in-app browsers) --
      // nothing to recover into here, the reader can still select the URL
      // from the address bar themselves.
    }
  }

  // navigator.share opens the OS's own native share sheet -- present on
  // most mobile browsers, essentially never on desktop. Shown as one extra
  // option alongside the per-platform links below, not a replacement for
  // them, since desktop readers (most of this site's traffic) never get it.
  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ url, title });
      track({ action: "share_click", category: "engagement", label: "native" });
    } catch {
      // AbortError when the reader just closes the native sheet without
      // picking anything -- not a real failure, nothing to show for it.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-amber-faint pt-8 print:hidden">
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">Share this post</p>
      <div className="flex flex-wrap items-center gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Share"
            title="Share"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:bg-spotlight/5 hover:text-spotlight"
          >
            <Share2 size={16} />
          </button>
        )}
        {targets.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share on ${t.label}`}
            title={`Share on ${t.label}`}
            onClick={() => track({ action: "share_click", category: "engagement", label: t.label.toLowerCase() })}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:bg-spotlight/5 hover:text-spotlight"
          >
            <t.icon size={16} />
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? "Link copied" : "Copy link"}
          title={copied ? "Link copied" : "Copy link"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint text-stone/80 transition-all hover:border-spotlight/50 hover:bg-spotlight/5 hover:text-spotlight"
        >
          {copied ? <Check size={16} className="text-spotlight" /> : <Link2 size={16} />}
        </button>
      </div>
    </div>
  );
}
