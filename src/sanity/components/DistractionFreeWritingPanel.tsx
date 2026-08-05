import {useContext, useEffect, useMemo, useState} from 'react'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {DocumentPaneContext, FullscreenPTEContext} from 'sanity/_singletons'
import {portableTextToPlainText, estimateReadingTimeFromText} from '../../lib/portableText'
import {onPasteAutoEmbed} from '../lib/autoEmbedPaste'

type PTBlock = {_key?: string; _type?: string; style?: string; children?: {text?: string}[]}

const HEADING_STYLES = new Set(['h1', 'h2', 'h3', 'h4'])

function headingText(block: PTBlock): string {
  return (block.children ?? []).map((c) => c.text ?? '').join('')
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Adds writing-session chrome around the body field's default editor,
 * rather than replacing it -- `renderDefault` is Sanity's documented way to
 * compose with the built-in Portable Text input instead of rebuilding it.
 *
 * Scope note: the PRD also describes a fade-non-active-paragraph focus
 * mode and cursor-centering typewriter scroll. Both require patching the
 * Portable Text editor's own rendering internals in ways that aren't a
 * stable, documented customization surface -- the kind of "clever and
 * fragile" Rule #4 warns against, likely to break on a future Sanity
 * upgrade. Left out on purpose. Full-screen writing itself is covered by
 * Studio's own built-in expand button on this field -- this panel just
 * triggers that same built-in state automatically when the document pane's
 * Focus mode is entered, so the two no longer need two separate clicks.
 */
export function DistractionFreeWritingPanel(props: ArrayOfObjectsInputProps) {
  const {value, renderDefault, path} = props
  const [sessionStart] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [outlineOpen, setOutlineOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - sessionStart), 1000)
    return () => clearInterval(id)
  }, [sessionStart])

  const blocks = useMemo(() => (Array.isArray(value) ? (value as PTBlock[]) : []), [value])

  const plainText = useMemo(() => portableTextToPlainText(blocks), [blocks])
  const wordCount = useMemo(
    () => (plainText.trim() ? plainText.trim().split(/\s+/).length : 0),
    [plainText],
  )
  const readingTime = useMemo(() => estimateReadingTimeFromText(plainText || ' '), [plainText])

  const outline = useMemo(
    () =>
      blocks
        .filter((b) => b._type === 'block' && b.style && HEADING_STYLES.has(b.style))
        .map((b) => ({key: b._key, style: b.style, text: headingText(b) || 'Untitled heading'})),
    [blocks],
  )

  // Entering Focus mode (the document pane's own toolbar toggle) should
  // also expand this field's editor -- Asher's preferred writing setup was
  // two separate clicks before this. Both context values are @internal:
  // not officially part of Sanity's stable API, so this is written to fail
  // quiet rather than loud. `FullscreenPTEContext`'s default value is a
  // real (non-null) object even outside a provider, so it's safe to call
  // directly; `DocumentPaneContext` genuinely can be null (e.g. if this
  // field is ever rendered outside a document pane), hence the `?.`.
  const documentPane = useContext(DocumentPaneContext)
  const fullscreenPTE = useContext(FullscreenPTEContext)
  const maximized = documentPane?.maximized ?? false

  useEffect(() => {
    if (maximized) fullscreenPTE.setFullscreenPath(path, true)
  }, [maximized, path, fullscreenPTE])

  function jumpTo(key: string | undefined) {
    if (!key) return
    // Best-effort: Sanity's Portable Text editor renders each block with a
    // data-key matching its _key. If a future Studio version changes that,
    // this just quietly does nothing rather than erroring.
    const el = document.querySelector(`[data-key="${key}"]`)
    el?.scrollIntoView({behavior: 'smooth', block: 'center'})
  }

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} border tone="transparent">
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Flex align="center" gap={3} wrap="wrap">
            <Badge tone="default" mode="outline">
              {wordCount} word{wordCount === 1 ? '' : 's'}
            </Badge>
            <Badge tone="default" mode="outline">
              {readingTime} min read
            </Badge>
            <Badge tone="primary" mode="outline">
              Session {formatElapsed(elapsed)}
            </Badge>
          </Flex>
          {outline.length > 0 && (
            <Text
              size={1}
              muted
              style={{cursor: 'pointer', textDecoration: 'underline'}}
              onClick={() => setOutlineOpen((v) => !v)}
            >
              {outlineOpen ? 'Hide outline' : `Outline (${outline.length})`}
            </Text>
          )}
        </Flex>
        {outlineOpen && outline.length > 0 && (
          <Box marginTop={3}>
            <Stack space={2}>
              {outline.map((item) => (
                <Text
                  key={item.key}
                  size={1}
                  style={{
                    cursor: 'pointer',
                    paddingLeft: item.style === 'h1' ? 0 : item.style === 'h2' ? 12 : item.style === 'h3' ? 24 : 36,
                  }}
                  onClick={() => jumpTo(item.key)}
                >
                  {item.text}
                </Text>
              ))}
            </Stack>
          </Box>
        )}
      </Card>
      {renderDefault({...props, onPaste: onPasteAutoEmbed})}
    </Stack>
  )
}
