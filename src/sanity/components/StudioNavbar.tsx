import type {NavbarProps} from 'sanity'
import {CommentsNavbarBadge} from './CommentsNavbarBadge'

// Wraps Studio's own navbar (unchanged) and adds the floating
// pending-comments badge alongside it -- see CommentsNavbarBadge for why
// this needed its own extension point rather than living on the
// Comments tool's icon.
export function StudioNavbar(props: NavbarProps) {
  return (
    <>
      {props.renderDefault(props)}
      <CommentsNavbarBadge />
    </>
  )
}
