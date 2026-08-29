import {useState} from 'react'
import {Button, Dialog} from '@sanity/ui'
import {ImageIcon} from '@sanity/icons/Image'
import {
  useImagePromptSuggestions,
  SuggestImagePromptDialogBody,
  type ImagePromptSource,
} from './SuggestImagePromptShared'

// Second entry point into the exact same "Suggest Image Prompt" dialog the
// document-action version (suggestImagePrompt.tsx) opens from the Publish
// button's own menu -- added here, inline next to the Featured Image field
// itself (see MainImageInputWithSuggestPrompt.tsx), so drafting prompts for
// the photo you're about to add lives right where you're adding it, not in
// a separate menu three clicks away. Asher's own ask (2026-08-29). Never
// writes to the document -- same as the action, this only ever drafts text
// for Asher to copy into an external image generator by hand.
export function SuggestImagePromptButton({source}: {source: ImagePromptSource | null}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {status, suggestions, error, runSuggestion} = useImagePromptSuggestions(source)

  return (
    <>
      <Button
        text="Suggest Image Prompt"
        icon={ImageIcon}
        mode="ghost"
        tone="primary"
        onClick={() => {
          setDialogOpen(true)
          if (status === 'idle') runSuggestion()
        }}
      />
      {dialogOpen && (
        <Dialog
          id="suggest-image-prompt-inline"
          header="AI-drafted image prompts"
          onClose={() => setDialogOpen(false)}
        >
          <SuggestImagePromptDialogBody
            status={status}
            suggestions={suggestions}
            error={error}
            onRetry={runSuggestion}
            onClose={() => setDialogOpen(false)}
          />
        </Dialog>
      )}
    </>
  )
}
