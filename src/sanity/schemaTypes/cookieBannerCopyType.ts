import {LinkIcon} from '@sanity/icons/Link'
import {CommentIcon as MessageIcon} from '@sanity/icons/Comment'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Singleton -- same "always open this exact document" pattern as
// siteSettingsType/linkPageType. Replaces the hardcoded VARIANTS array that
// used to live directly in CookieConsent.tsx: Asher asked to be able to
// edit the wording himself rather than needing a code change for every
// tweak, and this makes the variant *count* editable too, not just the
// text -- add a fourth idea or delete one down to just the winner, entirely
// from Studio.
//
// CookieConsent.tsx fetches `variants` client-side, picks one at random
// each time the banner is about to show (same "re-rolled every prompt, not
// stuck to one visitor" behavior as before), and reports that item's own
// Sanity `_key` as the tracked "variant" id -- so /api/track-consent no
// longer validates against a fixed enum of three known strings, it just
// records whatever key it's given (see track-consent/route.ts).
export const cookieBannerCopyType = defineType({
  name: 'cookieBannerCopy',
  title: 'Cookie Banner Copy',
  type: 'document',
  icon: MessageIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'Cookie Banner Copy',
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      description:
        'One is shown at random each time the cookie banner appears. Add, remove, or edit freely -- the banner always picks from whatever\'s here.',
      validation: (rule) => rule.min(1).error('Keep at least one variant, or the banner has nothing to show.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bannerVariant',
          icon: MessageIcon,
          fields: [
            defineField({
              name: 'label',
              title: 'Label (for your own reference in Studio only)',
              type: 'string',
              description: 'Not shown to visitors -- just so you can tell variants apart in this list.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Banner text',
              type: 'array',
              description: 'Keep it short -- this sits in a single banner strip at the bottom of the page.',
              validation: (rule) => rule.required(),
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{title: 'Normal', value: 'normal'}],
                  lists: [],
                  marks: {
                    decorators: [
                      {title: 'Strong', value: 'strong'},
                      {title: 'Emphasis', value: 'em'},
                    ],
                    annotations: [
                      {
                        title: 'Link',
                        name: 'link',
                        type: 'object',
                        icon: LinkIcon,
                        fields: [{title: 'URL', name: 'href', type: 'url'}],
                      },
                    ],
                  },
                }),
              ],
            }),
            defineField({
              name: 'declineLabel',
              title: 'Decline button text',
              type: 'string',
              initialValue: 'Decline',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'acceptLabel',
              title: 'Accept button text',
              type: 'string',
              initialValue: 'Accept',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'showTasteLink',
              title: 'Show the "how was the cookie?" feedback link',
              type: 'boolean',
              initialValue: false,
              description:
                'Adds a small link opening the anonymous colours/taste/texture feedback form -- turn on for a playful variant, leave off for a plain one.',
            }),
          ],
          preview: {
            select: {label: 'label', accept: 'acceptLabel'},
            prepare: ({label}) => ({title: label || 'Untitled variant'}),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {variants: 'variants'},
    prepare: ({variants}) => ({
      title: 'Cookie Banner Copy',
      subtitle: `${(variants as unknown[] | undefined)?.length ?? 0} variant(s)`,
    }),
  },
})
