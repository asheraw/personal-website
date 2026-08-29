import {useLayoutEffect} from 'react'
import type {BlockProps} from 'sanity'

// Second attempt -- the first (a hand-built Card+BlockPreview, ignoring
// props.open entirely) fixed the empty-popup problem but, as Asher pointed
// out by screenshot comparison, also lost Sanity's own default block
// chrome: the "..." menu (Remove/Duplicate/move up-down) that a plain,
// non-overridden object block gets for free. That chrome turns out to be
// part of what `renderDefault` itself draws -- there's no way to keep it
// while also swapping in custom collapsed content, since a hand-built
// replacement is exactly what was tried the first time.
//
// This version always calls `renderDefault(props)` -- passing the real,
// unmodified props, so it faithfully mirrors Sanity's true open/closed
// state and draws the exact same chrome (dots included) a plain divider
// with no override would. The only intervention: the instant `open`
// becomes true (which happens automatically the moment one is inserted,
// since there's nothing to fill in), a `useLayoutEffect` immediately calls
// `onClose()` back -- before the browser paints the open frame, so there's
// nothing to see. Divider has genuinely no fields worth opening for
// (`style` is `hidden: true`), so bouncing straight back to the default
// collapsed view -- chrome and all -- is the correct behaviour every time,
// not just on insert.
export function DividerBlockPreview(props: BlockProps) {
  useLayoutEffect(() => {
    if (props.open) props.onClose()
  }, [props.open, props.onClose])

  return props.renderDefault(props)
}
