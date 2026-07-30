import { ConfigureSiteChrome } from "@/components/asher/SiteChromeConfig";

// SiteHeader/SiteFooter now render globally from the (site) layout, so this
// just needs to label blog pages for analytics and keep the top padding
// that clears the fixed header.
export function BlogChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stage text-ivory">
      <ConfigureSiteChrome context="blog" />
      <main className="pt-28 pb-16">{children}</main>
    </div>
  );
}
