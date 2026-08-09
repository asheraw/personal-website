"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// An accordion's content field (blockContentType.ts) is its own
// deliberately restricted block config -- paragraphs, bold/italic/
// underline, lists, and a plain link, nothing else (no headings, no
// custom internalLink/affiliateLink/textColor annotations, no nested
// embeds) -- so this only ever needs to handle that exact subset, not the
// full postBodyComponents set the main post body uses. Kept local to this
// file rather than imported from portableTextComponents.tsx, which
// already imports Accordion itself -- a two-way import between the two
// would be a circular dependency for no real benefit, since this config
// isn't reused anywhere else.
const accordionBodyComponents: PortableTextComponents = {
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

export function Accordion({ title, content }: { title?: string; content?: unknown[] }) {
  const [open, setOpen] = useState(false);
  const hasContent = Array.isArray(content) && content.length > 0;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-amber-faint">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-semibold text-ivory transition-colors hover:text-spotlight"
      >
        <span>{title || "Details"}</span>
        <ChevronDown size={18} className={cn("shrink-0 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && hasContent && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-amber-faint px-5 py-4 text-stone/85">
              <PortableText value={content as never} components={accordionBodyComponents} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
