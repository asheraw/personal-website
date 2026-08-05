import type { NextConfig } from "next";

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
};

export default nextConfig;
