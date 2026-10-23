import type {NavbarProps} from 'sanity'
import {CommentsNavbarBadge} from './CommentsNavbarBadge'
import {ContactSubmissionsNavbarBadge} from './ContactSubmissionsNavbarBadge'

// Wraps Studio's own navbar (unchanged) and adds the floating
// pending-comments/contact-submissions badges alongside it -- see
// CommentsNavbarBadge for why this needed its own extension point rather
// than living on a tool's icon.
export function StudioNavbar(props: NavbarProps) {
  return (
    <>
      {/* The Presentation tab in the top bar isn't useful on its own (drafts only show when it's
          opened from a post's own Preview link), so the tab is hidden. The tool itself stays
          installed -- the "Open in Presentation" action on posts still uses it. */}
      <style>{`a[href^="/studio/presentation"]{display:none !important}`}</style>
      {props.renderDefault(props)}
      <CommentsNavbarBadge />
      <ContactSubmissionsNavbarBadge />
    </>
  )
}
