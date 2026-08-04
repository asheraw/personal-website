import Link from "next/link";
import { PortableText, type PortableTextComponents, type PortableTextBlockComponent } from "@portabletext/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import { urlFor } from "@/sanity/lib/image";
import { Accordion } from "@/components/asher/blog/Accordion";
import { ImageCarousel, type DisplayStyle, type GalleryImage } from "@/components/asher/blog/ImageCarousel";
import { SizedImage, type DisplaySize } from "@/components/asher/blog/SizedImage";
import { InstagramEmbed } from "@/components/asher/blog/InstagramEmbed";
import { isTextColorValue } from "@/lib/textColors";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? match[1] : null;
}

const CALLOUT_STYLES: Record<string, { label: string; classes: string }> = {
  note: { label: "Note", classes: "border-spotlight/50 bg-spotlight/5" },
  tip: { label: "Tip", classes: "border-emerald-500/40 bg-emerald-500/5" },
  warning: { label: "Warning", classes: "border-destructive/50 bg-destructive/5" },
};

// Minimal set of components for rendering a snippet's own (deliberately
// simple -- just paragraphs, bold/italic, links) content, reused inside
// each of the snippetType-specific wrappers below.
const snippetBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <Link href={(value?.href as string) ?? "#"} className="underline underline-offset-2">
        {children}
      </Link>
    ),
  },
};

