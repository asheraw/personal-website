import {useEffect, useState} from 'react'
import {CommentIcon} from '@sanity/icons/Comment'
import {useClient} from 'sanity'

const POLL_MS = 30_000

// Sanity Studio's persistent top-nav doesn't have a dedicated "badge on a
// tool" API, but a tool's `icon` accepts any component -- so the live count
// is rendered as part of the icon itself instead. Polls every 30s, which is
// enough for "is there something new to look at" without hammering the API.
export function CommentsToolIcon() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      client
        .fetch<number>(`count(*[_type == "comment" && status == "pending"])`)
        .then((count) => {
          if (!cancelled) setPending(count)
        })
        .catch(() => {
          // A missed poll isn't worth surfacing -- just try again next tick.
        })
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [client])

  return (
    <span style={{position: 'relative', display: 'inline-flex'}}>
      <CommentIcon />
      {pending !== null && pending > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            background: 'var(--card-critical-fg-color, #c44)',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: '14px',
            textAlign: 'center',
            padding: '0 3px',
          }}
        >
          {pending > 9 ? '9+' : pending}
        </span>
      )}
    </span>
  )
}
