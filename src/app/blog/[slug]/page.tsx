import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";

// Re-check Sanity for new or edited posts at most once per minute,
// instead of only ever showing what existed at the last deploy.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const POST_QUERY = `
  *[_type == "post" && slug.current == $slug][0] {
    title,
    publishedAt,
    body,
    mainImage
  }
`;

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await client.fetch(POST_QUERY, { slug });

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article>
        <h1 className="mb-3 text-4xl font-bold">
          {post.title}
        </h1>

        {post.publishedAt && (
          <p className="mb-10 text-sm text-gray-500">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        )}

        {post.mainImage && (
          <Image
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title}
            width={1200}
            height={675}
          />
        )}

        <div className="space-y-6 text-lg leading-8">
          <PortableText value={post.body} />
        </div>
      </article>
    </main>
  );
}