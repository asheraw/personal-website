import {BlockPreview} from 'sanity'
import type {BlockProps} from 'sanity'

type GalleryValue = {
  alt?: string
  asset?: {_ref?: string; _type?: string}
  additionalImages?: {asset?: {_ref?: string; _type?: string}}[]
  displayStyle?: string
}

// Mirrors the array member's own `preview.prepare()` in blockContentType.ts
// -- duplicated rather than reused because `prepare()` is wired into
// Sanity's schema/select pipeline, not easily callable as a plain function
// from a React component. If one changes (e.g. a new display style), the
// other should too.
function titleFor(value: GalleryValue, extra: number): string {
  if (!extra) return value.alt || 'Image'
  const label =
    value.displayStyle === 'slideshow'
      ? 'Slideshow'
      : value.displayStyle === 'scroll-strip'
        ? 'Scrolling strip'
        : value.displayStyle === 'masonry'
          ? 'Masonry grid'
          : 'Carousel'
  return `Image ${label} (${extra + 1} photos)`
}

/**
 * Replaces the Image block's inline Portable Text rendering with the same
 * compact preview card galleries already use, instead of Sanity's default
 * full-size "open for editing" view -- Asher's own ask, confirmed
 * directly: a single image (no gallery) stayed full-size in the writing
 * flow regardless of focus, unlike a gallery (which already renders
 * compact via this same array member's `preview.prepare()`).
 *
 * First attempt tried `renderDefault({...props, open: false})` -- had no
 * effect. Root cause, on closer look at BlockProps: `open` is real state
 * Sanity itself tracks and passes IN to this component; overriding it in
 * the object handed back to `renderDefault` doesn't change what Sanity's
 * own implementation reads for that decision (only specific documented
 * override points like `renderPreview` are actually honoured that way).
 * This version makes the decision itself instead of trying to talk
 * `renderDefault` into a different one: reads the REAL `props.open`
 * directly, and only falls through to Sanity's own full editing view when
 * it's genuinely true (the block the user just clicked into). Otherwise it
 * renders `BlockPreview` (Sanity's own compact-card component) and wires
 * a click handler straight to `props.onOpen()` -- the same function
 * Sanity's own UI would call -- so clicking the compact card still opens
 * real editing, just no longer defaulting to full-size while unfocused.
 */
export function CollapsedImageBlock(props: BlockProps) {
  if (props.open) {
    return props.renderDefault(props)
  }

  const value = (props.value ?? {}) as GalleryValue
  const items = value.additionalImages ?? []
  const extra = items.length
  const media = {_type: 'image', asset: value.asset ?? items[0]?.asset}

  return (
    <div onClick={() => props.onOpen()} style={{cursor: 'pointer'}}>
      <BlockPreview
        title={titleFor(value, extra)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same runtime-only image-asset shape used in blockContentType.ts's own preview.prepare()
        media={media as any}
        schemaType={props.schemaType}
      />
    </div>
  )
}
