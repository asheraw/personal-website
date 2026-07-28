import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, type PostSummary } from "@/sanity/lib/queries";

const SITE_URL = "https://asheraw.com";
const SITE_TITLE = "Asher Aw — Blog";
const SITE_DESCRIPTION = "Essays, stories, and lessons from Asher Aw — actor, coach, and storyteller.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await client.fetch<PostSummary[]>(ALL_POSTS_QUERY);

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
