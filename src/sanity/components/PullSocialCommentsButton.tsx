import {useState} from 'react'
import type {ComponentType} from 'react'
import {Button, Stack, Text} from '@sanity/ui'
import {Linkedin} from 'lucide-react'
import {siFacebook, siInstagram, siTiktok, siYoutube, siX, siThreads} from 'simple-icons'

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'x' | 'threads'

function BrandIcon({path}: {path: string}) {
  return (
    <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function FacebookIcon() {
  return <BrandIcon path={siFacebook.path} />
}
function InstagramIcon() {
  return <BrandIcon path={siInstagram.path} />
}
function TiktokIcon() {
  return <BrandIcon path={siTiktok.path} />
}
function YoutubeIcon() {
  return <BrandIcon path={siYoutube.path} />
}
function XIcon() {
  return <BrandIcon path={siX.path} />
}
function ThreadsIcon() {
  return <BrandIcon path={siThreads.path} />
}

// LinkedIn's mark isn't published in simple-icons -- lucide-react's own
// Linkedin glyph fills in, the same fallback ShareBar.tsx already uses for
// its share row.
const PLATFORM_META: Record<SocialPlatform, {label: string; icon: ComponentType}> = {
  facebook: {label: 'Facebook', icon: FacebookIcon},
  instagram: {label: 'Instagram', icon: InstagramIcon},
  tiktok: {label: 'TikTok', icon: TiktokIcon},
  youtube: {label: 'YouTube', icon: YoutubeIcon},
  linkedin: {label: 'LinkedIn', icon: Linkedin},
  x: {label: 'X', icon: XIcon},
  threads: {label: 'Threads', icon: ThreadsIcon},
}

// Compact per-platform chip on the Distribution dashboard's expanded row --
// calls /api/ai/pull-{platform}-comments, which itself does the Apify call,
// the dedupe/import (src/lib/socialCommentImport.ts), and records the pull
// timestamp on this post's shareLog doc. Shows the real platform mark + name
// so two chips sitting side by side are never visually identical -- the
// "last pulled" detail lives in the title tooltip instead of always-on text,
// keeping the row compact when nothing needs attention.
export function PullSocialCommentsButton({
  platform,
  postId,
  lastPulledAt,
  lastPulledCount,
  onPulled,
}: {
  platform: SocialPlatform
  postId: string
  lastPulledAt?: string
  lastPulledCount?: number
  onPulled: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<{pulled: number; created: number; matched: number} | null>(null)

  const meta = PLATFORM_META[platform]
  const tooltip = lastPulledAt
    ? `Last pulled ${new Date(lastPulledAt).toLocaleDateString()} (${lastPulledCount ?? 0})`
    : `Pull ${meta.label} comments`

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
    <Stack space={1}>
      <Button
        text={status === 'loading' ? 'Pulling…' : meta.label}
        icon={meta.icon}
        mode="ghost"
        tone={status === 'error' ? 'critical' : undefined}
        fontSize={0}
        padding={2}
        radius={6}
        title={tooltip}
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
    </Stack>
  )
}
