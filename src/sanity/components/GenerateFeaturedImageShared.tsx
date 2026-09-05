import {useState} from 'react'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from './ErrorMessage'

export type FeaturedImageResult = {subject: string; assetUrl: string}

export type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Shared by the "Generate Featured Image" document action
// (generateFeaturedImage.tsx) and the post editor's "AI Tools" tab -- one
// real fetch/state flow, not two copies of it. postId is passed in rather
// than derived internally, since the action and the view resolve "which
// document id" slightly differently (DocumentActionProps vs a view's own
// props) -- the hook itself doesn't need to know which.
export function useFeaturedImageGeneration(source: PostDraft | null, postId: string | undefined) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<FeaturedImageResult | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setStatus('loading')
    setError('')
    try {
      const bodyText = portableTextToPlainText(source?.body)
      const res = await fetch('/api/ai/generate-featured-image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: source?.title,
          bodyText,
          slug: source?.slug?.current,
          postId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult({subject: data.subject, assetUrl: data.assetUrl})
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return {status, result, error, run}
}

export function FeaturedImageResults({
  status,
  result,
  error,
  onRetry,
  onClose,
}: {
  status: 'idle' | 'loading' | 'done' | 'error'
  result: FeaturedImageResult | null
  error: string
  onRetry: () => void
  onClose?: () => void
}) {
  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>Picking a concept and rendering it — this can take a moment…</Text>
        </Flex>
      )}
      {status === 'error' && (
        <Stack space={4}>
          <ErrorMessage>{error}</ErrorMessage>
          <Button text="Try again" tone="primary" onClick={onRetry} />
        </Stack>
      )}
      {status === 'done' && result && (
        <Stack space={4}>
          <Card padding={3} radius={2} tone="positive" border>
            <Stack space={3}>
              <Text weight="semibold">Attached as this post&rsquo;s Featured Image</Text>
              <Text size={1} muted>
                {result.subject}
              </Text>
              <img src={result.assetUrl} alt={result.subject} style={{width: '100%', borderRadius: 4, display: 'block'}} />
            </Stack>
          </Card>
          <Text size={1} muted>
            Not quite right? Just replace it from the Featured Image field like any other image — this
            doesn&rsquo;t lock the field, it only set a starting point.
          </Text>
          {onClose && (
            <Flex justify="flex-end">
              <Button text="Close" mode="ghost" onClick={onClose} />
            </Flex>
          )}
        </Stack>
      )}
    </Box>
  )
}
