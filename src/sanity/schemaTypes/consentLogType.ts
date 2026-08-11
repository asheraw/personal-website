import {BarChartIcon} from '@sanity/icons/BarChart'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Singleton, one document (_id: "consentLog"), updated by
// src/app/api/track-consent/route.ts every time a visitor clicks Accept or
// Decline on the cookie banner. Exists specifically because GA/GTM itself
// can't answer "how many people declined" -- GTM never loads for a visitor
// who declines (that's the whole point of the consent gate), so there's no
// tool inside Google Analytics that could ever see that click. This is a
// first-party count instead: no IP address, no cookie, nothing that
// identifies who clicked -- same "anonymous tally" shape as notFoundHitType.
export const consentLogType = defineType({
  name: 'consentLog',
  title: 'Cookie Consent Log',
  type: 'document',
  icon: BarChartIcon,
  fields: [
    defineField({name: 'acceptedCount', title: 'Accepted', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'declinedCount', title: 'Declined', type: 'number', readOnly: true, initialValue: 0}),
    defineField({
      name: 'entries',
      title: 'Recent choices',
      type: 'array',
      readOnly: true,
      description: 'Every recent accept/decline click, newest last. Capped at the most recent 1000 to keep this from growing unbounded -- the counts above stay the true totals even past that cap.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'choice', type: 'string'}),
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
            // Which of CookieConsent.tsx's VARIANTS copy was shown for this
            // click -- added 2026-08-11 for the manual copy-variant review
            // Asher asked for. Absent on entries logged before that date
            // (nothing to backfill it from), so every count derived from
            // this field elsewhere (the Dashboard's per-variant breakdown)
            // only ever reflects entries recorded from here forward.
            defineField({name: 'variant', type: 'string'}),
          ],
          preview: {
            select: {choice: 'choice', timestamp: 'timestamp', variant: 'variant'},
            prepare: ({choice, timestamp, variant}) => ({
              title: choice === 'accepted' ? 'Accepted' : 'Declined',
              subtitle: `${timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time'}${variant ? ` · ${variant}` : ''}`,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {accepted: 'acceptedCount', declined: 'declinedCount'},
    prepare: ({accepted, declined}) => {
      const a = accepted || 0
      const d = declined || 0
      const total = a + d
      const rate = total ? Math.round((a / total) * 100) : 0
      return {
        title: `${a} accepted · ${d} declined`,
        subtitle: total ? `${rate}% accept rate` : 'No data yet',
      }
    },
  },
})
