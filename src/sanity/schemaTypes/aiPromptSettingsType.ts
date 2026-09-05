import {SparklesIcon} from '@sanity/icons/Sparkles'
import {defineField, defineType} from 'sanity'
import {
  DEFAULT_AI_PROMPT_INSTRUCTIONS,
  DEFAULT_VOICE_GUIDANCE,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  DEFAULT_COMPOSITION_MODE_1,
  DEFAULT_COMPOSITION_MODE_2,
  DEFAULT_LINKEDIN_TRIM_INSTRUCTIONS,
  DEFAULT_VIDEO_SCRIPT_INSTRUCTIONS,
  DEFAULT_VIDEO_STYLE_GUIDANCE,
  DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS,
} from '../../lib/aiPromptDefaults'

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
  // Grouped into tabs once this grew from 3 fields to 16 in one session --
  // a single flat scroll of ~76 rows of textarea had no way to jump to the
  // one prompt you actually came to edit. "Prompts" holds the task
  // instructions per feature (what to produce); "Image style" holds the
  // locked visual-identity constants (what it should look like) -- a
  // different concern from task instructions, not just an alphabetical
  // split.
  groups: [
    {name: 'voice', title: 'Voice', default: true},
    {name: 'providers', title: 'Providers'},
    {name: 'prompts', title: 'Prompts'},
    {name: 'imageStyle', title: 'Image style'},
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
      name: 'voiceGuidance',
      title: 'Voice & tone (used by every AI feature)',
      type: 'text',
      rows: 8,
      group: 'voice',
      initialValue: DEFAULT_VOICE_GUIDANCE,
      description:
        'What Asher’s voice actually sounds like -- shared by every AI-suggestion feature (SEO, social copy, and anything added later), so tweaking it once adjusts all of them instead of needing the same edit copied into several places. Separate from the task-specific instructions below on purpose. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'textProvider',
      title: 'Text generation provider',
      type: 'string',
      group: 'providers',
      options: {list: [{title: 'Gemini', value: 'gemini'}, {title: 'OpenRouter', value: 'openrouter'}]},
      initialValue: 'gemini',
      description:
        'Which AI provider drafts text (SEO suggestions today; more features over time). Gemini is the proven default -- switching to OpenRouter requires OPENROUTER_API_KEY to be set (see RUNBOOK.md) and lets you pick a specific model below.',
    }),
    defineField({
      name: 'textModel',
      title: 'OpenRouter text model',
      type: 'string',
      group: 'providers',
      description:
        'Only used when the provider above is set to OpenRouter -- an OpenRouter model id (e.g. "openai/gpt-4o-mini"). Ignored entirely on Gemini.',
      hidden: ({parent}) => (parent as {textProvider?: string} | undefined)?.textProvider !== 'openrouter',
    }),
    defineField({
      name: 'imageProvider',
      title: 'Image generation provider',
      type: 'string',
      group: 'providers',
      options: {list: [{title: 'Gemini', value: 'gemini'}, {title: 'OpenRouter', value: 'openrouter'}]},
      initialValue: 'gemini',
      description:
        'Which AI provider renders images (Generate Featured Image, and anything added later). Gemini is the proven default -- switching to OpenRouter requires OPENROUTER_API_KEY to be set (see RUNBOOK.md) and lets you pick a specific model below.',
    }),
    defineField({
      name: 'imageModel',
      title: 'OpenRouter image model',
      type: 'string',
      group: 'providers',
      description:
        'Only used when the provider above is set to OpenRouter -- an OpenRouter model id. Ignored entirely on Gemini.',
      hidden: ({parent}) => (parent as {imageProvider?: string} | undefined)?.imageProvider !== 'openrouter',
    }),
    defineField({
      name: 'promptInstructions',
      title: 'SEO suggestion instructions',
      type: 'text',
      rows: 16,
      group: 'prompts',
      initialValue: DEFAULT_AI_PROMPT_INSTRUCTIONS,
      description:
        'What Gemini is told when suggesting SEO titles, excerpts, and tags specifically -- the task itself (what to produce, length limits), not the voice (see above). Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'linkedinTrimInstructions',
      title: 'LinkedIn native post instructions',
      type: 'text',
      rows: 14,
      group: 'prompts',
      initialValue: DEFAULT_LINKEDIN_TRIM_INSTRUCTIONS,
      description:
        'What the AI is told when compressing a post’s full content into a standalone LinkedIn post -- deliberately separate from the "Draft Social Copy" feature’s own LinkedIn caption, which is a short announcement/teaser instead. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'videoScriptInstructions',
      title: 'Video script instructions',
      type: 'text',
      rows: 12,
      group: 'prompts',
      initialValue: DEFAULT_VIDEO_SCRIPT_INSTRUCTIONS,
      description:
        'What the AI is told when breaking a post into a short-form video script (narration + on-screen direction + a video-gen prompt, per scene). Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'carouselQuoteInstructions',
      title: 'Carousel quote-picking instructions',
      type: 'text',
      rows: 8,
      group: 'prompts',
      initialValue: DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS,
      description:
        'What the AI is told when picking quotable lines for an image carousel\'s slides -- reuses the image prompt template and composition modes below for each slide\'s background. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'carouselSlideCount',
      title: 'Carousel slide count',
      type: 'number',
      group: 'prompts',
      initialValue: 6,
      validation: (rule) => rule.min(4).max(8),
      description:
        'How many slides to generate per carousel -- each one is a text-extraction call plus an image-generation call, so cost/time scales with this number.',
    }),
    defineField({
      name: 'imagePromptTemplate',
      title: 'Image prompt template',
      type: 'text',
      rows: 6,
      group: 'imageStyle',
      initialValue: DEFAULT_IMAGE_PROMPT_TEMPLATE,
      description:
        'The full image-generation prompt "Suggest Image Prompt" assembles for each idea -- keep both {SUBJECT} and {COMPOSITION_MODE} exactly as written; those are the only two parts Gemini fills in (a concrete subject, and which mode below fits it). Everything else here is used word-for-word, every time, so the visual style stays consistent across posts instead of being reworded by the AI. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'compositionMode1',
      title: 'Composition Mode 1 (specimen / isolated)',
      type: 'text',
      rows: 3,
      group: 'imageStyle',
      initialValue: DEFAULT_COMPOSITION_MODE_1,
      description:
        'Substituted for {COMPOSITION_MODE} above when Gemini judges a subject fits better isolated -- a single symbolic object or motif, catalog-plate style. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'compositionMode2',
      title: 'Composition Mode 2 (environmental scene)',
      type: 'text',
      rows: 3,
      group: 'imageStyle',
      initialValue: DEFAULT_COMPOSITION_MODE_2,
      description:
        'Substituted for {COMPOSITION_MODE} above when Gemini judges a subject fits better as a full staged scene -- a moment, a figure in a place, layered depth. Leave blank to fall back to the default shown here.',
    }),
    defineField({
      name: 'videoStyleGuidance',
      title: 'Video prompt house style',
      type: 'text',
      rows: 6,
      group: 'imageStyle',
      initialValue: DEFAULT_VIDEO_STYLE_GUIDANCE,
      description:
        'The locked visual/tone throughline included in every scene’s video-gen prompt, so the visual style stays consistent across posts -- the video equivalent of the image prompt template above. Leave blank to fall back to the default shown here.',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
