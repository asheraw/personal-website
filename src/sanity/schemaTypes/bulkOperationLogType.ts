import {EditIcon} from '@sanity/icons/Edit'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Created programmatically by Studio -> Bulk Operations (see
// BulkOperationsTool.tsx) every time a bulk field edit or search-replace
// actually commits -- one document per operation, never authored by hand.
// `changes` snapshots the *previous* value of every field it touched, per
// affected post, so the whole operation can be undone later by replaying
// those values back -- whole-field snapshots, not per-character diffing,
// deliberately simple: one mechanism covers every operation type
// (add/remove tag, change category, change author, search-replace)
// uniformly, since undoing any of them is the same "put this field back to
// what it was" operation regardless of what changed it.
export const bulkOperationLogType = defineType({
  name: 'bulkOperationLog',
  title: 'Bulk Operation Log',
  type: 'document',
  icon: EditIcon,
  fields: [
    defineField({name: 'performedAt', title: 'Performed', type: 'datetime', readOnly: true}),
    defineField({
      name: 'operationType',
      title: 'Operation',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Add tag', value: 'addTag'},
          {title: 'Remove tag', value: 'removeTag'},
          {title: 'Change category', value: 'changeCategory'},
          {title: 'Change author', value: 'changeAuthor'},
          {title: 'Search & replace', value: 'searchReplace'},
        ],
      },
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'string',
      readOnly: true,
      description: 'Human-readable, e.g. "Added tag \'acting\' to 12 posts" -- what actually shows in the History view.',
    }),
    defineField({
      name: 'changes',
      title: 'Changes',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            // Plain string, not a reference -- a post later deleted
            // shouldn't break this log or block it from displaying.
            defineField({name: 'postId', title: 'Post ID', type: 'string'}),
            defineField({
              name: 'postTitle',
              title: 'Post title',
              type: 'string',
              description: 'Snapshotted at the time -- stays accurate even if the post is later retitled.',
            }),
            defineField({
              name: 'fieldPath',
              title: 'Field',
              type: 'string',
              description: 'Which field this change touched, e.g. "tags", "categories", "author", "title", "excerpt", "body".',
            }),
            defineField({
              name: 'previousValue',
              title: 'Previous value',
              type: 'text',
              description: 'JSON.stringify of the field\'s value before this operation -- what Undo replays back.',
            }),
          ],
          preview: {
            select: {title: 'postTitle', subtitle: 'fieldPath'},
          },
        }),
      ],
    }),
    defineField({
      name: 'undoneAt',
      title: 'Undone',
      type: 'datetime',
      readOnly: true,
      description: 'Set once this operation has been undone from the History view. Hidden until then.',
      hidden: ({document}) => !document?.undoneAt,
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'performedAtDesc',
      by: [{field: 'performedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {summary: 'summary', performedAt: 'performedAt', undoneAt: 'undoneAt'},
    prepare: ({summary, performedAt, undoneAt}) => ({
      title: summary || '(bulk operation)',
      subtitle: `${performedAt ? new Date(performedAt).toLocaleString() : ''}${undoneAt ? ' · undone' : ''}`,
    }),
  },
})
