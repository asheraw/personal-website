// Shared GROQ queries for fetching posts, used by the blog list, RSS feed,
// sitemap, and category/tag/author pages so they all stay consistent.

import type { PortableTextBlock } from "@/lib/portableText";

export const POST_SUMMARY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  // Powers both the auto-excerpt fallback and the reading-time estimate on
  // the frontend (PostCard.tsx), via the same portableTextToPlainText()/
  // estimateReadingTimeMinutes() logic the post page itself uses -- not
  // GROQ's own pt::text(), which only reads _type == "block" spans and is
  // blind to custom block types. That blindness is exactly what made a
  // Quote-Grid-heavy post's listing card undercount its reading time
  // (see RUNBOOK.md, "Post metadata: reading time"). Deliberately shallow:
  // only the handful of fields that function actually reads, not the full
  // body (markDefs, snippetRef resolution, etc. -- see POST_BY_SLUG_QUERY
  // for those).
  "bodyBlocks": body[]{
    _type,
    "children": children[]{text},
    text,
    content,
    "entries": entries[]{quote}
  },
  publishedAt,
  _updatedAt,
  mainImage,
  // Falls back to the image's own library-level default (Studio -> Media,
  // see imageAssetAltType.ts) only when this post never got its own alt
  // text written -- a post-specific alt always wins over the fallback.
  "mainImageAlt": coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText),
  "author": author->{name, "slug": slug.current},
  "categories": categories[]->{title, "slug": slug.current},
  tags,
  "commentCount": count(*[_type == "comment" && status == "approved" && !defined(trashedAt) && references(^._id)])
}`;

export const ALL_POSTS_QUERY = `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}
`;

// Paginated variant of ALL_POSTS_QUERY -- used only by the /blog listing
// page (via /api/blog/posts for pages after the first), so the initial
// page load and every subsequent "Load more" only pull as many full
// summaries (image, comment count, etc.) as are actually about to be
// shown. RSS/sitemap/category/author/tag pages all still want every post
// at once, so they keep using the queries above unchanged.
//
// $excludeId keeps the Featured post (Site Settings) from also showing up
// a second time further down the regular feed -- callers with no featured
// post pass an empty string, which never matches a real _id, so the filter
// is a safe no-op rather than needing a separate unfiltered query variant.
export const PAGINATED_POSTS_QUERY = `
  *[_type == "post" && defined(slug.current) && _id != $excludeId] | order(publishedAt desc) [$start...$end] ${POST_SUMMARY_PROJECTION}
`;

export const POSTS_COUNT_QUERY = `count(*[_type == "post" && defined(slug.current) && _id != $excludeId])`;

// The Site Settings singleton's Featured post reference, dereferenced to
// the same summary shape every other post card already uses -- shown in
// its own larger spot at the top of /blog, above the regular paginated
// feed (see FeaturedPostCard.tsx).
export const FEATURED_POST_QUERY = `
  *[_type == "siteSettings"][0].featuredPost-> ${POST_SUMMARY_PROJECTION}
`;

// Link-in-bio page (/link) -- reads the linkPage singleton (linkPageType.ts),
// a hand-curated array of cards rather than "every post with a flag set."
// Each card is just an image + where it goes -- no manual title/caption;
// the overlay headline on an internal card comes straight from the linked
// post's own title (`post->title` below), so `post->{title, "slug": ...}`
// and `externalUrl` are always fetched and the page component picks
// whichever one `linkType` says to use at render time, since GROQ
// conditionally dereferencing a possibly-null reference inside `select()`
// is more fragile than a plain if/else in TypeScript.
export const LINK_PAGE_QUERY = `
  *[_type == "linkPage"][0]{
    items[]{
      _key,
      image,
      "imageAlt": coalesce(image.alt, *[_type == "imageAssetAlt" && assetId == ^.image.asset._ref][0].altText),
      linkType,
      "post": post->{title, "slug": slug.current},
      externalUrl
    }
  }
