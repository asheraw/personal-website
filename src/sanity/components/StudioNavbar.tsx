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
      {props.renderDefault(props)}
      <CommentsNavbarBadge />
      <ContactSubmissionsNavbarBadge />
    </>
  )
}
