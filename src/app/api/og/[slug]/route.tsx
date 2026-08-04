import {ImageResponse} from 'next/og'
import {sanityFetch} from '@/sanity/lib/live'

export const runtime = 'edge'

const OG_CARD_QUERY = `
  *[_type == "post" && slug.current == $slug][0]{
    title,
    "author": author->name,
    "category": primaryCategory->title
  }
`

// Google's documented technique for loading a real webfont into Satori
// (which ImageResponse renders through): fetch the font CSS scoped to just
// the characters actually needed (keeps the request small and fast), pull
// the file URL out of it, then fetch that file's bytes directly.
async function loadPlayfairDisplay(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&text=${encodeURIComponent(text)}`
    const css = await (await fetch(cssUrl)).text()
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
    if (!match) return null
    const res = await fetch(match[1])
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

// The "branded social card" from ACE Phase 7 -- a small, controlled
// template (title, category, author, brand colors/type), not a design
// editor. Only used when a post has useBrandedSocialCard on (see
// postType.ts and [slug]/page.tsx's generateMetadata) -- the default for
// every post is still the real featured photo.
type OgCardData = {title?: string; author?: string; category?: string}

export async function GET(request: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {data: post} = await sanityFetch({query: OG_CARD_QUERY, params: {slug}})
  const card = post as OgCardData | null

  const title: string = card?.title || 'asheraw.com'
  const category: string | undefined = card?.category
  const author: string | undefined = card?.author

  const fontData = await loadPlayfairDisplay(title)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundColor: '#0a0807',
        }}
      >
        <div style={{display: 'flex'}}>
          {category && (
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                color: '#f0b865',
                textTransform: 'uppercase',
                letterSpacing: 4,
              }}
            >
              {category}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? 56 : 68,
            lineHeight: 1.15,
            color: '#f5efe4',
            fontFamily: fontData ? 'Playfair Display' : 'serif',
            fontWeight: 700,
            maxWidth: 980,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            color: '#9a8d78',
          }}
        >
          {author ? `${author} · ` : ''}asheraw.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData ? [{name: 'Playfair Display', data: fontData, weight: 700, style: 'normal'}] : undefined,
    },
  )
}
