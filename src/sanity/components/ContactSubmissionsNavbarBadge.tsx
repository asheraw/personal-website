import {usePendingContactCount} from '../hooks/usePendingContactCount'

// Same floating-pill pattern as CommentsNavbarBadge, for the same reason
// (Studio's navbar only renders tool *names* at normal widths, not icons,
// so a badge living on a tool/list-item icon is invisible in the one place
// it needs to be seen). Stacked above the comments badge (bottom: 66 vs
// 20) rather than sharing one spot, so both can be visible at once without
// overlapping when there's a backlog of both kinds.
//
// Links to /studio/contact-submissions -- the dedicated top-nav tool (see
// sanity.config.ts) that replaced the old Structure list-item view.
export function ContactSubmissionsNavbarBadge() {
  const pending = usePendingContactCount()

  if (!pending) return null

  return (
    <a
      href="/studio/contact-submissions"
      style={{
        position: 'fixed',
        bottom: 66,
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
        animation: 'asheraw-contact-badge-pulse 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes asheraw-contact-badge-pulse {
          0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 0 rgba(204,68,68,0.5); }
          50% { box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 6px rgba(204,68,68,0); }
        }
      `}</style>
      {pending} {pending === 1 ? 'contact message needs a reply' : 'contact messages need a reply'}
    </a>
  )
}
