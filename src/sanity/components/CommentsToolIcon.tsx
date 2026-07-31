import {CommentIcon} from '@sanity/icons/Comment'
import {usePendingCommentCount} from '../hooks/usePendingCommentCount'

// Sanity Studio's persistent top-nav doesn't have a dedicated "badge on a
// tool" API, so a tool's `icon` accepts any component -- the live count is
// rendered as part of the icon itself. Note: at wide viewports Studio's
// navbar shows tool *names* as plain text, not this icon at all, so this
// badge is only ever actually visible in narrow/overflow contexts (mobile
// nav, the "more tools" menu). CommentsNavbarBadge (rendered via
// studio.components.navbar in sanity.config.ts) is the one guaranteed
// visible everywhere -- this stays as a belt-and-suspenders extra, not the
// primary signal.
export function CommentsToolIcon() {
  const pending = usePendingCommentCount()

  return (
    <span style={{position: 'relative', display: 'inline-flex'}}>
      <CommentIcon />
      {pending !== null && pending > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            background: 'var(--card-critical-fg-color, #c44)',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: '14px',
            textAlign: 'center',
            padding: '0 3px',
          }}
        >
          {pending > 9 ? '9+' : pending}
        </span>
      )}
    </span>
  )
}
