import {SearchIcon} from '@sanity/icons/Search'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Created programmatically by the blog search box (see BlogSearch.tsx and
// src/app/api/track-search/route.ts) -- one document per distinct query,
// with hitCount going up each time the same thing gets searched again,
// rather than a new document per search. Same shape as notFoundHitType:
// the point isn't traffic-counting, it's "what do people keep looking for
// on this blog" -- especially a query that keeps coming back with zero
// results, which is about as direct a piece of content-idea evidence as
// this site can collect without asking anyone directly.
export const searchQueryLogType = defineType({
  name: 'searchQueryLog',
  title: 'Search Query',
  type: 'document',
  icon: SearchIcon,
  fields: [
    defineField({name: 'query', title: 'Search query', type: 'string', readOnly: true}),
    defineField({name: 'hitCount', title: 'Times searched', type: 'number', readOnly: true, initialValue: 1}),
    defineField({
      name: 'lastResultCount',
      title: 'Last result count',
      type: 'number',
      readOnly: true,
      description: 'How many posts matched the most recent time this was searched. Zero is the strongest signal here -- someone was looking for something this blog doesn\'t have yet.',
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
      title: 'Search log',
      type: 'array',
      readOnly: true,
      description: 'Every individual time this exact query was searched. Capped at the most recent 500 to keep this from growing unbounded; hitCount above is the true total even past that cap.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
            defineField({name: 'resultCount', type: 'number'}),
          ],
          preview: {
            select: {timestamp: 'timestamp', resultCount: 'resultCount'},
            prepare: ({timestamp, resultCount}) => ({
              title: timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time',
              subtitle: `${resultCount ?? 0} result${resultCount === 1 ? '' : 's'}`,
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
      description: 'Pending = not looked at yet. Ignored = you looked and decided it’s not worth writing about. Actioned = you turned it into a post (or it already exists and the search just isn’t finding it). Just for your own tracking.',
    }),
  ],
  orderings: [
    {
      title: 'Most searched first',
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
    select: {query: 'query', hitCount: 'hitCount', lastResultCount: 'lastResultCount', status: 'status'},
    prepare({query, hitCount, lastResultCount, status}) {
      const statusLabel = status === 'actioned' ? ' · ✓ actioned' : status === 'ignored' ? ' · ignored' : ''
      const resultLabel =
        lastResultCount === 0 ? 'no results' : `${lastResultCount ?? '?'} result${lastResultCount === 1 ? '' : 's'}`
      return {
        title: query || '(unknown query)',
        subtitle: `${hitCount || 1}× searched · ${resultLabel}${statusLabel}`,
      }
    },
  },
})
