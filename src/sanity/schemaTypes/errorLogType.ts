import {BugIcon} from '@sanity/icons/Bug'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Created programmatically by ErrorMonitor.tsx (window.onerror / unhandled
// promise rejections) and (site)/error.tsx (React render errors) via
// src/app/api/track-error/route.ts -- one document per distinct error
// message, occurrenceCount going up each time the same one recurs, rather
// than a new document per occurrence. Same shape and reasoning as
// notFoundHitType.ts: lets Asher browse "what's actually breaking for real
// visitors" in Studio, the one place he already checks, instead of needing
// to go dig through Vercel's function logs or a separate error-tracking
// account he'd have to sign up for and remember to check.
//
// Deliberately client-side only for now -- server-side errors (a failed
// Sanity write, an API route throwing) already land in Vercel's own
// function logs, and folding those in too would mean routing every
// existing try/catch through this as well, a separate, bigger change.
// This covers the gap that had nothing at all: JS errors on a real
// visitor's own browser.
export const errorLogType = defineType({
  name: 'errorLog',
  title: 'Error Log',
  type: 'document',
  icon: BugIcon,
  fields: [
    defineField({name: 'message', title: 'Error message', type: 'string', readOnly: true}),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Uncaught script error', value: 'error'},
          {title: 'Unhandled promise rejection', value: 'unhandledrejection'},
          {title: 'React render error', value: 'render'},
        ],
      },
    }),
    defineField({
      name: 'stack',
      title: 'Stack trace (first occurrence)',
      type: 'text',
      readOnly: true,
      description: 'Captured from whichever occurrence created this document. Later occurrences of the same message may have a slightly different stack (e.g. a different call site) -- this is a representative sample, not every one.',
    }),
    defineField({name: 'occurrenceCount', title: 'Times seen', type: 'number', readOnly: true, initialValue: 1}),
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
      name: 'occurrences',
      title: 'Occurrence log',
      type: 'array',
      readOnly: true,
      description: 'Every individual occurrence of this error -- useful for spotting patterns (e.g. always the same page, always the same browser). Capped at the most recent 200 to keep this from growing unbounded; occurrenceCount above is the true total even past that cap.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
            defineField({name: 'path', title: 'Page path', type: 'string'}),
            defineField({name: 'userAgent', type: 'string'}),
          ],
          preview: {
            select: {timestamp: 'timestamp', path: 'path'},
            prepare: ({timestamp, path}) => ({
              title: timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time',
              subtitle: path || 'Unknown page',
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
      description: 'Pending = not looked at yet. Ignored = you looked and decided it’s not worth fixing (e.g. caused by a browser extension, not this site). Actioned = you fixed it. Just for your own tracking.',
    }),
    defineField({
      name: 'resolutionNote',
      title: 'Resolution note',
      type: 'text',
      rows: 3,
      hidden: ({document}) => document?.status !== 'ignored' && document?.status !== 'actioned',
      description: 'Why this was ignored or how it was fixed. The whole point: if this error resurfaces later, whoever looks at it next (including a future AI session with no memory of this conversation) can see the actual reasoning here instead of it only ever having existed in a chat that\'s since scrolled away.',
    }),
  ],
  orderings: [
    {
      title: 'Most seen first',
      name: 'occurrenceCountDesc',
      by: [{field: 'occurrenceCount', direction: 'desc'}],
    },
    {
      title: 'Most recent first',
      name: 'lastSeenDesc',
      by: [{field: 'lastSeenAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {message: 'message', occurrenceCount: 'occurrenceCount', status: 'status', source: 'source'},
    prepare({message, occurrenceCount, status, source}) {
      const statusLabel = status === 'actioned' ? ' · ✓ fixed' : status === 'ignored' ? ' · ignored' : ''
      return {
        title: message || '(no message)',
        subtitle: `${occurrenceCount || 1}× · ${source || 'unknown source'}${statusLabel}`,
      }
    },
  },
})
