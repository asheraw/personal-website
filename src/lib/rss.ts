/**
 * Shared by the site-wide feed (src/app/rss.xml) and the per-category/tag/
 * author feeds under /blog/**\/rss.xml -- same item/channel XML shape
 * either way, just a different title, description, link, and post list
 * feeding in, so this is the one place that shape lives.
 */
import type { PostSummary } from "@/sanity/lib/queries";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SITE_URL = "https://asheraw.com";

export function buildRssFeed({
  title,
  description,
  link,
  selfUrl,
  posts,
}: {
  title: string;
  description: string;
  link: string;
  selfUrl: string;
  posts: PostSummary[];
}): string {
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : undefined;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
      ${post.author ? `<author>${escapeXml(post.author.name)}</author>` : ""}
      ${(post.categories ?? []).map((c) => `<category>${escapeXml(c.title)}</category>`).join("")}
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
