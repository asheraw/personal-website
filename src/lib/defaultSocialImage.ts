import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

// Same image the root (site) layout uses for the homepage: Site Settings ->
// default social image in Studio, falling back to the bundled hero shot.
// Pages that define their own openGraph/twitter have to repeat it, because
// Next.js metadata doesn't deep-merge -- without this they lose og:image.
const FALLBACK = "https://asheraw.com/asher/hero-stage.png";

export async function getDefaultSocialImage(): Promise<string> {
  const settings = await client.fetch<{ defaultSocialImage?: { asset?: { _ref: string } } } | null>(
    `*[_type == "siteSettings"][0]{defaultSocialImage}`
  );
  return settings?.defaultSocialImage
    ? urlFor(settings.defaultSocialImage).width(1344).height(768).fit("crop").crop("focalpoint").format("jpg").quality(75).url()
    : FALLBACK;
}
