import type {ComponentType} from 'react'
import {Linkedin} from 'lucide-react'
import {siFacebook, siInstagram, siTiktok, siYoutube, siX, siThreads} from 'simple-icons'

export type SocialPlatform =
  | 'facebook'
  | 'facebookPage'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'x'
  | 'threads'

function BrandIcon({path}: {path: string}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      style={{display: 'block'}}
    >
      <path d={path} />
    </svg>
  )
}

function FacebookIcon() {
  return <BrandIcon path={siFacebook.path} />
}
// Facebook Page shares the exact same brand mark as Facebook Profile --
// simple-icons only ships one Facebook glyph, there's no separate "Page"
// version to swap in. A small "P" badge in the corner is the actual
// differentiator, so the two are still tellable apart at a glance rather
// than only on hover (where the title="Facebook Page" tooltip already
// worked). Sized entirely in em so it scales correctly whether this
// renders at table-header size or inside a Button's own icon slot.
function FacebookPageIcon() {
  return (
    <span style={{position: 'relative', display: 'inline-flex', width: '1em', height: '1em'}}>
      <BrandIcon path={siFacebook.path} />
      <span
        style={{
          position: 'absolute',
          bottom: '-8%',
          right: '-12%',
          width: '0.52em',
          height: '0.52em',
          borderRadius: '50%',
          background: 'var(--card-bg-color, Canvas)',
          border: '0.07em solid currentColor',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.4em',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        P
      </span>
    </span>
  )
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
// Linkedin glyph fills in, the same fallback ShareBar.tsx uses for its
// public share row. size="1em" keeps it sized the same way as the other
// icons here (which use viewBox 1em SVGs), so a row of platform icons
// side by side don't come out visibly mismatched.
function LinkedinIcon() {
  return <Linkedin size="1em" style={{display: 'block'}} />
}

// Shared between the Distribution dashboard's table header (icon-only
// columns) and its per-platform "Pull comments" rows -- one source for
// which glyph and label goes with which platform, so the two never drift.
export const PLATFORM_META: Record<SocialPlatform, {label: string; icon: ComponentType}> = {
  facebook: {label: 'Facebook', icon: FacebookIcon},
  facebookPage: {label: 'Facebook Page', icon: FacebookPageIcon},
  instagram: {label: 'Instagram', icon: InstagramIcon},
  tiktok: {label: 'TikTok', icon: TiktokIcon},
  youtube: {label: 'YouTube', icon: YoutubeIcon},
  linkedin: {label: 'LinkedIn', icon: LinkedinIcon},
  x: {label: 'X', icon: XIcon},
  threads: {label: 'Threads', icon: ThreadsIcon},
}

// Renders one platform's icon at a given pixel size -- for standalone use
// (table headers, row labels) outside of a Sanity UI Button's own icon
// slot, where PLATFORM_META's "1em" components size themselves off
// whatever font-size context Button already provides.
export function PlatformIcon({platform, size = 16}: {platform: SocialPlatform; size?: number}) {
  const Icon = PLATFORM_META[platform].icon
  return (
    <span style={{fontSize: size, display: 'inline-flex', lineHeight: 0}}>
      <Icon />
    </span>
  )
}
