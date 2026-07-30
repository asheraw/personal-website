import {CogIcon} from '@sanity/icons/Cog'
import {defineField, defineType} from 'sanity'

// Singleton -- see structure.tsx, which always opens this exact document ID
// rather than listing many. Same pattern as `aiPromptSettingsType`.
//
// Grew 2026-07-30 from "just default author" to also cover the site-wide
// identity/SEO fields that used to be hardcoded consts in
// src/app/(site)/layout.tsx (title, description, default social image) --
// asked for directly by Asher, not speculative. Other singletons the PRD
// names (Navigation, Analytics, Newsletter) still belong to later phases
// and get their own docs when those phases start; SEO Defaults specifically
// is now partly folded in here rather than kept as a separate empty
// singleton, since "site title/description/social image" IS the SEO
// defaults for a single-author site like this one.
export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fieldsets: [
    {
      name: 'identity',
      title: 'Site identity & SEO',
      description: 'Used as the default browser tab title, search-result description, and social-share preview for the site (homepage, and any page that doesn’t set its own).',
      options: {collapsible: false},
    },
    {
      name: 'publishing',
      title: 'Publishing',
      options: {collapsible: false},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'Site Settings',
    }),
    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
      fieldset: 'identity',
      description: 'Shown in the browser tab and as the main SEO title. Individual pages (like blog posts) show their own title with this appended, e.g. "Post Name · Asher Aw".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      fieldset: 'identity',
      description: 'The description search engines and social previews show under the title, when a page doesn’t have its own.',
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'defaultSocialImage',
      title: 'Default social share image',
      type: 'image',
      fieldset: 'identity',
      description: 'Shown when a link to the site is shared (WhatsApp, X, LinkedIn, etc.) on pages that don’t set their own — the homepage, for example. Blog posts always use their own Main Image instead.',
    }),
    defineField({
      name: 'defaultAuthor',
      title: 'Default author for new posts',
      type: 'reference',
      to: {type: 'author'},
      fieldset: 'publishing',
      description: 'Every new post starts assigned to this author. Change it here any time — it only affects posts created afterward, never existing ones.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'siteTitle'},
    prepare: ({title}) => ({title: 'Site Settings', subtitle: title}),
  },
})
