import {useState} from 'react'
import {Button, Stack, Text} from '@sanity/ui'
import {CommentIcon} from '@sanity/icons/Comment'
import type {SocialPlatform} from '../lib/platformIcons'

export type {SocialPlatform}

// One row in the Distribution dashboard's "Pull comments back" list -- the
// platform name and pulled-so-far status are shown by the parent row label;
// this only owns the click-to-pull action itself, its in-flight state, and
// the transient result/error feedback right after a click. Calls
// /api/ai/pull-{platform}-comments, which does the Apify call, the dedupe/
// import (src/lib/socialCommentImport.ts), and records the pull timestamp
// on this post's shareLog doc.
//
// `disabled` covers two different reasons a platform can't be pulled yet --
// no URL saved on the post, or no scraper built for it at all (X/Threads) --
// `disabledReason` is shown as the button's hover title either way.
export function PullSocialCommentsButton({
  platform,
  postId,
  onPulled,
  disabled,
  disabledReason,
}: {
  platform: SocialPlatform
  postId: string
  lastPulledAt?: string
  lastPulledCount?: number
  onPulled: () => void
  disabled?: boolean
  disabledReason?: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<{pulled: number; created: number; matched: number} | null>(null)

  async function handlePull() {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`/api/ai/pull-${platform}-comments`, {
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
        tone={status === 'error' ? 'critical' : 'primary'}
        fontSize={1}
        padding={3}
        radius={6}
        title={disabledReason}
        disabled={disabled || status === 'loading'}
        onClick={handlePull}
      />
      {status === 'error' && (
        <Text size={1} muted>
          {error}
        </Text>
      )}
      {status !== 'error' && lastResult && (
        <Text size={1} muted>
          {lastResult.pulled} pulled — {lastResult.created} new, {lastResult.matched} already had
        </Text>
      )}
    </Stack>
  )
}
