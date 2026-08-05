import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {estimateReadingTimeMinutes} from '../../lib/portableText'
import {CategoryCheckboxInput} from '../components/CategoryCheckboxInput'
import {TagsAutocompleteInput} from '../components/TagsAutocompleteInput'
import {DistractionFreeWritingPanel} from '../components/DistractionFreeWritingPanel'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  // Field order matches how Asher actually writes, not a database-y default
  // order: draft the body first, then title, then everything downstream of
  // the title (slug), then the image (made manually, after the content is
  // settled), then category/tags, then the stuff that's basically automatic
  // (author) or decided right before hitting Publish (date, SEO, social).
  fields: [
    defineField({
      name: 'body',
      type: 'blockContent',
      components: {input: DistractionFreeWritingPanel},
    }),
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
      components: {input: CategoryCheckboxInput},
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
      description: 'Free-form topic labels, separate from categories. Existing tags are suggested as you type, to avoid near-duplicates.',
      components: {input: TagsAutocompleteInput},
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: {type: 'author'},
      // Reads the default author from the Site Settings singleton (Studio
      // sidebar -> Site Settings), configurable there instead of hardcoded.
      // Falls back to the old slug-based lookup only if Site Settings has
      // no default set yet (e.g. a fresh dataset before it's configured).
      initialValue: async (_params, context) => {
        const client = context.getClient({apiVersion: '2023-01-01'})
        const fromSettings = await client.fetch<string | null>(
          `*[_type == "siteSettings"][0].defaultAuthor._ref`
        )
        if (fromSettings) return {_ref: fromSettings}
        const fallbackId = await client.fetch<string | null>(
          `*[_type == "author" && slug.current == "asher-aw"][0]._id`
        )
        return fallbackId ? {_ref: fallbackId} : undefined
      },
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      description: 'Defaults to the moment you create the post. Change it any time — your change is always kept.',
      options: {dateFormat: 'YYYY-MMM-DD'},
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'scheduledPublishAt',
      title: 'Schedule for later (optional)',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      description:
        'Set a date on an unpublished draft and it publishes itself automatically -- no need to come back and click Publish by hand. Checked once a day, so treat this as "goes live sometime that day," not an exact time (a Vercel Hobby-plan limit, not a choice). Has no effect on an already-published post -- only unpublished drafts get auto-published.',
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
      name: 'useBrandedSocialCard',
      title: 'Use branded social card instead of the photo',
      type: 'boolean',
      description:
        'Turn on to show a generated title/category/author card (site colors and type) when this post is shared, instead of the featured photo — useful for posts without a strong photo, or ones you’d rather represent with text. Off by default; existing behavior (the photo) is unaffected unless you turn this on.',
      initialValue: false,
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      description: 'Turn on to keep this post out of Google and other search results (it stays visible on your site).',
      initialValue: false,
    }),
    defineField({
      name: 'commentsLocked',
      title: 'Lock comments',
      type: 'boolean',
      description:
        'Turn on to stop new comments and replies on this post -- existing comments stay exactly as they are, just no new ones can be added. Can also be toggled per-post from Studio -> Comments, right where you already moderate.',
      initialValue: false,
    }),
    // PLAY: an optional, interactive alternative way to experience this
    // post -- separate from the normal reading view (STORY), never
    // required, off by default. `presentation` is deliberately an array
    // capped at one item rather than a plain object: this is the "approved
    // registry" pattern -- Key Moments is the only presentation type that
    // exists today, but adding a second type later (e.g. a before/after
    // slider) means adding another array member here, not restructuring
    // this field. No arbitrary code lives in Sanity either way -- each
    // registered type is a fixed, developer-built component with
    // structured configuration data only.
    defineField({
      name: 'play',
      title: 'PLAY mode',
      type: 'object',
      description: 'An optional, interactive alternative way to experience this post. Off by default -- every post works perfectly well without it.',
      fields: [
        defineField({name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: false}),
        defineField({
          name: 'mobileEnabled',
          title: 'Available on mobile',
          type: 'boolean',
          initialValue: true,
          description: 'Turn off if this presentation genuinely needs a bigger screen -- visitors on mobile see the normal post instead, automatically.',
        }),
        defineField({
          name: 'presentation',
          title: 'Presentation',
          type: 'array',
          description: 'Pick one interactive presentation for this post. Only one kind exists today (Key Moments); more may be added later.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'keyMoments',
              title: 'Key Moments (click-through quote carousel)',
              fields: [
                defineField({
                  name: 'introText',
                  title: 'Intro (optional)',
                  type: 'text',
                  rows: 2,
                  description: 'Shown before the first moment -- a line or two setting up what\'s about to follow.',
                }),
                defineField({
                  name: 'moments',
                  title: 'Moments',
                  type: 'array',
                  description: 'The pull quotes / key lines a reader clicks through, one at a time. "Suggest SEO & Excerpt" on this post can draft pull-quote options to paste in here.',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'moment',
                      fields: [
                        defineField({
                          name: 'quote',
                          title: 'Quote / key line',
                          type: 'text',
                          rows: 3,
                          validation: (rule) => rule.required(),
                        }),
                        defineField({name: 'caption', title: 'Context (optional)', type: 'string'}),
                      ],
                      preview: {
                        select: {quote: 'quote'},
                        prepare: ({quote}) => ({title: quote}),
                      },
                    }),
                  ],
                  validation: (rule) =>
                    rule.min(2).error('Add at least 2 moments -- one alone isn\'t much of a click-through.'),
                }),
              ],
              preview: {
                select: {moments: 'moments'},
                prepare: ({moments}) => ({title: `Key Moments (${moments?.length ?? 0})`}),
              },
            }),
          ],
          validation: (rule) => rule.max(1),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      body: 'body',
    },
    prepare(selection) {
      const {author, body} = selection
      const minutes = estimateReadingTimeMinutes(body)
      const parts = [author && `by ${author}`, `${minutes} min read`].filter(Boolean)
      return {...selection, subtitle: parts.join(' · ')}
    },
  },
})
