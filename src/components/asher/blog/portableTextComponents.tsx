import Image from "next/image";
import Link from "next/link";
import type { PortableTextComponents } from "@portabletext/react";
import { urlFor } from "@/sanity/lib/image";

export const postBodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="leading-8 text-ivory/90">{children}</p>,
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
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-7">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ivory">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const href = (value?.href as string) ?? "#";
      const isExternal = /^https?:\/\//.test(href) && !href.includes("asheraw.com");
      return (
        <Link
          href={href}
          className="text-spotlight underline decoration-spotlight/40 underline-offset-2 transition-colors hover:decoration-spotlight"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      return (
        <div className="my-8 overflow-hidden rounded-lg">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.alt ?? ""}
            width={1200}
            height={800}
            className="h-auto w-full"
          />
        </div>
      );
    },
  },
};
