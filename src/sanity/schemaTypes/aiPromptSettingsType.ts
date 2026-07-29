import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'
import {DEFAULT_AI_PROMPT_INSTRUCTIONS} from '../../lib/aiPromptDefaults'

// Singleton -- see structure.ts, which always opens this exact document ID
// rather than listing many.
//
// Fully editable on purpose (an earlier version only allowed appending
// "extra guidance" on top of a read-only baseline, to protect against
// accidentally breaking the feature -- turned out unnecessary): the JSON
// response SHAPE Gemini must return is enforced separately by
// responseSchema in suggest-seo/route.ts, not by this text, and title/
// excerpt lengths are hard-capped there too regardless of what this field
// says. Editing this freely can make suggestions worse, but can't actually
// break the feature.
export const aiPromptSettingsType = defineType({
  name: 'aiPromptSettings',
  title: 'AI Suggestion Settings',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      hidden: true,
      initialValue: 'AI Suggestion Settings',
    }),
    defineField({
      name: 'promptInstructions',
      title: 'Instructions given to the AI',
      type: 'text',
      rows: 16,
      initialValue: DEFAULT_AI_PROMPT_INSTRUCTIONS,
      description:
        'What Gemini is told when suggesting SEO titles, excerpts, and tags for a post. Edit freely to change tone, phrasing habits, or requirements -- there’s no fixed technical wording buried in here that’s unsafe to touch. Leave blank to fall back to the default shown here.',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
