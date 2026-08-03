import {useCallback, useEffect, useState} from 'react'
import type {CSSProperties, ReactNode} from 'react'
import {Badge, Box, Button, Card, Checkbox, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {TrashIcon} from '@sanity/icons/Trash'

type SubmissionRow = {
  _id: string
  name?: string
  email?: string
  subject?: string
  message?: string
  countryCode?: string
  phone?: string
  emailSent?: boolean
  emailError?: string
  handled: boolean
  _createdAt: string
}

const COLUMNS = '1fr 1.2fr 1.4fr 1.6fr auto auto'
const PREVIEW_LENGTH = 250
const ROW_CLASS = 'contact-submissions-row'

// A plain native element, not Sanity UI's <Text>, owns the truncation
// (overflow/ellipsis/nowrap) directly on itself -- putting those styles on
// Text, or on a div wrapping Text, both clipped the *height* of the line
// (only half of each letter showed). Text renders its children inside its
// own nested box, so a parent's overflow:hidden doesn't reliably ellipsize
// a grandchild's text; only a single element that owns both the text node
// and the overflow style is guaranteed correct.
function TruncatedCell({muted, children}: {muted?: boolean; children: ReactNode}) {
  return (
    <div
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        fontSize: 13,
        lineHeight: 1.4,
        color: muted ? 'var(--card-muted-fg-color)' : 'var(--card-fg-color)',
      }}
    >
      {children}
    </div>
  )
}

// A genuine table view of every contact form submission -- replacing the
// previous "click into each submission's own document" pattern, same
// reasoning as the Media/Comments/404 Hits tools. Unlike those, this
// document type has liveEdit on (see contactSubmissionType.ts), so ticking
// Handled saves immediately with no separate publish step.
export function ContactSubmissionsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [rows, setRows] = useState<SubmissionRow[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const load = useCallback(() => {
    client
      .fetch<SubmissionRow[]>(
        `*[_type == "contactSubmission"] | order(_createdAt desc){
          _id, name, email, subject, message, countryCode, phone, emailSent, emailError, handled, _createdAt
        }`,
      )
      .then(setRows)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  async function toggleHandled(id: string, current: boolean) {
    setBusyId(id)
    try {
      await client.patch(id).set({handled: !current}).commit()
      setRows((prev) => (prev ? prev.map((r) => (r._id === id ? {...r, handled: !current} : r)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSubmission(id: string) {
    setBusyId(id)
    try {
      await client.delete(id)
      setRows((prev) => (prev ? prev.filter((r) => r._id !== id) : prev))
    } finally {
      setBusyId(null)
      setConfirmingDeleteId(null)
    }
  }

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const unhandled = rows.filter((r) => !r.handled)

  return (
    <Box padding={4}>
      <style>{`
        .${ROW_CLASS}:hover { background: var(--card-muted-bg-color); }
      `}</style>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3}>
            <Text size={3} weight="bold">
              Contact Submissions
            </Text>
            {unhandled.length > 0 && (
              <Badge tone="caution" fontSize={1}>
                {unhandled.length} awaiting reply
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Every message sent through the contact form, newest first — a preview shows below each row; click
            one to read the full message if it runs longer.
          </Text>
        </Stack>

        {rows.length === 0 && (
          <Text size={1} muted>
            No submissions yet.
          </Text>
        )}

        {rows.length > 0 && (
          <Card radius={2} border>
            <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)'}}>
              <Grid columns={6} gap={3} style={{gridTemplateColumns: COLUMNS}}>
                <Text size={0} weight="semibold" muted>
                  Date
                </Text>
                <Text size={0} weight="semibold" muted>
                  Name
                </Text>
                <Text size={0} weight="semibold" muted>
                  Email
                </Text>
                <Text size={0} weight="semibold" muted>
                  Subject
                </Text>
                <Text size={0} weight="semibold" muted>
                  Handled
                </Text>
                <Box />
              </Grid>
            </Box>
            <Stack>
              {rows.map((row, i) => {
                const isOpen = expanded.has(row._id)
                const isConfirming = confirmingDeleteId === row._id
                // A left border accent, not a full background wash, flags
                // an unhandled row -- clear at a glance without tinting the
                // whole row a strong caution color.
                const rowStyle: CSSProperties = {
                  borderBottom: i === rows.length - 1 ? undefined : '1px solid var(--card-border-color)',
                  borderLeft: row.handled ? '3px solid transparent' : '3px solid var(--card-badge-caution-dot-color)',
                }
                return (
                  <Box key={row._id} className={ROW_CLASS} style={rowStyle}>
                    <Box padding={3} style={{cursor: 'pointer'}} onClick={() => toggleExpanded(row._id)}>
                      <Stack space={2}>
                        <Grid columns={6} gap={3} style={{gridTemplateColumns: COLUMNS, alignItems: 'center'}}>
                          <Text size={1} muted style={{whiteSpace: 'nowrap'}}>
                            {new Date(row._createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </Text>
                          <TruncatedCell>{row.name || 'Unknown'}</TruncatedCell>
                          <TruncatedCell muted>{row.email}</TruncatedCell>
                          <TruncatedCell>{row.subject || '—'}</TruncatedCell>
                          <Box onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={row.handled}
                              disabled={busyId === row._id}
                              onChange={() => toggleHandled(row._id, row.handled)}
                            />
                          </Box>
                          <Box onClick={(e) => e.stopPropagation()}>
                            <Button
                              icon={TrashIcon}
                              tone="critical"
                              mode="bleed"
                              padding={2}
                              title="Delete this submission"
                              aria-label="Delete this submission"
                              onClick={() => setConfirmingDeleteId(row._id)}
                            />
                          </Box>
                        </Grid>
                        {!isOpen && row.message && (
                          <Text size={1} muted style={{whiteSpace: 'pre-wrap'}}>
                            {row.message.length > PREVIEW_LENGTH
                              ? `${row.message.slice(0, PREVIEW_LENGTH)}…`
                              : row.message}
                          </Text>
                        )}
                      </Stack>
                    </Box>
                    {isOpen && (
                      <Box paddingX={3} paddingBottom={3}>
                        <Card padding={3} radius={2} tone="transparent" border>
                          <Stack space={2}>
                            <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                              {row.message}
                            </Text>
                            <Text size={0} muted>
                              {row.phone ? `Phone: ${row.countryCode || ''} ${row.phone}` : 'No phone given'}
                              {' · '}
                              {row.emailSent ? 'Notification email sent' : 'Notification email NOT sent'}
                              {row.emailError ? ` (${row.emailError})` : ''}
                            </Text>
                          </Stack>
                        </Card>
                      </Box>
                    )}
                    {isConfirming && (
                      <Box paddingX={3} paddingBottom={3}>
                        <Card padding={2} radius={2} tone="critical" border>
                          <Flex align="center" gap={2} wrap="wrap">
                            <Text size={1}>Delete this submission for good? This can&rsquo;t be undone.</Text>
                            <Button
                              text="Yes, delete forever"
                              tone="critical"
                              fontSize={1}
                              disabled={busyId === row._id}
                              onClick={() => deleteSubmission(row._id)}
                            />
                            <Button
                              text="Cancel"
                              mode="ghost"
                              fontSize={1}
                              disabled={busyId === row._id}
                              onClick={() => setConfirmingDeleteId(null)}
                            />
                          </Flex>
                        </Card>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
