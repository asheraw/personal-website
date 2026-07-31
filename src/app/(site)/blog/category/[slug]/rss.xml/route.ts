import { client } from "@/sanity/lib/client";
import { CATEGORY_BY_SLUG_QUERY, POSTS_BY_CATEGORY_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { buildRssFeed, rssResponse } from "@/lib/rss";

const SITE_URL = "https://asheraw.com";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, posts] = await Promise.all([
    client.fetch<{ title: string; description?: string } | null>(CATEGORY_BY_SLUG_QUERY, { slug }),
    client.fetch<PostSummary[]>(POSTS_BY_CATEGORY_QUERY, { categorySlug: slug }),
  ]);

  if (!category) {
    return new Response("Not found", { status: 404 });
  }

  const xml = buildRssFeed({
    title: `${category.title} — Asher Aw`,
    description: category.description || `Posts filed under ${category.title}.`,
    link: `${SITE_URL}/blog/category/${slug}`,
    selfUrl: `${SITE_URL}/blog/category/${slug}/rss.xml`,
    posts,
  });

  return rssResponse(xml);
}
