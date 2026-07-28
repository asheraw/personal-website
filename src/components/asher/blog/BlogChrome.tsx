import { SiteHeader } from "@/components/asher/SiteHeader";
import { SiteFooter } from "@/components/asher/SiteFooter";

export function BlogChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stage text-ivory">
      <SiteHeader />
      <main className="pt-28 pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
