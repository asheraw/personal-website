import {useEffect} from 'react'
import {useFormValue, set} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {slugify} from '../../lib/portableText'

type SlugValue = {current?: string}

// Auto-fills the slug from the title the moment there's a real title to
// slugify -- Asher's own ask (2026-08-30), after noticing Preview stays
// hidden with no explanation until the slug's own "Generate" button gets
// clicked by hand (see openInPresentation.ts's `if (!slug) return null`).
//
// Fires ONLY while the slug is still genuinely empty -- the instant it's
// set, by this auto-fill or by typing one in directly, the effect's own
// `hasSlug` check stops it from ever touching the field again, even if
// the title keeps changing after that. This is the one decision that
// actually matters here, confirmed directly with Asher before building:
// a slug is a permanent address once a post exists (search engines index
// it, links point to it), so only the very first save should ever get to
// invent one for free -- editing an older post's title later must never
// silently rewrite its live URL.
//
// Reuses the same slugify() src/lib/portableText.ts already has for
// heading anchor ids, rather than a second hand-rolled implementation --
// exported from there for this.
export function SlugAutoGenerateInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const title = useFormValue(['title']) as string | undefined
  const hasSlug = !!(value as SlugValue | undefined)?.current

  useEffect(() => {
    if (hasSlug) return
    const generated = title ? slugify(title) : ''
    if (!generated) return
    onChange(set({_type: 'slug', current: generated}))
  }, [title, hasSlug, onChange])

  return props.renderDefault(props)
}
