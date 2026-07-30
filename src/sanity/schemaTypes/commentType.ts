import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'

// A visitor-submitted comment on a post. Created via /api/comments (never
// directly in Studio by a visitor) with status "pending" -- nothing shows
// on the live site until approved here. Sanity-native by design: no
// third-party comment service, no ads/tracking, one canonical source.
export const commentType = defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{type: 'post'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Never shown publicly -- for your reference only, in case you want to reply.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending review', value: 'pending'},
          {title: 'Approved (visible on site)', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Submitted',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdAtDesc',
      by: [{field: 'createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {name: 'name', message: 'message', status: 'status', postTitle: 'post.title'},
    prepare: ({name, message, status, postTitle}) => ({
      title: `${name}: ${message?.slice(0, 60) ?? ''}`,
      subtitle: `${status} · on "${postTitle ?? 'unknown post'}"`,
    }),
  },
})
