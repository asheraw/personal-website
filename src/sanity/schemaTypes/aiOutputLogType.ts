import {DocumentsIcon} from '@sanity/icons/Documents'
import {defineArrayMember, defineField, defineType} from 'sanity'

// One document per AI generation call (not a singleton) -- created by
// suggest-seo/route.ts and suggest-social/route.ts the moment suggestions
// are returned, then patched by log-usage/route.ts if/when the editor
// actually applies or copies one of them. This is the "review queue" half
// of AI Workspace: a plain, honest record of every suggestion Gemini made
// and whether it was actually used, browsable in Studio -- not a queue
// that blocks anything or requires action, just visibility.
//
// `output` stores the raw suggestion JSON as text, not structured fields --
// the two features return different shapes (SEO: titles/excerpts/tags,
// social: x/linkedin/facebook), and this is a read-only audit record, not
// something meant to be edited back into a post from here.
export const aiOutputLogType = defineType({
  name: 'aiOutputLog',
  title: 'AI Output Log',
  type: 'document',
  icon: DocumentsIcon,
  fields: [
    defineField({
      name: 'feature',
      title: 'Feature',
      type: 'string',
      readOnly: true,
      options: {list: [{title: 'Suggest SEO & Excerpt', value: 'seo'}, {title: 'Draft Social Copy', value: 'social'}, {title: 'Suggest Image Prompt', value: 'imagePrompt'}]},
    }),
    defineField({name: 'postTitle', title: 'Post', type: 'string', readOnly: true}),
    defineField({name: 'postSlug', title: 'Post slug', type: 'string', readOnly: true}),
    defineField({
      name: 'output',
      title: 'What was suggested',
      type: 'text',
      rows: 10,
      readOnly: true,
      description: 'The raw suggestions Gemini returned, exactly as generated -- for reference, not for editing back into the post from here.',
    }),
    defineField({name: 'used', title: 'Used at least one suggestion', type: 'boolean', readOnly: true, initialValue: false}),
    defineField({
      name: 'usedActions',
      title: 'What was actually used',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'action', type: 'string'}),
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
          ],
          preview: {
            select: {action: 'action', timestamp: 'timestamp'},
            prepare: ({action, timestamp}) => ({
              title: action,
              subtitle: timestamp ? new Date(timestamp).toLocaleString() : undefined,
            }),
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Most recent first',
      name: 'createdDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {feature: 'feature', postTitle: 'postTitle', used: 'used'},
    prepare: ({feature, postTitle, used}) => {
      const label = feature === 'social' ? 'Social copy' : feature === 'imagePrompt' ? 'Image prompt' : 'SEO'
      return {
        title: `${label} — ${postTitle || '(untitled post)'}`,
        subtitle: used ? '✓ used' : 'not used',
      }
    },
  },
})
