import {ImageResponse} from 'next/og'

export const runtime = 'edge'

// A shareable quote-card image, generated from any quote text -- built for
// the "Make Image" button next to each AI-drafted pull quote in "Suggest
// SEO & Excerpt" (SuggestSeoShared.tsx). Query-param driven rather than
// tied to a post's slug like /api/og/[slug] is, since a quote isn't a
// property of the post document itself (it's a substring Gemini pulled out
// for this specific purpose) -- `text` is the only required param.
//
// Same brand palette and font-loading technique as the branded social card
// (/api/og/[slug]/route.tsx) on purpose, not a new visual language --
// Asher said he'll experiment with the actual style later, so this is a
// functional, on-brand default to iterate from, not a finished design.
async function loadPlayfairDisplay(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&text=${encodeURIComponent(text)}`
    const css = await (await fetch(cssUrl)).text()
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
    if (!match) return null
    const res = await fetch(match[1])
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const quote = (searchParams.get('text') || '').slice(0, 400)
  const attribution = (searchParams.get('attribution') || '').slice(0, 120)

  if (!quote) {
    return new Response('Missing "text" query param', {status: 400})
  }

  // Includes the literal "asheraw.com · " text too, not just the quote and
  // attribution -- that's always rendered regardless of what's passed in,
  // and Google Fonts' `text=` subsetting only fetches glyphs for exactly
  // the characters given it. Missing this caused a real, visible bug: the
  // domain line silently fell back to a different font partway through
  // ("ashera" in Playfair, "w.com" in the fallback) whenever the quote/
  // attribution text didn't happen to already contain a 'w', 'c', 'o', or
  // 'm' -- caught by actually rendering and looking at a test image, not
  // by reading the code.
  const fontData = await loadPlayfairDisplay(quote + attribution + 'asheraw.com · ')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '96px',
          backgroundColor: '#0a0807',
        }}
      >
        <div style={{display: 'flex', fontSize: 120, lineHeight: 1, color: '#f0b865', opacity: 0.5, fontFamily: 'sans-serif'}}>
          &ldquo;
        </div>
        <div
          style={{
            display: 'flex',
            textAlign: 'center',
            fontSize: quote.length > 180 ? 40 : quote.length > 90 ? 48 : 56,
            lineHeight: 1.35,
            color: '#f5efe4',
            fontFamily: fontData ? 'Playfair Display' : 'serif',
            fontStyle: 'italic',
            fontWeight: 700,
            maxWidth: 920,
            marginTop: -24,
          }}
        >
          {quote}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 26,
            color: '#9a8d78',
            marginTop: 48,
            fontFamily: 'sans-serif',
          }}
        >
          {attribution ? `${attribution} · ` : ''}asheraw.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: fontData ? [{name: 'Playfair Display', data: fontData, weight: 700, style: 'italic'}] : undefined,
    },
  )
}
