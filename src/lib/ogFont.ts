// Fetches a font from Google Fonts for next/og's ImageResponse, subset to
// just the characters being drawn. `familyQuery` is the css2 `family=` value
// (e.g. "Anton" or "Playfair+Display:ital,wght@1,700"). Callers must include
// EVERY literal string they render in `text` -- glyphs outside the subset
// silently fall back to another font (see the note in api/og/quote). Returns
// null on any failure so the caller can fall back to a system font.
export async function loadGoogleFont(familyQuery: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${familyQuery}&text=${encodeURIComponent(text)}`)
    ).text();
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// Background images for these cards may only come from our own Sanity CDN,
// so the routes can't be used to make the server fetch arbitrary URLs.
export function sanityCdnUrlOrEmpty(url: string | null): string {
  return url && /^https:\/\/cdn\.sanity\.io\//.test(url) ? url : "";
}
