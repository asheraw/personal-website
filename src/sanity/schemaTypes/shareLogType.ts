import {ShareIcon} from '@sanity/icons/Share'
import {defineArrayMember, defineField, defineType} from 'sanity'

// One document per post (_id: "share-<slug>"), created/incremented by
// /api/track-share -- called from ShareBar.tsx alongside its existing
// GA event, so this stays accurate even for visitors who declined
// analytics (GA/GTM never loads for them; this first-party count still
// does, same "works regardless of consent" reasoning as consentLogType).
//
// Deliberately scoped to *outbound* share-button clicks only -- "which of
// my posts are actually getting shared, and to where" -- not replies,
// likes, or engagement pulled back from X/Facebook/LinkedIn's own APIs.
// ACE_MASTER_SPEC.md is explicit that automated multi-platform engagement
// tracking isn't worth the ongoing API fees/OAuth/platform churn for a
// solo creator; this is the scoped, actually-useful half of "distribution
// dashboard" instead.
export const shareLogType = defineType({
  name: 'shareLog',
  title: 'Social Share',
  type: 'document',
  icon: ShareIcon,
  fields: [
    defineField({name: 'postSlug', title: 'Post', type: 'string', readOnly: true}),
    defineField({
      name: 'postTitle',
      title: 'Post title',
      type: 'string',
      readOnly: true,
      description: 'Denormalized from the post at the time of its first share, purely so this list is readable without following a reference. If the post is later retitled, this stays as it was.',
    }),
    defineField({name: 'totalShares', title: 'Total shares', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'xCount', title: 'X (Twitter)', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'facebookCount', title: 'Facebook', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'linkedinCount', title: 'LinkedIn', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'whatsappCount', title: 'WhatsApp', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'emailCount', title: 'Email', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'copyLinkCount', title: 'Copy link', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'nativeCount', title: 'Native share sheet', type: 'number', readOnly: true, initialValue: 0}),
    defineField({
      name: 'lastSharedAt',
      title: 'Last shared',
      type: 'datetime',
      options: {dateFormat: 'YYYY-MMM-DD'},
      readOnly: true,
    }),
    // Manual, not automated -- ACE_MASTER_SPEC.md is explicit that pulling
    // replies/engagement back from X/Facebook/LinkedIn's own APIs isn't
    // worth the ongoing fees/OAuth/platform churn for a solo creator. This
    // is the other half of "distribution dashboard": a place to jot down
    // "got 3 replies on LinkedIn" by hand, from Studio -> Distribution,
    // without needing any platform integration at all.
    defineField({
      name: 'engagementNotes',
      title: 'Engagement notes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'note', type: 'text', rows: 2}),
            defineField({name: 'platform', type: 'string'}),
            defineField({name: 'timestamp', type: 'datetime', options: {dateFormat: 'YYYY-MMM-DD'}}),
          ],
          preview: {
            select: {note: 'note', platform: 'platform', timestamp: 'timestamp'},
            prepare: ({note, platform, timestamp}) => ({
              title: note,
              subtitle: `${platform ? `${platform} · ` : ''}${timestamp ? new Date(timestamp).toLocaleDateString() : ''}`,
            }),
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Most shared first',
      name: 'totalSharesDesc',
      by: [{field: 'totalShares', direction: 'desc'}],
    },
    {
      title: 'Most recent first',
      name: 'lastSharedDesc',
      by: [{field: 'lastSharedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'postTitle',
      total: 'totalShares',
      x: 'xCount',
      facebook: 'facebookCount',
      linkedin: 'linkedinCount',
      whatsapp: 'whatsappCount',
    },
    prepare: ({title, total, x, facebook, linkedin, whatsapp}) => ({
      title: title || '(untitled post)',
      subtitle: `${total || 0} shares — X ${x || 0} · FB ${facebook || 0} · LinkedIn ${linkedin || 0} · WhatsApp ${whatsapp || 0}`,
    }),
  },
})
