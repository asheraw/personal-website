import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { sanityFetch } from "@/sanity/lib/live";
import { POST_PLAY_QUERY } from "@/sanity/lib/queries";
import { KeyMomentsPlay } from "@/components/asher/blog/KeyMomentsPlay";
import { isMobileUserAgent } from "@/lib/device";

const SITE_URL = "https://asheraw.com";

type Moment = { quote: string; caption?: string };
type KeyMomentsPresentation = { _type: "keyMoments"; introText?: string; moments?: Moment[] };
type Post = {
  title: string;
  slug: string;
  play?: {
    enabled?: boolean;
    mobileEnabled?: boolean;
    presentation?: KeyMomentsPresentation[];
  };
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  const { data } = await sanityFetch({ query: POST_PLAY_QUERY, params: { slug } });
  return data as Post | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  // The canonical version always wins -- this is a derivative presentation
  // of the same publication, never a competing page, so it points its own
  // canonical straight back to STORY and stays out of search entirely
  // rather than risking duplicate-content confusion.
  return {
    title: `${post.title} — Key Moments`,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
  };
}

export default async function PlayPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const presentation = post.play?.presentation?.[0];
  if (!post.play?.enabled || !presentation) notFound();

  // Server-aware, not client-aware -- checked from the request's own
  // User-Agent header before anything is sent, per the spec's explicit
  // instruction not to rely on browser width after already downloading
  // the PLAY experience. A mobile visitor hitting this URL directly (e.g.
  // a shared link) lands on the real post instead, not a broken/disabled
  // PLAY page.
  if (post.play.mobileEnabled === false) {
    const userAgent = (await headers()).get("user-agent");
    if (isMobileUserAgent(userAgent)) {
      redirect(`/blog/${post.slug}`);
    }
  }

  return (
    <KeyMomentsPlay
      postTitle={post.title}
      postSlug={post.slug}
      introText={presentation.introText}
      moments={presentation.moments ?? []}
    />
  );
}
