import {ImageResponse} from 'next/og'
import {loadGoogleFont, sanityCdnUrlOrEmpty} from '@/lib/ogFont'

export const runtime = 'edge'

// Classic top-text / bottom-text image meme, 1200x1200: big white capitals
// with a black outline over an optional background (`bg`, Sanity CDN only).
// Called by the "Draft Meme" tool in the post editor's AI Tools tab, which
// also hands the same URL back as the downloadable PNG.
export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const top = (searchParams.get('top') || '').slice(0, 80).toUpperCase()
  const bottom = (searchParams.get('bottom') || '').slice(0, 80).toUpperCase()
  const bg = sanityCdnUrlOrEmpty(searchParams.get('bg'))

  if (!top && !bottom) {
    return new Response('Missing "top" or "bottom" query param', {status: 400})
  }

  const fontData = await loadGoogleFont('Anton', top + bottom)
  const size = (t: string) => (t.length <= 22 ? 120 : t.length <= 32 ? 96 : t.length <= 46 ? 76 : 62)
  // Outline via stacked shadows -- the same look as the classic Impact meme
  // without relying on text-stroke support.
  const outline = [-3, 0, 3].flatMap((x) => [-3, 0, 3].map((y) => `${x}px ${y}px 0 #000`)).join(', ')
  const line = (t: string) => (
    <div
      style={{
        display: 'flex',
        textAlign: 'center',
        justifyContent: 'center',
        fontSize: size(t),
        lineHeight: 1.05,
        color: '#fff',
        fontFamily: fontData ? 'Anton' : 'sans-serif',
        fontWeight: 400,
        letterSpacing: 2,
        textShadow: outline,
        maxWidth: 1090,
      }}
    >
      {t}
    </div>
  )

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '40px 50px',
          backgroundColor: '#0a0807',
          position: 'relative',
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} width={1200} height={1200} style={{position: 'absolute', top: 0, left: 0, width: 1200, height: 1200, objectFit: 'cover'}} />
        )}
        <div style={{display: 'flex'}}>{top && line(top)}</div>
        <div style={{display: 'flex'}}>{bottom && line(bottom)}</div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: fontData ? [{name: 'Anton', data: fontData, weight: 400, style: 'normal'}] : undefined,
    },
  )
}
