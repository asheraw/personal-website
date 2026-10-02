import {useRef, useState} from 'react'
import {useClient} from 'sanity'
import JSZip from 'jszip'
import {Box, Button, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {downloadBlob} from '../../lib/downloadFile'
import {ErrorMessage} from './ErrorMessage'
import {CopyOption} from './SuggestSocialCopyShared'

export type CarouselSlide = {
  quote: string
  subject: string
  prompt: string
  imageUrl?: string
  busy?: boolean
  slideError?: string
}
export type ImageCarouselResult = {slides: CarouselSlide[]}

export type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Signature stamped by the card renderer (/api/og/quote) as its attribution
// line -- the image model is told to leave all text out, so this is always
// spelled right.
const SIGNATURE = 'Asher Aw, 1984'

function cardUrl(slide: CarouselSlide) {
  const params = new URLSearchParams({text: slide.quote, attribution: SIGNATURE})
  if (slide.imageUrl) params.set('bg', slide.imageUrl)
  return `/api/og/quote?${params}`
}

// Shared by the "Draft Image Carousel" document action
// (suggestImageCarousel.tsx) and the post editor's "AI Tools" tab -- one
// real fetch/state flow, not two copies of it. Picking quotes is one fast
// text call; images are then made (or uploaded) per slide, so a slow or
// rate-limited image never loses the rest.
export function useImageCarouselSuggestion(source: PostDraft | null) {
  const client = useClient({apiVersion: '2026-07-22'})
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ImageCarouselResult | null>(null)
  const [error, setError] = useState('')
  // Ref mirrors state so the one-by-one render loop always patches the
  // latest slides rather than a stale closure copy.
  const slidesRef = useRef<CarouselSlide[]>([])
  const slug = source?.slug?.current || 'carousel'

  function setSlides(next: CarouselSlide[]) {
    slidesRef.current = next
    setResult({slides: next})
  }

  function patchSlide(i: number, patch: Partial<CarouselSlide>) {
    setSlides(slidesRef.current.map((s, k) => (k === i ? {...s, ...patch} : s)))
  }

  async function run() {
    setStatus('loading')
    setError('')
    try {
      const bodyText = portableTextToPlainText(source?.body)
      const res = await fetch('/api/ai/suggest-image-carousel', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: source?.title, bodyText, slug: source?.slug?.current}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSlides(data.slides)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  // Resolves to the HTTP status so the render-all loop can stop on a 429.
  async function renderImage(i: number): Promise<number> {
    patchSlide(i, {busy: true, slideError: undefined})
    try {
      const res = await fetch('/api/ai/generate-carousel-slide', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: slidesRef.current[i].prompt, slug, index: i + 1}),
      })
      const data = await res.json()
      if (!res.ok) {
        patchSlide(i, {busy: false, slideError: data.error || 'Something went wrong'})
        return res.status
      }
      patchSlide(i, {busy: false, imageUrl: data.imageUrl})
      return 200
    } catch (e) {
      patchSlide(i, {busy: false, slideError: e instanceof Error ? e.message : 'Something went wrong'})
      return 500
    }
  }

  async function renderAllMissing() {
    for (let i = 0; i < slidesRef.current.length; i++) {
      if (slidesRef.current[i].imageUrl) continue
      if ((await renderImage(i)) === 429) break
    }
  }

  async function uploadImage(i: number, file: File) {
    patchSlide(i, {busy: true, slideError: undefined})
    try {
      const asset = await client.assets.upload('image', file, {filename: file.name})
      patchSlide(i, {busy: false, imageUrl: asset.url})
    } catch (e) {
      patchSlide(i, {busy: false, slideError: e instanceof Error ? e.message : 'Upload failed'})
    }
  }

  async function downloadSlide(i: number) {
    downloadBlob(`${slug}-slide-${i + 1}.png`, await (await fetch(cardUrl(slidesRef.current[i]))).blob())
  }

  async function downloadAll() {
    const zip = new JSZip()
    await Promise.all(
      slidesRef.current.map(async (s, i) => {
        zip.file(`${slug}-slide-${i + 1}.png`, await (await fetch(cardUrl(s))).blob())
      })
    )
    downloadBlob(`${slug}-carousel.zip`, await zip.generateAsync({type: 'blob'}))
  }

  return {
    status,
    result,
    error,
    run,
    actions: {renderImage, renderAllMissing, uploadImage, downloadSlide, downloadAll},
  }
}

