"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent } from "@/lib/consent";
import { track } from "@/lib/analytics";
import { CookieTasteFeedback } from "./CookieTasteFeedback";

// How long to wait before showing the banner at all -- asked for directly
// (2026-08-11): showing it the instant the page loads invites a reflexive
// "close whatever that is" dismissal before anyone's actually looked at
// anything. A visitor who's stuck around a few seconds is at least reading.
const SHOW_DELAY_MS = 10_000;

type Variant = {
  id: "current" | "formal" | "cookieTasting";
  body: React.ReactNode;
  declineLabel: string;
  acceptLabel: string;
  showTasteLink?: boolean;
};

// Three copies, picked at random each time the banner is about to show (not
// stuck to one per visitor) -- Asher's own experiment, run manually: "current"
// is what's been live, "formal" is the exact wording this banner used before
// (pulled from git history, not rewritten from memory), "cookieTasting" is a
// new playful version paired with a tiny anonymous feedback form. No
// automatic winner-picking -- see the dashboard's Cookie Consent card for the
// per-variant accept/decline split, reviewed by hand.
const VARIANTS: Variant[] = [
  {
    id: "current",
    body: (
      <>
        I&apos;m making this site better. I just need to see what you click and how long you stick
        around—but nothing identifies you.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
          Privacy Policy
        </Link>{" "}
        here. Click Accept to help me out, thanks!
      </>
    ),
    declineLabel: "Decline",
    acceptLabel: "Accept",
  },
  {
    id: "formal",
    body: (
      <>
        This site uses cookies to understand how it&apos;s used, including heatmaps and session recordings.
        Analytics only load if you say yes — nothing is tracked otherwise. See the{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
          Privacy Policy
        </Link>
        .
      </>
    ),
    declineLabel: "Decline",
    acceptLabel: "Accept",
  },
  {
    id: "cookieTasting",
    body: (
      <>
        🍪 Got a cookie for you — the digital kind. One bite tells me what you clicked and how long you
        lingered, nothing that says who you are.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
          Privacy Policy
        </Link>{" "}
        if you want the fine print.
      </>
    ),
    declineLabel: "No thanks",
    acceptLabel: "Take a bite",
    showTasteLink: true,
  },
];

function pickVariant(): Variant {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

// Records the accept/decline click itself -- separate from whether
// analytics is later allowed to run afterward. Two channels, because
// GA/GTM can only ever tell half the story: it doesn't load at all for a
// visitor who declines (see Analytics.tsx), so there's no tag inside
// Google Analytics that could ever see a decline. The first-party POST
// (Sanity-backed, see /api/track-consent) is the reliable total for both
// choices; the dataLayer event is a bonus for Accept specifically, in
// case Asher wants to see it alongside other GA behavior for people who
// opted in -- track() itself only pushes if `window.dataLayer` already
// exists, which it won't yet at the exact moment of this click (GTM's own
// script hasn't loaded), so the array is seeded here first.
function trackConsentChoice(choice: "accepted" | "declined", variant: Variant["id"]) {
  fetch("/api/track-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice, variant }),
    keepalive: true,
  }).catch(() => {});

  if (choice === "accepted") {
    window.dataLayer = window.dataLayer || [];
    track({ action: "cookie_consent", category: "privacy", label: "accepted" });
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showTaste, setShowTaste] = useState(false);
  const variantRef = useRef<Variant | null>(null);
  if (variantRef.current === null) variantRef.current = pickVariant();
  const variant = variantRef.current;

  useEffect(() => {
    if (getConsent() !== "unset") return;
    const timer = setTimeout(() => {
      // Re-check rather than trust the closure -- consent could have been
      // set some other way (another tab) during the delay window.
      if (getConsent() === "unset") setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p>{variant.body}</p>
              {variant.showTasteLink && (
                <button
                  type="button"
                  onClick={() => setShowTaste(true)}
                  className="mt-1 underline underline-offset-2 hover:no-underline"
                >
                  Already had a nibble? Tell me how it tasted →
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  trackConsentChoice("declined", variant.id);
                  setConsent("denied");
                  setVisible(false);
                }}
              >
                {variant.declineLabel}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  trackConsentChoice("accepted", variant.id);
                  setConsent("granted");
                  setVisible(false);
                }}
              >
                {variant.acceptLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showTaste && <CookieTasteFeedback onClose={() => setShowTaste(false)} />}
    </>
  );
}
