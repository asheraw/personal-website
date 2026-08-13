import {usePendingCommentCount} from '../hooks/usePendingCommentCount'

// The actual fix for "I don't see anything different when a comment comes
// in": CommentsToolIcon's badge lives on the tool's `icon`, but Sanity's
// navbar renders tool *names* as plain text at normal viewport widths --
// the icon (and its badge) never actually renders there, so that badge
// was invisible in the one place it needed to be seen. This uses Studio's
// navbar extension point (studio.components.navbar, wired in
// sanity.config.ts) instead: a floating pill, fixed to the bottom-left
// corner of the screen (deliberately *not* pinned into the navbar row
// itself -- that row's own content, the Drafts/release picker and icon
// cluster on the right, isn't a fixed, guessable width), visible on
// every Studio page regardless of which tool is open. Originally
// bottom-right; moved after Asher reported it sitting directly on top of
// the document pane's own Publish button and "..." extended-actions
// menu -- those live bottom-right of every open document, a fixed,
// predictable spot this should never have shared in the first place.
export function CommentsNavbarBadge() {
  const pending = usePendingCommentCount()

  if (!pending) return null

  return (
    <a href="/studio/comments" className="asheraw-comments-badge">
      <style>{`
        .asheraw-comments-badge {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--card-critical-fg-color, #c44);
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          animation: asheraw-comments-badge-pulse 2s ease-in-out infinite;
        }
        .asheraw-comments-badge .asheraw-comments-badge-full { display: inline; }
        .asheraw-comments-badge .asheraw-comments-badge-short { display: none; }
        /* Full text pill has real room to sit clear of page content on a
           desktop-width screen -- on a phone (this tool is genuinely used
           on the move, per Asher directly) that same fixed-position pill
           is wide enough to sit on top of whatever's scrolled to the
           bottom, which is exactly what happened. Collapses to a small
           count-only circle instead of shrinking the same pill, since a
           truncated label ("3 comm…") reads as a rendering bug rather
           than a deliberate compact mode. */
        @media (max-width: 480px) {
          .asheraw-comments-badge {
            bottom: 12px;
            left: 12px;
            width: 34px;
            height: 34px;
            padding: 0;
            justify-content: center;
            border-radius: 50%;
          }
          .asheraw-comments-badge .asheraw-comments-badge-full { display: none; }
          .asheraw-comments-badge .asheraw-comments-badge-short { display: inline; }
        }
        @keyframes asheraw-comments-badge-pulse {
          0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 0 rgba(204,68,68,0.5); }
          50% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 6px rgba(204,68,68,0); }
        }
      `}</style>
      <span className="asheraw-comments-badge-full">
        {pending} {pending === 1 ? 'comment needs review' : 'comments need review'}
      </span>
      <span className="asheraw-comments-badge-short" aria-label={`${pending} comments need review`}>
        {pending > 99 ? '99+' : pending}
      </span>
    </a>
  )
}
