import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { AUTHOR_BY_SLUG_QUERY, POSTS_BY_AUTHOR_QUERY, type PostSummary } from "@/sanity/lib/queries";
import { PostCard } from "@/components/asher/blog/PostCard";
import { BlogChrome } from "@/components/asher/blog/BlogChrome";
import { postBodyComponents } from "@/components/asher/blog/portableTextComponents";

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
    // This lists the same posts as /blog for a single-author site, so it's
    // kept out of search results to avoid competing with /blog for ranking.
    // Revisit if guest authors are ever added.
    robots: { index: false, follow: true },
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
    <BlogChrome>
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <nav className="mb-6 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">
          <Link href="/blog" className="transition-colors hover:text-spotlight">
            Blog
          </Link>{" "}
          / {author.name}
        </nav>

        <div className="flex items-center gap-5">
          {author.image && (
            <Image
              src={urlFor(author.image).width(96).height(96).fit("crop").url()}
              alt={author.name}
              width={96}
              height={96}
              className="rounded-full border border-amber-faint"
            />
          )}
          <div>
            <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Author</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.01em] text-ivory sm:text-4xl">
              {author.name}
            </h1>
          </div>
        </div>

        {author.bio ? (
          <div className="mt-6 max-w-xl text-stone/85">
            <PortableText value={author.bio as never} components={postBodyComponents} />
          </div>
        ) : null}

        {posts.length === 0 ? (
          <p className="mt-16 text-stone/70">No posts from this author yet.</p>
        ) : (
          <div className="mt-16 space-y-16">
            {posts.map((post, index) => (
              <PostCard key={post._id} post={post} priority={index === 0} />
            ))}
          </div>
        )}
      </div>
    </BlogChrome>
  );
}
