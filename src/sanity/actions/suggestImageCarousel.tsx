import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {Box} from '@sanity/ui'
import {
  useImageCarouselSuggestion,
  ImageCarouselResults,
  type PostDraft,
} from '../components/SuggestImageCarouselShared'

// "Draft Image Carousel" -- picks quotable lines word-for-word from the
// post (/api/ai/suggest-image-carousel), then per slide generates or takes
// an uploaded background and renders the finished card (/api/og/quote).
// Never attaches anything to the post -- slides are downloaded and posted
// by hand. The actual fetch/state logic
// and result rendering live in SuggestImageCarouselShared.tsx -- shared
// with the post editor's "AI Tools" tab.
export function createSuggestImageCarouselAction(): DocumentActionComponent {
  const SuggestImageCarouselAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const source = (props.draft ?? props.published) as PostDraft | null
    const {status, result, error, run, actions} = useImageCarouselSuggestion(source)

    return {
      label: 'Draft Image Carousel',
      icon: ImagesIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') run()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-generated carousel materials',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                <ImageCarouselResults status={status} result={result} error={error} onRetry={run} actions={actions} />
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestImageCarouselAction
}
