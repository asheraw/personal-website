import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ArchiveIcon} from '@sanity/icons/Archive'
import {UndoIcon} from '@sanity/icons/Undo'

// "Shelved" = a draft parked for later. It is not deleted and not trashed: shelvedAt is stamped on the
// draft, which moves it from Posts to Posts -> Shelved and off the Dashboard's "Continue a draft" list
// and the Calendar's tray. The nightly job (src/app/api/cron/purge-trash/route.ts) shelves first-time
// drafts untouched for 30 days automatically; these two actions do it by hand. Publishing a shelved
// draft clears the mark (publishWithDate.ts).

function draftOf(props: DocumentActionProps) {
  return props.draft as {shelvedAt?: string} | null
}

export const shelveAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: '2026-07-22'})
  const [busy, setBusy] = useState(false)
  const draft = draftOf(props)

  // Only a draft can be shelved, and only once.
  if (props.type !== 'post' || !draft || draft.shelvedAt) return null

  return {
    label: busy ? 'Shelving…' : 'Shelve for later',
    icon: ArchiveIcon,
    disabled: busy,
    onHandle: async () => {
      setBusy(true)
      try {
        await client.patch(props.draft!._id).set({shelvedAt: new Date().toISOString()}).commit()
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

export const unshelveAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: '2026-07-22'})
  const [busy, setBusy] = useState(false)
  const draft = draftOf(props)

  if (props.type !== 'post' || !draft?.shelvedAt) return null

  return {
    label: busy ? 'Unshelving…' : 'Unshelve',
    icon: UndoIcon,
    tone: 'positive',
    disabled: busy,
    onHandle: async () => {
      setBusy(true)
      try {
        // Editing the draft also restarts the 30-day clock.
        await client.patch(props.draft!._id).unset(['shelvedAt']).commit()
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}
