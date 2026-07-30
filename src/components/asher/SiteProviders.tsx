"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/asher/ThemeProvider";
import { SiteChromeProvider } from "@/components/asher/SiteChromeConfig";

// Bundles the two providers every page needs for a consistent,
// globally-rendered SiteHeader/SiteFooter. Used by the (site) route
// group's layout, and separately by not-found.tsx, which sits outside
// that group (Next.js requires the root not-found.tsx to catch
// genuinely unmatched URLs, so it can't share that layout) but should
// still look and behave identically.
export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SiteChromeProvider>{children}</SiteChromeProvider>
    </ThemeProvider>
  );
}
