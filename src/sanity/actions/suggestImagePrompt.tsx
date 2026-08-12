import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'

type Idea = {subject: string; mode: number; prompt: string}
type Suggestions = {ideas: Idea[]; logId?: string | null}

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

// Same fire-and-forget reasoning as suggestSeo.tsx/suggestSocialCopy.tsx's
// own logUsage.
function logUsage(logId: string | null | undefined, action: string) {
  if (!logId) return
  fetch('/api/ai/log-usage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({logId, action}),
  }).catch(() => {})
}

// Mode shown as a small badge above the assembled prompt -- lets Asher
// tell the 3 ideas apart at a glance (isolated subject vs. full scene)
// before reading the whole prompt text, since that's the one thing that
// actually varies in shape between ideas now that the surrounding style
// wording is fixed.
function PromptOption({idea, onCopy}: {idea: Idea; onCopy: () => void}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(idea.prompt)
      setCopied(true)
      onCopy()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Same as CopyOption in suggestSocialCopy.tsx -- nothing to recover
      // into, the text is still fully visible and selectable by hand.
    }
  }

  return (
    <Card padding={3} radius={2} tone="primary" border>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary" fontSize={0}>
            {idea.mode === 2 ? 'Environmental scene' : 'Isolated specimen'}
          </Badge>
        </Flex>
        <Text style={{whiteSpace: 'pre-wrap'}}>{idea.prompt}</Text>
      </Stack>
      <Flex justify="flex-end" marginTop={3}>
        <Button
          text={copied ? 'Copied!' : 'Copy prompt'}
          tone={copied ? 'positive' : 'primary'}
          mode="ghost"
          onClick={handleCopy}
        />
      </Flex>
    </Card>
  )
}

/**
 * "Suggest Image Prompt" -- the ACE spec's DreamLab-style workflow: draft 3
 * ready-to-paste image-generation prompts in Studio, copy one, then
 * generate it separately in Gemini (Asher's actual tool) or any other AI
 * image generator, iterate until satisfied, and upload the result back
 * into this post's Featured/Social Image field by hand. Deliberately not
 * an automated image-generation integration -- the spec explicitly asks
 * not to automate a sub-one-minute manual step without a stable official
 * API and clear long-term value. Never generates an image itself, never
 * writes to the document.
 */
export function createSuggestImagePromptAction(): DocumentActionComponent {
  const SuggestImagePromptAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
    const [error, setError] = useState('')

    const source = (props.draft ?? props.published) as PostDraft | null

    async function runSuggestion() {
      setStatus('loading')
      setError('')
      try {
        const bodyText = portableTextToPlainText(source?.body)
        const res = await fetch('/api/ai/suggest-image-prompt', {
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
      label: 'Suggest Image Prompt',
      icon: ImageIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted image prompts',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Reading the post and drafting three visual concepts…</Text>
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
                      {suggestions.ideas.map((idea, i) => (
                        <PromptOption
                          key={idea.prompt}
                          idea={idea}
                          onCopy={() => logUsage(suggestions.logId, `Copied image prompt (option ${i + 1})`)}
                        />
                      ))}
                    </Stack>
                    <Text size={1} muted>
                      Copy one, paste it into Gemini (or your image generator of choice), generate, download,
                      then upload the result back into this post&rsquo;s Featured Image or Social Sharing Image
                      field. These are starting points — edit freely before generating. The style wording
                      itself comes from Studio → AI Workspace → Suggestion Settings, so tweaking it there
                      applies to every future suggestion.
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

  return SuggestImagePromptAction
}
