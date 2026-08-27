import type {BlockProps} from 'sanity'

/**
 * Forces the Image block to always render its collapsed preview row
 * inline in the Portable Text editor, instead of Sanity's own default
 * full-size "open for editing" view -- Asher's own ask, after noticing a
 * single image (no gallery) stays rendered at full size in the writing
 * flow regardless of whether it's the block he's actually working on
 * right now, unlike the gallery case (which already renders as a compact
 * thumbnail + title row via this same array member's `preview.prepare()`).
 *
 * `open` is a real prop on BlockProps ("If the block is currently opened
 * for editing") -- forcing it false here means the inline flow always
 * shows the compact preview. This doesn't touch the separate edit dialog
 * (clicking the block still opens the Alt text/Caption/Gallery form, via
 * ImageGalleryStatusInput) -- only the READ-ONLY inline rendering changes.
 * Worth confirming directly in Studio: clicking into a photo to adjust its
 * hotspot/crop should still work exactly as before.
 */
export function CollapsedImageBlock(props: BlockProps) {
  return props.renderDefault({...props, open: false})
}
