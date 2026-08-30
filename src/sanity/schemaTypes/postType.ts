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
  // settled), then category/tags, then the stuff that's basically automatic
  // (author) or decided right before hitting Publish (date, SEO, social).
  //
  // Fieldsets add visual dividers/headings on top of that same order --
  // deliberately not reordering anything, just marking where one concern
  // ends and another begins on what was previously one unbroken scroll of
  // 17 fields. Body/title/slug/main image stay ungrouped on purpose: they're
  // the very first thing in the form, so there's nothing above them to
  // visually separate them from. Only PLAY mode collapses by default -- it's
  // off for most posts; every other fieldset stays open since its fields are
  // either touched on every post (Organize, Publishing) or matter enough to
  // stay visible without an extra click (Search & Sharing, Discussion).
  fieldsets: [
    {name: 'organize', title: 'Organize'},
    {name: 'publishing', title: 'Publishing'},
    {
      name: 'seoSharing',
      title: 'Search & Sharing',
      description: 'These are exactly the fields the "SEO Preview" tab (next to Editor, above) previews.',
    },
    {name: 'discussion', title: 'Discussion'},
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
      name: 'categories',
      type: 'array',
      fieldset: 'organize',
      description: 'Pick from existing categories. To add a brand-new category, do that from the Categories tab in the left sidebar, then come back here to pick it.',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}, options: {disableNew: true}})],
      components: {input: CategoryCheckboxInput},
    }),
    defineField({
      name: 'primaryCategory',
      title: 'Primary category (for breadcrumb)',
      type: 'reference',
      fieldset: 'organize',
      to: {type: 'category'},
      description:
        "Which category should show in the breadcrumb and drive this post's main topic. Only matters if you picked more than one category above — leave blank to just use the first one. Tap one of the buttons below to pick it -- only ever shows categories you've already ticked above, so there's nothing to search for.",
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
      description: 'Free-form topic labels, separate from categories. Existing tags are suggested as you type, to avoid near-duplicates.',
      components: {input: TagsAutocompleteInput},
    }),
    defineField({
      name: 'author',
      type: 'reference',
      fieldset: 'publishing',
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
      fieldset: 'publishing',
      description: 'Defaults to the moment you create the post. Change it any time — your change is always kept.',
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
      description:
        'Set a date on an unpublished draft and it publishes itself automatically -- no need to come back and click Publish by hand. Checked once a day, so treat this as "goes live sometime that day," not an exact time. Has no effect on an already-published post -- only unpublished drafts get auto-published.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / SEO description',
      type: 'text',
      fieldset: 'seoSharing',
      rows: 3,
      description:
        'Shown on the blog listing AND used as the search-engine/social description — one summary, doing both jobs. Keep it under 160 characters; anything past that gets cut off in Google results and doesn’t help clicks anyway.',
      validation: (rule) => rule.max(160).warning('Past ~160 characters this gets cut off in Google and social previews.'),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title (optional)',
      type: 'string',
      fieldset: 'seoSharing',
      description: 'Overrides the page title shown in search results and browser tabs. Leave blank to use the post title.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social sharing image (optional)',
      type: 'image',
      fieldset: 'seoSharing',
      description: 'Overrides the image shown when this post is shared on social media. Leave blank to use the featured image.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'useBrandedSocialCard',
      title: 'Use branded social card instead of the photo',
      type: 'boolean',
      fieldset: 'seoSharing',
      description:
        'Turn on to show a generated title/category/author card (site colors and type) when this post is shared, instead of the featured photo — useful for posts without a strong photo, or ones you’d rather represent with text. Off by default; existing behavior (the photo) is unaffected unless you turn this on.',
      initialValue: false,
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      fieldset: 'seoSharing',
      description: 'Turn on to keep this post out of Google and other search results (it stays visible on your site).',
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
      description:
        'Turn on to stop new comments and replies on this post -- existing comments stay exactly as they are, just no new ones can be added. Can also be toggled per-post from Studio -> Comments, right where you already moderate.',
      initialValue: false,
    }),
    defineField({
      name: 'legacyFacebookThreadUrl',
      title: 'Original Facebook thread (internal note)',
      type: 'url',
      fieldset: 'discussion',
      description:
        'Internal reference only -- never shown on the live site or fed into anything automated. Facebook comments on personal-profile posts (not a Page) aren\'t reachable through any API, so cross-checking an imported thread against the real one means opening this link by hand. Safe to delete once you\'re done cross-checking a post\'s comments -- nothing else in the codebase reads this field.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
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
