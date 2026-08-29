import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'

type CalendarPost = {
  _id: string
  title: string
  date: string
  status: 'published' | 'scheduled'
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// A 6x7 grid covering every day visible for the given month, including
// the tail end of the previous month and the start of the next so every
// week row is complete.
function buildGridDays(monthStart: Date): Date[] {
  const firstWeekday = monthStart.getDay()
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - firstWeekday)
  return Array.from({length: 42}, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

// Drag-and-drop editorial calendar -- published posts shown on their
// publishedAt date, unpublished drafts with a scheduledPublishAt shown
// (differently styled) on that date. Dragging a card to a different day
// patches the relevant date field, preserving the original time-of-day.
// Native HTML5 drag-and-drop, no extra dependency. Actual auto-publishing
// of scheduled drafts happens separately (src/app/api/cron/publish-
// scheduled/route.ts, once daily) -- this tool only visualizes and lets
// you reschedule, it never publishes anything itself.
export function EditorialCalendarTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [posts, setPosts] = useState<CalendarPost[] | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [published, scheduledDrafts] = await Promise.all([
      client.fetch<{_id: string; title: string; publishedAt: string}[]>(
        `*[_type == "post" && !(_id in path("drafts.**")) && defined(publishedAt)]{_id, title, publishedAt}`,
      ),
      // perspective: 'raw' is required here -- this API's default query
      // perspective excludes drafts.* documents entirely, even from an
      // exact _id match, unless explicitly asked for.
      client.fetch<{_id: string; title: string; scheduledPublishAt: string}[]>(
        `*[_id in path("drafts.**") && _type == "post" && defined(scheduledPublishAt)]{_id, title, scheduledPublishAt}`,
        {},
        {perspective: 'raw'},
      ),
    ])
    const publishedIds = new Set(published.map((p) => p._id))
    const rows: CalendarPost[] = [
      ...published.map((p) => ({_id: p._id, title: p.title, date: p.publishedAt, status: 'published' as const})),
      // A draft with scheduledPublishAt whose published counterpart
      // already exists is just an in-progress edit to a live post, not a
      // first-time scheduled publish -- doesn't belong on this calendar.
      ...scheduledDrafts
        .filter((d) => !publishedIds.has(d._id.replace(/^drafts\./, '')))
        .map((d) => ({_id: d._id, title: d.title, date: d.scheduledPublishAt, status: 'scheduled' as const})),
    ]
    setPosts(rows)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  async function moveTo(post: CalendarPost, newDay: Date) {
    const original = new Date(post.date)
    const updated = new Date(newDay)
    updated.setHours(original.getHours(), original.getMinutes(), original.getSeconds())
    const field = post.status === 'published' ? 'publishedAt' : 'scheduledPublishAt'
    await client.patch(post._id).set({[field]: updated.toISOString()}).commit()
    await load()
  }

  if (!posts) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const gridDays = buildGridDays(monthStart)
  const postsByDay = new Map<string, CalendarPost[]>()
  for (const post of posts) {
    const key = dateKey(new Date(post.date))
    postsByDay.set(key, [...(postsByDay.get(key) ?? []), post])
  }
  const monthLabel = monthStart.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})
  const today = dateKey(new Date())

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Editorial Calendar
          </Text>
          <Text size={1} muted>
            Solid cards are published (drag to change the date shown on the post). Dashed cards are
            unpublished drafts scheduled to auto-publish — checked once a day, so a post goes live sometime
            that day, not at an exact minute. Drag either kind to a new day.
          </Text>
        </Stack>

        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Button
              icon={ChevronLeftIcon}
              mode="ghost"
              onClick={() => setMonthStart((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            />
            <Text size={2} weight="semibold" style={{minWidth: 160, textAlign: 'center'}}>
              {monthLabel}
            </Text>
            <Button
              icon={ChevronRightIcon}
              mode="ghost"
              onClick={() => setMonthStart((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            />
          </Flex>
          <Button text="Today" mode="ghost" fontSize={1} onClick={() => setMonthStart(startOfMonth(new Date()))} />
        </Flex>

        <Box style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4}}>
          {WEEKDAYS.map((wd) => (
            <Text key={wd} size={0} muted weight="semibold" style={{textAlign: 'center', padding: '4px 0'}}>
              {wd}
            </Text>
          ))}
          {gridDays.map((day) => {
            const key = dateKey(day)
            const inMonth = day.getMonth() === monthStart.getMonth()
            const dayPosts = postsByDay.get(key) ?? []
            const isToday = key === today
            const isDragOver = dragOverKey === key
            return (
              <Card
                key={key}
                padding={2}
                radius={2}
                border
                tone={isDragOver ? 'primary' : 'transparent'}
                style={{minHeight: 96, opacity: inMonth ? 1 : 0.4}}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverKey(key)
                }}
                onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOverKey(null)
                  const post = posts.find((p) => p._id === draggingId)
                  if (post) moveTo(post, day)
                  setDraggingId(null)
                }}
              >
                <Stack space={2}>
                  <Text size={0} muted={!isToday} weight={isToday ? 'bold' : undefined}>
                    {day.getDate()}
                  </Text>
                  {dayPosts.map((post) => (
                    <Card
                      key={post._id}
                      padding={2}
                      radius={2}
                      tone={post.status === 'published' ? 'positive' : 'caution'}
                      border
                      draggable
                      onDragStart={() => setDraggingId(post._id)}
                      style={{
                        cursor: 'grab',
                        borderStyle: post.status === 'scheduled' ? 'dashed' : 'solid',
                      }}
                    >
                      <Text size={0} textOverflow="ellipsis">
                        {post.title}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Card>
            )
          })}
        </Box>

        <Flex gap={4}>
          <Flex align="center" gap={2}>
            <Badge tone="positive" fontSize={0}>
              ■
            </Badge>
            <Text size={1} muted>
              Published
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Badge tone="caution" fontSize={0}>
              ┄
            </Badge>
            <Text size={1} muted>
              Scheduled (unpublished draft)
            </Text>
          </Flex>
        </Flex>
      </Stack>
    </Box>
  )
}
