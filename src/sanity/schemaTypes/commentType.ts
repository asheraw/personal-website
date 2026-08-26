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
      // Weak, not the default strong reference -- a strong reference is
      // what actually caused the "cannot be deleted, referenced by ..."
      // publish failure documented in RUNBOOK.md: Sanity refuses to
      // delete a draft (which is what publishing does under the hood)
      // while any strong reference still points at its exact ID, and
      // it separately refuses to WRITE a strong reference pointing at a
      // document that doesn't exist yet -- a genuine deadlock for a post
      // that's never published: no published copy can exist until the
      // blocking reference is fixed, and the reference can't be fixed
      // until a published copy exists. A weak reference does neither --
      // it doesn't block deleting its target, and Sanity allows writing
      // one to a not-yet-existing document. The one real trade-off: if a
      // published post is ever deleted while comments still reference
      // it, those comments are left pointing at nothing (shown as a
      // broken-reference warning in Studio, `post->title` resolves to
      // null) instead of Sanity protecting against that deletion --
      // acceptable here since posts on this site are essentially never
      // deleted once real comments exist on them.
      weak: true,
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
      name: 'ip',
      title: 'IP address',
      type: 'string',
      description:
        'Captured at submission, same as the contact form. Used (alongside email) to auto-flag future submissions once something from this address has been marked Spam.',
      readOnly: true,
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 4,
      description: 'Not required if a GIF is attached below -- a GIF alone is a valid comment on its own.',
    }),
    defineField({
      name: 'gifUrl',
      title: 'GIF URL',
      type: 'url',
      description:
        'Set via the GIF picker in the comment form, not typed by hand -- restricted server-side (/api/comments) to Giphy\'s own CDN so this field can never be used to smuggle an arbitrary hotlinked image in. Rendered as a plain <img>, never a clickable link.',
      readOnly: true,
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
          {title: 'Spam', value: 'spam'},
        ],
      },
      description:
        '"Rejected" is a one-off no; "Spam" additionally blocks this email/IP from getting past moderation automatically going forward (see /api/comments\'s spam check). Set by the Spam button in Studio -> Comments, not meant to be picked from this raw list directly.',
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Submitted',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'parentComment',
      title: 'Replying to',
      type: 'reference',
      to: [{type: 'comment'}],
      description: 'Set when this comment is a reply to another one -- either a visitor replying from the live site, or Asher replying from the Comments tool. Nests up to 3 levels deep (comment -> reply -> reply to that reply); replying to an already-3rd-level comment attaches to that comment\'s own parent instead, flattening to a sibling rather than a 4th level (enforced in /api/comments\'s POST handler, not just the UI).',
      readOnly: true,
      // Same reasoning as `post` above -- a reply referencing a parent
      // comment that's itself still an unpublished draft (exactly the
      // shape of a legacy-imported thread) would hit the identical
      // deadlock otherwise: a strong reference can't be written pointing
      // at a not-yet-existing document, and can't block that document's
      // eventual publish either. See RUNBOOK.md.
      weak: true,
    }),
    defineField({
      name: 'isAuthorReply',
      title: "Asher's reply",
      type: 'boolean',
      description: 'Set automatically by the Comments tool\'s Reply action. Drives the distinct styling on the live site -- not meant to be toggled by hand.',
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: 'featuredTestimonial',
      title: 'Featured testimonial',
      type: 'boolean',
      description:
        'Set from the "Feature" button in Studio -> Comments. Shown, one at a time (picked at random per page load), in the small comment social-proof section on /blog -- real name, real quote, real date. Only ever a genuine visitor comment, never one of Asher\'s own replies (see isAuthorReply above) -- this is proof other people are reading and engaging, not a self-quote.',
      initialValue: false,
    }),
    defineField({
      name: 'notifyOnReply',
      title: 'Notify on reply',
      type: 'boolean',
      description:
        'Set by the commenter, opt-in and unchecked by default -- email this address when a new reply lands anywhere else in this same comment thread. Auto-expires (see notifyExpiresAt) after 30 days with no new activity, or when the commenter unsubscribes from a notification email.',
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: 'notifyExpiresAt',
      title: 'Notification expires',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      description:
        'When this reply-notification subscription lapses if the thread stays quiet. Set on submission (+30 days) and pushed forward another 30 days each time a notification actually goes out, so an active conversation keeps everyone subscribed notified.',
      readOnly: true,
      hidden: ({document}) => !document?.notifyOnReply,
    }),
    defineField({
      name: 'editedAt',
      title: 'Last edited by Asher',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      description: 'Set automatically whenever the message is edited from the Comments tool. Not shown publicly.',
      readOnly: true,
      hidden: ({document}) => !document?.editedAt,
    }),
    defineField({
      name: 'trashedAt',
      title: 'Trashed',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      description:
        'Set by the Trash button in Studio -> Comments. A trashed comment never shows on the live site regardless of its status, and is permanently deleted automatically 30 days after this date (or sooner, from the Trash view).',
      readOnly: true,
      hidden: ({document}) => !document?.trashedAt,
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
    select: {
      name: 'name',
      message: 'message',
      gifUrl: 'gifUrl',
      status: 'status',
      postTitle: 'post.title',
      parentComment: 'parentComment._ref',
      trashedAt: 'trashedAt',
      featuredTestimonial: 'featuredTestimonial',
    },
    prepare: ({name, message, gifUrl, status, postTitle, parentComment, trashedAt, featuredTestimonial}) => ({
      title: `${parentComment ? '↳ ' : ''}${featuredTestimonial ? '★ ' : ''}${name}: ${message?.slice(0, 60) ?? (gifUrl ? '[GIF]' : '')}`,
      subtitle: `${trashedAt ? 'trashed · ' : ''}${status} · on "${postTitle ?? 'unknown post'}"`,
    }),
  },
})
