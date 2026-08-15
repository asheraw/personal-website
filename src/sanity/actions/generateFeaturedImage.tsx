import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

type Result = {subject: string; assetUrl: string}

/**
 * "Generate Featured Image" -- the automated sibling of "Suggest Image
 * Prompt" (suggestImagePrompt.tsx). That action stops at 3 prompts to copy
 * into DreamLab by hand, on purpose. This one skips the manual step
 * entirely: picks the single most click-worthy concept, renders it with
 * Gemini's own image model, and attaches it as this post's Featured Image
 * directly -- no copy/paste/upload round trip. Built for clearing the
 * Facebook-import backlog fast (see scripts/process-facebook-backlog.mjs)
 * but kept here as a real one-click action for any future post too, since
 * generating one image is a stable official API call, not the
 * no-official-API DreamLab workflow the other action deliberately stayed
 * manual for.
 *
 * Same "AI proposes" spirit still applies to the choice of subject, but
 * there's nothing to choose between here -- if the result doesn't fit, the
 * fix is the same as any AI-drafted image: swap the Featured Image field
 * by hand afterward. That's expected, not a failure mode.
 */
export function createGenerateFeaturedImageAction(): DocumentActionComponent {
  const GenerateFeaturedImageAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [result, setResult] = useState<Result | null>(null)
    const [error, setError] = useState('')

    const source = (props.draft ?? props.published) as PostDraft | null
    // A raw writeClient.patch() below, not useDocumentOperation -- unlike
    // the SEO action, this needs to run from a plain API route (also
    // called directly by the backlog script, no Studio session involved).
    // For an already-published post with no pending draft, this patches
    // the published document directly rather than staging a draft first --
    // fine for this session's actual use (every Facebook-import post is
    // still a fresh draft when this runs), worth revisiting if this action
    // ever gets used on a live post and the instant-live-change surprises
    // anyone.
    const docId = props.draft?._id ?? props.published?._id ?? props.id

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
            postId: docId,
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

    return {
      label: 'Generate Featured Image',
      icon: ImageIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-generated featured image',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Picking a concept and rendering it — this can take a moment…</Text>
                  </Flex>
                )}
                {status === 'error' && (
                  <Stack space={4}>
                    <ErrorMessage>{error}</ErrorMessage>
                    <Button text="Try again" tone="primary" onClick={run} />
                  </Stack>
                )}
                {status === 'done' && result && (
                  <Stack space={4}>
                    <Card padding={3} radius={2} tone="positive" border>
                      <Stack space={3}>
                        <Text weight="semibold">Attached as this post&rsquo;s Featured Image</Text>
                        <Text size={1} muted>{result.subject}</Text>
                        <img
                          src={result.assetUrl}
                          alt={result.subject}
                          style={{width: '100%', borderRadius: 4, display: 'block'}}
                        />
                      </Stack>
                    </Card>
                    <Text size={1} muted>
                      Not quite right? Just replace it from the Featured Image field like any other image — this
                      doesn&rsquo;t lock the field, it only set a starting point.
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

  return GenerateFeaturedImageAction
}
