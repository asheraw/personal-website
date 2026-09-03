import {CogIcon} from '@sanity/icons/Cog'
import {defineArrayMember, defineField, defineType} from 'sanity'

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
      name: 'blog',
      title: 'Blog page',
      description: 'The heading, tagline, and featured post shown at the top of /blog.',
      options: {collapsible: false},
    },
    {
      name: 'publishing',
      title: 'Publishing',
      options: {collapsible: false},
    },
    {
      name: 'distribution',
      title: 'Connected accounts',
      description: 'One-time registry of your real accounts on each platform, so posts can reference a known account instead of retyping a handle every time.',
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
      name: 'blogHeading',
      title: 'Blog heading',
      type: 'string',
      fieldset: 'blog',
      description: 'The big heading at the top of the blog list page.',
      initialValue: 'Dig The Mind of Asher',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'blogTagline',
      title: 'Blog tagline',
      type: 'text',
      rows: 2,
      fieldset: 'blog',
      description: 'The short line under the heading, above the search box.',
      initialValue: "Welcome to my blog, I'm currently going through a revamp so there's many things that are still a Work-In-Progress.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredPost',
      title: 'Featured post',
      type: 'reference',
      to: {type: 'post'},
      fieldset: 'blog',
      description:
        'Shown in a larger spot at the top of the blog list, above the regular feed -- gives you a deliberate first thing a visitor sees instead of always whatever\'s chronologically newest. Leave empty to skip it and just show posts in normal order.',
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
    defineField({
      name: 'connectedAccounts',
      title: 'Connected accounts',
      type: 'array',
      fieldset: 'distribution',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'connectedAccount',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: {
                list: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'Threads', 'YouTube'],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Profile URL / handle',
              type: 'url',
              validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
            }),
          ],
          preview: {
            select: {platform: 'platform', url: 'url'},
            prepare: ({platform, url}) => ({title: platform, subtitle: url}),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'siteTitle'},
    prepare: ({title}) => ({title: 'Site Settings', subtitle: title}),
  },
})
