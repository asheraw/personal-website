import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ShareIcon} from '@sanity/icons/Share'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'

type Suggestions = {x: string[]; linkedin: string[]; facebook: string[]; logId?: string | null}

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Same reasoning as suggestSeo.tsx's own logUsage -- fire-and-forget, no-op
// without a logId, never blocks the actual copy-to-clipboard action.
function logUsage(logId: string | null | undefined, action: string) {
  if (!logId) return
  fetch('/api/ai/log-usage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({logId, action}),
  }).catch(() => {})
}

function CopyOption({text, onCopy}: {text: string; onCopy: () => void}) {
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

/**
 * "Draft Social Copy" -- drafts 2 caption options each for X, LinkedIn, and
 * Facebook from the post's own content via Gemini, for Asher to copy and
 * paste when he announces the post on his own accounts. Never posts
 * anywhere itself and never writes to the document -- purely text to copy,
 * matching the ACE spec's "AI proposes, humans decide" rule the same way
 * "Suggest SEO & Excerpt" already does.
 */
export function createSuggestSocialCopyAction(): DocumentActionComponent {
  const SuggestSocialCopyAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
    const [error, setError] = useState('')

    // A post with no unpublished edits has no draft at all -- only a
    // published version. Fall back to that, same reasoning as
    // suggestSeo.tsx.
    const source = (props.draft ?? props.published) as PostDraft | null

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

    return {
      label: 'Draft Social Copy',
      icon: ShareIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted social captions',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Reading the post and drafting captions…</Text>
                  </Flex>
                )}
                {status === 'error' && (
                  <Stack space={4}>
                    <ErrorMessage>{error}</ErrorMessage>
                    <Button text="Try again" tone="primary" onClick={runSuggestion} />
                  </Stack>
                )}
                {status === 'done' && suggestions && (
                  <Stack space={5}>
                    <Stack space={3}>
                      <Heading size={1}>X (Twitter)</Heading>
                      {suggestions.x.map((text, i) => (
                        <CopyOption
                          key={text}
                          text={text}
                          onCopy={() => logUsage(suggestions.logId, `Copied X caption (option ${i + 1})`)}
                        />
                      ))}
                    </Stack>
                    <Stack space={3}>
                      <Heading size={1}>LinkedIn</Heading>
                      {suggestions.linkedin.map((text, i) => (
                        <CopyOption
                          key={text}
                          text={text}
                          onCopy={() => logUsage(suggestions.logId, `Copied LinkedIn caption (option ${i + 1})`)}
                        />
                      ))}
                    </Stack>
                    <Stack space={3}>
                      <Heading size={1}>Facebook</Heading>
                      {suggestions.facebook.map((text, i) => (
                        <CopyOption
                          key={text}
                          text={text}
                          onCopy={() => logUsage(suggestions.logId, `Copied Facebook caption (option ${i + 1})`)}
                        />
                      ))}
                    </Stack>
                    <Text size={1} muted>
                      Copies to your clipboard, ready to paste into each platform&rsquo;s own composer along
                      with the post link — the link itself is left out on purpose, since X/LinkedIn/Facebook
                      all generate their own preview card from it. Edit freely before posting; these are
                      starting points, not final copy.
                    </Text>
                    <Flex justify="flex-end">
                      <Button text="Close" mode="ghost" onClick={() => setDialogOpen(false)} />
                    </Flex>
                  </Stack>
                )}
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestSocialCopyAction
}
