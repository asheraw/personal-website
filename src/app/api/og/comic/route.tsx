import {ImageResponse} from 'next/og'
import {loadGoogleFont, sanityCdnUrlOrEmpty} from '@/lib/ogFont'

export const runtime = 'edge'

// One 4-panel comic, rendered two ways from the same params:
//   ?n=1..4  -> that panel alone, a 1200x1200 square (caption band at the bottom)
//   (no n)   -> all four together as a 2x2 comic page, also 1200x1200
// Per panel i (1-4): `c{i}` = caption, `b{i}` = background (Sanity CDN only;
// a panel without one is a plain dark square). Used by the "Draft Comic"
// tool in the AI Tools tab, which downloads all five images.
const SIGNATURE = 'Asher Aw, 1984 · asheraw.com'

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const captions = [1, 2, 3, 4].map((i) => (searchParams.get(`c${i}`) || '').slice(0, 120))
  const bgs = [1, 2, 3, 4].map((i) => sanityCdnUrlOrEmpty(searchParams.get(`b${i}`)))
  const n = Number(searchParams.get('n')) || 0

  if (!captions.some(Boolean)) {
    return new Response('Missing caption params c1..c4', {status: 400})
  }

  const fontData = await loadGoogleFont('Playfair+Display:ital,wght@1,700', captions.join('') + SIGNATURE)

  // size = the panel's pixel width/height; `solo` adds the signature line.
  const panel = (i: number, size: number, solo: boolean) => (
    <div
      key={i}
      style={{
        display: 'flex',
        position: 'relative',
        width: size,
        height: size,
        backgroundColor: '#0a0807',
        ...(solo ? {} : {border: '4px solid #0a0807'}),
      }}
    >
      {bgs[i] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgs[i]} width={size} height={size} style={{position: 'absolute', top: 0, left: 0, width: size, height: size, objectFit: 'cover'}} />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: solo ? '28px 56px 24px' : '14px 24px 12px',
          backgroundColor: 'rgba(10,8,7,0.85)',
        }}
      >
        <div
          style={{
            display: 'flex',
            textAlign: 'center',
            fontSize: solo ? 46 : 24,
            lineHeight: 1.3,
            color: '#f5efe4',
            fontFamily: fontData ? 'Playfair Display' : 'serif',
            fontStyle: 'italic',
            fontWeight: 700,
          }}
        >
          {captions[i]}
        </div>
        {solo && (
          <div style={{display: 'flex', fontSize: 22, color: '#d8cbb3', marginTop: 14, fontFamily: fontData ? 'Playfair Display' : 'serif', fontStyle: 'italic', fontWeight: 700}}>
            {SIGNATURE}
          </div>
        )}
      </div>
    </div>
  )

  const body =
    n >= 1 && n <= 4 ? (
      <div style={{display: 'flex'}}>{panel(n - 1, 1200, true)}</div>
    ) : (
      // Comic-page gutters in paper colour: 18 + 573 + 18 + 573 + 18 = 1200.
      <div style={{display: 'flex', flexDirection: 'column', width: 1200, height: 1200, padding: 18, gap: 18, backgroundColor: '#efe6d2'}}>
        <div style={{display: 'flex', gap: 18}}>{panel(0, 573, false)}{panel(1, 573, false)}</div>
        <div style={{display: 'flex', gap: 18}}>{panel(2, 573, false)}{panel(3, 573, false)}</div>
      </div>
    )

  return new ImageResponse(body, {
    width: 1200,
    height: 1200,
    fonts: fontData ? [{name: 'Playfair Display', data: fontData, weight: 700, style: 'italic'}] : undefined,
  })
}
