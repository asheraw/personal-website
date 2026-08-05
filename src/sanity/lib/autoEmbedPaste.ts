import type {PortableTextInputProps} from 'sanity'

// Matches a *whole* pasted string being nothing but a YouTube/Instagram
// URL -- deliberately anchored start-to-end, not a search-anywhere match,
// since the point is "the writer pasted just a link on its own," not
// "this paragraph happens to mention a YouTube URL somewhere in it."
const YOUTUBE_URL = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)(\S*)$/i
const INSTAGRAM_URL = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+\/?(\?\S*)?$/i

// Wired into the post body field via DistractionFreeWritingPanel's
// renderDefault call -- pasting a bare YouTube or Instagram post URL
// (Ctrl/Cmd+V over an empty line, or over selected text) inserts the real
// embed block directly instead of leaving a plain link the writer would
// otherwise need to delete and re-add through the block-insert menu by
// hand. Only fires on an actual paste event; typing a URL and pressing
// space/Enter does not go through this, and would need a different,
// currently-undocumented Studio API to also cover -- not attempted here.
export const onPasteAutoEmbed: PortableTextInputProps['onPaste'] = (data) => {
  const text = data.event.clipboardData?.getData('text/plain')?.trim()
  if (!text) return undefined

  if (YOUTUBE_URL.test(text)) {
    return {insert: [{_type: 'youtube', url: text}]}
  }
  if (INSTAGRAM_URL.test(text)) {
    return {insert: [{_type: 'instagramEmbed', url: text}]}
  }
  return undefined
}
