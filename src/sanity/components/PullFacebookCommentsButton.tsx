import {useState} from 'react'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {CommentIcon} from '@sanity/icons/Comment'

// "Pull comments" on the Distribution dashboard's Facebook column -- calls
// /api/ai/pull-facebook-comments, which itself does the Apify call, the
// dedupe/import (src/lib/facebookCommentImport.ts), and records the pull
// timestamp on this post's shareLog doc. Same loading/error UI pattern as
// SharePanel.tsx's "Draft social copy" flow. Only rendered when the post
// actually has a Facebook socialLinks entry -- nothing to pull otherwise.
export function PullFacebookCommentsButton({
  postId,
  lastPulledAt,
  lastPulledCount,
  onPulled,
}: {
  postId: string
  lastPulledAt?: string
  lastPulledCount?: number
  onPulled: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<{pulled: number; created: number; matched: number} | null>(null)

  async function handlePull() {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/ai/pull-facebook-comments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({postId}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setLastResult(data)
      setStatus('idle')
      onPulled()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <Stack space={1} style={{textAlign: 'right'}}>
      <Button
        text={status === 'loading' ? 'Pulling…' : 'Pull comments'}
        icon={CommentIcon}
        mode="ghost"
        tone={status === 'error' ? 'critical' : undefined}
        fontSize={0}
        padding={2}
        disabled={status === 'loading'}
        onClick={handlePull}
      />
      {status === 'error' && (
        <Text size={0} muted>
          {error}
        </Text>
      )}
      {status !== 'error' && lastResult && (
        <Text size={0} muted>
          {lastResult.pulled} pulled — {lastResult.created} new, {lastResult.matched} already had
        </Text>
      )}
      {status !== 'error' && !lastResult && lastPulledAt && (
        <Flex justify="flex-end">
          <Text size={0} muted>
            Last pulled {new Date(lastPulledAt).toLocaleDateString()} ({lastPulledCount ?? 0})
          </Text>
        </Flex>
      )}
    </Stack>
  )
}
