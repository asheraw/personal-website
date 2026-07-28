import Link from "next/link";
import { client } from "@/sanity/lib/client";

// Re-check Sanity for new or edited posts at most once per minute,
// instead of only ever showing what existed at the last deploy.
export const revalidate = 60;

type Post = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
};

const POSTS_QUERY = `
  *[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt
  }
`;

export default async function BlogPage() {
  const posts = await client.fetch<Post[]>(POSTS_QUERY);

  return (
    <main>
      <h1>Blog</h1>

      {posts.map((post) => (
        <article key={post._id}>
          <h2>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>

          {post.publishedAt && (
            <p>{new Date(post.publishedAt).toLocaleDateString()}</p>
          )}
        </article>
      ))}
    </main>
  );
}