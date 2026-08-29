import {BlockPreview} from 'sanity'
import type {BlockProps} from 'sanity'
import {Card} from '@sanity/ui'
import {urlFor} from '../lib/image'

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
  const assetRef = value.asset ?? items[0]?.asset

  // `BlockPreview` used standalone like this doesn't go through Sanity's
  // own async preview-resolution pipeline (the thing that normally turns a
  // raw `{_type: 'image', asset}` shape into an actual thumbnail wherever
  // the schema's `preview.prepare()` output shows up elsewhere, e.g. the
  // Comments tool or a reference list) -- passing that same raw shape here
  // rendered as a blank box, confirmed directly. Building the real URL with
  // the project's own `urlFor` and handing it a genuine `<img>` sidesteps
  // that missing resolution step entirely.
  const media = assetRef?._ref ? (
    <img
      src={urlFor(assetRef).width(64).height(64).fit('crop').url()}
      alt=""
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
  ) : undefined

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
      <BlockPreview title={titleFor(value, extra)} media={media} schemaType={props.schemaType} />
    </Card>
  )
}
