import {defineArrayMember, defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'

// A reusable block of content -- a pull quote, callout, CTA, author bio, or
// recurring disclaimer -- that gets *referenced* (not copied) into post
// bodies via the `snippetRef` array member added to blockContentType.ts.
// Editing a snippet here updates every post using it, since posts only
// ever store a reference to it, never a copy of its content.
export const snippetType = defineType({
  name: 'snippet',
  title: 'Reusable Snippet',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Internal label',
      type: 'string',
      description: 'For finding it in this list -- not shown to readers.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'snippetType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Pull quote', value: 'pullquote'},
          {title: 'Callout', value: 'callout'},
          {title: 'Call to action', value: 'cta'},
          {title: 'Newsletter signup (Beehiiv)', value: 'newsletter'},
          {title: 'Author bio', value: 'authorbio'},
          {title: 'Disclaimer', value: 'disclaimer'},
        ],
      },
      initialValue: 'callout',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'beehiivFormId',
      title: 'Beehiiv form ID',
      type: 'string',
      description:
        'The long ID from the Beehiiv embed code: the part after data-beehiiv-form=" (e.g. 307a7d3a-414d-...). Not the whole script.',
      hidden: ({document}) => document?.snippetType !== 'newsletter',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.snippetType !== 'newsletter') return true
          if (!value) return 'Paste the form ID from Beehiiv.'
          return /^[0-9a-f-]{36}$/i.test(value) || 'This should look like 307a7d3a-414d-4b32-b79c-313966dc9d45.'
        }),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      hidden: ({document}) => document?.snippetType === 'newsletter',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [{title: 'URL', name: 'href', type: 'url'}],
              },
            ],
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', snippetType: 'snippetType'},
    prepare: ({title, snippetType}) => ({title: title || 'Untitled snippet', subtitle: snippetType}),
  },
})
