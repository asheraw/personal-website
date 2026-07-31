import {useCallback, useEffect, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {useClient} from 'sanity'

// Shown as the name on every reply created from this tool. Cosmetic only --
// the frontend's distinct reply styling keys off isAuthorReply, not this
// string, so it's safe to change here later without touching anything else.
const REPLY_AUTHOR_NAME = 'Asher Aw'

type CommentRow = {
  _id: string
  name: string
  email: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  postId: string | null
  postTitle: string | null
  postSlug: string | null
  parentComment: string | null
  isAuthorReply: boolean
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
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  const load = useCallback(() => {
    client
      .fetch<CommentRow[]>(
        `*[_type == "comment"] | order(createdAt desc){
          _id, name, email, message, status, createdAt, isAuthorReply,
          "postId": post._ref, "postTitle": post->title, "postSlug": post->slug.current,
          "parentComment": parentComment._ref
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

  function startReply(id: string) {
    setReplyingId(id)
    setReplyText('')
  }

  // Replies are created already "approved" -- they're Asher's own words, not
  // visitor-submitted content that needs moderating -- and are never subject
  // to the honeypot/captcha checks the public form goes through, since this
  // only runs from inside authenticated Studio.
  async function submitReply(parent: CommentRow) {
    if (!replyText.trim() || !parent.postId) return
    setReplyBusy(true)
    try {
      const created = await client.create({
        _type: 'comment',
        post: {_type: 'reference', _ref: parent.postId},
        name: REPLY_AUTHOR_NAME,
        email: '',
        message: replyText.trim(),
        status: 'approved',
        createdAt: new Date().toISOString(),
        parentComment: {_type: 'reference', _ref: parent._id},
        isAuthorReply: true,
      })
      setComments((prev) =>
        prev
          ? [
              {
                _id: created._id,
                name: REPLY_AUTHOR_NAME,
                email: '',
                message: replyText.trim(),
                status: 'approved',
                createdAt: new Date().toISOString(),
                postId: parent.postId,
                postTitle: parent.postTitle,
                postSlug: parent.postSlug,
                parentComment: parent._id,
                isAuthorReply: true,
              },
              ...prev,
            ]
          : prev,
      )
      setReplyingId(null)
      setReplyText('')
    } finally {
      setReplyBusy(false)
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

        {[...pending, ...rest].map((comment) => {
          const parent = comment.parentComment
            ? comments.find((c) => c._id === comment.parentComment)
            : null

          return (
            <Card
              key={comment._id}
              padding={3}
              radius={2}
              border
              tone={comment.isAuthorReply ? 'primary' : undefined}
              marginLeft={comment.isAuthorReply ? 4 : 0}
            >
              <Stack space={3}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                  <Flex align="center" gap={2}>
                    {comment.isAuthorReply && (
                      <Text size={1} muted>
                        ↳
                      </Text>
                    )}
                    <Text size={1} weight="medium">
                      {comment.name}
                    </Text>
                    {comment.email && (
                      <Text size={0} muted>
                        {comment.email}
                      </Text>
                    )}
                  </Flex>
                  <Badge tone={STATUS_TONE[comment.status]} fontSize={0}>
                    {comment.status}
                  </Badge>
                </Flex>
                {parent && (
                  <Text size={0} muted>
                    Replying to {parent.name}: &ldquo;{parent.message.slice(0, 60)}
                    {parent.message.length > 60 ? '…' : ''}&rdquo;
                    {parent.status !== 'approved' && ' — note: that comment itself isn\'t approved yet, so this reply won\'t show in context until it is.'}
                  </Text>
                )}
                <Text size={1}>{comment.message}</Text>
                <Text size={0} muted>
                  On &ldquo;{comment.postTitle ?? 'unknown post'}&rdquo; ·{' '}
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
                <Flex gap={2} wrap="wrap">
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
                  {!comment.isAuthorReply && replyingId !== comment._id && (
                    <Button
                      text="Reply"
                      mode="ghost"
                      fontSize={1}
                      onClick={() => startReply(comment._id)}
                    />
                  )}
                </Flex>
                {replyingId === comment._id && (
                  <Stack space={2}>
                    <TextArea
                      fontSize={1}
                      rows={3}
                      placeholder={`Reply as ${REPLY_AUTHOR_NAME}…`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.currentTarget.value)}
                    />
                    <Flex gap={2}>
                      <Button
                        text="Post reply"
                        tone="primary"
                        fontSize={1}
                        disabled={replyBusy || !replyText.trim()}
                        onClick={() => submitReply(comment)}
                      />
                      <Button
                        text="Cancel"
                        mode="ghost"
                        fontSize={1}
                        disabled={replyBusy}
                        onClick={() => setReplyingId(null)}
                      />
                    </Flex>
                  </Stack>
                )}
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
