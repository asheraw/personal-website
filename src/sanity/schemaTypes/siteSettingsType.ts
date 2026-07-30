import {CogIcon} from '@sanity/icons/Cog'
import {defineField, defineType} from 'sanity'

// Singleton -- see structure.ts, which always opens this exact document ID
// rather than listing many. Same pattern as `aiPromptSettingsType`.
//
// Scope kept deliberately small: just what's actually needed right now
// (the default author, which used to be hardcoded via a slug lookup in
// postType.ts). Grows when a real workflow needs another site-wide
// setting, not speculatively ahead of that -- other singletons the PRD
// names (SEO Defaults, Navigation, Analytics, Newsletter) belong to later
// phases and get their own docs when those phases start.
export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'Site Settings',
    }),
    defineField({
      name: 'defaultAuthor',
      title: 'Default author for new posts',
      type: 'reference',
      to: {type: 'author'},
      description: 'Every new post starts assigned to this author. Change it here any time — it only affects posts created afterward, never existing ones.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
