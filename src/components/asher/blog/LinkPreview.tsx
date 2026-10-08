"use client";

import { useEffect, useRef, useState } from "react";

type Preview = { title: string; description: string; image?: string; domain: string };
type Card = { preview: Preview; top: number; left: number; above: boolean };

const CARD_W = 320;
const SHOW_DELAY_MS = 350;
const HIDE_DELAY_MS = 120;

// Hover preview for links inside a post body. One listener on the document
// (event delegation), so it also covers links rendered later. Only reacts to
// links inside an element marked data-link-preview, and only on devices that
// can really hover -- touch screens just follow the link as before.
export function LinkPreview() {
  const [card, setCard] = useState<Card | null>(null);
  const cache = useRef(new Map<string, Preview | null>());
  const showTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);
  const current = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const place = (a: HTMLAnchorElement, preview: Preview) => {
      const r = a.getBoundingClientRect();
      const above = r.bottom + 220 > window.innerHeight && r.top > 240;
      setCard({
        preview,
        above,
        top: above ? r.top - 8 : r.bottom + 8,
        left: Math.max(12, Math.min(r.left, window.innerWidth - CARD_W - 12)),
      });
    };

    const open = async (a: HTMLAnchorElement) => {
      const href = a.href;
      let preview = cache.current.get(href);
      if (preview === undefined) {
        try {
          const res = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`);
          preview = res.ok ? ((await res.json()) as Preview) : null;
        } catch {
          preview = null;
        }
        cache.current.set(href, preview);
      }
      if (preview && current.current === a) place(a, preview);
    };

    const onOver = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !a.closest("[data-link-preview]")) return;
      const href = a.getAttribute("href") || "";
      if (!/^(https?:\/\/|\/(?!\/))/.test(href)) return; // skips #anchors, mailto:, tel:
      window.clearTimeout(hideTimer.current);
      if (current.current === a) return;
      current.current = a;
      window.clearTimeout(showTimer.current);
      showTimer.current = window.setTimeout(() => open(a), SHOW_DELAY_MS);
    };

    const onOut = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || a !== current.current) return;
      window.clearTimeout(showTimer.current);
      hideTimer.current = window.setTimeout(() => {
        current.current = null;
        setCard(null);
      }, HIDE_DELAY_MS);
    };

    const hide = () => {
      window.clearTimeout(showTimer.current);
      current.current = null;
      setCard(null);
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", hide);
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!card) return null;
  const { preview } = card;
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 animate-in fade-in-0 zoom-in-95 overflow-hidden rounded-xl border border-amber-faint bg-stage shadow-2xl duration-150 print:hidden"
      style={{ width: CARD_W, left: card.left, top: card.top, transform: card.above ? "translateY(-100%)" : undefined }}
    >
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          className="h-36 w-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="p-4">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight/80">{preview.domain}</p>
        <p className="mt-1.5 font-display text-base font-semibold leading-snug text-ivory">{preview.title}</p>
        {preview.description && <p className="mt-1.5 text-sm leading-relaxed text-stone/80">{preview.description}</p>}
      </div>
    </div>
  );
}
