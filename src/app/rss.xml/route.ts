import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { buildRssFeed, rssResponse } from "@/lib/rss";

const SITE_URL = "https://asheraw.com";

export async function GET() {
  const posts = await client.fetch<PostSummary[]>(ALL_POSTS_QUERY);

  const xml = buildRssFeed({
    title: "Asher Aw — Blog",
    description: "Essays, stories, and lessons from Asher Aw — actor, coach, and storyteller.",
    link: `${SITE_URL}/blog`,
    selfUrl: `${SITE_URL}/rss.xml`,
    posts,
  });

  return rssResponse(xml);
}
