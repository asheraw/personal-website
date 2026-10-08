import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

// Feeds the hover preview card on links inside blog posts (see
// LinkPreview.tsx). Internal /blog/<slug> links read straight from Sanity;
// anything else gets its title/description read from the page's own
// <meta> tags. Fetching an arbitrary URL on a visitor's behalf is an SSRF
// risk, so every hop is checked against private/loopback address ranges
// before it is requested.
const SITE_HOST = "asheraw.com";

type Preview = { title: string; description: string; image?: string; domain: string };

function isPrivateAddress(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
  );
}

async function assertPublicHost(hostname: string) {
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("blocked");
    return;
  }
  const addrs = await lookup(hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("blocked");
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function meta(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"));
    const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"));
    const v = (a || b)?.[1];
    if (v) return decode(v);
  }
}

async function fetchHtml(startUrl: string): Promise<{ html: string; url: string }> {
  let url = new URL(startUrl);
  for (let hop = 0; hop < 3; hop++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("blocked");
    await assertPublicHost(url.hostname);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; asheraw.com link preview)", accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) throw new Error("not html");
    // Only the <head> matters, so stop reading after 200KB.
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < 200_000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { html: Buffer.concat(chunks).toString("utf8"), url: url.toString() };
  }
  throw new Error("too many redirects");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw || raw.length > 2000) return NextResponse.json({ error: "bad url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw, `https://${SITE_HOST}`);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  const headers = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };

  try {
    const isOwn = target.hostname === SITE_HOST || target.hostname === `www.${SITE_HOST}`;
    const postMatch = isOwn && target.pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (postMatch) {
      const post = await client.fetch<{ title: string; blurb?: string; mainImage?: { asset?: { _ref: string } } } | null>(
        `*[_type == "post" && slug.current == $slug][0]{title, "blurb": coalesce(excerpt, pt::text(body)[0...200]), mainImage}`,
        { slug: decodeURIComponent(postMatch[1]) },
      );
      if (post) {
        const preview: Preview = {
          title: post.title,
          description: (post.blurb || "").slice(0, 160),
          image: post.mainImage?.asset ? urlFor(post.mainImage).width(560).height(300).fit("crop").format("jpg").quality(70).url() : undefined,
          domain: SITE_HOST,
        };
        return NextResponse.json(preview, { headers });
      }
    }

    const { html, url } = await fetchHtml(target.toString());
    const title = meta(html, ["og:title", "twitter:title"]) || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "");
    if (!title) throw new Error("no title");
    const preview: Preview = {
      title: title.slice(0, 120),
      description: (meta(html, ["og:description", "twitter:description", "description"]) || "").slice(0, 160),
      // Remote images are not shown: the site's CSP only allows its own and Sanity's image hosts.
      image: isOwn ? meta(html, ["og:image"]) : undefined,
      domain: new URL(url).hostname.replace(/^www\./, ""),
    };
    return NextResponse.json(preview, { headers });
  } catch {
    return NextResponse.json({ error: "no preview" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } });
  }
}
