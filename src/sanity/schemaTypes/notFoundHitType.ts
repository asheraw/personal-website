import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Created programmatically by the 404 page (see src/app/not-found.tsx and
// src/app/api/track-404/route.ts) -- one document per distinct missing
// path, with hitCount going up each time it's hit again, rather than a new
// document per visit. Lets Asher browse "what are people actually looking
// for that doesn't exist" in Studio, the same place he already reviews
// contact submissions -- instead of needing to build a custom report in
// Google Analytics.
export const notFoundHitType = defineType({
  name: 'notFoundHit',
  title: '404 Hit',
  type: 'document',
  icon: LinkRemovedIcon,
  fields: [
    defineField({name: 'path', title: 'Path that was hit', type: 'string', readOnly: true}),
    defineField({name: 'hitCount', title: 'Times hit', type: 'number', readOnly: true, initialValue: 1}),
    defineField({
      name: 'referrer',
      title: 'Last referrer',
      type: 'string',
      readOnly: true,
      description: 'Where the visitor came from on their most recent hit, if their browser sent one. Blank often just means a direct link or a privacy setting stripped it -- not necessarily meaningful on its own.',
    }),
    defineField({
      name: 'userAgent',
      title: 'Last user agent',
      type: 'string',
      readOnly: true,
      description: 'The browser/bot identifying itself on the most recent hit -- the quickest way to tell "a search engine crawler found a stale link" from "a real visitor typed or clicked a wrong URL."',
    }),
    defineField({
      name: 'firstSeenAt',
      title: 'First seen',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      readOnly: true,
    }),
    defineField({
      name: 'lastSeenAt',
      title: 'Last seen',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      readOnly: true,
    }),
    defineField({
      name: 'hits',
      title: 'Hit log',
      type: 'array',
      readOnly: true,
      description: 'Every individual hit on this path -- useful for spotting patterns (e.g. a burst of hits in a short window suggests scanning/bruteforcing rather than organic broken links). Capped at the most recent 500 to keep this from growing unbounded; hitCount above is the true total even past that cap.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
            defineField({name: 'referrer', type: 'string'}),
            defineField({name: 'userAgent', type: 'string'}),
          ],
          preview: {
            select: {timestamp: 'timestamp', referrer: 'referrer'},
            prepare: ({timestamp, referrer}) => ({
              title: timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time',
              subtitle: referrer || 'No referrer',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Ignored', value: 'ignored'},
          {title: 'Actioned', value: 'actioned'},
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      description: 'Pending = not looked at yet. Ignored = you looked and decided it’s not worth doing anything about. Actioned = you set up a redirect, turned it into a post, or otherwise dealt with it. Just for your own tracking.',
    }),
  ],
  orderings: [
    {
      title: 'Most hit first',
      name: 'hitCountDesc',
      by: [{field: 'hitCount', direction: 'desc'}],
    },
    {
      title: 'Most recent first',
      name: 'lastSeenDesc',
      by: [{field: 'lastSeenAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {path: 'path', hitCount: 'hitCount', status: 'status'},
    prepare({path, hitCount, status}) {
      const statusLabel = status === 'actioned' ? ' · ✓ actioned' : status === 'ignored' ? ' · ignored' : ''
      return {
        title: path || '(unknown path)',
        subtitle: `${hitCount || 1}× hit${statusLabel}`,
      }
    },
  },
})
