"use client";

import { useEffect, useRef, useState } from "react";

type Preview = { title: string; description: string; image?: string; domain: string };
type Card = { preview: Preview | null; // null = still loading
   top: number; left: number; above: boolean };

const CARD_W = 320;
const SHOW_DELAY_MS = 350;
const HIDE_DELAY_MS = 120;
const WARM_COUNT = 5;

const isPreviewable = (href: string) => /^(https?:\/\/|\/(?!\/))/.test(href); // skips #anchors, mailto:, tel:

// Used when a site blocks previews (X, Instagram, LinkedIn...) so the card
// still says where the link goes.
function fallbackPreview(href: string): Preview {
  const domain = new URL(href, window.location.href).hostname.replace(/^www\./, "");
  return { title: `Link to ${domain}`, description: "No preview available. Click to open the page.", domain };
}

// Hover preview for links inside a post body. One listener on the document
// (event delegation), so it also covers links rendered later. Only reacts to
// links inside an element marked data-link-preview, and only on devices that
// can really hover -- touch screens just follow the link as before.
export function LinkPreview() {
  const [card, setCard] = useState<Card | null>(null);
  // Holds the request itself, not just the result, so a hover while a warm-up fetch is still in flight reuses it.
  const cache = useRef(new Map<string, Promise<Preview>>());
  const settled = useRef(new Set<string>());
  const showTimer = useRef<number | undefined>(undefined);
  const hideTimer = useRef<number | undefined>(undefined);
  const current = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const place = (a: HTMLAnchorElement, preview: Preview | null) => {
      const r = a.getBoundingClientRect();
      const above = r.bottom + 220 > window.innerHeight && r.top > 240;
      setCard({
        preview,
        above,
        top: above ? r.top - 8 : r.bottom + 8,
        left: Math.max(12, Math.min(r.left, window.innerWidth - CARD_W - 12)),
      });
    };

    const load = (href: string): Promise<Preview> => {
      let req = cache.current.get(href);
      if (!req) {
        req = fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
          .then((res) => (res.ok ? (res.json() as Promise<Preview>) : fallbackPreview(href)))
          .catch(() => fallbackPreview(href))
          .then((preview) => {
            settled.current.add(href);
            return preview;
          });
        cache.current.set(href, req);
      }
      return req;
    };

    const open = async (a: HTMLAnchorElement) => {
      if (!settled.current.has(a.href)) place(a, null);
      const preview = await load(a.href);
      if (current.current === a) place(a, preview);
    };

    // Warm the first few links once the page is idle, one at a time, so most
    // hovers find the preview already waiting.
    const warm = async () => {
      const seen = new Set<string>();
      const links = document.querySelectorAll<HTMLAnchorElement>("[data-link-preview] a[href]");
      for (const a of links) {
        if (seen.size >= WARM_COUNT) break;
        if (!isPreviewable(a.getAttribute("href") || "") || seen.has(a.href)) continue;
        seen.add(a.href);
        await load(a.href);
      }
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const warmTimer = idle ? idle(warm) : window.setTimeout(warm, 1500);

    const onOver = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !a.closest("[data-link-preview]")) return;
      const href = a.getAttribute("href") || "";
      if (!isPreviewable(href)) return;
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
  if (!preview) {
    return (
      <div
        role="tooltip"
        aria-busy="true"
        className="pointer-events-none fixed z-50 animate-in fade-in-0 overflow-hidden rounded-xl border border-amber-faint bg-stage shadow-2xl duration-150 print:hidden"
        style={{ width: CARD_W, left: card.left, top: card.top, transform: card.above ? "translateY(-100%)" : undefined }}
      >
        <div className="p-4">
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight/80">Loading preview…</p>
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-ivory/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-ivory/10" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-ivory/10" />
        </div>
      </div>
    );
  }
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
