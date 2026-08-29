import type {InputProps} from 'sanity'
import {Card, Text} from '@sanity/ui'

// Wraps the default datetime picker with a plain-language status line --
// Asher's own report (2026-08-29): after setting "Schedule for later", the
// field itself gave no confirmation it had actually registered, and the
// only way to check was leaving the post entirely for Studio -> Calendar.
// This answers "is it properly scheduled" right where the date was just
// set, no navigating away needed.
export function ScheduledPublishInput(props: InputProps) {
  const value = props.value as string | undefined

  let banner: {tone: 'positive' | 'caution'; text: string} | null = null
  if (value) {
    const when = new Date(value)
    const formatted = when.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})
    banner =
      when > new Date()
        ? {tone: 'positive', text: `Scheduled — will publish automatically sometime on ${formatted}.`}
        : {
            tone: 'caution',
            text: `${formatted} has already passed. If this is still a draft, the daily check either hasn't run yet today or something's blocking it — worth a look at Studio -> Calendar if it's still unpublished tomorrow.`,
          }
  }

  return (
    <>
      {props.renderDefault(props)}
      {banner && (
        <Card tone={banner.tone} padding={3} radius={2} marginTop={2} border>
          <Text size={1}>{banner.text}</Text>
        </Card>
      )}
    </>
  )
}
