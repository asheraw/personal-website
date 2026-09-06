import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, ALL_CATEGORIES_QUERY, type PostSummary } from "@/sanity/lib/queries";

const ALL_PAGES_QUERY = `*[_type == "page" && defined(slug.current) && noIndex != true]{"slug": slug.current, _updatedAt}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://asheraw.com";

  const [posts, categories, pages] = await Promise.all([
    client.fetch<PostSummary[]>(ALL_POSTS_QUERY),
    client.fetch<{ title: string; slug: string }[]>(ALL_CATEGORIES_QUERY),
    client.fetch<{ slug: string; _updatedAt: string }[]>(ALL_PAGES_QUERY),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/#stage`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/#coaching`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/#faith`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/#contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const rootPages: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(page._updatedAt || Date.now()),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post._updatedAt || post.publishedAt || Date.now()),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/blog/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Tags are free-text strings on each post (no separate "tag" document to
  // query), so the distinct list comes from the posts already fetched
  // above rather than its own Sanity query. Author pages are deliberately
  // left out here -- they're set to noindex (see AuthorPage's own
  // generateMetadata) since they'd otherwise duplicate /blog for a
  // single-author site.
  const tagSlugs = [...new Set(posts.flatMap((post) => post.tags ?? []))];
  const tagPages: MetadataRoute.Sitemap = tagSlugs.map((tag) => ({
    url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticPages, ...rootPages, ...postPages, ...categoryPages, ...tagPages];
}
