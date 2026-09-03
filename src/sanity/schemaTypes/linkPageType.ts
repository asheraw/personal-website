import {LinkIcon} from '@sanity/icons/Link'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Singleton -- see structure.tsx, same "always open this exact document"
// pattern as siteSettingsType/aiPromptSettingsType.
//
// Replaces the first version of this feature (a `showOnLinkPage` boolean on
// postType, shipped earlier the same day): Asher wanted real control per
// card -- pick any image from Media (not necessarily a post's current Main
// Image) and choose exactly where it goes (a post on this site, or any
// external URL) -- not "this card is always this post's own image/URL, on
// or off." A manually-ordered array here (drag to reorder in Studio)
// replaces the old publishedAt-desc-across-flagged-posts ordering, since
// these cards are curated one at a time, not derived.
//
// No manual title/caption fields, on purpose -- every card either links to
// a post (which already has its own title, shown live on the card) or an
// external URL (rare enough not to be worth a whole extra field for right
// now). Asked for directly: "No need for title and caption since this is a
// redirect to my posts."
export const linkPageType = defineType({
  name: 'linkPage',
  title: 'Link Page (asheraw.com/link)',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'Link Page',
    }),
    defineField({
      name: 'items',
      title: 'Cards',
      type: 'array',
      description: 'Shown top to bottom exactly in this order -- drag to reorder.',
      // Sanity's own default array-of-objects rendering is one full-width
      // row per card -- 'grid' is Studio's built-in alternative, same one
      // already used for the post gallery's "More photos" field: square
      // tiles wrapping several per row instead of a stacked list, closer to
      // how these cards actually look on the live /link page.
      options: {layout: 'grid'},
      of: [
        defineArrayMember({
          type: 'object',
          name: 'linkItem',
          icon: LinkIcon,
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              description: 'Pick any image from Media -- reuse a post\'s existing photo, or upload/choose something different (e.g. a screenshot of the actual Instagram post).',
              validation: (rule) => rule.required(),
              fields: [
                defineField({name: 'alt', type: 'string', title: 'Alternative text'}),
              ],
            }),
            defineField({
              name: 'linkType',
              title: 'Links to',
              type: 'string',
              options: {
                list: [
                  {title: 'A post on this site', value: 'post'},
                  {title: 'An external URL', value: 'external'},
                ],
                layout: 'radio',
              },
              initialValue: 'post',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'post',
              title: 'Post',
              type: 'reference',
              to: [{type: 'post'}],
              hidden: ({parent}) => (parent as {linkType?: string})?.linkType !== 'post',
              validation: (rule) =>
                rule.custom((value, context) => {
                  const parent = context.parent as {linkType?: string} | undefined
                  if (parent?.linkType === 'post' && !value) return 'Pick a post, or switch "Links to" to an external URL.'
                  return true
                }),
            }),
            defineField({
              name: 'externalUrl',
              title: 'External URL',
              type: 'url',
              hidden: ({parent}) => (parent as {linkType?: string})?.linkType !== 'external',
              validation: (rule) =>
                rule.custom((value, context) => {
                  const parent = context.parent as {linkType?: string} | undefined
                  if (parent?.linkType === 'external' && !value) return 'Add a URL, or switch "Links to" back to a post.'
                  return true
                }).uri({scheme: ['http', 'https']}),
            }),
          ],
          preview: {
            select: {media: 'image', postTitle: 'post.title', linkType: 'linkType', externalUrl: 'externalUrl'},
            prepare: ({media, postTitle, linkType, externalUrl}) => ({
              title: linkType === 'external' ? externalUrl || 'No URL set' : postTitle || 'No post picked',
              subtitle: linkType === 'external' ? 'External link' : 'Post on this site',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {items: 'items'},
    prepare: ({items}) => ({title: 'Link Page', subtitle: `${(items as unknown[] | undefined)?.length ?? 0} card(s)`}),
  },
})
