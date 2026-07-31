import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

const POLL_MS = 30_000

// Shared by CommentsToolIcon (the tool's own icon slot -- only actually
// rendered in narrow-viewport/overflow menus, see CommentsNavbarBadge for
// why) and CommentsNavbarBadge (the always-visible one). One poll, one
// piece of state, instead of two independent timers hitting the same
// query.
export function usePendingCommentCount(): number | null {
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

  return pending
}
