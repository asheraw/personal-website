import {Badge} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'
import {SavedStatusInput} from './SavedStatusInput'

/**
 * Wraps the Image block's default editing panel (via SavedStatusInput,
 * unchanged) with one extra line above it: a badge stating plainly whether
 * this is currently a single image or a gallery. Asher's own gap, pointed
 * out directly after a deeper look at this panel: adding a second photo
 * via "More photos" silently turns the whole block into a gallery (Display
 * style appears, the live post renders a carousel instead of one image),
 * but nothing on screen ever announces that shift -- this makes it visible
 * at a glance instead of something only inferable from which fields happen
 * to be showing.
 *
 * Composed alongside SavedStatusInput (not merged into it) because that
 * component is shared with other object types (Accordion, Code block --
 * see blockContentType.ts) that have no `additionalImages` field at all;
 * keeping gallery-specific logic out of it avoids leaking image-only
 * assumptions into unrelated blocks.
 */
export function ImageGalleryStatusInput(props: ObjectInputProps) {
  const additionalCount = ((props.value as {additionalImages?: unknown[]} | undefined)?.additionalImages ?? []).length
  const isGallery = additionalCount > 0

  return (
    <>
      <div style={{marginBottom: 8}}>
        <Badge tone={isGallery ? 'primary' : 'default'} mode="outline">
          {isGallery ? `Gallery — ${additionalCount + 1} photos` : 'Single image'}
        </Badge>
      </div>
      <SavedStatusInput {...props} />
    </>
  )
}
