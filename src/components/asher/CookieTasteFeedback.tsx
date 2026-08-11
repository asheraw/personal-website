"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Only ever shown from the "cookie tasting" consent-banner variant (see
// CookieConsent.tsx) -- a tiny, fully anonymous reaction form. No name, no
// email, nothing that could be linked back to a specific visitor; posts a
// bare set of choices to /api/track-cookie-feedback. The three playful
// categories map to real things about the site (see the hint line under
// each), not just decoration -- Asher's own framing, since he wants
// feedback that actually tells him something about colours/writing/feel.
const SCALE = [
  { value: 1, emoji: "😕" },
  { value: 2, emoji: "🙂" },
  { value: 3, emoji: "😋" },
  { value: 4, emoji: "🤩" },
] as const;

const CATEGORIES = [
  { key: "colours", label: "The colours", hint: "the look — palette, dark/light mode, how it feels visually" },
  { key: "taste", label: "The taste", hint: "the writing itself — the posts, the voice, whether it's worth reading" },
  { key: "texture", label: "The texture", hint: "how it feels to use — navigation, animations, getting around" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];
type Ratings = Partial<Record<CategoryKey, number>>;

export function CookieTasteFeedback({ onClose }: { onClose: () => void }) {
  const [ratings, setRatings] = useState<Ratings>({});
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const allRated = CATEGORIES.every((c) => ratings[c.key] !== undefined);

  async function submit() {
    setStatus("sending");
    try {
      await fetch("/api/track-cookie-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ratings, comment: comment.trim() || undefined }),
        keepalive: true,
      });
    } catch {
      // Anonymous and low-stakes -- if it fails, it fails silently rather
      // than nagging the visitor with an error for a bonus feedback form.
    }
    setStatus("sent");
  }

  // Auto-close a couple seconds after a successful send, so this doesn't
  // linger and require a manual close before getting back to whatever's
  // underneath (Accept/Decline hasn't necessarily happened yet).
  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  // A centered modal with its own backdrop (same pattern as
  // ImageLightbox.tsx), not another bottom-anchored bar -- the consent
  // banner this launches from already owns that strip of the screen, and
  // stacking a second full-width bar there caused this panel to sit on top
  // of Accept/Decline, blocking them until the visitor closed this first.
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="How was the cookie?"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-xl border border-border bg-background p-4 shadow-lg"
      >
        {status === "sent" ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Thanks for the taste test — genuinely helpful.</p>
            <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">How was the cookie? 🍪</p>
              <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((c) => (
                <div key={c.key}>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{c.label}</span> — {c.hint}
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    {SCALE.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        aria-label={`${c.label}: ${s.value} of 4`}
                        onClick={() => setRatings((prev) => ({ ...prev, [c.key]: s.value }))}
                        className={`rounded-md border px-2.5 py-1 text-base transition-colors ${
                          ratings[c.key] === s.value ? "border-foreground bg-foreground/10" : "border-border hover:border-foreground/40"
                        }`}
                      >
                        {s.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything else? (optional)"
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />
              <Button size="sm" disabled={!allRated || status === "sending"} onClick={submit} className="w-full">
                {status === "sending" ? "Sending..." : "Send anonymously"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