export const postBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="leading-8 text-ivory/90">{children}</p>,
    // "H1" is no longer offered as a style choice in Studio (removed
    // 2026-07-31 -- the post title is the page's one real H1, so writers
    // shouldn't be able to add more) -- kept rendering here only so any
    // post written before that change still displays exactly as it always
    // has, rather than falling back to Portable Text's unstyled default.
    h1: ({ children }) => (
      <h2 className="mt-12 font-display text-3xl font-semibold tracking-tight text-ivory sm:text-4xl">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
        {children}
      </h2>
    ),
    // NOTE: createPostBodyComponents() below overrides this specific
    // renderer to add an id -- this bare version (no id) stays as the
    // default for any other Portable Text field that doesn't need one
    // (e.g. an author bio), so it's never silently missing an id it
    // never had a reading-progress checkpoint to match anyway.
    h3: ({ children }) => (
      <h3 className="mt-8 font-display text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 font-display text-lg font-semibold tracking-tight text-ivory">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-spotlight/60 pl-5 italic text-stone/90">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-6 text-ivory/90">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-6 text-ivory/90">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-7">{children}</li>,
    number: ({ children }) => <li className="leading-7">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ivory">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
    "strike-through": ({ children }) => <span className="line-through">{children}</span>,
    // Named color only, resolved to a CSS custom property with separate
    // dark-mode and light-mode values (globals.css) -- never a raw hex
    // from the CMS, so there's no way for a chosen color to land as
    // illegible in one theme just because it looked fine in the other.
    textColor: ({ value, children }) => {
      const color = (value as { color?: unknown })?.color;
      if (!isTextColorValue(color)) return <>{children}</>;
      return <span style={{ color: `var(--tc-${color})` }}>{children}</span>;
    },
    code: ({ children }) => (
      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono-stage text-[0.9em] text-spotlight">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const href = (value?.href as string) ?? "#";
      const isExternal = /^https?:\/\//.test(href) && !href.includes("asheraw.com");
      // openInSameTab is the rare per-link override -- external links open
      // in a new tab by default, same as always, unless a writer
      // deliberately turns this on for a specific link.
      const openInNewTab = isExternal && !value?.openInSameTab;
      return (
        <Link
          href={href}
          className="text-spotlight underline decoration-spotlight/40 underline-offset-2 transition-colors hover:decoration-spotlight"
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noreferrer" : undefined}
        >
          {children}
        </Link>
      );
    },
    // Links to another post by reference -- "slug" is the *current* slug of
    // the referenced post, resolved fresh by POST_BY_SLUG_QUERY every time
    // this page renders, so a later slug change on the target post doesn't
    // leave this link pointing at a stale, now-broken URL.
    internalLink: ({ value, children }) => {
      const slug = value?.slug as string | undefined;
      if (!slug) return <span>{children}</span>;
      return (
        <Link
          href={`/blog/${slug}`}
          className="text-spotlight underline decoration-spotlight/40 underline-offset-2 transition-colors hover:decoration-spotlight"
        >
          {children}
        </Link>
      );
    },
    // rel="sponsored" (Google's recommended rel for paid/affiliate links,
    // separate from a plain nofollow) is set automatically here -- a writer
    // picking this annotation instead of the plain URL one is the only
    // thing that has to happen by hand; the compliance detail follows for
    // free. See AffiliateDisclosure.tsx for the accompanying page-level
    // banner, shown whenever a post contains at least one of these.
    affiliateLink: ({ value, children }) => {
      const href = (value?.href as string) ?? "#";
      return (
        <Link
          href={href}
          className="text-spotlight underline decoration-spotlight/40 underline-offset-2 transition-colors hover:decoration-spotlight"
          target="_blank"
          rel="sponsored noreferrer"
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    // A plain single photo, unless "More photos" was used in Studio --
    // then it's the first photo in a carousel/slideshow/scrolling strip
    // alongside them, rendered by ImageCarousel instead. A block with no
    // additionalImages renders exactly as a plain image always has.
    image: ({ value }) => {
      if (!value?.asset) return null;
      const size: DisplaySize =
        value.displaySize === "small" || value.displaySize === "medium" ? value.displaySize : "original";
      const additional = (value.additionalImages ?? []) as GalleryImage[];
      if (additional.length > 0) {
        const images: GalleryImage[] = [
          { _key: `${value._key ?? "primary"}-main`, asset: value.asset, alt: value.alt, caption: value.caption },
          ...additional,
        ];
        const mode: DisplayStyle =
          value.displayStyle === "slideshow" || value.displayStyle === "scroll-strip"
            ? value.displayStyle
            : "carousel";
        return <ImageCarousel images={images} mode={mode} size={size} />;
      }
      return (
        <SizedImage
          src={urlFor(value).width(1200).url()}
          fullSrc={urlFor(value).width(2400).url()}
          alt={value.alt ?? ""}
          caption={value.caption}
          size={size}
        />
      );
    },
    divider: () => <hr className="my-10 border-amber-faint" />,
    codeBlock: ({ value }) => (
      <div className="my-8 overflow-hidden rounded-lg border border-amber-faint text-sm">
        <SyntaxHighlighter
          language={value?.language || "text"}
          style={oneDark}
          customStyle={{ margin: 0, padding: "1.25rem", background: "transparent" }}
          wrapLongLines
        >
          {value?.code || ""}
        </SyntaxHighlighter>
      </div>
    ),
    callout: ({ value }) => {
      const style = CALLOUT_STYLES[value?.style as string] ?? CALLOUT_STYLES.note;
      return (
        <div className={`my-8 rounded-lg border px-5 py-4 ${style.classes}`}>
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/70">{style.label}</p>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ivory/90">{value?.text}</p>
        </div>
      );
    },
    accordion: ({ value }) => <Accordion title={value?.title} content={value?.content} />,
    // Renders a Reusable Snippet inserted into this post -- `snippetData`
    // is the dereferenced snippet document (see POST_BY_SLUG_QUERY), never
    // a copy: editing the snippet in Studio updates every post that uses
    // it, since only a reference is stored here.
    snippetRef: ({ value }) => {
      const snippet = value?.snippetData;
      if (!snippet?.content) return null;
      const body = <PortableText value={snippet.content} components={snippetBodyComponents} />;
      switch (snippet.snippetType) {
        case "pullquote":
          return (
            <blockquote className="my-10 border-l-2 border-spotlight/60 pl-6 font-display text-2xl italic leading-snug text-ivory">
              {body}
            </blockquote>
          );
        case "cta":
          return (
            <div className="my-8 rounded-lg border border-spotlight/40 bg-spotlight/5 px-6 py-5 text-center text-ivory/90">
              {body}
            </div>
          );
        case "authorbio":
          return (
            <div className="my-8 rounded-lg border border-amber-faint bg-stage/40 px-5 py-4 text-sm text-stone/85">
              {body}
            </div>
          );
        case "disclaimer":
          return (
            <div className="my-8 text-xs italic leading-relaxed text-stone/60">{body}</div>
          );
        case "callout":
        default:
          return (
            <div className="my-8 rounded-lg border border-spotlight/50 bg-spotlight/5 px-5 py-4 text-ivory/90">
              {body}
            </div>
          );
      }
    },
    youtube: ({ value }) => {
      const id = value?.url ? getYouTubeId(value.url as string) : null;
      if (!id) return null;
      return (
        <div className="my-8 aspect-video overflow-hidden rounded-lg border border-amber-faint">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    },
    instagramEmbed: ({ value }) => {
      const url = value?.url as string | undefined;
      if (!url) return null;
      return <InstagramEmbed url={url} />;
    },
  },
};

// Used only on the post page itself, where the reading progress bar needs
// every h2 to have a real, stable anchor id to jump to. headingIds maps a
// heading block's _key to the id extractH2Checkpoints() (src/lib/
// portableText.ts) already assigned it, so the two never disagree about
// what a given heading's id is.
export function createPostBodyComponents(headingIds: Map<string, string>): PortableTextComponents {
  const block: Record<string, PortableTextBlockComponent> = {
    ...(postBodyComponents.block as Record<string, PortableTextBlockComponent>),
    h2: ({ children, value }) => (
      <h2
        id={headingIds.get((value as { _key?: string })._key ?? "")}
        className="mt-10 font-display text-2xl font-semibold tracking-tight text-ivory sm:text-3xl scroll-mt-24"
      >
        {children}
      </h2>
    ),
  };
  return { ...postBodyComponents, block };
}
