import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ShareIcon} from '@sanity/icons/Share'
import {Box} from '@sanity/ui'
import {useSocialSuggestions, SocialCopyResults, type PostDraft} from '../components/SuggestSocialCopyShared'

/**
 * "Draft Social Copy" -- drafts 2 caption options each for X, LinkedIn, and
 * Facebook from the post's own content via Gemini, for Asher to copy and
 * paste when he announces the post on his own accounts. Never posts
 * anywhere itself and never writes to the document -- purely text to copy,
 * matching the ACE spec's "AI proposes, humans decide" rule the same way
 * "Suggest SEO & Excerpt" already does.
 *
 * The actual fetch/state logic and every result card live in
 * SuggestSocialCopyShared.tsx -- shared with the "Share this post" panel on
 * the Distribution dashboard (SharePanel.tsx), so there are two entry
 * points into exactly one drafting flow, not two copies of it.
 */
export function createSuggestSocialCopyAction(): DocumentActionComponent {
  const SuggestSocialCopyAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const [dialogOpen, setDialogOpen] = useState(false)

    // A post with no unpublished edits has no draft at all -- only a
    // published version. Fall back to that, same reasoning as
    // suggestSeo.tsx.
    const source = (props.draft ?? props.published) as PostDraft | null
    const {status, suggestions, error, runSuggestion} = useSocialSuggestions(source)
    const postUrl = source?.slug?.current ? `https://asheraw.com/blog/${source.slug.current}` : undefined

    return {
      label: 'Draft Social Copy',
      icon: ShareIcon,
      onHandle: () => {
        setDialogOpen(true)
        if (status === 'idle') runSuggestion()
      },
      dialog: dialogOpen
        ? {
            type: 'dialog',
            header: 'AI-drafted social captions',
            onClose: () => setDialogOpen(false),
            content: (
              <Box padding={4}>
                <SocialCopyResults status={status} suggestions={suggestions} error={error} onRetry={runSuggestion} postUrl={postUrl} />
              </Box>
            ),
          }
        : null,
    }
  }

  return SuggestSocialCopyAction
}
