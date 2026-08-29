import {BlockPreview} from 'sanity'
import type {BlockProps} from 'sanity'
import {Card} from '@sanity/ui'

type ImageAsset = {_ref?: string; _type?: string}
type GalleryValue = {
  alt?: string
  asset?: ImageAsset
  additionalImages?: {asset?: ImageAsset}[]
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

  // Used to render a real photo thumbnail here (via `urlFor`) -- Asher's
  // own ask (2026-08-29), after comparing this against Divider's plain
  // icon-and-text row: drop the thumbnail entirely and let `BlockPreview`
  // fall back to the array member's own `icon: ImageIcon`
  // (blockContentType.ts), the same way Divider's row shows its own
  // `icon: UlistIcon` with no media. Now visually consistent with every
  // other block type's collapsed row -- an icon and a title, nothing
  // photo-specific about the treatment.

  // Sanity's own default preview draws a selection outline by reading
  // `props.selected` itself -- since this component replaces that default
  // preview entirely, that outline has to be drawn here too, or selecting
  // the block (which Sanity still tracks correctly, e.g. for backspace-to-
  // delete) is invisible. `border` + tone is the same pattern already used
  // for status colouring in ErrorLogTool.tsx's cards.
  return (
    <Card
      radius={2}
      border
      tone={props.selected ? 'primary' : 'transparent'}
      onDoubleClick={(event) => {
        // Same stopPropagation reasoning as before (see git history), just
        // moved from onClick to onDoubleClick: a single click now falls
        // through untouched to Sanity's own block wrapper, which is what
        // actually handles selecting the block (backspace-to-delete,
        // drag-to-reposition) -- Asher's own ask, confirmed directly: he
        // wants single-click to select like it used to, double-click to
        // open for editing.
        event.stopPropagation()
        props.onOpen()
      }}
      style={{cursor: 'pointer'}}
    >
      <BlockPreview title={titleFor(value, extra)} schemaType={props.schemaType} />
    </Card>
  )
}
