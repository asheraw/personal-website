// Sanity's own CDN URLs keep the original asset's file extension in the
// path itself (transform params are query-string only), so this is a
// reliable, cheap check with no extra GROQ field/query needed anywhere
// that already has a urlFor(...)-built URL in hand.
//
// Why this matters: next.config.ts forces every next/image-optimized
// image through AVIF/WebP re-encoding (`images.formats`), which flattens
// an animated GIF to a single static frame -- the exact same class of bug
// already fixed for comment-thread GIFs (see CommentSection.tsx / RUNBOOK
// "Comments: emoji picker and GIF comments via Giphy"). Any component
// rendering a Sanity image that might be an uploaded GIF should check this
// first and fall back to a plain <img> (unoptimized, animation intact)
// instead of next/image when it's true.
export function isAnimatedGifUrl(url: string): boolean {
  return /\.gif(\?|$)/i.test(url);
}
