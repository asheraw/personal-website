import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {TrashIcon} from '@sanity/icons/Trash'
import {UndoIcon} from '@sanity/icons/Undo'

// Soft delete for posts. "Move to Trash" stamps trashedAt on the draft and the published copy
// (whichever exist); every public query and Studio list ignores posts with trashedAt, so the post
// leaves the site and the lists straight away but nothing is destroyed. Posts -> Trash lists them,
// where they can be restored or deleted for good; the nightly purge-trash cron removes any that have
// been there 30+ days (src/app/api/cron/purge-trash/route.ts).

const TRASH_RETENTION_DAYS = 30

function trashedAtOf(props: DocumentActionProps): string | undefined {
  const doc = (props.draft ?? props.published) as {trashedAt?: string} | null
  return doc?.trashedAt
}

function useSetTrashed(props: DocumentActionProps) {
  const client = useClient({apiVersion: '2026-07-22'})
  const baseId = props.id.replace(/^drafts\./, '')

  return async function setTrashed(value: string | null) {
    const ids = [baseId, `drafts.${baseId}`]
    const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids}, {perspective: 'raw'})
    let tx = client.transaction()
    for (const id of existing) {
      tx = value ? tx.patch(id, (p) => p.set({trashedAt: value})) : tx.patch(id, (p) => p.unset(['trashedAt']))
    }
    await tx.commit()
    // Same best-effort page refresh Publish does, so the post leaves (or returns to) the live site now.
    const slug = (props.draft as {slug?: {current?: string}} | null)?.slug?.current ?? (props.published as {slug?: {current?: string}} | null)?.slug?.current
    fetch(slug ? `/api/revalidate?path=${encodeURIComponent(`/blog/${slug}`)}` : '/api/revalidate').catch(() => {})
  }
}

export const moveToTrashAction: DocumentActionComponent = (props) => {
  const setTrashed = useSetTrashed(props)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (props.type !== 'post' || !(props.draft ?? props.published) || trashedAtOf(props)) return null

  return {
    label: 'Move to Trash',
    icon: TrashIcon,
    tone: 'critical',
    disabled: busy,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'confirm',
      tone: 'critical',
      message: `Move this post to Trash? It leaves the site right away. It stays in Posts → Trash for ${TRASH_RETENTION_DAYS} days, where you can restore it, and is deleted for good after that.`,
      confirmButtonText: 'Move to Trash',
      onCancel: () => {
        setOpen(false)
        props.onComplete()
      },
      onConfirm: async () => {
        setBusy(true)
        try {
          await setTrashed(new Date().toISOString())
        } finally {
          setBusy(false)
          setOpen(false)
          props.onComplete()
        }
      },
    },
  }
}

export const restoreFromTrashAction: DocumentActionComponent = (props) => {
  const setTrashed = useSetTrashed(props)
  const [busy, setBusy] = useState(false)

  if (props.type !== 'post' || !trashedAtOf(props)) return null

  return {
    label: busy ? 'Restoring…' : 'Restore from Trash',
    icon: UndoIcon,
    tone: 'positive',
    disabled: busy,
    onHandle: async () => {
      setBusy(true)
      try {
        await setTrashed(null)
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

// The built-in Delete is only offered once a post is already in the Trash, relabelled so it can't
// be mistaken for the safe option.
export function deleteForeverOnlyInTrash(original: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props) => {
    const action = original(props)
    if (!action || !trashedAtOf(props)) return null
    return {...action, label: 'Delete forever'}
  }
  return Wrapped
}
