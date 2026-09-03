import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'
import {CopyOption, logUsage} from '../components/SuggestSocialCopyShared'

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

type Scene = {narration: string; onScreenDirection: string; videoPrompt: string}
type Result = {scenes: Scene[]; logId?: string | null}

// "Draft Video Script" -- breaks a post into a short-form video script via
// /api/ai/suggest-video-script, each scene paired with narration to read on
// camera AND a separate AI video-generation prompt (for tools like Sora/
// Runway/Veo, no camera needed) in a consistent house visual style. No
// second consumer exists for this yet, so it stays a single self-contained
// action rather than a paired Shared component -- same shape as
// generateFeaturedImage.tsx.
export function createSuggestVideoScriptAction(): DocumentActionComponent {
  const SuggestVideoScriptAction: DocumentActionComponent = (props: DocumentActionProps) => {
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
        const res = await fetch('/api/ai/suggest-video-script', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({title: source?.title, bodyText, slug: source?.slug?.current}),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong')
        setResult({scenes: data.scenes, logId: data.logId})
        setStatus('done')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
        setStatus('error')
      }
    }

    function fullScript(scenes: Scene[]) {
      return scenes
        .map((s, i) => `Scene ${i + 1}\n${s.narration}\n[${s.onScreenDirection}]`)
        .join('\n\n')
    }

    function everything(scenes: Scene[]) {
      return scenes
        .map(
          (s, i) =>
            `Scene ${i + 1}\nNarration: ${s.narration}\nOn screen: ${s.onScreenDirection}\nVideo prompt: ${s.videoPrompt}`
        )
        .join('\n\n')
    }

    return {
      label: 'Draft Video Script',
      icon: ComponentIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted video script',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Breaking the post into scenes…</Text>
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
                    <Flex gap={2} wrap="wrap">
                      <Button
                        text="Copy full script"
                        mode="ghost"
                        fontSize={1}
                        onClick={async () => {
                          await navigator.clipboard.writeText(fullScript(result.scenes))
                          logUsage(result.logId, 'Copied video script')
                        }}
                      />
                      <Button
                        text="Copy everything (script + prompts)"
                        mode="ghost"
                        fontSize={1}
                        onClick={async () => {
                          await navigator.clipboard.writeText(everything(result.scenes))
                          logUsage(result.logId, 'Copied full video script + prompts')
                        }}
                      />
                    </Flex>
                    {result.scenes.map((scene, i) => (
                      <Card key={i} padding={3} radius={2} border>
                        <Stack space={3}>
                          <Flex align="center" gap={2}>
                            <Badge tone="primary">Scene {i + 1}</Badge>
                          </Flex>
                          <Stack space={2}>
                            <Heading size={0}>Narration</Heading>
                            <Text style={{whiteSpace: 'pre-wrap'}}>{scene.narration}</Text>
                          </Stack>
                          <Stack space={2}>
                            <Heading size={0}>On screen</Heading>
                            <Text size={1} muted>
                              {scene.onScreenDirection}
                            </Text>
                          </Stack>
                          <Stack space={2}>
                            <Heading size={0}>Video-gen prompt</Heading>
                            <CopyOption
                              text={scene.videoPrompt}
                              onCopy={() => logUsage(result.logId, `Copied video prompt (scene ${i + 1})`)}
                            />
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                    <Text size={1} muted>
                      Read the narration straight to camera, or paste a scene's video prompt into an AI video
                      tool instead -- either way, edit freely before using.
                    </Text>
                  </Stack>
                )}
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestVideoScriptAction
}
