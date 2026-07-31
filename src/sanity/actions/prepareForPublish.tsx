import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

export type PostDraft = {
  mainImage?: {alt?: string} | null
  excerpt?: string
  categories?: unknown[]
  seoTitle?: string
  title?: string
}

// Shared by the pre-publish confirmation dialog below and SeoPreviewView
// (the persistent "SEO Preview" document tab) -- one list of "worth a
// look" issues, not two that could quietly drift apart from each other.
export function getChecklistIssues(doc: PostDraft | null): string[] {
  if (!doc) return []
  const issues: string[] = []

  if (!doc.mainImage) {
    issues.push('No featured image set')
  } else if (!doc.mainImage.alt) {
    issues.push('Featured image has no alt text — helps search engines and screen readers alike')
  }
  if (!doc.excerpt) {
    issues.push('No excerpt written — a preview will be auto-generated from the post text instead')
  }
  if (!doc.categories || doc.categories.length === 0) issues.push('No category assigned')

  const effectiveTitle = doc.seoTitle || doc.title || ''
  if (effectiveTitle.length > 70) {
    issues.push('Title is long enough that it may get cut off in search results')
  }

  return issues
}

/**
 * Wraps the Publish action (already wrapped by withAutoPublishDate) with a
 * lightweight pre-publish check. Warns, never blocks: if everything looks
 * fine, publishing happens exactly as before with no extra step. If
 * something's worth a second look, shows what's missing and lets the editor
 * either go fix it or publish anyway -- their call, always.
 */
export function withPrePublishChecklist(originalAction: DocumentActionComponent): DocumentActionComponent {
  const WrappedWithChecklist: DocumentActionComponent = (props: DocumentActionProps) => {
    const [showDialog, setShowDialog] = useState(false)
    const original = originalAction(props)

    if (!original) return null

    const issues = getChecklistIssues(props.draft as PostDraft | null)

    if (issues.length === 0) {
      return original
    }

    return {
      ...original,
      onHandle: () => setShowDialog(true),
      dialog: showDialog
        ? {
            type: 'confirm',
            tone: 'caution',
            message: (
              <div>
                <p style={{marginTop: 0}}>Worth a look before this goes live:</p>
                <ul style={{paddingLeft: '1.1em'}}>
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ),
            confirmButtonText: 'Publish anyway',
            cancelButtonText: 'Go back and edit',
            onConfirm: () => {
              setShowDialog(false)
              original.onHandle?.()
            },
            onCancel: () => setShowDialog(false),
          }
        : null,
    }
  }

  return WrappedWithChecklist
}
