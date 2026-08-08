import {useState} from 'react'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from './ErrorMessage'

export type SocialSuggestions = {x: string[]; linkedin: string[]; facebook: string[]; logId?: string | null}

export type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Shared by the "Draft Social Copy" document action (suggestSocialCopy.tsx,
// triggered from the Publish button's own menu) and the "Share this post"
// panel on the Distribution dashboard (SharePanel.tsx) -- same reasoning as
// SuggestSeoShared.tsx: one real fetch/render implementation, two entry
// points into it.

// Fire-and-forget -- a failed log-usage call shouldn't interrupt or delay
// the actual copy-to-clipboard action, it's purely a record of it.
export function logUsage(logId: string | null | undefined, action: string) {
  if (!logId) return
  fetch('/api/ai/log-usage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({logId, action}),
  }).catch(() => {})
}

export function useSocialSuggestions(source: PostDraft | null) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [suggestions, setSuggestions] = useState<SocialSuggestions | null>(null)
  const [error, setError] = useState('')

  async function runSuggestion() {
    setStatus('loading')
    setError('')
    try {
      const bodyText = portableTextToPlainText(source?.body)
      const res = await fetch('/api/ai/suggest-social', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: source?.title, bodyText, slug: source?.slug?.current}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSuggestions(data)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return {status, suggestions, error, runSuggestion}
}

export function CopyOption({text, onCopy}: {text: string; onCopy: () => void}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard permission denied/unavailable -- nothing to recover into,
      // the text is still fully visible and selectable by hand.
    }
  }

  return (
    <Card padding={3} radius={2} tone="primary" border>
      <Text style={{whiteSpace: 'pre-wrap'}}>{text}</Text>
      <Flex align="center" justify="space-between" gap={3} marginTop={3}>
        <Text size={0} muted>
          {text.length} characters
        </Text>
        <Button
          text={copied ? 'Copied!' : 'Copy'}
          tone={copied ? 'positive' : 'primary'}
          mode="ghost"
          onClick={handleCopy}
        />
      </Flex>
    </Card>
  )
}

// The actual dialog/panel body -- loading/error/results states, and every
// platform section. `postUrl` (when given) adds an "Open X to post" link --
// X's own compose intent genuinely supports pre-filled text with no URL
// attached, so that one can be a real one-click hop. LinkedIn/Facebook
// don't get an equivalent: their own share dialogs only accept a URL param,
// not custom caption text, so there's nothing honest to deep-link to there
// -- the copy button is the whole affordance for those two.
export function SocialCopyResults({
  status,
  suggestions,
  error,
  onRetry,
  postUrl,
}: {
  status: 'idle' | 'loading' | 'done' | 'error'
  suggestions: SocialSuggestions | null
  error: string
  onRetry: () => void
  postUrl?: string
}) {
  const xIntentHref = (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`

  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>Reading the post and drafting captions…</Text>
        </Flex>
      )}
      {status === 'error' && (
        <Stack space={4}>
          <ErrorMessage>{error}</ErrorMessage>
          <Button text="Try again" tone="primary" onClick={onRetry} />
        </Stack>
      )}
      {status === 'done' && suggestions && (
        <Stack space={5}>
          <Stack space={3}>
            <Heading size={1}>X (Twitter)</Heading>
            {suggestions.x.map((text, i) => (
              <Stack space={2} key={text}>
                <CopyOption text={text} onCopy={() => logUsage(suggestions.logId, `Copied X caption (option ${i + 1})`)} />
                <Flex justify="flex-end">
                  <Button
                    as="a"
                    href={xIntentHref(text)}
                    target="_blank"
                    rel="noreferrer"
                    text="Open X to post"
                    mode="ghost"
                    fontSize={1}
                    onClick={() => logUsage(suggestions.logId, `Opened X compose (option ${i + 1})`)}
                  />
                </Flex>
              </Stack>
            ))}
          </Stack>
          <Stack space={3}>
            <Heading size={1}>LinkedIn</Heading>
            {suggestions.linkedin.map((text, i) => (
              <CopyOption key={text} text={text} onCopy={() => logUsage(suggestions.logId, `Copied LinkedIn caption (option ${i + 1})`)} />
            ))}
          </Stack>
          <Stack space={3}>
            <Heading size={1}>Facebook</Heading>
            {suggestions.facebook.map((text, i) => (
              <CopyOption key={text} text={text} onCopy={() => logUsage(suggestions.logId, `Copied Facebook caption (option ${i + 1})`)} />
            ))}
          </Stack>
          {postUrl && (
            <Stack space={3}>
              <Heading size={1}>The link itself</Heading>
              <CopyOption text={postUrl} onCopy={() => logUsage(suggestions.logId, 'Copied post URL for a follow-up comment')} />
              <Text size={1} muted>
                Post the caption on its own first, then paste this as a reply/first comment once it&rsquo;s up
                — not attached to the post itself. X and LinkedIn both measurably favor posts without an
                outbound link attached directly; this is the standard workaround.
              </Text>
            </Stack>
          )}
          <Text size={1} muted>
            Edit freely before posting — these are starting points, not final copy.
          </Text>
        </Stack>
      )}
    </Box>
  )
}
