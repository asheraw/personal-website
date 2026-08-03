import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

const POLL_MS = 30_000

// Same pattern as usePendingCommentCount -- "pending" here means
// `handled != true` (the field contactSubmissionType.ts already tracks by
// hand; this just counts it), not a separate status field.
export function usePendingContactCount(): number | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      client
        .fetch<number>(`count(*[_type == "contactSubmission" && handled != true])`)
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
