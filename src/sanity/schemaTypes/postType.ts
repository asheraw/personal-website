import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {estimateReadingTimeMinutes} from '../../lib/portableText'
import {CategoryCheckboxInput} from '../components/CategoryCheckboxInput'
import {PrimaryCategoryInput} from '../components/PrimaryCategoryInput'
import {TagsAutocompleteInput} from '../components/TagsAutocompleteInput'
import {DistractionFreeWritingPanel} from '../components/DistractionFreeWritingPanel'
import {TitleInputWithSeoSuggest} from '../components/TitleInputWithSeoSuggest'
import {MainImageInputWithSuggestPrompt} from '../components/MainImageInputWithSuggestPrompt'
import {ScheduledPublishInput} from '../components/ScheduledPublishInput'
import {SlugAutoGenerateInput} from '../components/SlugAutoGenerateInput'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  // Field order matches how Asher actually writes, not a database-y default
  // order: draft the body first, then title, then everything downstream of
  // the title (slug), then the image (made manually, after the content is
  // settled), the excerpt, then category/tags, then publish date.
  //
  // Visible by default: only what gets touched on (nearly) every post.
  // Everything else -- SEO/social overrides, discussion settings, author
  // (always Asher, set automatically from Site Settings), PLAY mode --
  // sits in collapsed fieldsets (2026-09-23 editor cleanup, Asher's call:
  // those used to be open on every post, a long scroll of fields almost
  // never changed). Excerpt moved out of Search & Sharing up next to the
  // featured image at the same time: it's the blog-listing summary too,
  // filled in on every post, so it doesn't belong behind a collapsed
  // "overrides" section.
  fieldsets: [
    {name: 'organize', title: 'Organize'},
    {name: 'publishing', title: 'Publishing'},
    {
      name: 'seoSharing',
      title: 'Search & sharing overrides',
      description: 'Optional -- leave blank to use the title, excerpt and featured image. Previewed in the SEO Preview tab.',
      options: {collapsible: true, collapsed: true},
    },
    {name: 'discussion', title: 'Discussion', options: {collapsible: true, collapsed: true}},
    {name: 'byline', title: 'Author', options: {collapsible: true, collapsed: true}},
    {name: 'playMode', title: 'PLAY mode', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'body',
      type: 'blockContent',
      components: {input: DistractionFreeWritingPanel},
    }),
    defineField({
      name: 'title',
      type: 'string',
      components: {input: TitleInputWithSeoSuggest},
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      components: {input: SlugAutoGenerateInput},
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
      ],
      components: {input: MainImageInputWithSuggestPrompt},
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / SEO description',
      type: 'text',
      rows: 3,
      description: 'Blog listing summary + search/social description. Under 160 characters.',
      validation: (rule) => rule.max(160).warning('Past ~160 characters this gets cut off in Google and social previews.'),
    }),
    defineField({
      name: 'categories',
      type: 'array',
      fieldset: 'organize',
      description: 'New categories are added from the Categories tab in the sidebar.',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}, options: {disableNew: true}})],
      components: {input: CategoryCheckboxInput},
    }),
    defineField({
      name: 'primaryCategory',
      title: 'Primary category (for breadcrumb)',
      type: 'reference',
      fieldset: 'organize',
      to: {type: 'category'},
      description: 'Which ticked category shows in the breadcrumb. Blank = the first one.',
      // Only meaningful with 2+ categories ticked -- with one (most posts)
      // the breadcrumb just uses it, so the field was dead space every time.
      hidden: ({document}) => (((document as {categories?: unknown[]})?.categories?.length ?? 0) < 2),
      options: {
        disableNew: true,
        filter: ({document}) => {
          const selected = ((document as {categories?: {_ref: string}[]})?.categories ?? []).map((c) => c._ref)
          return {filter: '_id in $selected', params: {selected}}
        },
      },
      components: {input: PrimaryCategoryInput},
    }),
    defineField({
      name: 'tags',
      type: 'array',
      fieldset: 'organize',
      of: [defineArrayMember({type: 'string'})],
      description: 'Existing tags are suggested as you type.',
      components: {input: TagsAutocompleteInput},
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      fieldset: 'publishing',
      description: 'Defaults to when the post was created.',
      options: {dateFormat: 'YYYY-MMM-DD'},
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'scheduledPublishAt',
      title: 'Schedule for later (optional)',
      type: 'datetime',
      fieldset: 'publishing',
      options: {dateFormat: 'YYYY-MMM-DD'},
      components: {input: ScheduledPublishInput},
      description: 'Unpublished drafts only -- publishes itself sometime that day (checked once daily).',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title (optional)',
      type: 'string',
      fieldset: 'seoSharing',
      description: 'Search results + browser tab. Blank = post title.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social sharing image (optional)',
      type: 'image',
      fieldset: 'seoSharing',
      description: 'Blank = featured image.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'useBrandedSocialCard',
      title: 'Use branded social card instead of the photo',
      type: 'boolean',
      fieldset: 'seoSharing',
      description: 'Shares show a generated title card instead of the image.',
      initialValue: false,
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      fieldset: 'seoSharing',
      description: 'Stays on the site, just out of Google.',
      initialValue: false,
    }),
    // Which of Content Audit's four checks (image/alt text/excerpt/
    // category) Asher has deliberately decided don't apply to this post --
    // per-check, not a whole-post "ignore everything" toggle, on his own
    // call (2026-08-11): a blanket dismissal risked quietly hiding a real
    // problem alongside the one actually being dismissed. Hidden from the
    // normal editor form -- this is only ever set via the "Dismiss" button
    // on a flagged issue in Studio -> Content Health, which has the actual
    // context (what's missing, why) that deciding this needs; it has no
    // business cluttering the main 17-field post form.
    defineField({
      name: 'contentAuditDismissed',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      hidden: true,
    }),
    defineField({
      name: 'commentsLocked',
      title: 'Lock comments',
      type: 'boolean',
      fieldset: 'discussion',
      description: 'Stops new comments; existing ones stay. Also toggleable from Comments.',
      initialValue: false,
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      fieldset: 'discussion',
      description: 'Where this post was shared -- used to pull comments back.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: {
                list: ['Facebook', 'Facebook Page', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'Threads', 'YouTube'],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
            }),
          ],
          preview: {
            select: {platform: 'platform', url: 'url'},
            prepare: ({platform, url}) => ({title: platform, subtitle: url}),
          },
        }),
      ],
    }),
    defineField({
      name: 'author',
      type: 'reference',
      fieldset: 'byline',
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
      fieldset: 'playMode',
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
  // Studio's built-in "Sort by" menu on the Posts list only ever offers
  // Title/Last Edited/Created out of the box -- none of which is the date
  // that actually matters for a backlog of posts imported from years-old
  // Facebook posts (still unpublished, still being worked on): the post's
  // own `publishedAt`, which for these is the real historical date of the
  // original post, not whenever the Sanity draft happened to get created.
  // Asked for directly (2026-08-21) so the backlog can be worked through in
  // real chronological order instead of import order.
  orderings: [
    {
      name: 'publishedAtDesc',
      title: 'Sort by Post Date, Newest',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      name: 'publishedAtAsc',
      title: 'Sort by Post Date, Oldest',
      by: [{field: 'publishedAt', direction: 'asc'}],
    },
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
