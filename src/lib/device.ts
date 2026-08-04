// Server-side device detection from the request's own User-Agent header --
// deliberately not client-side viewport width. The ACE spec is explicit
// about this for PLAY specifically: "use server-aware/rendering-aware
// logic -- never rely on browser width after downloading the whole PLAY
// application." A UA check runs before anything is sent, so a mobile-
// disabled PLAY presentation's assets are never fetched by a mobile
// visitor in the first place, rather than being downloaded and then hidden.
const MOBILE_UA_PATTERN = /Mobi|Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini/i;

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return MOBILE_UA_PATTERN.test(userAgent);
}
