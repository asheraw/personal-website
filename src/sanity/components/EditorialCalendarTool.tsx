import {useCallback, useEffect, useState} from 'react'
import {Box, Button, Card, Flex, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useClient} from 'sanity'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {openPostInStudio} from '../lib/openPostInStudio'

type CalendarPost = {
  _id: string
  title: string
  date: string
  status: 'published' | 'scheduled'
}

type TrayDraft = {_id: string; title: string}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Drafts dropped onto a day get this local time (the daily cron publishes
// sometime that day either way, so the exact hour isn't meaningful).
const DEFAULT_SCHEDULE_HOUR = 9

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Only the weeks the month actually needs (4-6 rows), each a full 7 days
// including the tail of the previous month and the start of the next.
function buildGridDays(monthStart: Date): Date[] {
  const firstWeekday = monthStart.getDay()
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - firstWeekday)
  return Array.from({length: weeks * 7}, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short'})
}

// Drag-and-drop editorial calendar. Published posts sit on their
// publishedAt date; unpublished drafts with a scheduledPublishAt sit on that
// date (dashed). Drafts with NO date wait in the tray on the right: drag one
// onto a day to schedule it, drag a scheduled card back onto the tray to
// unschedule it. Click any card to open the post. Native HTML5 drag-and-drop,
// no extra dependency. Auto-publishing itself happens separately (src/app/api/
// cron/publish-scheduled/route.ts, once daily) -- this tool only schedules.
export function EditorialCalendarTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const toast = useToast()
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [posts, setPosts] = useState<CalendarPost[] | null>(null)
  const [tray, setTray] = useState<TrayDraft[]>([])
  const [dragging, setDragging] = useState<{id: string; kind: 'calendar' | 'tray'} | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [published, publishedIds, drafts] = await Promise.all([
      client.fetch<{_id: string; title: string; publishedAt: string}[]>(
        `*[_type == "post" && !defined(trashedAt) && !(_id in path("drafts.**")) && defined(publishedAt)]{_id, title, publishedAt}`,
      ),
      client.fetch<string[]>(`*[_type == "post" && !defined(trashedAt) && !(_id in path("drafts.**"))]._id`),
      // perspective: 'raw' is required here -- this API's default query
      // perspective excludes drafts.* documents entirely, even from an
      // exact _id match, unless explicitly asked for.
      client.fetch<{_id: string; title: string; scheduledPublishAt?: string}[]>(
        `*[_id in path("drafts.**") && _type == "post" && !defined(trashedAt) && !defined(shelvedAt)]{_id, title, scheduledPublishAt} | order(_updatedAt desc)`,
        {},
        {perspective: 'raw'},
      ),
    ])
    const liveIds = new Set(publishedIds)
    // A draft whose published counterpart already exists is just an
    // in-progress edit to a live post, not a first-time scheduled publish --
    // it belongs on neither the calendar nor the tray.
    const firstTime = drafts.filter((d) => !liveIds.has(d._id.replace(/^drafts\./, '')))
    setPosts([
      ...published.map((p) => ({_id: p._id, title: p.title, date: p.publishedAt, status: 'published' as const})),
      ...firstTime
        .filter((d) => d.scheduledPublishAt)
        .map((d) => ({_id: d._id, title: d.title, date: d.scheduledPublishAt!, status: 'scheduled' as const})),
    ])
    setTray(firstTime.filter((d) => !d.scheduledPublishAt).map((d) => ({_id: d._id, title: d.title || 'Untitled draft'})))
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  function notify(title: string, undo: () => Promise<void>) {
    toast.push({
      status: 'success',
      title,
      duration: 9000,
      description: (
        <Button
          text="Undo"
          mode="ghost"
          fontSize={1}
          padding={2}
          onClick={async () => {
            await undo()
            await load()
          }}
        />
      ),
    })
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
      await load()
      return true
    } catch (err) {
      toast.push({status: 'error', title: "Couldn't save that change", description: err instanceof Error ? err.message : String(err)})
      return false
    }
  }

  async function moveTo(post: CalendarPost, newDay: Date) {
    const original = new Date(post.date)
    if (dateKey(original) === dateKey(newDay)) return
    const updated = new Date(newDay)
    updated.setHours(original.getHours(), original.getMinutes(), original.getSeconds())
    const field = post.status === 'published' ? 'publishedAt' : 'scheduledPublishAt'
    const ok = await run(() => client.patch(post._id).set({[field]: updated.toISOString()}).commit())
    if (ok) {
      const label = post.status === 'published' ? 'Moved (public date changed)' : 'Rescheduled'
      notify(`${label} to ${shortDate(newDay)}`, async () => {
        await client.patch(post._id).set({[field]: post.date}).commit()
      })
    }
  }

  async function schedule(draft: TrayDraft, day: Date) {
    const when = new Date(day)
    when.setHours(DEFAULT_SCHEDULE_HOUR, 0, 0, 0)
    const ok = await run(() => client.patch(draft._id).set({scheduledPublishAt: when.toISOString()}).commit())
    if (ok) {
      notify(`Scheduled for ${shortDate(day)}`, async () => {
        await client.patch(draft._id).unset(['scheduledPublishAt']).commit()
      })
    }
  }

  async function unschedule(post: CalendarPost) {
    if (post.status !== 'scheduled') {
      toast.push({status: 'warning', title: 'Published posts stay on the calendar', description: 'Only scheduled drafts can go back to the tray.'})
      return
    }
    const ok = await run(() => client.patch(post._id).unset(['scheduledPublishAt']).commit())
    if (ok) {
      notify('Moved back to unscheduled drafts', async () => {
        await client.patch(post._id).set({scheduledPublishAt: post.date}).commit()
      })
    }
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

  function onDropDay(day: Date) {
    setDragOverKey(null)
    const d = dragging
    setDragging(null)
    if (!d) return
    if (d.kind === 'tray') {
      const draft = tray.find((t) => t._id === d.id)
      if (draft) schedule(draft, day)
    } else {
      const post = posts?.find((p) => p._id === d.id)
      if (post) moveTo(post, day)
    }
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Editorial Calendar
          </Text>
          <Text size={1} muted>
            Drag a card to another day to move it. Click a card to open the post. Scheduled drafts publish automatically
            once a day, so a post goes live sometime that day.
          </Text>
        </Stack>

        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Flex align="center" gap={2}>
            <Button icon={ChevronLeftIcon} mode="ghost" aria-label="Previous month" onClick={() => setMonthStart((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} />
            <Text size={2} weight="semibold" style={{minWidth: 160, textAlign: 'center'}}>
              {monthLabel}
            </Text>
            <Button icon={ChevronRightIcon} mode="ghost" aria-label="Next month" onClick={() => setMonthStart((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} />
            <Button text="Today" mode="ghost" fontSize={1} onClick={() => setMonthStart(startOfMonth(new Date()))} />
          </Flex>
          <Flex align="center" gap={3}>
            <Flex align="center" gap={2}>
              <Card tone="positive" border padding={1} radius={1} style={{width: 28}} />
              <Text size={1} muted>
                Published
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Card tone="caution" border padding={1} radius={1} style={{width: 28, borderStyle: 'dashed'}} />
              <Text size={1} muted>
                Scheduled draft
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex gap={4} wrap="wrap" align="flex-start">
          <Box style={{flex: '1 1 640px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4}}>
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
                  tone={isDragOver || isToday ? 'primary' : 'transparent'}
                  style={{
                    minHeight: 96,
                    opacity: inMonth ? 1 : 0.4,
                    outline: isToday ? '2px solid var(--card-focus-ring-color, #2276fc)' : isDragOver ? '2px dashed var(--card-focus-ring-color, #2276fc)' : 'none',
                    outlineOffset: -2,
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverKey(key)
                  }}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => {
                    e.preventDefault()
                    onDropDay(day)
                  }}
                >
                  <Stack space={2}>
                    <Text size={0} muted={!isToday} weight={isToday ? 'bold' : undefined}>
                      {isToday ? `${day.getDate()} · Today` : day.getDate()}
                    </Text>
                    {dayPosts.map((post) => (
                      <Card
                        key={post._id}
                        padding={2}
                        radius={2}
                        tone={post.status === 'published' ? 'positive' : 'caution'}
                        border
                        draggable
                        title={`${post.title} -- click to open`}
                        onDragStart={() => setDragging({id: post._id, kind: 'calendar'})}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOverKey(null)
                        }}
                        onClick={() => openPostInStudio(post._id.replace(/^drafts\./, ''))}
                        style={{
                          cursor: 'grab',
                          opacity: dragging?.id === post._id ? 0.4 : 1,
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

          <Box style={{flex: '0 0 260px', maxWidth: '100%'}}>
            <Card
              padding={3}
              radius={2}
              border
              tone={dragOverKey === 'tray' ? 'primary' : 'transparent'}
              style={{outline: dragOverKey === 'tray' ? '2px dashed var(--card-focus-ring-color, #2276fc)' : 'none', outlineOffset: -2}}
              onDragOver={(e) => {
                if (dragging?.kind !== 'calendar') return
                e.preventDefault()
                setDragOverKey('tray')
              }}
              onDragLeave={() => setDragOverKey((k) => (k === 'tray' ? null : k))}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverKey(null)
                const d = dragging
                setDragging(null)
                const post = d?.kind === 'calendar' ? posts.find((p) => p._id === d.id) : undefined
                if (post) unschedule(post)
              }}
            >
              <Stack space={3}>
                <Text size={1} weight="semibold">
                  Unscheduled drafts ({tray.length})
                </Text>
                <Text size={0} muted>
                  Drag one onto a day to schedule it. Drop a scheduled card here to unschedule it.
                </Text>
                {tray.length === 0 ? (
                  <Text size={1} muted>
                    Nothing waiting — every first-time draft has a date.
                  </Text>
                ) : (
                  <Stack space={2}>
                    {tray.map((d) => (
                      <Card
                        key={d._id}
                        padding={2}
                        radius={2}
                        border
                        draggable
                        title={`${d.title} -- drag to a day, or click to open`}
                        onDragStart={() => setDragging({id: d._id, kind: 'tray'})}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOverKey(null)
                        }}
                        onClick={() => openPostInStudio(d._id.replace(/^drafts\./, ''))}
                        style={{cursor: 'grab', opacity: dragging?.id === d._id ? 0.4 : 1}}
                      >
                        <Text size={1} textOverflow="ellipsis">
                          {d.title}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Box>
        </Flex>
      </Stack>
    </Box>
  )
}
