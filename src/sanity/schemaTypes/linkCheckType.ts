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
            defineField({name: 'id', title: 'Document ID', type: 'string'}),
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
    defineField({
      name: 'blocked',
      title: 'Likely bot-blocked',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
      description:
        'True when the failure was a 401/403/429 -- the site actively refusing an automated request, not necessarily that the page is gone. Shown as its own "Possibly Blocked" section in Studio -> Content Health rather than lumped in with genuinely broken links.',
    }),
    defineField({
      name: 'lastCheckedAt',
      title: 'Last checked',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      readOnly: true,
    }),
    defineField({
      name: 'brokenSince',
      title: 'Broken since',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
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
    select: {url: 'url', ok: 'ok', isAffiliate: 'isAffiliate', blocked: 'blocked'},
    prepare({url, ok, isAffiliate, blocked}) {
      const status = ok === false ? (blocked ? '⚠ possibly blocked' : '✗ broken') : '✓ ok'
      return {
        title: url || '(no URL)',
        subtitle: `${status}${isAffiliate ? ' · affiliate' : ''}`,
      }
    },
  },
})
