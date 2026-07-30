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
          {title: 'Author bio', value: 'authorbio'},
          {title: 'Disclaimer', value: 'disclaimer'},
        ],
      },
      initialValue: 'callout',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
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
