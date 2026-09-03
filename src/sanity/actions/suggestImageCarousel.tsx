import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Box, Button, Card, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'
import {CopyOption} from '../components/SuggestSocialCopyShared'

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

type Slide = {quote: string; imageUrl: string; assetId: string}
type Result = {slides: Slide[]; warning?: string}

// "Draft Image Carousel" -- generates background-only images (no baked-in
// text) plus quotable lines picked word-for-word from the post, via
// /api/ai/suggest-image-carousel. Deliberately stops there: it never
// composites text onto the images and never attaches anything to the
// post. Asher takes the backgrounds and quotes into Canva himself to build
// the actual editable carousel -- his own call, since Canva's editable
// text layer beats permanently baking the quote into a raster image. No
// second consumer exists for this yet, so it stays a single self-contained
// action rather than a paired Shared component -- same shape as
// generateFeaturedImage.tsx.
export function createSuggestImageCarouselAction(): DocumentActionComponent {
  const SuggestImageCarouselAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [result, setResult] = useState<Result | null>(null)
    const [error, setError] = useState('')

    const source = (props.draft ?? props.published) as PostDraft | null

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

    return {
      label: 'Draft Image Carousel',
      icon: ImagesIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-generated carousel materials',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Picking quotes and rendering backgrounds — this can take a moment for several slides…</Text>
                  </Flex>
                )}
                {status === 'error' && (
                  <Stack space={4}>
                    <ErrorMessage>{error}</ErrorMessage>
                    <Button text="Try again" tone="primary" onClick={run} />
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
                      Backgrounds only, no text baked in on purpose — build the actual carousel in Canva
                      yourself using these images and quotes as raw material.
                    </Text>
                    <Grid columns={[1, 2]} gap={4}>
                      {result.slides.map((slide, i) => (
                        <Card key={slide.assetId} padding={3} radius={2} border>
                          <Stack space={3}>
                            <img
                              src={slide.imageUrl}
                              alt={slide.quote}
                              style={{width: '100%', borderRadius: 4, display: 'block'}}
                            />
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
            ),
          }
        : null,
    }
  }

  return SuggestImageCarouselAction
}
