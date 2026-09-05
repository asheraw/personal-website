import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {Box} from '@sanity/ui'
import {
  useFeaturedImageGeneration,
  FeaturedImageResults,
  type PostDraft,
} from '../components/GenerateFeaturedImageShared'

/**
 * "Generate Featured Image" -- the automated sibling of "Suggest Image
 * Prompt" (suggestImagePrompt.tsx). That action stops at 3 prompts to copy
 * into DreamLab by hand, on purpose. This one skips the manual step
 * entirely: picks the single most click-worthy concept, renders it with
 * Gemini's own image model, and attaches it as this post's Featured Image
 * directly -- no copy/paste/upload round trip.
 *
 * The actual fetch/state logic and result rendering live in
 * GenerateFeaturedImageShared.tsx -- shared with the post editor's
 * "AI Tools" tab.
 */
export function createGenerateFeaturedImageAction(): DocumentActionComponent {
  const GenerateFeaturedImageAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const source = (props.draft ?? props.published) as PostDraft | null
    // A raw writeClient.patch() server-side, not useDocumentOperation --
    // unlike the SEO action, this needs to run from a plain API route (also
    // called directly by the backlog script, no Studio session involved).
    const docId = props.draft?._id ?? props.published?._id ?? props.id
    const {status, result, error, run} = useFeaturedImageGeneration(source, docId)

    return {
      label: 'Generate Featured Image',
      icon: ImageIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-generated featured image',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                <FeaturedImageResults
                  status={status}
                  result={result}
                  error={error}
                  onRetry={run}
                  onClose={() => setDialogOpen(false)}
                />
              </Box>
            ),
          }
        : null,
    }
  }

  return GenerateFeaturedImageAction
}
