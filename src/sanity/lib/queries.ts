// Shared GROQ queries for fetching posts, used by the blog list, RSS feed,
// sitemap, and category/tag/author pages so they all stay consistent.

export const POST_SUMMARY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  // Fallback preview text when no manual excerpt is set, trimmed to a
  // generous raw length here -- the exact display length + word-boundary
  // trimming happens in the frontend (see src/lib/text.ts).
  "autoExcerpt": pt::text(body)[0...400],
  // Untruncated plain text, used only to estimate reading time -- cheaper
  // than fetching the full block-structured body just for a word count.
  "bodyPlainText": pt::text(body),
  publishedAt,
  _updatedAt,
  mainImage,
  "author": author->{name, "slug": slug.current},
  "categories": categories[]->{title, "slug": slug.current},
  tags,
  "commentCount": count(*[_type == "comment" && status == "approved" && references(^._id)])
}`;

export const ALL_POSTS_QUERY = `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}
`;

export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    _updatedAt,
    body[]{
      ...,
      _type == "block" => {
        markDefs[]{
          ...,
          _type == "internalLink" => {
            "slug": reference->slug.current
          }
        }
      },
      _type == "snippetRef" => {
        "snippetData": @->{title, snippetType, content}
      }
    },
    mainImage,
    seoTitle,
    socialImage,
    noIndex,
    tags,
    "author": author->{name, "slug": slug.current, image, bio},
    "categories": categories[]->{title, "slug": slug.current},
    "primaryCategory": primaryCategory->{title, "slug": slug.current},
    "commentCount": count(*[_type == "comment" && status == "approved" && references(^._id)])
  }
`;

export const POSTS_BY_CATEGORY_QUERY = `
  *[_type == "post" && defined(slug.current) && $categorySlug in categories[]->slug.current]
  | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}
`;

export const POSTS_BY_AUTHOR_QUERY = `
  *[_type == "post" && defined(slug.current) && author->slug.current == $authorSlug]
  | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}
`;

export const POSTS_BY_TAG_QUERY = `
  *[_type == "post" && defined(slug.current) && $tag in tags]
  | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}
`;

// Related posts: any other published post sharing at least one category or
// tag with the current one, ranked by how much overlap it has (shared
// categories + shared tags counted together) rather than just recency, so
// the closest match shows first even if it's older than a loosely-related
// recent post. A post with no categories or tags at all simply has nothing
// to relate on -- the caller should treat an empty result as "don't show
// the section" rather than falling back to unrelated posts, which would
// undermine what "related" means here.
export const RELATED_POSTS_QUERY = `
  *[
    _type == "post" && defined(slug.current) && _id != $excludeId &&
    (
      count((categories[]->slug.current)[@ in $categorySlugs]) > 0 ||
      count((tags[])[@ in $tags]) > 0
    )
  ] | order(
    count((categories[]->slug.current)[@ in $categorySlugs]) + count((tags[])[@ in $tags]) desc,
    publishedAt desc
  ) [0...3] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    "autoExcerpt": pt::text(body)[0...200],
    publishedAt,
    mainImage
  }
`;

export const ALL_CATEGORIES_QUERY = `
  *[_type == "category"] | order(title asc) {title, "slug": slug.current}
`;

export const CATEGORY_BY_SLUG_QUERY = `
  *[_type == "category" && slug.current == $slug][0]{title, description}
`;

export const AUTHOR_BY_SLUG_QUERY = `
  *[_type == "author" && slug.current == $slug][0]{name, image, bio}
`;

export type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  autoExcerpt?: string;
  publishedAt?: string;
  mainImage?: { asset?: { _ref: string }; alt?: string };
};

export type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  autoExcerpt?: string;
  bodyPlainText?: string;
  publishedAt?: string;
  _updatedAt: string;
  mainImage?: { asset?: { _ref: string }; alt?: string };
  author?: { name: string; slug: string } | null;
  categories?: { title: string; slug: string }[];
  tags?: string[];
  commentCount?: number;
};
