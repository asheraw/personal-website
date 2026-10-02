import {useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'
import JSZip from 'jszip'
import {Box, Button, Card, Flex, Grid, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {portableTextToPlainText} from '../../lib/portableText'
import {downloadBlob} from '../../lib/downloadFile'
import {ErrorMessage} from './ErrorMessage'
import {CopyPromptButton, type PostDraft} from './SuggestImageCarouselShared'

// The comic-strip and meme tools share one flow, mirroring the carousel's:
// one fast text call writes the captions + an image prompt per picture, then
// each background is generated (or pasted into the free Gemini app and
// uploaded back) one at a time, and /api/og/comic + /api/og/meme lay the text
// over it. Captions are editable here before downloading.
export type VisualKind = 'comic' | 'meme'

export type VisualItem = {
  subject: string
  prompt: string
  caption?: string // comic panels
  top?: string // memes
  bottom?: string
  imageUrl?: string
  busy?: boolean
  slideError?: string
}

const enc = encodeURIComponent

// n: 1-4 -> that panel alone; omitted -> all four as one 2x2 page.
export function comicUrl(items: VisualItem[], n?: number) {
  const parts = items.flatMap((p, i) => [`c${i + 1}=${enc(p.caption ?? '')}`, ...(p.imageUrl ? [`b${i + 1}=${enc(p.imageUrl)}`] : [])])
  return `/api/og/comic?${n ? `n=${n}&` : ''}${parts.join('&')}`
}

export function memeUrl(item: VisualItem) {
  return `/api/og/meme?top=${enc(item.top ?? '')}&bottom=${enc(item.bottom ?? '')}${item.imageUrl ? `&bg=${enc(item.imageUrl)}` : ''}`
}

export function useVisualPack(kind: VisualKind, source: PostDraft | null) {
  const client = useClient({apiVersion: '2026-07-22'})
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [items, setItems] = useState<VisualItem[] | null>(null)
  const [error, setError] = useState('')
  // Ref mirrors state so the one-by-one render loop patches the latest items.
  const ref = useRef<VisualItem[]>([])
  const slug = source?.slug?.current || kind

  function setAll(next: VisualItem[]) {
    ref.current = next
    setItems(next)
  }
  function patchItem(i: number, patch: Partial<VisualItem>) {
    setAll(ref.current.map((s, k) => (k === i ? {...s, ...patch} : s)))
  }

  async function run() {
    setStatus('loading')
    setError('')
    try {
      const bodyText = portableTextToPlainText(source?.body)
      const res = await fetch('/api/ai/suggest-visual', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({kind, title: source?.title, bodyText, slug: source?.slug?.current}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setAll(kind === 'comic' ? data.panels : data.memes)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  // Resolves to the HTTP status so the render-all loop can stop on a 429.
  async function renderImage(i: number): Promise<number> {
    patchItem(i, {busy: true, slideError: undefined})
    try {
      const res = await fetch('/api/ai/generate-carousel-slide', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: ref.current[i].prompt, slug: `${slug}-${kind}`, index: i + 1}),
      })
      const data = await res.json()
      if (!res.ok) {
        patchItem(i, {busy: false, slideError: data.error || 'Something went wrong'})
        return res.status
      }
      patchItem(i, {busy: false, imageUrl: data.imageUrl})
      return 200
    } catch (e) {
      patchItem(i, {busy: false, slideError: e instanceof Error ? e.message : 'Something went wrong'})
      return 500
    }
  }

  async function renderAllMissing() {
    for (let i = 0; i < ref.current.length; i++) {
      if (ref.current[i].imageUrl) continue
      if ((await renderImage(i)) === 429) break
    }
  }

  async function uploadImage(i: number, file: File) {
    patchItem(i, {busy: true, slideError: undefined})
    try {
      const asset = await client.assets.upload('image', file, {filename: file.name})
      patchItem(i, {busy: false, imageUrl: asset.url})
    } catch (e) {
      patchItem(i, {busy: false, slideError: e instanceof Error ? e.message : 'Upload failed'})
    }
  }

  async function downloadUrl(url: string, filename: string) {
    downloadBlob(filename, await (await fetch(url)).blob())
  }

  // Comic: the 4 panels + the combined page (5 images). Meme: every meme.
  async function downloadAll() {
    const zip = new JSZip()
    const files =
      kind === 'comic'
        ? [
            ...ref.current.map((_, i) => ({url: comicUrl(ref.current, i + 1), name: `${slug}-comic-panel-${i + 1}.png`})),
            {url: comicUrl(ref.current), name: `${slug}-comic-all-4.png`},
          ]
        : ref.current.map((m, i) => ({url: memeUrl(m), name: `${slug}-meme-${i + 1}.png`}))
    await Promise.all(files.map(async (f) => zip.file(f.name, await (await fetch(f.url)).blob())))
    downloadBlob(`${slug}-${kind}.zip`, await zip.generateAsync({type: 'blob'}))
  }

  return {
    status,
    items,
    error,
    run,
    slug,
    actions: {patchItem, renderImage, renderAllMissing, uploadImage, downloadUrl, downloadAll},
  }
}

export type VisualPack = ReturnType<typeof useVisualPack>

// Commits on blur, not per keystroke -- each commit re-fetches the preview
// image from the edge route, which would otherwise fire on every letter.
function CommitInput({value, onCommit}: {value: string; onCommit: (v: string) => void}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <TextInput
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => draft !== value && onCommit(draft)}
    />
  )
}

function ItemControls({
  item,
  i,
  pack,
  previewUrl,
  downloadName,
}: {
  item: VisualItem
  i: number
  pack: VisualPack
  previewUrl: string
  downloadName: string
}) {
  const {actions} = pack
  return (
    <Stack space={3}>
      <div style={{position: 'relative'}}>
        <img
          src={previewUrl}
          alt={item.caption ?? `${item.top} ${item.bottom}`}
          style={{width: '100%', aspectRatio: '1 / 1', borderRadius: 4, display: 'block', background: '#0a0807'}}
        />
        {item.busy && (
          <Flex align="center" justify="center" style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 4}}>
            <Spinner />
          </Flex>
        )}
      </div>
      {item.slideError && <ErrorMessage>{item.slideError}</ErrorMessage>}
      <Text size={1} muted>
        Picture idea: {item.subject}
      </Text>
      <Flex gap={2} wrap="wrap">
        <Button
          text={item.imageUrl ? 'Regenerate' : 'Generate picture'}
          mode="ghost"
          fontSize={1}
          disabled={item.busy}
          onClick={() => actions.renderImage(i)}
        />
        <CopyPromptButton text={item.prompt} />
        <Button
          text="Upload picture"
          mode="ghost"
          fontSize={1}
          disabled={item.busy}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = () => {
              const file = input.files?.[0]
              if (file) actions.uploadImage(i, file)
            }
            input.click()
          }}
        />
        <Button
          text="Download"
          mode="ghost"
          fontSize={1}
          disabled={item.busy}
          onClick={() => actions.downloadUrl(previewUrl, downloadName)}
        />
      </Flex>
    </Stack>
  )
}

