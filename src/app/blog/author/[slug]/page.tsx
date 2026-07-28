import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { AUTHOR_BY_SLUG_QUERY, POSTS_BY_AUTHOR_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";

export const revalidate = 60;

type Author = {
  name: string;
  image?: { asset?: { _ref: string } };
  bio?: unknown;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getAuthor(slug: string) {
  return client.fetch<Author | null>(AUTHOR_BY_SLUG_QUERY, { slug });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return {};
  return {
    title: `${author.name} — Blog`,
    description: `Posts written by ${author.name}.`,
    alternates: { canonical: `/blog/author/${slug}` },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const [author, posts] = await Promise.all([
    getAuthor(slug),
    client.fetch<PostSummary[]>(POSTS_BY_AUTHOR_QUERY, { authorSlug: slug }),
  ]);

  if (!author) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>{" "}
        / {author.name}
      </nav>

      <div className="flex items-center gap-4 mb-12">
        {author.image && (
          <Image
            src={urlFor(author.image).width(96).height(96).fit("crop").url()}
            alt={author.name}
            width={96}
            height={96}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{author.name}</h1>
          {author.bio ? (
            <div className="text-muted-foreground mt-1">
              <PortableText value={author.bio as never} />
            </div>
          ) : null}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts from this author yet.</p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
