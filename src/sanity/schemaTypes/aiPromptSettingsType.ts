import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'

// Singleton -- see structure.ts, which always opens this exact document ID
// rather than listing many. Only the "extra guidance" part of the AI
// suggestion prompt is editable here on purpose: the character limits and
// response-shape instructions in src/app/api/ai/suggest-seo/route.ts stay
// in code, since accidentally editing those away would silently break the
// feature (mismatched excerpt lengths, invalid response format, etc).
export const aiPromptSettingsType = defineType({
  name: 'aiPromptSettings',
  title: 'AI Suggestion Settings',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'extraGuidance',
      title: 'Extra guidance for AI suggestions',
      type: 'text',
      rows: 8,
      description:
        'Added on top of the built-in instructions Gemini gets when suggesting SEO titles, excerpts, and tags for a post. Use this to steer tone, call out phrasing to avoid, or note things it should always/never do. Leave blank to use the default behavior only.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'AI Suggestion Settings'}),
  },
})
