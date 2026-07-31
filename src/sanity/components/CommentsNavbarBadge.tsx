import {usePendingCommentCount} from '../hooks/usePendingCommentCount'

// The actual fix for "I don't see anything different when a comment comes
// in": CommentsToolIcon's badge lives on the tool's `icon`, but Sanity's
// navbar renders tool *names* as plain text at normal viewport widths --
// the icon (and its badge) never actually renders there, so that badge
// was invisible in the one place it needed to be seen. This uses Studio's
// navbar extension point (studio.components.navbar, wired in
// sanity.config.ts) instead: a floating pill, fixed to the bottom-right
// corner of the screen (deliberately *not* pinned into the navbar row
// itself -- that row's own content, the Drafts/release picker and icon
// cluster on the right, isn't a fixed, guessable width, and this sandbox
// has no way to render Studio live to check for overlap), visible on
// every Studio page regardless of which tool is open.
export function CommentsNavbarBadge() {
  const pending = usePendingCommentCount()

  if (!pending) return null

  return (
    <a
      href="/studio/comments"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'var(--card-critical-fg-color, #c44)',
        color: 'white',
        fontSize: 12,
        fontWeight: 700,
        textDecoration: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        animation: 'asheraw-comments-badge-pulse 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes asheraw-comments-badge-pulse {
          0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 0 rgba(204,68,68,0.5); }
          50% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 6px rgba(204,68,68,0); }
        }
      `}</style>
      {pending} {pending === 1 ? 'comment needs review' : 'comments need review'}
    </a>
  )
}
