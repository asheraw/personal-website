import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { PostSummary } from "@/sanity/lib/queries";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="border-b border-border pb-12 last:border-none">
      {post.mainImage && (
        <Link href={`/blog/${post.slug}`} className="block mb-4">
          <Image
            src={urlFor(post.mainImage).width(1200).height(630).fit("crop").url()}
            alt={post.mainImage.alt ?? post.title}
            width={1200}
            height={630}
            className="rounded-lg w-full h-auto object-cover"
          />
        </Link>
      )}

      <h2 className="text-2xl font-semibold mb-2">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
        {post.publishedAt && (
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        {post.author && (
          <>
            <span aria-hidden="true">·</span>
            <Link href={`/blog/author/${post.author.slug}`} className="hover:underline">
              {post.author.name}
            </Link>
          </>
        )}
        {post.categories?.map((category) => (
          <Link
            key={category.slug}
            href={`/blog/category/${category.slug}`}
            className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
          >
            {category.title}
          </Link>
        ))}
      </div>

      {post.excerpt && <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>}

      <Link href={`/blog/${post.slug}`} className="inline-block mt-3 text-sm font-medium hover:underline">
        Read more →
      </Link>
    </article>
  );
}
