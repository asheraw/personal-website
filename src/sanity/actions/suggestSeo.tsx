import {useState} from 'react'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'

type Suggestions = {seoTitles: string[]; excerpts: string[]}

type PostDraft = {
  title?: string
  body?: unknown
}

function portableTextToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      if (typeof block !== 'object' || block === null) return ''
      const b = block as {_type?: string; children?: {text?: string}[]}
      if (b._type !== 'block' || !Array.isArray(b.children)) return ''
      return b.children.map((c) => c.text || '').join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

function TitleOption({text, onUse}: {text: string; onUse: () => void}) {
  return (
    <Card padding={3} radius={2} tone="primary" border>
      <Flex align="center" justify="space-between" gap={3}>
        <Text>{text}</Text>
        <Button text="Use this" tone="positive" mode="ghost" onClick={onUse} />
      </Flex>
      <Box marginTop={2}>
        <Text size={0} muted>
          {text.length}/70 characters
        </Text>
      </Box>
    </Card>
  )
}

function ExcerptOption({text, onUse}: {text: string; onUse: () => void}) {
  // First 120 characters shown in normal weight (what mobile search results
  // actually show); the rest is muted, so it's visually clear at a glance
  // whether the important part is front-loaded the way it needs to be.
  const visible = text.slice(0, 120)
  const overflow = text.slice(120)
  return (
    <Card padding={3} radius={2} tone="primary" border>
      <Text>
        {visible}
        {overflow && <Text muted>{overflow}</Text>}
      </Text>
      <Flex align="center" justify="space-between" gap={3} marginTop={3}>
        <Text size={0} muted>
          {text.length}/160 characters · first 120 shown above the muted part
        </Text>
        <Button text="Use this" tone="positive" mode="ghost" onClick={onUse} />
      </Flex>
    </Card>
  )
}

/**
 * "Suggest SEO & Excerpt" -- drafts 3 options each for SEO title and excerpt
 * from the post's own content via Gemini, shown for review. Never writes
 * anything without the editor explicitly picking one -- matches the ACE
 * spec's "AI proposes, humans decide" rule.
 */
export function createSuggestSeoAction(): DocumentActionComponent {
  const SuggestSeoAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {patch} = useDocumentOperation(props.id, props.type)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
    const [error, setError] = useState('')

    // A post with no unpublished edits has no draft at all -- only a
    // published version. Fall back to that, otherwise this silently sends
    // an empty title/body for any post that's already live and untouched.
    const source = (props.draft ?? props.published) as PostDraft | null

    async function runSuggestion() {
      setStatus('loading')
      setError('')
      try {
        const bodyText = portableTextToPlainText(source?.body)
        const res = await fetch('/api/ai/suggest-seo', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({title: source?.title, bodyText}),
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
      label: 'Suggest SEO & Excerpt',
      icon: SparklesIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-suggested SEO title & excerpt',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Reading the post and drafting suggestions…</Text>
                  </Flex>
                )}
                {status === 'error' && (
                  <Stack space={4}>
                    <Text tone="critical">{error}</Text>
                    <Button text="Try again" tone="primary" onClick={runSuggestion} />
                  </Stack>
                )}
                {status === 'done' && suggestions && (
                  <Stack space={5}>
                    <Stack space={3}>
                      <Heading size={1}>SEO title — pick one</Heading>
                      {suggestions.seoTitles.map((titleOption) => (
                        <TitleOption
                          key={titleOption}
                          text={titleOption}
                          onUse={() => patch.execute([{set: {seoTitle: titleOption}}])}
                        />
                      ))}
                    </Stack>
                    <Stack space={3}>
                      <Heading size={1}>Excerpt — pick one</Heading>
                      {suggestions.excerpts.map((excerptOption) => (
                        <ExcerptOption
                          key={excerptOption}
                          text={excerptOption}
                          onUse={() => patch.execute([{set: {excerpt: excerptOption}}])}
                        />
                      ))}
                    </Stack>
                    <Text size={1} muted>
                      Picking one replaces whatever&rsquo;s currently in that field. You can still edit it
                      afterward — these are starting points, not final copy.
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

  return SuggestSeoAction
}
