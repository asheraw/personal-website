import type { Metadata } from "next";
import { NotFoundContent } from "@/components/asher/NotFoundContent";

// A plain Server Component so this can export metadata -- Next.js doesn't
// allow that from a "use client" file, but the 404 page needs client hooks
// (usePathname, tracking on mount), which now live in NotFoundContent.tsx
// instead. Without this, the browser tab just showed the raw URL
// ("asheraw.com/404") since there was nothing to fall back to.
// No title template to inherit here -- this file sits at the app root
// (outside the (site) route group, which is where the "%s · Asher Aw"
// template is defined), so the full title is spelled out explicitly.
export const metadata: Metadata = {
  title: "Page Not Found · Asher Aw",
  description: "This page doesn't exist on asheraw.com — wrong link, an old page that got removed, or a typo.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
