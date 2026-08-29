import {BlockPreview} from 'sanity'
import type {BlockProps} from 'sanity'
import {Card} from '@sanity/ui'

// Divider's only field (`style`) is `hidden: true` -- there is genuinely
// nothing to configure. Sanity's default behaviour still auto-opens a full
// edit panel the instant one is inserted, which is just an empty black box
// with nothing in it except an X to close -- Asher's report. This ignores
// `props.open` entirely and always renders the same compact preview, so
// there's simply never a popup to dismiss.
//
// Same Card + tone-on-selected treatment CollapsedImageBlock.tsx uses for
// Image, so Divider and Image now share one consistent look/behaviour in
// the body editor instead of Divider falling back to Sanity's plain
// unstyled default preview -- Asher's own ask (2026-08-29), confirmed by
// screenshot comparison.
export function DividerBlockPreview(props: BlockProps) {
  return (
    <Card radius={2} border tone={props.selected ? 'primary' : 'transparent'}>
      <BlockPreview title="— Divider —" schemaType={props.schemaType} />
    </Card>
  )
}
