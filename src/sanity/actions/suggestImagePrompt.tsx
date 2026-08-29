import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {
  useImagePromptSuggestions,
  SuggestImagePromptDialogBody,
  type ImagePromptSource,
} from '../components/SuggestImagePromptShared'

/**
 * "Suggest Image Prompt" -- the ACE spec's DreamLab-style workflow: draft 3
 * ready-to-paste image-generation prompts in Studio, copy one, then
 * generate it separately in Gemini (Asher's actual tool) or any other AI
 * image generator, iterate until satisfied, and upload the result back
 * into this post's Featured/Social Image field by hand. Deliberately not
 * an automated image-generation integration -- the spec explicitly asks
 * not to automate a sub-one-minute manual step without a stable official
 * API and clear long-term value. Never generates an image itself, never
 * writes to the document.
 *
 * The actual fetch/state logic and dialog body live in
 * SuggestImagePromptShared.tsx -- shared with the identical button inline
 * next to the Featured Image field (SuggestImagePromptButton.tsx, wired in
 * via MainImageInputWithSuggestPrompt.tsx), so there are two entry points
 * into exactly one dialog experience, not two copies of it. This file is
 * just the document-action glue: opening/closing via the action
 * framework's own `dialog` return shape.
 */
export function createSuggestImagePromptAction(): DocumentActionComponent {
  const SuggestImagePromptAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const source = (props.draft ?? props.published) as ImagePromptSource | null
    const {status, suggestions, error, runSuggestion} = useImagePromptSuggestions(source)

    return {
      label: 'Suggest Image Prompt',
      icon: ImageIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted image prompts',
            onClose: () => setDialogOpen(false),
            content: (
              <SuggestImagePromptDialogBody
                status={status}
                suggestions={suggestions}
                error={error}
                onRetry={runSuggestion}
                onClose={() => setDialogOpen(false)}
              />
            ),
          }
        : null,
    }
  }

  return SuggestImagePromptAction
}
