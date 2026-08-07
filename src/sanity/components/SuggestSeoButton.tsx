import {useState} from 'react'
import {useDocumentOperation} from 'sanity'
import {Button, Dialog} from '@sanity/ui'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {logUsage, useSeoSuggestions, SuggestSeoDialogBody, type PostDraft} from './SuggestSeoShared'

// The second entry point into the exact same "Suggest SEO & Excerpt" dialog
// the document-action version (suggestSeo.tsx) opens from the Publish
// button's own menu -- added here, right on the tab that's already showing
// the "Worth a look" checklist and a live preview of the fields this
// suggestion writes to (seoTitle, excerpt, tags), so the fix-it action
// lives next to the thing telling you something's worth fixing, not in a
// separate menu entirely. Same shared dialog body/fetch logic as the
// action; only the surrounding chrome differs (a plain @sanity/ui Dialog
// here, vs. the document-action framework's own dialog shape there).
export function SuggestSeoButton({documentId, source}: {documentId: string; source: PostDraft | null}) {
  const {patch} = useDocumentOperation(documentId, 'post')
  const [dialogOpen, setDialogOpen] = useState(false)
  const {status, suggestions, error, runSuggestion} = useSeoSuggestions(source)
  const [currentTags, setCurrentTags] = useState<string[]>(() => source?.tags ?? [])

  return (
    <>
      <Button
        text="Suggest SEO & Excerpt"
        icon={SparklesIcon}
        tone="primary"
        onClick={() => {
          setDialogOpen(true)
          if (status === 'idle') runSuggestion()
        }}
      />
      {dialogOpen && (
        <Dialog id="suggest-seo-from-preview" header="AI-suggested SEO title, excerpt, tags & more" onClose={() => setDialogOpen(false)}>
          <SuggestSeoDialogBody
            status={status}
            suggestions={suggestions}
            error={error}
            currentTags={currentTags}
            onRetry={runSuggestion}
            onClose={() => setDialogOpen(false)}
            onUseTitle={(text, logId) => {
              patch.execute([{set: {seoTitle: text}}])
              logUsage(logId, `Used SEO title: "${text}"`)
            }}
            onUseExcerpt={(text, logId) => {
              patch.execute([{set: {excerpt: text}}])
              logUsage(logId, `Used excerpt: "${text}"`)
            }}
            onUseHeadline={(text, logId) => {
              patch.execute([{set: {title: text}}])
              logUsage(logId, `Used alternative headline: "${text}"`)
            }}
            onAddTags={(selected, logId) => {
              const merged = Array.from(new Set([...currentTags, ...selected]))
              patch.execute([{set: {tags: merged}}])
              setCurrentTags(merged)
              logUsage(logId, `Added tags: ${selected.join(', ')}`)
            }}
          />
        </Dialog>
      )}
    </>
  )
}
