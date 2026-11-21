"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";

const GTM_ID = "GTM-PVCX5DQ";
// Microsoft Clarity (heatmaps + session recordings) -- clarity.microsoft.com
// -> Settings -> Setup -> Install tracking code. Project ID for asheraw.com.
const CLARITY_PROJECT_ID = "xw9besolc9";
// Meta Pixel "AsherAw.com" (Events Manager), created 2026-11-21 for retargeting
// ads. Not the old "Sig Strat Pixel" -- that one belongs to significancestrategy.com.
const META_PIXEL_ID = "975936355230100";
// Sales letter: also fires ViewContent so ads can retarget people who read it.
const SALES_PAGES = ["/contenttoclients"];

type Fbq = (...args: unknown[]) => void;

export function Analytics() {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();

  // Meta Pixel lives entirely in this effect (no <Script>), so every page --
  // first load and each client-side route change -- fires exactly once, from
  // one place. Same consent gate as GTM/Clarity: nothing runs until "granted".
  // trackSingle keeps these events on this pixel only (GTM loads an older one).
  useEffect(() => {
    if (!allowed) return;
    const w = window as unknown as { fbq?: Fbq };
    if (!w.fbq) {
      // Standard Meta base code, unrolled: queueing stub + async fbevents.js.
      /* eslint-disable */
      (function (f: any, b: Document, e: string, v: string) {
        if (f.fbq) return;
        const n: any = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = true; t.src = v;
        const s = b.getElementsByTagName(e)[0];
        s.parentNode!.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
      w.fbq!("init", META_PIXEL_ID);
    }
    const fbq = w.fbq!;
    fbq("trackSingle", META_PIXEL_ID, "PageView");
    if (SALES_PAGES.includes(pathname)) fbq("trackSingle", META_PIXEL_ID, "ViewContent", { content_name: pathname });
  }, [allowed, pathname]);

  useEffect(() => {
    setAllowed(getConsent() === "granted");

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setAllowed(detail === "granted");
    };

    window.addEventListener(CONSENT_EVENT, handleChange);
    return () => window.removeEventListener(CONSENT_EVENT, handleChange);
  }, []);

  if (!allowed) return null;

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="gtm"
        />
      </noscript>
      {/* Same consent gate as GTM above -- this whole component already
          returns null until "allowed" is true, so Clarity never loads
          before analytics is accepted either. Single small async script,
          same shape/weight as GTM's own loader snippet. */}
      {CLARITY_PROJECT_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      )}
    </>
  );
}