export type CarouselActions = ReturnType<typeof useImageCarouselSuggestion>['actions']

function CopyPromptButton({text}: {text: string}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      text={copied ? 'Copied!' : 'Copy image prompt'}
      tone={copied ? 'positive' : 'default'}
      mode="ghost"
      fontSize={1}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          // Clipboard blocked -- nothing to recover into.
        }
      }}
    />
  )
}

export function ImageCarouselResults({
  status,
  result,
  error,
  onRetry,
  actions,
}: {
  status: 'idle' | 'loading' | 'done' | 'error'
  result: ImageCarouselResult | null
  error: string
  onRetry: () => void
  actions: CarouselActions
}) {
  const anyBusy = result?.slides.some((s) => s.busy) ?? false
  const missing = result?.slides.filter((s) => !s.imageUrl).length ?? 0

  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>Picking the quotable lines…</Text>
        </Flex>
      )}
      {status === 'error' && (
        <Stack space={4}>
          <ErrorMessage>{error}</ErrorMessage>
          <Button text="Try again" tone="primary" onClick={onRetry} />
        </Stack>
      )}
      {status === 'done' && result && (
        <Stack space={5}>
          <Text size={1} muted>
            {result.slides.length} slides. Each card below is the finished slide — your quote laid over its
            background. Give a slide a background by generating it here, or paste its prompt into the Gemini
            app and upload the picture. A slide with no background is still a valid plain card.
          </Text>
          <Flex gap={3} wrap="wrap">
            <Button
              text={missing ? `Generate ${missing} missing background${missing > 1 ? 's' : ''}` : 'All backgrounds ready'}
              tone="primary"
              disabled={!missing || anyBusy}
              onClick={actions.renderAllMissing}
            />
            <Button text="Download all (zip)" mode="ghost" disabled={anyBusy} onClick={actions.downloadAll} />
          </Flex>
          <Grid columns={[1, 2]} gap={4}>
            {result.slides.map((slide, i) => (
              <Card key={i} padding={3} radius={2} border>
                <Stack space={3}>
                  <div style={{position: 'relative'}}>
                    <img
                      src={cardUrl(slide)}
                      alt={slide.quote}
                      style={{width: '100%', aspectRatio: '1 / 1', borderRadius: 4, display: 'block', background: '#0a0807'}}
                    />
                    {slide.busy && (
                      <Flex
                        align="center"
                        justify="center"
                        style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 4}}
                      >
                        <Spinner />
                      </Flex>
                    )}
                  </div>
                  {slide.slideError && <ErrorMessage>{slide.slideError}</ErrorMessage>}
                  <Text size={1} muted>
                    Background idea: {slide.subject}
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      text={slide.imageUrl ? 'Regenerate' : 'Generate background'}
                      mode="ghost"
                      fontSize={1}
                      disabled={slide.busy}
                      onClick={() => actions.renderImage(i)}
                    />
                    <CopyPromptButton text={slide.prompt} />
                    <Button
                      text="Upload background"
                      mode="ghost"
                      fontSize={1}
                      disabled={slide.busy}
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = () => {
                          const file = input.files?.[0]
                          if (file) actions.uploadImage(i, file)
                        }
                        input.click()
                      }}
                    />
                    <Button
                      text="Download"
                      mode="ghost"
                      fontSize={1}
                      disabled={slide.busy}
                      onClick={() => actions.downloadSlide(i)}
                    />
                  </Flex>
                  <CopyOption text={slide.quote} onCopy={() => {}} />
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
