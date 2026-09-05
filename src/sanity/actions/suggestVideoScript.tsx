import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'
import {Box} from '@sanity/ui'
import {
  useVideoScriptSuggestion,
  VideoScriptResults,
  type PostDraft,
} from '../components/SuggestVideoScriptShared'

// "Draft Video Script" -- breaks a post into a short-form video script via
// /api/ai/suggest-video-script, each scene paired with narration to read on
// camera AND a separate AI video-generation prompt. The actual fetch/state
// logic and result rendering live in SuggestVideoScriptShared.tsx -- shared
// with the post editor's "AI Tools" tab.
export function createSuggestVideoScriptAction(): DocumentActionComponent {
  const SuggestVideoScriptAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const source = (props.draft ?? props.published) as PostDraft | null
    const {status, result, error, run} = useVideoScriptSuggestion(source)

    return {
      label: 'Draft Video Script',
      icon: ComponentIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted video script',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                <VideoScriptResults status={status} result={result} error={error} onRetry={run} />
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestVideoScriptAction
}
