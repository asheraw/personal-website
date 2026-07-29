import {useState} from 'react'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'

type Suggestion = {seoTitle: string; excerpt: string}

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

/**
 * "Suggest SEO & Excerpt" -- drafts a suggested SEO title and excerpt from
 * the post's own content via Claude, shown for review. Never writes
 * anything without the editor explicitly clicking "Use this suggestion" --
 * matches the ACE spec's "AI proposes, humans decide" rule.
 */
export function createSuggestSeoAction(): DocumentActionComponent {
  const SuggestSeoAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {patch} = useDocumentOperation(props.id, props.type)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
    const [error, setError] = useState('')

    const draft = props.draft as PostDraft | null

    async function runSuggestion() {
      setStatus('loading')
      setError('')
      try {
        const bodyText = portableTextToPlainText(draft?.body)
        const res = await fetch('/api/ai/suggest-seo', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({title: draft?.title, bodyText}),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong')
        setSuggestion(data)
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
                    <Text>Reading the post and drafting a suggestion…</Text>
                  </Flex>
                )}
                {status === 'error' && (
                  <Stack space={4}>
                    <Text tone="critical">{error}</Text>
                    <Button text="Try again" tone="primary" onClick={runSuggestion} />
                  </Stack>
                )}
                {status === 'done' && suggestion && (
                  <Stack space={4}>
                    <Card padding={3} radius={2} tone="primary" border>
                      <Stack space={2}>
                        <Heading size={0}>Suggested SEO title</Heading>
                        <Text>{suggestion.seoTitle}</Text>
                      </Stack>
                    </Card>
                    <Card padding={3} radius={2} tone="primary" border>
                      <Stack space={2}>
                        <Heading size={0}>Suggested excerpt</Heading>
                        <Text>{suggestion.excerpt}</Text>
                      </Stack>
                    </Card>
                    <Text size={1} muted>
                      This replaces whatever is currently in those two fields — review before applying.
                    </Text>
                    <Flex gap={2}>
                      <Button
                        text="Use this suggestion"
                        tone="positive"
                        icon={SparklesIcon}
                        onClick={() => {
                          patch.execute([
                            {set: {seoTitle: suggestion.seoTitle, excerpt: suggestion.excerpt}},
                          ])
                          setDialogOpen(false)
                          setStatus('idle')
                        }}
                      />
                      <Button
                        text="Discard"
                        mode="ghost"
                        onClick={() => {
                          setDialogOpen(false)
                          setStatus('idle')
                        }}
                      />
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
