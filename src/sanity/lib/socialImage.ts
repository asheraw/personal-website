import { urlFor } from "./image";

// The picture Facebook, LinkedIn, WhatsApp, X and friends show when a post is shared: 1200x630
// (1.91:1). Shared by the live page metadata and Studio's SEO Preview tab so the preview is the
// exact crop that ships.
export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;

// Fractions of the ORIGINAL image trimmed off each edge (same convention as Sanity's own image
// crop), saved from the SEO Preview tab. assetRef pins the crop to the image it was drawn on, so
// swapping the picture later quietly falls back to the automatic crop instead of reusing a stale one.
export type SocialCrop = {
  assetRef?: string;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
};

type ImageLike = { asset?: { _ref?: string } } | null | undefined;

// Original pixel size is encoded in the asset id: image-<hash>-<w>x<h>-<ext>.
function sizeFromRef(ref: string): { w: number; h: number } | null {
  const m = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

export function activeSocialCrop(source: ImageLike, crop: SocialCrop | null | undefined): Required<SocialCrop> | null {
  const ref = source?.asset?._ref;
  if (!ref || !crop || crop.assetRef !== ref) return null;
  const { left, top, right, bottom } = crop;
  if ([left, top, right, bottom].some((n) => typeof n !== "number")) return null;
  return { assetRef: ref, left: left!, top: top!, right: right!, bottom: bottom! };
}

// Returns an image-url builder; callers add .format()/.url() as they need.
// No saved crop: centre on the image's focus point, as before.
export function socialImageBuilder(source: NonNullable<ImageLike>, crop?: SocialCrop | null, width = SHARE_WIDTH) {
  const height = Math.round((width * SHARE_HEIGHT) / SHARE_WIDTH);
  const active = activeSocialCrop(source, crop);
  const size = active ? sizeFromRef(active.assetRef) : null;
  if (active && size) {
    const left = Math.round(active.left * size.w);
    const top = Math.round(active.top * size.h);
    const w = Math.max(1, Math.round((1 - active.left - active.right) * size.w));
    const h = Math.max(1, Math.round((1 - active.top - active.bottom) * size.h));
    // A plain {asset} source: the image's own hotspot/crop would otherwise fight the rect.
    return urlFor({ _type: "image", asset: { _type: "reference", _ref: active.assetRef } })
      .rect(left, top, w, h)
      .width(width)
      .height(height)
      .fit("crop");
  }
  return urlFor(source as Parameters<typeof urlFor>[0]).width(width).height(height).fit("crop").crop("focalpoint");
}
