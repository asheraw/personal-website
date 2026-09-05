import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {EditIcon} from '@sanity/icons/Edit'
import {Box} from '@sanity/ui'
import {
  useLinkedInPostSuggestion,
  LinkedInPostResults,
  type PostDraft,
} from '../components/SuggestLinkedInPostShared'

// "Draft LinkedIn Post" -- compresses the post's actual full content into a
// standalone, native LinkedIn post via /api/ai/suggest-linkedin-post.
// Deliberately separate from "Draft Social Copy"'s own LinkedIn output,
// which is a short announcement/teaser meant to run with a link posted
// separately in the first comment -- this needs no outbound link at all.
// The actual fetch/state logic and result rendering live in
// SuggestLinkedInPostShared.tsx -- shared with the post editor's "AI Tools"
// tab, so there are two entry points into exactly one drafting flow.
export function createSuggestLinkedInPostAction(): DocumentActionComponent {
  const SuggestLinkedInPostAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const source = (props.draft ?? props.published) as PostDraft | null
    const {status, result, error, run} = useLinkedInPostSuggestion(source)

    return {
      label: 'Draft LinkedIn Post',
      icon: EditIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted LinkedIn post',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                <LinkedInPostResults status={status} result={result} error={error} onRetry={run} />
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestLinkedInPostAction
}
