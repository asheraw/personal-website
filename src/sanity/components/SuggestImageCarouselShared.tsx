import {useState} from 'react'
import {Box, Button, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {LaunchIcon} from '@sanity/icons/Launch'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from './ErrorMessage'
import {CopyOption} from './SuggestSocialCopyShared'

export type CarouselSlide = {quote: string; imageUrl: string; assetId: string}
export type ImageCarouselResult = {slides: CarouselSlide[]; warning?: string}

export type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Shared by the "Draft Image Carousel" document action
// (suggestImageCarousel.tsx) and the post editor's "AI Tools" tab -- one
// real fetch/state flow, not two copies of it.
export function useImageCarouselSuggestion(source: PostDraft | null) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ImageCarouselResult | null>(null)
  const [error, setError] = useState('')

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
      setResult({slides: data.slides, warning: data.warning})
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return {status, result, error, run}
}

export function ImageCarouselResults({
  status,
  result,
  error,
  onRetry,
}: {
  status: 'idle' | 'loading' | 'done' | 'error'
  result: ImageCarouselResult | null
  error: string
  onRetry: () => void
}) {
  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>Picking quotes and rendering backgrounds — this can take a moment for several slides…</Text>
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
          {result.warning && (
            <Card padding={3} radius={2} tone="caution" border>
              <Text size={1}>{result.warning}</Text>
            </Card>
          )}
          <Text size={1} muted>
            Backgrounds only, no text baked in on purpose — build the actual carousel in Canva yourself using
            these images and quotes as raw material.
          </Text>
          <Grid columns={[1, 2]} gap={4}>
            {result.slides.map((slide, i) => (
              <Card key={slide.assetId} padding={3} radius={2} border>
                <Stack space={3}>
                  <img src={slide.imageUrl} alt={slide.quote} style={{width: '100%', borderRadius: 4, display: 'block'}} />
                  <CopyOption text={slide.quote} onCopy={() => {}} />
                  <Button
                    as="a"
                    href={slide.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    text={`Open slide ${i + 1} image`}
                    icon={LaunchIcon}
                    mode="ghost"
                    fontSize={1}
                  />
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
