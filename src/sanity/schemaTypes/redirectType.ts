import {defineField, defineType} from 'sanity'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'

// Read by src/middleware.ts on every request (cached ~60s) -- a visitor
// hitting `from` gets sent to `to` before Next.js even tries to match a
// route, so this covers a renamed post's old slug, a removed page, or any
// other path that no longer exists but shouldn't just 404. Nothing else
// in the codebase reads this document type.
export const redirectType = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: ArrowRightIcon,
  fields: [
    defineField({
      name: 'from',
      title: 'From path',
      type: 'string',
      description: 'The old path, starting with / -- e.g. /blog/old-slug. No domain, no query string.',
      validation: (rule) =>
        rule
          .required()
          .custom((value) => {
            if (!value) return true
            if (!value.startsWith('/')) return 'Must start with / (e.g. /blog/old-slug)'
            if (value.includes('?')) return "Leave off the query string (the part after '?')"
            return true
          })
          // Two redirects for the same "from" would be ambiguous -- only
          // the first one middleware.ts happens to see would ever apply.
          .custom(async (value, context) => {
            if (!value) return true
            const client = context.getClient({apiVersion: '2026-07-22'})
            const id = context.document?._id?.replace(/^drafts\./, '')
            const duplicate = await client.fetch(
              `count(*[_type == "redirect" && from == $value && !(_id in [$id, "drafts." + $id])])`,
              {value, id: id ?? ''},
            )
            return duplicate === 0 || 'Another redirect already uses this exact "from" path.'
          }),
    }),
    defineField({
      name: 'to',
      title: 'To path or URL',
      type: 'string',
      description: 'Where visitors land instead -- an internal path (/blog/new-slug) or a full URL (https://...).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'permanent',
      title: 'Permanent (301)',
      type: 'boolean',
      description:
        'On = permanent redirect (301) -- tells search engines to update their index to the new address. Off = temporary (302). Almost every real case here (a renamed post, a removed page) is permanent.',
      initialValue: true,
    }),
    defineField({
      name: 'notes',
      title: 'Notes (optional)',
      type: 'string',
      description: 'Just for your own reference -- why this redirect exists.',
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
    select: {from: 'from', to: 'to', permanent: 'permanent'},
    prepare: ({from, to, permanent}) => ({
      title: `${from ?? '(no path yet)'} → ${to ?? '?'}`,
      subtitle: permanent === false ? '302 temporary' : '301 permanent',
    }),
  },
})