`;

// Lightweight index for BlogSearch -- title/blurb/tags/categories only, no
// image or comment count, and (unlike the paginated query above)
// deliberately *not* paginated: search has to be able to find a post
// regardless of whether its card has been scrolled/loaded into view yet.
export const SEARCH_INDEX_QUERY = `
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "blurb": coalesce(excerpt, pt::text(body)[0...400]),
    tags,
    "categoryTitles": categories[]->title
  }
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
    "mainImageAlt": coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText),
    seoTitle,
    socialImage,
    useBrandedSocialCard,
    noIndex,
    commentsLocked,
    play,
    tags,
    "author": author->{name, "slug": slug.current, image, bio},
    "categories": categories[]->{title, "slug": slug.current},
    "primaryCategory": primaryCategory->{title, "slug": slug.current},
    "commentCount": count(*[_type == "comment" && status == "approved" && !defined(trashedAt) && references(^._id)])
  }
`;

// Shared by both the single-post "Export as Markdown" document action and
// the bulk "Export all posts" tool -- same reference-resolution as
// POST_BY_SLUG_QUERY (internalLink -> slug, snippetRef -> content) so a
// post reads identically whether it's exported alone or as part of the
// full archive. Author/categories resolve straight to plain strings here
// (not slug-carrying objects) since export frontmatter has no links to
// preserve, only the names themselves.
export const POST_EXPORT_PROJECTION = `{
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  "author": author->name,
  "categories": categories[]->title,
  tags,
  mainImage,
  "mainImageAlt": coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText),
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
      "snippetData": @->{snippetType, content}
    }
  }
}`;

export const POST_EXPORT_BY_ID_QUERY = `*[_id == $id][0] ${POST_EXPORT_PROJECTION}`;

export const ALL_POSTS_EXPORT_QUERY = `
  *[_type == "post" && defined(slug.current)] | order(publishedAt asc) ${POST_EXPORT_PROJECTION}
`;

// Lean, purpose-specific query for the PLAY page (src/app/(site)/blog/
// [slug]/play/page.tsx) -- doesn't need the post's full body/comments/etc,
// just enough to render the PLAY presentation and link back to STORY.
export const POST_PLAY_QUERY = `
  *[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    play
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
// tag with the current one. Ranking by how much overlap each candidate has
// (shared categories + shared tags counted together) happens in JS after
// the fetch, not in this query's own order() -- keeps this GROQ to the
// same plain-path/function-call shapes already proven elsewhere in this
// file, rather than leaning on a compound arithmetic expression inside
// order() that's untested against the real dataset. Capped at 12
// candidates here; the caller takes the top 3 after ranking. A post with
// no categories or tags at all simply has nothing to relate on -- the
// caller should treat an empty result as "don't show the section" rather
// than falling back to unrelated posts, which would undermine what
// "related" means here.
export const RELATED_POSTS_QUERY = `
  *[
    _type == "post" && defined(slug.current) && _id != $excludeId &&
    (
      count((categories[]->slug.current)[@ in $categorySlugs]) > 0 ||
      count((tags[])[@ in $tags]) > 0
    )
  ] | order(publishedAt desc) [0...12] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    "autoExcerpt": pt::text(body)[0...200],
    publishedAt,
    mainImage,
    "mainImageAlt": coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText),
    "matchScore": count((categories[]->slug.current)[@ in $categorySlugs]) + count((tags[])[@ in $tags])
  }
`;

export const ALL_CATEGORIES_QUERY = `
  *[_type == "category"] | order(title asc) {title, "slug": slug.current}
`;

// Same category list, but only ones with at least one post -- for the
// browsing strip at the top of /blog, where an empty category would just
// be a dead-end click. ALL_CATEGORIES_QUERY above stays as-is (sitemap.ts
// still wants every category, empty or not).
export const BLOG_CATEGORIES_WITH_POSTS_QUERY = `
  *[_type == "category" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc) {
    title, "slug": slug.current
  }
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
  mainImageAlt?: string;
};

export type PostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  bodyBlocks?: PortableTextBlock[];
  publishedAt?: string;
  _updatedAt: string;
  mainImage?: { asset?: { _ref: string }; alt?: string };
  mainImageAlt?: string;
  author?: { name: string; slug: string } | null;
  categories?: { title: string; slug: string }[];
  tags?: string[];
  commentCount?: number;
};
