import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

/**
 * Wraps the default Publish action for posts so the "Published at" field
 * is stamped with the current moment the FIRST time a post is actually
 * published -- not when the draft was first created (which is what a
 * plain schema `initialValue` gives you). Matches how WordPress/Ghost
 * behave: the date reflects when it went live, not when writing started.
 *
 * If the field already has a value, it's left alone -- an editor's manual
 * date always wins. Everything else about the default Publish button
 * (label, disabled state, confirmation dialog) is left untouched; only
 * the moment right before publishing is intercepted.
 *
 * Takes the original action component as an argument rather than
 * importing it by name, since Sanity doesn't expose the default publish
 * action as a stable top-level export -- this way it keeps working
 * regardless of exactly where that component lives internally.
 */
export function withAutoPublishDate(originalAction: DocumentActionComponent): DocumentActionComponent {
  const WrappedPublishAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {patch} = useDocumentOperation(props.id, props.type)
    const original = originalAction(props)

    if (!original) return null

    const hasPublishedAt = Boolean((props.draft as {publishedAt?: string} | null)?.publishedAt)

    return {
      ...original,
      onHandle: () => {
        if (!hasPublishedAt) {
          patch.execute([{set: {publishedAt: new Date().toISOString()}}])
        }
        original.onHandle?.()
      },
    }
  }

  return WrappedPublishAction
}
