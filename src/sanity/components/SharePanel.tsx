import {useState} from 'react'
import {useClient} from 'sanity'
import {Button, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {ShareIcon} from '@sanity/icons/Share'
import {useSocialSuggestions, SocialCopyResults, type PostDraft} from './SuggestSocialCopyShared'

// "Share this post" on the Distribution dashboard -- the same AI-drafted
// caption flow "Draft Social Copy" already gives from inside a post's own
// editor, surfaced here too since Distribution is where Asher actually
// decides what to share and when, not mid-write. Body text isn't in
// DistributionDashboardTool's own post list (just _id/title/slug/
// publishedAt, kept light since it loads every post at once) -- fetched
// here on demand, only once this panel is actually opened for a given post,
// not eagerly for the whole list.
export function SharePanel({postId, title, slug}: {postId: string; title: string; slug: string}) {
  const client = useClient({apiVersion: '2026-07-22'})
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<PostDraft | null>(null)
  const [loadingSource, setLoadingSource] = useState(false)
  const {status, suggestions, error, runSuggestion} = useSocialSuggestions(source)

  async function handleOpen() {
    setOpen(true)
    if (source) return
    setLoadingSource(true)
    try {
      const doc = await client.fetch<{body: unknown}>(`*[_id == $id][0]{body}`, {id: postId})
      const loaded: PostDraft = {title, body: doc?.body, slug: {current: slug}}
      setSource(loaded)
    } finally {
      setLoadingSource(false)
    }
  }

  if (!open) {
    return <Button text="Share this post" icon={ShareIcon} mode="ghost" fontSize={0} padding={2} onClick={handleOpen} />
  }

  return (
    <Stack space={3}>
      <Button text="Hide" mode="ghost" fontSize={0} padding={2} onClick={() => setOpen(false)} />
      {loadingSource || !source ? (
        <Flex align="center" gap={2}>
          <Spinner muted />
          <Text size={1} muted>
            Loading post…
          </Text>
        </Flex>
      ) : status === 'idle' ? (
        <Button text="Draft social copy" tone="primary" fontSize={1} onClick={runSuggestion} />
      ) : (
        <SocialCopyResults
          status={status}
          suggestions={suggestions}
          error={error}
          onRetry={runSuggestion}
          postUrl={`https://asheraw.com/blog/${slug}`}
        />
      )}
    </Stack>
  )
}
