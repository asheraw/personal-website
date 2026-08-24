import {useState} from 'react'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {logUsage, useSeoSuggestions, SuggestSeoDialogBody, type PostDraft} from '../components/SuggestSeoShared'

/**
 * "Suggest SEO & Excerpt" -- drafts SEO title/excerpt/tag options from the
 * post's own content via Gemini, plus a few more content ideas in the same
 * dialog (alternative headlines, pull quotes, FAQ suggestions) since they're
 * all the same shape of thing -- AI-drafted options shown for review, never
 * written anywhere without the editor explicitly picking one, matching the
 * ACE spec's "AI proposes, humans decide" rule. Alternative headlines patch
 * the post's real title directly (same as SEO title/excerpt); pull quotes
 * and FAQs copy to the clipboard instead, since neither maps to a single
 * field -- a pull quote goes wherever the writer decides in the body, and
 * there's no FAQ section on posts (yet) to write into.
 *
 * The actual fetch/state logic and every result card live in
 * SuggestSeoShared.tsx -- shared with the identical "Suggest SEO & Excerpt"
 * button on the SEO Preview tab (SuggestSeoButton.tsx), so there are two
 * entry points into exactly one dialog experience, not two copies of it.
 * This file is just the document-action glue: opening/closing via the
 * action framework's own `dialog` return shape, and patching the document
 * via useDocumentOperation.
 */
export function createSuggestSeoAction(): DocumentActionComponent {
  const SuggestSeoAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {patch} = useDocumentOperation(props.id, props.type)
    const [dialogOpen, setDialogOpen] = useState(false)

    // A post with no unpublished edits has no draft at all -- only a
    // published version. Fall back to that, otherwise this silently sends
    // an empty title/body for any post that's already live and untouched.
    const source = (props.draft ?? props.published) as PostDraft | null
    const {status, suggestions, error, runSuggestion} = useSeoSuggestions(source)

    // Tags get ADDED to, not replaced like title/excerpt -- tracked locally
    // so the UI can grey out already-added suggestions immediately without
    // waiting on the document to refetch after each patch.
    const [currentTags, setCurrentTags] = useState<string[]>(() => source?.tags ?? [])

    return {
      label: 'Suggest SEO & Excerpt',
      icon: SparklesIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-suggested SEO title, excerpt, tags & more',
            onClose: () => setDialogOpen(false),
            content: (
              <SuggestSeoDialogBody
                status={status}
                suggestions={suggestions}
                error={error}
                postTitle={source?.title}
                currentTags={currentTags}
                onRetry={runSuggestion}
                onClose={() => setDialogOpen(false)}
                onUseTitle={(text, logId) => {
                  patch.execute([{set: {seoTitle: text}}]).catch(() => {})
                  logUsage(logId, `Used SEO title: "${text}"`)
                }}
                onUseExcerpt={(text, logId) => {
                  patch.execute([{set: {excerpt: text}}]).catch(() => {})
                  logUsage(logId, `Used excerpt: "${text}"`)
                }}
                onUseHeadline={(text, logId) => {
                  patch.execute([{set: {title: text}}]).catch(() => {})
                  logUsage(logId, `Used alternative headline: "${text}"`)
                }}
                onAddTags={(selected, logId) => {
                  const merged = Array.from(new Set([...currentTags, ...selected]))
                  patch.execute([{set: {tags: merged}}]).catch(() => {})
                  setCurrentTags(merged)
                  logUsage(logId, `Added tags: ${selected.join(', ')}`)
                }}
              />
            ),
          }
        : null,
    }
  }

  return SuggestSeoAction
}
