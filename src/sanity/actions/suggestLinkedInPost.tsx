import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {EditIcon} from '@sanity/icons/Edit'
import {Box, Button, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {ErrorMessage} from '../components/ErrorMessage'
import {CopyOption, logUsage} from '../components/SuggestSocialCopyShared'

type PostDraft = {
  title?: string
  body?: unknown
  slug?: {current?: string}
}

type Result = {posts: string[]; logId?: string | null}

// "Draft LinkedIn Post" -- compresses the post's actual full content into a
// standalone, native LinkedIn post via /api/ai/suggest-linkedin-post.
// Deliberately separate from "Draft Social Copy"'s own LinkedIn output,
// which is a short announcement/teaser meant to run with a link posted
// separately in the first comment -- this needs no outbound link at all,
// since LinkedIn's own algorithm rewards content people never have to
// leave the platform to read. No second consumer exists for this yet (see
// docs/ideas/distribution-switchboard.md's own note that dashboard
// integration is separate future work), so this stays a single
// self-contained action rather than a paired Shared component -- same
// shape as generateFeaturedImage.tsx.
export function createSuggestLinkedInPostAction(): DocumentActionComponent {
  const SuggestLinkedInPostAction: DocumentActionComponent = (props: DocumentActionProps) => {
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

    return {
      label: 'Draft LinkedIn Post',
      icon: EditIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted LinkedIn post',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                {status === 'loading' && (
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Reading the post and condensing it…</Text>
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
                      No link needed -- this is meant to stand on its own as a native LinkedIn post. Edit
                      freely before posting.
                    </Text>
                  </Stack>
                )}
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestLinkedInPostAction
}
