import {ImageIcon} from '@sanity/icons/Image'
import {defineField, defineType} from 'sanity'

// A canonical alt text per image ASSET (not per use) -- Sanity's own
// `sanity.imageAsset` system document can't be extended with custom
// fields, so this is a companion document instead, one per asset that's
// had a library-level alt text set. `assetId` is a plain string (the
// asset document's own _id), not a `reference` field -- a `reference`'s
// `to` array has to name a type from this project's own schema, and
// `sanity.imageAsset` (a system type, not a user-defined one) isn't a
// valid target there, which broke Studio's schema compilation entirely
// when tried. A plain string sidesteps that -- this field is `readOnly`
// and only ever set programmatically by MediaLibraryTool.tsx anyway, never
// through Sanity's own reference-picker UI, so nothing is lost by not
// using a real reference.
//
// Used as a *fallback*, not a forced override: wherever a post's main
// image alt text is rendered, an empty per-post `mainImage.alt` falls back
// to this (see POST_SUMMARY_PROJECTION / POST_BY_SLUG_QUERY's
// "mainImageAlt" projection) -- a post-specific alt always wins if one was
// actually written, so this only fills the gap when nobody has.
export const imageAssetAltType = defineType({
  name: 'imageAssetAlt',
  title: 'Image Alt Text',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({name: 'assetId', title: 'Image asset ID', type: 'string', readOnly: true}),
    defineField({
      name: 'altText',
      title: 'Default alt text',
      type: 'string',
      description:
        'Used automatically wherever this image is inserted as a post\'s Featured Image and no alt text was written for that specific post -- a post-specific alt text always takes priority over this if one exists.',
    }),
  ],
  preview: {
    select: {altText: 'altText'},
    prepare: ({altText}) => ({title: altText || '(no default alt text set)'}),
  },
})
