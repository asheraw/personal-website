import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Checkbox, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

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
            Every message sent through the contact form, newest first. Click a row to read the full message.
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
                return (
                  <Box
                    key={row._id}
                    style={{
                      borderBottom: i === rows.length - 1 ? undefined : '1px solid var(--card-border-color)',
                    }}
                  >
                    <Box
                      padding={3}
                      style={{cursor: 'pointer'}}
                      onClick={() => toggleExpanded(row._id)}
                    >
                      <Grid columns={6} gap={3} style={{gridTemplateColumns: COLUMNS, alignItems: 'center'}}>
                        <Text size={1} muted>
                          {new Date(row._createdAt).toLocaleDateString()}
                        </Text>
                        <Text size={1}>{row.name || 'Unknown'}</Text>
                        <Text size={1} muted style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {row.email}
                        </Text>
                        <Text size={1} style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {row.subject || '—'}
                        </Text>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={row.handled}
                            disabled={busyId === row._id}
                            onChange={() => toggleHandled(row._id, row.handled)}
                          />
                        </Box>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <Button
                            text="Delete"
                            tone="critical"
                            mode="ghost"
                            fontSize={1}
                            padding={2}
                            onClick={() => setConfirmingDeleteId(row._id)}
                          />
                        </Box>
                      </Grid>
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
