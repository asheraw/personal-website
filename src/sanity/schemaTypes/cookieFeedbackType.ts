import {ComponentIcon} from '@sanity/icons/Component'
import {defineField, defineType} from 'sanity'

// Created programmatically by /api/track-cookie-feedback (triggered from
// CookieTasteFeedback.tsx, itself only reachable through the "cookieTasting"
// consent-banner variant -- see CookieConsent.tsx) -- not meant to be
// authored by hand. Deliberately anonymous: no name/email/IP field exists
// here at all, unlike contactSubmissionType, since the whole point was a
// low-stakes "how'd we do" reaction with nothing traceable to a visitor.
export const cookieFeedbackType = defineType({
  name: 'cookieFeedback',
  title: 'Cookie Taste Feedback',
  type: 'document',
  icon: ComponentIcon,
  liveEdit: true,
  fields: [
    defineField({
      name: 'colours',
      title: 'Colours (visual design)',
      type: 'number',
      readOnly: true,
      description: '1 (didn’t land) to 4 (loved it).',
    }),
    defineField({
      name: 'taste',
      title: 'Taste (the writing)',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'texture',
      title: 'Texture (the feel of using it)',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'comment',
      title: 'Comment (optional)',
      type: 'text',
      rows: 3,
      readOnly: true,
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
    select: {colours: 'colours', taste: 'taste', texture: 'texture'},
    prepare({colours, taste, texture}) {
      return {
        title: `Colours ${colours ?? '–'} · Taste ${taste ?? '–'} · Texture ${texture ?? '–'}`,
      }
    },
  },
})