export function VisualPackResults({kind, pack}: {kind: VisualKind; pack: VisualPack}) {
  const {status, items, error, run, actions, slug} = pack
  const anyBusy = items?.some((s) => s.busy) ?? false
  const missing = items?.filter((s) => !s.imageUrl).length ?? 0

  return (
    <Box>
      {status === 'loading' && (
        <Flex align="center" gap={3}>
          <Spinner />
          <Text>{kind === 'comic' ? 'Writing the strip…' : 'Writing the memes…'}</Text>
        </Flex>
      )}
      {status === 'error' && (
        <Stack space={4}>
          <ErrorMessage>{error}</ErrorMessage>
          <Button text="Try again" tone="primary" onClick={run} />
        </Stack>
      )}
      {status === 'done' && items && (
        <Stack space={5}>
          <Text size={1} muted>
            {kind === 'comic'
              ? 'Four square panels plus the combined 2×2 page — five images. Edit any caption, then give each panel a picture: generate it here, or paste its prompt into the Gemini app and upload the result.'
              : 'Pick your favourite. Edit the text, then give it a picture: generate it here, or paste its prompt into the Gemini app and upload the result.'}
          </Text>
          <Flex gap={3} wrap="wrap">
            <Button
              text={missing ? `Generate ${missing} missing picture${missing > 1 ? 's' : ''}` : 'All pictures ready'}
              tone="primary"
              disabled={!missing || anyBusy}
              onClick={actions.renderAllMissing}
            />
            <Button
              text={kind === 'comic' ? 'Download all 5 (zip)' : 'Download all (zip)'}
              mode="ghost"
              disabled={anyBusy}
              onClick={actions.downloadAll}
            />
          </Flex>

          {kind === 'comic' && (
            <Card padding={3} radius={2} border>
              <Stack space={3}>
                <Text size={1} weight="semibold">
                  The whole strip (image 5)
                </Text>
                <img
                  src={comicUrl(items)}
                  alt="All four comic panels together"
                  style={{width: '100%', maxWidth: 520, aspectRatio: '1 / 1', borderRadius: 4, display: 'block', background: '#efe6d2'}}
                />
                <Flex>
                  <Button
                    text="Download the 2×2 page"
                    mode="ghost"
                    fontSize={1}
                    onClick={() => actions.downloadUrl(comicUrl(items), `${slug}-comic-all-4.png`)}
                  />
                </Flex>
              </Stack>
            </Card>
          )}

          <Grid columns={[1, 2]} gap={4}>
            {items.map((item, i) => (
              <Card key={i} padding={3} radius={2} border>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    {kind === 'comic' ? `Panel ${i + 1}` : `Meme ${i + 1}`}
                  </Text>
                  <ItemControls
                    item={item}
                    i={i}
                    pack={pack}
                    previewUrl={kind === 'comic' ? comicUrl(items, i + 1) : memeUrl(item)}
                    downloadName={kind === 'comic' ? `${slug}-comic-panel-${i + 1}.png` : `${slug}-meme-${i + 1}.png`}
                  />
                  {kind === 'comic' ? (
                    <CommitInput value={item.caption ?? ''} onCommit={(v) => actions.patchItem(i, {caption: v})} />
                  ) : (
                    <Stack space={2}>
                      <CommitInput value={item.top ?? ''} onCommit={(v) => actions.patchItem(i, {top: v})} />
                      <CommitInput value={item.bottom ?? ''} onCommit={(v) => actions.patchItem(i, {bottom: v})} />
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
