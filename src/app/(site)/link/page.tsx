import type { Metadata } from "next";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { LINK_PAGE_QUERY } from "@/sanity/lib/queries";
import { ConfigureSiteChrome } from "@/components/asher/SiteChromeConfig";

const SITE_URL = "https://asheraw.com";
const TITLE = "Asher Aw — Latest Posts";
const DESCRIPTION = "The posts Asher's been sharing lately — tap through to read the full thing.";

export const metadata: Metadata = {
  title: "Latest Posts",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/link` },
  robots: { index: false }, // a bio link, not a page meant to rank on its own
  openGraph: { type: "website", url: `${SITE_URL}/link`, siteName: "Asher Aw", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", site: "@AsherAw", creator: "@AsherAw", title: TITLE, description: DESCRIPTION },
};

type LinkItem = {
  _key: string;
  image?: { asset?: { _ref: string } };
  imageAlt?: string;
  linkType: "post" | "external";
  post?: { title?: string; slug?: string };
  externalUrl?: string;
};

type SiteSettings = {
  siteDescription?: string;
  defaultAuthor?: { name?: string; image?: { asset?: { _ref: string } } };
};

async function getData() {
  const [linkPage, settings] = await Promise.all([
    client.fetch<{ items?: LinkItem[] } | null>(LINK_PAGE_QUERY),
    client.fetch<SiteSettings>(`*[_type == "siteSettings"][0]{siteDescription, defaultAuthor->{name, image}}`),
  ]);
  return { items: linkPage?.items ?? [], settings };
}

// A card only ever renders once it has an image and a resolved destination
// -- a "Links to: Post" card whose reference got deleted, or an "External
// URL" card left blank mid-edit, shouldn't produce a dead tile on the live
// page even though Studio already nudges against saving it that way. The
// headline shown on the tile comes from the linked post's own title for an
// internal card; an external card (no document to pull a title from) just
// shows the image with no overlay text.
function resolveCard(item: LinkItem): { href: string; label: string | null; external: boolean } | null {
  if (item.linkType === "external" && item.externalUrl) return { href: item.externalUrl, label: null, external: true };
  if (item.linkType === "post" && item.post?.slug) return { href: `/blog/${item.post.slug}`, label: item.post.title ?? null, external: false };
  return null;
}

export default async function LinkPage() {
  const { items, settings } = await getData();
  const authorName = settings.defaultAuthor?.name ?? "Asher Aw";
  const authorImage = settings.defaultAuthor?.image;
  const cards = items.map((item) => ({ item, resolved: resolveCard(item) })).filter((c) => c.resolved && c.item.image?.asset);

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-stage px-5 pt-28 pb-16 text-ivory sm:px-8 sm:pt-32 sm:pb-24">
      <ConfigureSiteChrome context="connect" />
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(240,184,101,0.16) 0%, rgba(240,184,101,0.05) 40%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className="relative mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          {authorImage?.asset && (
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-spotlight/40">
              <Image
                src={urlFor(authorImage).width(200).height(200).fit("crop").url()}
                alt={authorName}
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h1 className="mt-4 font-display text-2xl font-semibold text-ivory">{authorName}</h1>
          <p className="mt-1 font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Singapore · Actor · Coach · Storyteller</p>
          {settings.siteDescription && (
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone/75">{settings.siteDescription}</p>
          )}
        </div>

        {cards.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-amber-faint bg-stage/40 p-6 text-center text-sm text-stone/60">
            No cards yet — add one in Studio &rarr; Link Page.
          </p>
        ) : (
          // Instagram's own profile grid: three even square tiles per row,
          // hairline gaps, full-bleed cropped image with the headline
          // overlaid at the bottom rather than sitting in text beside a
          // small thumbnail -- deliberately mirrors that familiar look
          // since readers are arriving here straight from Instagram.
          <div className="mt-10 grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl border border-amber-faint">
            {cards.map(({ item, resolved }) => (
              <a
                key={item._key}
                href={resolved!.href}
                target={resolved!.external ? "_blank" : undefined}
                rel={resolved!.external ? "noreferrer" : undefined}
                className="group relative block aspect-square overflow-hidden bg-stage/60"
              >
                <Image
                  src={urlFor(item.image!).width(600).height(600).fit("crop").crop("focalpoint").url()}
                  alt={item.imageAlt ?? resolved!.label ?? ""}
                  fill
                  sizes="(max-width: 512px) 33vw, 170px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {resolved!.label && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6">
                    <p className="line-clamp-3 text-[11px] font-semibold leading-tight text-white">{resolved!.label}</p>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
