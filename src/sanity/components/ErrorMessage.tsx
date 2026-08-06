import type {ReactNode} from 'react'
import {Card, Text} from '@sanity/ui'

// A small critical-tone status line, used for every inline error message
// across Studio's actions/tools. Exists because `<Text tone="critical">`
// looks like it should work (Text visually reads as the "just some colored
// text" component) but doesn't -- Sanity UI only puts `tone` on Card/Badge/
// Button, and Text silently has no such prop. That mistake had been
// copy-pasted into 8 different files before this got pulled out into one
// place: color now comes from the Card, which Text inherits from.
export function ErrorMessage({children}: {children: ReactNode}) {
  return (
    <Card tone="critical" padding={2} radius={2}>
      <Text size={1}>{children}</Text>
    </Card>
  )
}
