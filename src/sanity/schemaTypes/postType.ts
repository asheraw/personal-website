import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: {type: 'author'},
      initialValue: async (_params, context) => {
        const client = context.getClient({apiVersion: '2023-01-01'})
        const defaultAuthorId = await client.fetch<string | null>(
          `*[_type == "author" && slug.current == "asher-aw"][0]._id`
        )
        return defaultAuthorId ? {_type: 'reference', _ref: defaultAuthorId} : undefined
      },
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        })
      ]
    }),
    defineField({
      name: 'categories',
      type: 'array',
      description: 'Pick from existing categories. To add a brand-new category, do that from the Categories tab in the left sidebar, then come back here to pick it.',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}, options: {disableNew: true}})],
    }),
    defineField({
      name: 'primaryCategory',
      title: 'Primary category (for breadcrumb)',
      type: 'reference',
      to: {type: 'category'},
      description:
        "Which category should show in the breadcrumb and drive this post's main topic. Only matters if you picked more than one category above — leave blank to just use the first one.",
      options: {
        disableNew: true,
        filter: ({document}) => {
          const selected = ((document as {categories?: {_ref: string}[]})?.categories ?? []).map((c) => c._ref)
          return {filter: '_id in $selected', params: {selected}}
        },
      },
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {
        layout: 'tags',
      },
      description: 'Free-form topic labels, separate from categories.',
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      description: 'Defaults to the moment you create the post. Change it any time — your change is always kept.',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / SEO description',
      type: 'text',
      rows: 3,
      description:
        'Shown on the blog listing AND used as the search-engine/social description — one summary, doing both jobs. Keep it under 160 characters; anything past that gets cut off in Google results and doesn’t help clicks anyway.',
      validation: (rule) => rule.max(160).warning('Past ~160 characters this gets cut off in Google and social previews.'),
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title (optional)',
      type: 'string',
      description: 'Overrides the page title shown in search results and browser tabs. Leave blank to use the post title.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social sharing image (optional)',
      type: 'image',
      description: 'Overrides the image shown when this post is shared on social media. Leave blank to use the featured image.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      description: 'Turn on to keep this post out of Google and other search results (it stays visible on your site).',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})
