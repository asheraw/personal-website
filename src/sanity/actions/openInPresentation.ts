import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'

/**
 * Adds a "Preview" button to the post editor that jumps straight into
 * Presentation pointed at this exact post -- instead of opening
 * Presentation's default view (the homepage) and having to hunt the post
 * down manually.
 *
 * The "Documents on this page" panel in Presentation is NOT a general
 * search -- it only shows documents tied to whatever URL is currently
 * loaded, so there was previously no reliable way to jump to a specific
 * (especially unpublished) post except typing its URL in by hand.
 */
export const openInPresentationAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const slug = (props.draft as {slug?: {current?: string}} | null)?.slug?.current
    ?? (props.published as {slug?: {current?: string}} | null)?.slug?.current

  if (!slug) return null

  return {
    label: 'Preview',
    icon: EyeOpenIcon,
    onHandle: () => {
      const previewPath = `/blog/${slug}`
      window.open(`/studio/presentation?preview=${encodeURIComponent(previewPath)}`, '_blank')
      props.onComplete()
    },
  }
}
