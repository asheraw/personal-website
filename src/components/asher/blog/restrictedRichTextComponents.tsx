import Link from "next/link";
import { type PortableTextComponents } from "@portabletext/react";

// The exact restricted block config in blockContentType.ts's
// `restrictedRichTextField()` -- paragraphs, bold/italic/underline, lists,
// and a plain link, nothing else (no headings, no custom
// internalLink/affiliateLink/textColor annotations, no nested embeds).
// Originally lived only inside Accordion.tsx; extracted here once Callout's
// Text field needed the identical rendering (2026-08-29) so the two don't
// drift into two slightly different implementations of the same thing.
export const restrictedRichTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="leading-relaxed">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ivory">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
    link: ({ value, children }) => {
      const href = (value?.href as string) ?? "#";
      const isExternal = /^https?:\/\//.test(href) && !href.includes("asheraw.com");
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
  },
};
