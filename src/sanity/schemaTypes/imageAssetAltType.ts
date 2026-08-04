import {ImageIcon} from '@sanity/icons/Image'
import {defineField, defineType} from 'sanity'

// A canonical alt text per image ASSET (not per use) -- Sanity's own
// `sanity.imageAsset` system document can't be extended with custom
// fields, so this is a companion document instead, one per asset that's
// had a library-level alt text set, keyed by a real reference so GROQ can
// dereference it (`asset->`) the same way any other reference works.
// Edited from Studio -> Media (MediaLibraryTool.tsx), not browsed as its
// own document list -- excluded from the Structure sidebar's catch-all the
// same way other tool-managed types are.
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
    defineField({
      name: 'asset',
      title: 'Image',
      type: 'reference',
      to: [{type: 'sanity.imageAsset'}],
      readOnly: true,
    }),
    defineField({
      name: 'altText',
      title: 'Default alt text',
      type: 'string',
      description:
        'Used automatically wherever this image is inserted as a post\'s Featured Image and no alt text was written for that specific post -- a post-specific alt text always takes priority over this if one exists.',
    }),
  ],
  preview: {
    select: {altText: 'altText', media: 'asset'},
    prepare: ({altText, media}) => ({title: altText || '(no default alt text set)', media}),
  },
})
