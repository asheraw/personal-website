import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { ALL_POSTS_QUERY, ALL_CATEGORIES_QUERY, type PostSummary } from "@/sanity/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://asheraw.com";

  const [posts, categories] = await Promise.all([
    client.fetch<PostSummary[]>(ALL_POSTS_QUERY),
    client.fetch<{ title: string; slug: string }[]>(ALL_CATEGORIES_QUERY),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/#stage`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/#coaching`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/#faith`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/#contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

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

  return [...staticPages, ...postPages, ...categoryPages];
}
