import {BlockPreview} from 'sanity'
import type {BlockProps} from 'sanity'
import {Card} from '@sanity/ui'

type GifValue = {url?: string; thumbUrl?: string; title?: string}

// Same compact-card treatment CollapsedImageBlock.tsx uses for Image --
// single-click selects (Card border/tone reflects props.selected), double-
// click opens (GifPickerInput.tsx). Simpler than Image's version: the
// thumbnail is already a plain external URL (Giphy's own), no `urlFor`
// resolution needed since there's no Sanity asset behind it at all.
export function CollapsedGifBlock(props: BlockProps) {
  if (props.open) {
    return props.renderDefault(props)
  }

  const value = (props.value ?? {}) as GifValue
  const thumb = value.thumbUrl || value.url
  const media = thumb ? (
    // eslint-disable-next-line @next/next/no-img-element -- external Giphy hotlink, not a Next page
    <img src={thumb} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  ) : undefined

  return (
    <Card
      radius={2}
      border
      tone={props.selected ? 'primary' : 'transparent'}
      onDoubleClick={(event) => {
        event.stopPropagation()
        props.onOpen()
      }}
      style={{cursor: 'pointer'}}
    >
      <BlockPreview title={value.title ? `GIF: ${value.title}` : 'GIF'} media={media} schemaType={props.schemaType} />
    </Card>
  )
}
