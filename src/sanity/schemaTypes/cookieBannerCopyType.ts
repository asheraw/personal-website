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
// `text`/`linkText`/`linkHref`/`afterLink` replace what was originally a
// Portable Text `body` field (2026-08-11, second pass) -- every real
// variant only ever needed one plain-text sentence with a single link
// embedded partway through (text, then link, then a closing clause), never
// bold/italic/multiple links, so a real rich-text editor was more machinery
// than the actual need justified. This shape is also what makes
// CookiesTool.tsx's single combined edit form possible: plain inputs render
// as plain inputs, whereas embedding a Portable Text editor inside a
// custom Studio pane isn't something Sanity supports directly (its block
// editor is a document-form field, not a component you can mount
// standalone) -- rich text sent this feature back to living in Sanity's
// own document form, exactly what Asher asked to stop being the case.
//
// CookieConsent.tsx fetches `variants` client-side, picks one at random
// each time the banner is about to show (same "re-rolled every prompt, not
// stuck to one visitor" behavior as before), and reports that item's own
// Sanity `_key` as the tracked "variant" id -- so /api/track-consent
// doesn't validate against a fixed enum of known strings, it just records
// whatever key it's given (see track-consent/route.ts).
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
              name: 'text',
              title: 'Banner text',
              type: 'text',
              rows: 3,
              description:
                'Keep it short -- this sits in a single banner strip at the bottom of the page. If Link text below is set, it\'s inserted right after this text (not embedded mid-sentence) -- write this ending naturally leading into it, e.g. "...nothing identifies you. See the".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'linkText',
              title: 'Link text (optional)',
              type: 'string',
              initialValue: 'Privacy Policy',
              description: 'Leave blank for no link at all.',
            }),
            defineField({
              name: 'linkHref',
              title: 'Link URL',
              type: 'url',
              initialValue: '/privacy',
              // Sanity's `url` type rejects a relative path like "/privacy"
              // under its default validation (an absolute URI is required
              // unless told otherwise) -- allowRelative: true is needed for
              // exactly the case this field exists for: an internal link to
              // this site's own Privacy Policy page.
              validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}),
            }),
            defineField({
              name: 'afterLink',
              title: 'Text after the link (optional)',
              type: 'string',
              description:
                'Added directly after the link with no extra space -- start it with a space or punctuation yourself, e.g. " here. Click Accept to help me out, thanks!" or "."',
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
