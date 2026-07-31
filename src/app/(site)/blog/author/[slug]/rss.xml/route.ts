import { client } from "@/sanity/lib/client";
import { AUTHOR_BY_SLUG_QUERY, POSTS_BY_AUTHOR_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { buildRssFeed, rssResponse } from "@/lib/rss";

const SITE_URL = "https://asheraw.com";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [author, posts] = await Promise.all([
    client.fetch<{ name: string } | null>(AUTHOR_BY_SLUG_QUERY, { slug }),
    client.fetch<PostSummary[]>(POSTS_BY_AUTHOR_QUERY, { authorSlug: slug }),
  ]);

  if (!author) {
    return new Response("Not found", { status: 404 });
  }

  const xml = buildRssFeed({
    title: `${author.name} — Asher Aw`,
    description: `Posts written by ${author.name}.`,
    link: `${SITE_URL}/blog/author/${slug}`,
    selfUrl: `${SITE_URL}/blog/author/${slug}/rss.xml`,
    posts,
  });

  return rssResponse(xml);
}
