import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {defineField, defineType} from 'sanity'

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
    defineField({name: 'firstSeenAt', title: 'First seen', type: 'datetime', readOnly: true}),
    defineField({name: 'lastSeenAt', title: 'Last seen', type: 'datetime', readOnly: true}),
    defineField({
      name: 'actioned',
      title: 'Actioned',
      type: 'boolean',
      description: 'Tick this off once you’ve dealt with this one -- set up a redirect, turned it into a post, or decided it’s not worth doing anything about. Just for your own tracking.',
      initialValue: false,
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
    select: {path: 'path', hitCount: 'hitCount', actioned: 'actioned'},
    prepare({path, hitCount, actioned}) {
      return {
        title: path || '(unknown path)',
        subtitle: `${hitCount || 1}× hit${actioned ? ' · ✓ actioned' : ''}`,
      }
    },
  },
})
