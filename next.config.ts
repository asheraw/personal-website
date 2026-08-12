import type { NextConfig } from "next";

// Every external domain the public site actually loads a script/image/frame/
// connection from -- started by grepping every component that touches a
// third-party URL, then corrected twice against what a real browser actually
// tried to reach: once against a local production build (caught
// *.api.sanity.io, used by a library-internal live-connection component, not
// this codebase's own code), and once against the actual deployed site
// (caught static.cloudflareinsights.com, a beacon script Vercel's own
// hosting infrastructure injects automatically -- not from this repo or any
// of its dependencies at all, impossible to find by reading source). See
// RUNBOOK.md's "Security headers" section for the full list and why each
// one's there. `'unsafe-inline'` is a deliberate,
// documented tradeoff (not an oversight): Google Tag Manager's own bootstrap
// snippet, Microsoft Clarity's loader, and the JSON-LD structured-data blocks
// are all inline <script> tags with no nonce wiring in this codebase, so a
// strict script-src would break them outright. This CSP still blocks the
// most common real-world case -- a script loaded from an attacker-controlled
// domain -- it just doesn't fully close the inline-injection gap a nonce-based
// setup would. `/studio/*` is deliberately excluded entirely (see headers()
// below): Sanity Studio is a complex authenticated SPA that needs much
// broader permissions than this list to function, and getting that wrong
// risks breaking the one tool Asher relies on daily.
const PUBLIC_SITE_CSP = [
  "default-src 'self'",
  // static.cloudflareinsights.com -- not from this codebase or any of its
  // dependencies either; caught only by testing the real deployed site,
  // where Vercel's own hosting infrastructure injects this beacon script
  // automatically on every page, outside anything this repo controls.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.instagram.com https://connect.facebook.net https://www.clarity.ms https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  // https://*.giphy.com -- comment GIFs render as a plain hotlinked <img>
  // straight from Giphy's own CDN (see CommentSection.tsx's CommentGif and
  // gif-search/route.ts), never rehosted; caught locally with a real
  // browser before this ever reached production, not assumed from source.
  "img-src 'self' data: https://cdn.sanity.io https://www.google-analytics.com https://www.facebook.com https://www.clarity.ms https://*.clarity.ms https://*.giphy.com",
  "font-src 'self' data:",
  // https://*.api.sanity.io -- not found by grepping this codebase's own
  // components; caught only by actually loading the page and watching the
  // browser console for real CSP violations. <SanityLive/> (next-sanity/
  // live, mounted in (site)/layout.tsx) opens a real-time connection
  // straight from the visitor's own browser to keep pages fresh without a
  // full reload -- easy to miss by reading source, since it's inside a
  // library, not this codebase's own components.
  // https://*.apicdn.sanity.io -- a genuinely different hostname from
  // *.api.sanity.io above, not covered by that wildcard (caught the same
  // way: a real browser console error, not visible from reading source).
  // CookieConsent.tsx is the first client-side component in this codebase
  // to fetch from Sanity directly (to pick a random banner-copy variant) --
  // it uses the same shared `client` (src/sanity/lib/client.ts) every
  // server component already uses, which has useCdn:true baked in, so its
  // reads route through Sanity's CDN subdomain specifically, not the plain
  // API one SanityLive happens to use.
  "connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms https://connect.facebook.net https://www.facebook.com https://*.cloudflareinsights.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.instagram.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: PUBLIC_SITE_CSP },
  // Redundant with the CSP's own frame-ancestors 'self' on every modern
  // browser -- kept alongside it because some older browsers and automated
  // security scanners only recognize this header, not the CSP directive.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  // pdfkit (PDF export, src/lib/exportPdf.ts) reads its own bundled font
  // metric files (Helvetica.afm etc.) from disk at runtime via a
  // __dirname-relative path. Bundling it into the server build rewrites
  // that path and breaks the read (confirmed directly -- it fails with
  // ENOENT on a bundler-mangled path). Marking it external tells Next.js
  // to require() it straight from node_modules at runtime instead, so its
  // own relative paths stay intact.
  serverExternalPackages: ["pdfkit"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
      { protocol: "https", hostname: "z-cdn.chatglm.cn", pathname: "/**" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  // Excludes /studio -- Sanity Studio is a complex authenticated SPA that
  // needs far broader script/style/connect permissions than the public
  // site's CSP allows (dynamic imports, its own realtime connection to
  // Sanity, etc.), and getting that wrong risks breaking Asher's own daily
  // editing tool rather than protecting a visitor. Same negative-match
  // pattern already used in middleware.ts's own matcher.
  async headers() {
    return [
      {
        source: "/((?!studio).*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
