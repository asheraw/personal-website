import {useState} from 'react'
import {Box, Button, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from './ErrorMessage'
import {CopyOption, logUsage} from './SuggestSocialCopyShared'

export type LinkedInPostResult = {posts: string[]; logId?: string | null}

export type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Shared by the "Draft LinkedIn Post" document action (suggestLinkedInPost.tsx)
// and the post editor's "AI Tools" tab -- one real fetch/state flow, not two
// copies of it. Extracted the moment a second consumer showed up, per the
// same reasoning generateFeaturedImage.tsx and this file's own siblings
// already document: pair into Shared only once there's a real reason to,
// not by default.
export function useLinkedInPostSuggestion(source: PostDraft | null) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<LinkedInPostResult | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setStatus('loading')
    setError('')
    try {
      const bodyText = portableTextToPlainText(source?.body)
      const res = await fetch('/api/ai/suggest-linkedin-post', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: source?.title, bodyText, slug: source?.slug?.current}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult({posts: data.posts, logId: data.logId})
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return {status, result, error, run}
}

export function LinkedInPostResults({
  status,
  result,
  error,
  onRetry,
}: {
  status: 'idle' | 'loading' | 'done' | 'error'
  result: LinkedInPostResult | null
  error: string
  onRetry: () => void
}) {
  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>Reading the post and condensing it…</Text>
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
          <Stack space={3}>
            <Heading size={1}>Standalone LinkedIn post</Heading>
            {result.posts.map((text, i) => (
              <CopyOption
                key={text}
                text={text}
                onCopy={() => logUsage(result.logId, `Copied LinkedIn post (option ${i + 1})`)}
              />
            ))}
          </Stack>
          <Text size={1} muted>
            No link needed -- this is meant to stand on its own as a native LinkedIn post. Edit freely before
            posting.
          </Text>
        </Stack>
      )}
    </Box>
  )
}
