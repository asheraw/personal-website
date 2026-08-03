"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent } from "@/lib/consent";
import { track } from "@/lib/analytics";

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
function trackConsentChoice(choice: "accepted" | "declined") {
  fetch("/api/track-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice }),
    keepalive: true,
  }).catch(() => {});

  if (choice === "accepted") {
    window.dataLayer = window.dataLayer || [];
    track({ action: "cookie_consent", category: "privacy", label: "accepted" });
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === "unset");
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          I&apos;m making this site better. I just need to see what you click and how long you stick
          around—but nothing identifies you.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
            Privacy Policy
          </Link>{" "}
          here. Click Accept to help me out, thanks!
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              trackConsentChoice("declined");
              setConsent("denied");
              setVisible(false);
            }}
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={() => {
              trackConsentChoice("accepted");
              setConsent("granted");
              setVisible(false);
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
