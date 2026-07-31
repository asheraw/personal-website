import { client } from "@/sanity/lib/client";
import { POSTS_BY_TAG_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { buildRssFeed, rssResponse } from "@/lib/rss";

const SITE_URL = "https://asheraw.com";

// No 404 for an unknown tag -- the tag page itself doesn't 404 either
// (it just shows "no posts tagged X yet"), so an empty feed matches that
// same behavior rather than treating a typo'd tag as an error.
export async function GET(_request: Request, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await client.fetch<PostSummary[]>(POSTS_BY_TAG_QUERY, { tag: decoded });

  const xml = buildRssFeed({
    title: `#${decoded} — Asher Aw`,
    description: `Posts tagged #${decoded}.`,
    link: `${SITE_URL}/blog/tag/${tag}`,
    selfUrl: `${SITE_URL}/blog/tag/${tag}/rss.xml`,
    posts,
  });

  return rssResponse(xml);
}
