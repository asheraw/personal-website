import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'
import {DEFAULT_AI_PROMPT_INSTRUCTIONS, DEFAULT_VOICE_GUIDANCE} from '../../lib/aiPromptDefaults'

// Singleton -- see structure.ts, which always opens this exact document ID
// rather than listing many.
//
// Fully editable on purpose (an earlier version only allowed appending
// "extra guidance" on top of a read-only baseline, to protect against
// accidentally breaking the feature -- turned out unnecessary): the JSON
// response SHAPE Gemini must return is enforced separately by
// responseSchema in each route (suggest-seo, suggest-social), not by this
// text, and length caps are hard-enforced there too regardless of what
// these fields say. Editing this freely can make suggestions worse, but
// can't actually break either feature.
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
      name: 'voiceGuidance',
      title: 'Voice & tone (used by every AI feature)',
      type: 'text',
      rows: 8,
      initialValue: DEFAULT_VOICE_GUIDANCE,
      description:
        'What Asher’s voice actually sounds like -- shared by every AI-suggestion feature (SEO, social copy, and anything added later), so tweaking it once adjusts all of them instead of needing the same edit copied into several places. Separate from the task-specific instructions below on purpose. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'promptInstructions',
      title: 'SEO suggestion instructions',
      type: 'text',
      rows: 16,
      initialValue: DEFAULT_AI_PROMPT_INSTRUCTIONS,
      description:
        'What Gemini is told when suggesting SEO titles, excerpts, and tags specifically -- the task itself (what to produce, length limits), not the voice (see above). Leave blank to fall back to the default shown here.',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
