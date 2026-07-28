import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {defineField, defineType} from 'sanity'

// Created programmatically by the contact form's API route (see
// src/app/api/contact/route.ts) -- not meant to be authored by hand,
// which is why most fields are read-only. "Handled" is the one field
// you're meant to actually use, to keep track of what you've replied to.
export const contactSubmissionType = defineType({
  name: 'contactSubmission',
  title: 'Contact Submission',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({name: 'name', type: 'string', readOnly: true}),
    defineField({name: 'email', type: 'string', readOnly: true}),
    defineField({name: 'subject', type: 'string', readOnly: true}),
    defineField({name: 'message', type: 'text', rows: 5, readOnly: true}),
    defineField({name: 'countryCode', title: 'Country code', type: 'string', readOnly: true}),
    defineField({name: 'phone', type: 'string', readOnly: true}),
    defineField({name: 'ip', title: 'IP address', type: 'string', readOnly: true}),
    defineField({
      name: 'emailSent',
      title: 'Notification email sent',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: 'emailError',
      title: 'Email error (if any)',
      type: 'string',
      readOnly: true,
      description: 'Filled in automatically if the notification email failed to send -- the submission itself is still safely saved either way.',
    }),
    defineField({
      name: 'handled',
      title: 'Replied / handled',
      type: 'boolean',
      description: 'Tick this off once you’ve followed up -- just for your own tracking, nothing automatic depends on it.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {name: 'name', subject: 'subject', email: 'email', handled: 'handled'},
    prepare({name, subject, email, handled}) {
      return {
        title: `${name || 'Unknown'} — ${subject || 'No subject'}`,
        subtitle: `${email || ''}${handled ? ' · ✓ handled' : ''}`,
      }
    },
  },
})
