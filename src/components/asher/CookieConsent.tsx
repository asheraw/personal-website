"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { client } from "@/sanity/lib/client";
import { getConsent, setConsent } from "@/lib/consent";
import { track } from "@/lib/analytics";
import { CookieTasteFeedback } from "./CookieTasteFeedback";

// How long to wait before showing the banner at all -- avoids the
// reflexive "close whatever that is" dismissal before anyone's actually
// looked at anything.
const SHOW_DELAY_MS = 10_000;

type Variant = {
  _key: string;
  text: string;
  linkText?: string;
  linkHref?: string;
  afterLink?: string;
  declineLabel: string;
  acceptLabel: string;
  showTasteLink?: boolean;
};

// Editable in Studio (Cookie Banner Copy) rather than hardcoded here --
// Asher asked to be able to tweak wording, add, or remove variants himself
// without needing a code change each time. One is picked at random every
// time the banner is about to show, not stuck to one per visitor. This is
// only ever used if the Sanity fetch below fails or the document has no
// variants yet (e.g. a fresh dataset before the singleton's been seeded) --
// a real network problem shouldn't mean the banner silently never appears
// and analytics consent never gets asked at all.
const FALLBACK_VARIANT: Variant = {
  _key: "fallback",
  text: "This site uses cookies to understand how it's used. Analytics only load if you say yes.",
  declineLabel: "Decline",
  acceptLabel: "Accept",
};

function useBannerVariant(): Variant | null {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<{ variants?: Variant[] } | null>(`*[_type == "cookieBannerCopy"][0]{variants}`)
      .then((doc) => {
        if (cancelled) return;
        const variants = doc?.variants ?? [];
        const picked = variants.length > 0 ? variants[Math.floor(Math.random() * variants.length)] : FALLBACK_VARIANT;
        setVariant(picked);
      })
      .catch(() => {
        if (!cancelled) setVariant(FALLBACK_VARIANT);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return variant;
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
function trackConsentChoice(choice: "accepted" | "declined", variantKey: string) {
  fetch("/api/track-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice, variant: variantKey }),
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
  const [delayElapsed, setDelayElapsed] = useState(false);
  const variant = useBannerVariant();
  const consentAlreadyDecided = useRef(getConsent() !== "unset");

  useEffect(() => {
    if (consentAlreadyDecided.current) return;
    const timer = setTimeout(() => setDelayElapsed(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!delayElapsed || !variant) return;
    // Re-check rather than trust the ref -- consent could have been set
    // some other way (another tab) during the delay/fetch window.
    if (getConsent() === "unset") setVisible(true);
  }, [delayElapsed, variant]);

  return (
    <>
      {visible && variant && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span>
                {variant.text}
                {variant.linkText && variant.linkHref && (
                  <>
                    {" "}
                    <a
                      href={variant.linkHref}
                      className="underline underline-offset-2 hover:no-underline"
                      target={/^https?:\/\//.test(variant.linkHref) ? "_blank" : undefined}
                      rel="noreferrer"
                    >
                      {variant.linkText}
                    </a>
                  </>
                )}
                {variant.afterLink}
              </span>
              {variant.showTasteLink && (
                <button
                  type="button"
                  onClick={() => setShowTaste(true)}
                  className="mt-1 block underline underline-offset-2 hover:no-underline"
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
                  trackConsentChoice("declined", variant._key);
                  setConsent("denied");
                  setVisible(false);
                }}
              >
                {variant.declineLabel}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  trackConsentChoice("accepted", variant._key);
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
