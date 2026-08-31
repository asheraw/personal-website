/**
 * Shared by portableTextComponents.tsx (deciding which embed component to
 * render) and portableText.ts's hasVideoEmbed() (deciding whether to show
 * the blog card "Video" tag) -- one place for "what platform is this embed
 * URL from," so the two never drift into disagreeing with each other about
 * the same URL, the same class of bug autoEmbedPaste.ts's own comments
 * already flag for the embed-type merge.
 */

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? match[1] : null;
}

export function isInstagramUrl(url: string): boolean {
  return /instagram\.com/i.test(url);
}

// Narrower than isInstagramUrl -- an Instagram /p/ URL is a "post," which
// could be a single photo, a photo carousel, or a video; there's no way to
// tell which from the URL alone (would need a real oEmbed lookup). A /reel/
// URL is unambiguous: Reels are always video. Used to decide the blog card
// "Video" tag, where showing it on what's actually a photo carousel would be
// a real, visible inaccuracy -- not used for isInstagramUrl's own job
// (which embed component to render), since InstagramEmbed.tsx renders both
// posts and Reels identically either way.
export function isInstagramReelUrl(url: string): boolean {
  return /instagram\.com\/reel\//i.test(url);
}

// "Definitely video" -- deliberately conservative. A YouTube URL is always
// video. An Instagram Reel is always video. A bare Instagram /p/ URL is not
// included, on purpose (see isInstagramReelUrl above) -- better to miss
// tagging a video post there than to wrongly tag a photo carousel.
export function isDefinitelyVideoEmbedUrl(url: string): boolean {
  return getYouTubeId(url) !== null || isInstagramReelUrl(url);
}
