import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'

// The exact wording currently hardcoded into the Gemini prompt in
// src/app/api/ai/suggest-seo/route.ts, shown here read-only so Asher can see
// what he'd actually be adding to before writing his own tweaks. NOT wired
// up live -- if the real prompt in route.ts changes, update this string to
// match, or this reference copy goes stale.
const CURRENT_DEFAULT_INSTRUCTIONS = `Voice: Write in the author's own voice as it comes through in the content -- not generic marketing copy. Never invent facts, quotes, numbers, or details that aren't actually in the post.

SEO titles: 70 characters or fewer each.

Excerpts: 160 characters or fewer each (doubles as the meta description AND the blog listing preview). The single most important point must appear within the first 120 characters, since mobile search results often cut off before 160. Written to create curiosity that earns the click -- never a flat, generic summary that already gives everything away.

Tags: 3-5 short topic labels (1-3 words each). Tags already used elsewhere on the blog are automatically suggested for reuse, so near-duplicates aren't invented when an existing one already fits.`

// Singleton -- see structure.ts, which always opens this exact document ID
// rather than listing many. Only "extraGuidance" is editable here on
// purpose: the character limits and response-shape instructions in
// suggest-seo/route.ts stay in code, since accidentally editing those away
// would silently break the feature (mismatched excerpt lengths, invalid
// response format, etc).
export const aiPromptSettingsType = defineType({
  name: 'aiPromptSettings',
  title: 'AI Suggestion Settings',
  type: 'document',
  icon: SparklesIcon,
  fieldsets: [
    {
      name: 'reference',
      title: 'What the AI already does (read-only, for reference)',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'AI Suggestion Settings',
    }),
    defineField({
      name: 'currentInstructions',
      title: 'Current default instructions',
      type: 'text',
      rows: 12,
      readOnly: true,
      fieldset: 'reference',
      initialValue: CURRENT_DEFAULT_INSTRUCTIONS,
      description: 'What Gemini is already told, before anything below gets added on top.',
    }),
    defineField({
      name: 'extraGuidance',
      title: 'Extra guidance for AI suggestions',
      type: 'text',
      rows: 8,
      description:
        'Added on top of the instructions above when Gemini suggests SEO titles, excerpts, and tags for a post. Use this to steer tone, call out phrasing to avoid, or note things it should always/never do. Leave blank to use the default behavior only.',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
