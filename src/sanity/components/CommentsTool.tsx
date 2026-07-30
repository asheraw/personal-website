import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

type CommentRow = {
  _id: string
  name: string
  email: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  postTitle: string | null
  postSlug: string | null
}

const STATUS_TONE: Record<CommentRow['status'], 'caution' | 'positive' | 'critical'> = {
  pending: 'caution',
  approved: 'positive',
  rejected: 'critical',
}

// A custom Studio tool (not a plain document-type list) so pending comments
// can be moderated with one click each, instead of opening, editing, and
// saving every comment individually. The "unread" count Asher asked for
// (WordPress-style) is shown prominently at the top of this tool -- Studio's
// persistent top-nav bar doesn't support a live dynamic badge without much
// deeper customization, so it lives here instead, the first thing visible
// on opening Comments.
export function CommentsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    client
      .fetch<CommentRow[]>(
        `*[_type == "comment"] | order(createdAt desc){
          _id, name, email, message, status, createdAt,
          "postTitle": post->title, "postSlug": post->slug.current
        }`,
      )
      .then(setComments)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(id: string, status: CommentRow['status']) {
    setBusyId(id)
    try {
      await client.patch(id).set({status}).commit()
      setComments((prev) => (prev ? prev.map((c) => (c._id === id ? {...c, status} : c)) : prev))
    } finally {
      setBusyId(null)
    }
  }

  if (!comments) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const pending = comments.filter((c) => c.status === 'pending')
  const rest = comments.filter((c) => c.status !== 'pending')

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" gap={3}>
            <Text size={3} weight="bold">
              Comments
            </Text>
            {pending.length > 0 && (
              <Badge tone="caution" fontSize={1}>
                {pending.length} awaiting moderation
              </Badge>
            )}
          </Flex>
          <Text size={1} muted>
            Nothing shows on the live site until approved here.
          </Text>
        </Stack>

        {pending.length === 0 && rest.length === 0 && (
          <Text size={1} muted>
            No comments yet.
          </Text>
        )}

        {[...pending, ...rest].map((comment) => (
          <Card key={comment._id} padding={3} radius={2} border>
            <Stack space={3}>
              <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="medium">
                    {comment.name}
                  </Text>
                  <Text size={0} muted>
                    {comment.email}
                  </Text>
                </Flex>
                <Badge tone={STATUS_TONE[comment.status]} fontSize={0}>
                  {comment.status}
                </Badge>
              </Flex>
              <Text size={1}>{comment.message}</Text>
              <Text size={0} muted>
                On &ldquo;{comment.postTitle ?? 'unknown post'}&rdquo; ·{' '}
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
              <Flex gap={2}>
                {comment.status !== 'approved' && (
                  <Button
                    text="Approve"
                    tone="positive"
                    fontSize={1}
                    disabled={busyId === comment._id}
                    onClick={() => setStatus(comment._id, 'approved')}
                  />
                )}
                {comment.status !== 'rejected' && (
                  <Button
                    text="Reject"
                    tone="critical"
                    mode="ghost"
                    fontSize={1}
                    disabled={busyId === comment._id}
                    onClick={() => setStatus(comment._id, 'rejected')}
                  />
                )}
              </Flex>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
