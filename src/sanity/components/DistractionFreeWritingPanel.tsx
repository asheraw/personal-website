import {useContext, useEffect, useMemo, useRef, useState} from 'react'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'
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
  const {value, renderDefault} = props
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
  // two separate clicks before this.
  //
  // Writing to Sanity's FullscreenPTEContext directly (an earlier attempt)
  // turned out to be a no-op: the editor's own "expand" state is local
  // React state that's seeded from that context once at mount and never
  // re-reads it afterwards, so a later write just sits there unused. The
  // only thing that actually flips that state is a real click on the
  // editor's own expand/collapse button (`data-testid="fullscreen-button-expand"`
  // in Sanity's source), so this simulates exactly that click instead of
  // trying to fake the internal state it produces. `DocumentPaneContext` is
  // @internal to Sanity and genuinely can be null outside a document pane,
  // hence the `?.`; if a future Studio version renames the button's test id,
  // this just quietly stops finding it rather than throwing.
  const documentPane = useContext(DocumentPaneContext)
  const maximized = documentPane?.maximized ?? false
  const bodyFieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!maximized) return
    const expandButton = bodyFieldRef.current?.querySelector(
      '[data-testid="fullscreen-button-expand"]',
    )
    if (expandButton instanceof HTMLElement) expandButton.click()
  }, [maximized])

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
      <div ref={bodyFieldRef}>{renderDefault({...props, onPaste: onPasteAutoEmbed})}</div>
    </Stack>
  )
}
