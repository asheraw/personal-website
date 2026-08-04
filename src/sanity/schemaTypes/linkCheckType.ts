import {LinkIcon} from '@sanity/icons/Link'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Created programmatically by the link checker (see src/lib/linkChecker.ts,
// called from both /api/check-links and the daily cron) -- one document per
// distinct URL found across every post and snippet's own content, not
// authored by hand. `sources` is recomputed fresh on every run (not
// accumulated), so a URL removed from every post/snippet it used to appear
// in eventually gets its linkCheck document deleted entirely rather than
// pointing at content that no longer references it.
export const linkCheckType = defineType({
  name: 'linkCheck',
  title: 'Link Check',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({name: 'url', title: 'URL', type: 'url', readOnly: true}),
    defineField({
      name: 'isAffiliate',
      title: 'Affiliate link',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: 'sources',
      title: 'Used in',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'type', type: 'string'}),
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'slug', type: 'string'}),
          ],
          preview: {
            select: {type: 'type', title: 'title'},
            prepare: ({type, title}) => ({title: title, subtitle: type}),
          },
        }),
      ],
    }),
    defineField({name: 'ok', title: 'OK', type: 'boolean', readOnly: true}),
    defineField({name: 'statusCode', title: 'HTTP status', type: 'number', readOnly: true}),
    defineField({name: 'error', title: 'Error (if any)', type: 'string', readOnly: true}),
    defineField({name: 'lastCheckedAt', title: 'Last checked', type: 'datetime', readOnly: true}),
    defineField({
      name: 'brokenSince',
      title: 'Broken since',
      type: 'datetime',
      readOnly: true,
      description: 'When this URL first failed a check -- cleared automatically the next time it passes.',
    }),
  ],
  orderings: [
    {
      title: 'Newest checked first',
      name: 'lastCheckedDesc',
      by: [{field: 'lastCheckedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {url: 'url', ok: 'ok', isAffiliate: 'isAffiliate'},
    prepare({url, ok, isAffiliate}) {
      return {
        title: url || '(no URL)',
        subtitle: `${ok === false ? '✗ broken' : '✓ ok'}${isAffiliate ? ' · affiliate' : ''}`,
      }
    },
  },
})
