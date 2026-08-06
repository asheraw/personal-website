import type {PortableTextBlock, PortableTextInputProps} from 'sanity'

// Matches a *whole* pasted string being nothing but a YouTube/Instagram
// URL -- deliberately anchored start-to-end, not a search-anywhere match,
// since the point is "the writer pasted just a link on its own," not
// "this paragraph happens to mention a YouTube URL somewhere in it."
const YOUTUBE_URL = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)(\S*)$/i
const INSTAGRAM_URL = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+\/?(\?\S*)?$/i

// Both match into the single merged `embed` type (2026-08-06) -- before
// the YouTube/Instagram merge this returned 'youtube' or 'instagramEmbed'
// directly; now that those are legacy-only (see blockContentType.ts), a
// paste should never create a new one of those, only the current type.
function isEmbeddableUrl(text: string): boolean {
  return YOUTUBE_URL.test(text) || INSTAGRAM_URL.test(text)
}

// PasteData's `path` is only ever the selection's *focus* path -- it can't
// tell a collapsed caret apart from a wide selection on its own (both have
// a focus path). This walks it back to the block being pasted into, so
// its existing text can be checked instead.
function focusBlockKey(path: readonly unknown[]): string | undefined {
  const first = path[0]
  return typeof first === 'object' && first !== null && '_key' in first
    ? (first as {_key: string})._key
    : undefined
}

function blockPlainText(block: PortableTextBlock | undefined): string {
  const children = (block as {children?: {text?: string}[]} | undefined)?.children
  return Array.isArray(children) ? children.map((c) => c.text ?? '').join('') : ''
}

// Wired into the post body field via DistractionFreeWritingPanel's
// renderDefault call -- pasting a bare YouTube or Instagram post URL onto
// an *empty* line inserts the real embed block directly, instead of
// leaving a plain link the writer would otherwise need to delete and
// re-add through the block-insert menu by hand.
//
// Deliberately does NOT intercept when the target block already has real
// text in it -- that's exactly the "highlight some text, paste a URL over
// it, it becomes a link" flow Asher already relies on, and this must never
// hijack it. `PasteData` has no direct "is there a selection" flag (see
// RUNBOOK.md), so this checks whether the block being pasted into is empty
// instead: highlighted text always means a non-empty block, and an embed
// is only ever meant to sit on its own blank line anyway. If the target
// block can't be identified at all, this deliberately falls through to
// normal paste handling rather than guessing -- a missed auto-embed is a
// minor inconvenience; incorrectly overriding a real paste-to-link would
// not be.
export const onPasteAutoEmbed: PortableTextInputProps['onPaste'] = (data) => {
  const text = data.event.clipboardData?.getData('text/plain')?.trim()
  if (!text) return undefined

  if (!isEmbeddableUrl(text)) return undefined

  const key = focusBlockKey(data.path)
  if (!key) return undefined

  const focusBlock = Array.isArray(data.value)
    ? data.value.find((b) => (b as {_key?: string})._key === key)
    : undefined
  if (blockPlainText(focusBlock).trim().length > 0) return undefined

  return {insert: [{_type: 'embed', url: text}]}
}
