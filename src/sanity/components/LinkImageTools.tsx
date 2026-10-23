import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {AddIcon} from '@sanity/icons/Add'
import {RemoveIcon} from '@sanity/icons/Remove'
import {urlFor} from '../lib/image'

type LibraryAsset = {_id: string; url: string; originalFilename: string | null}

const PAGE_SIZE = 48

// Pick an image that is already in the Media Library instead of uploading it
// again. Search matches the original filename (same as the Media tool).
export function ImageLibraryDialog({onPick, onClose}: {onPick: (assetId: string) => void; onClose: () => void}) {
  const client = useClient({apiVersion: '2026-07-22'})
  const [assets, setAssets] = useState<LibraryAsset[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [term, setTerm] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setTerm(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const load = useCallback(
    (offset: number) =>
      term
        ? client.fetch<LibraryAsset[]>(
            `*[_type == "sanity.imageAsset" && originalFilename match $term] | order(_createdAt desc) [${offset}...${offset + PAGE_SIZE + 1}]{_id, url, originalFilename}`,
            {term: `*${term}*`},
          )
        : client.fetch<LibraryAsset[]>(
            `*[_type == "sanity.imageAsset"] | order(_createdAt desc) [${offset}...${offset + PAGE_SIZE + 1}]{_id, url, originalFilename}`,
          ),
    [client, term],
  )

  useEffect(() => {
    let cancelled = false
    setAssets(null)
    load(0).then((rows) => {
      if (cancelled) return
      setHasMore(rows.length > PAGE_SIZE)
      setAssets(rows.slice(0, PAGE_SIZE))
    })
    return () => {
      cancelled = true
    }
  }, [load])

  async function loadMore() {
    if (!assets) return
    setLoadingMore(true)
    try {
      const rows = await load(assets.length)
      setHasMore(rows.length > PAGE_SIZE)
      setAssets([...assets, ...rows.slice(0, PAGE_SIZE)])
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Dialog id="link-image-library" header="Choose from Media Library" onClose={onClose} width={3}>
      <Box padding={4}>
        <Stack space={4}>
          <TextInput fontSize={1} placeholder="Search by file name..." value={searchInput} onChange={(e) => setSearchInput(e.currentTarget.value)} />
          {assets === null ? (
            <Flex justify="center" padding={5}>
              <Spinner muted />
            </Flex>
          ) : assets.length === 0 ? (
            <Text size={1} muted>
              No images found.
            </Text>
          ) : (
            <Grid columns={[2, 3, 4]} gap={2}>
              {assets.map((a) => (
                <Card
                  key={a._id}
                  as="button"
                  type="button"
                  padding={0}
                  radius={2}
                  border
                  onClick={() => onPick(a._id)}
                  title={a.originalFilename ?? ''}
                  style={{cursor: 'pointer', overflow: 'hidden', aspectRatio: '1 / 1', position: 'relative'}}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Studio, not the public site */}
                  <img
                    src={`${a.url}?w=300&h=300&fit=crop`}
                    alt={a.originalFilename ?? ''}
                    loading="lazy"
                    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </Card>
              ))}
            </Grid>
          )}
          {hasMore && <Button text={loadingMore ? 'Loading...' : 'Load more'} mode="ghost" fontSize={1} disabled={loadingMore} onClick={loadMore} />}
        </Stack>
      </Box>
    </Dialog>
  )
}

export type ImageCrop = {_type: 'sanity.imageCrop'; top: number; bottom: number; left: number; right: number}

// Original pixel size is encoded in the asset id: image-<hash>-<w>x<h>-<ext>.
function sizeFromRef(ref: string): {w: number; h: number} | null {
  const m = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i)
  return m ? {w: Number(m[1]), h: Number(m[2])} : null
}

const VIEW_W = 300
const VIEW_H = 400 // 3:4, same shape as the tiles on the live /link page

// Pan + zoom inside a 3:4 frame; saves the visible area as the image's crop so
// the live page and the Studio grid both show exactly what the frame shows.
export function ImageCropDialog({
  assetRef,
  crop,
  onSave,
  onClose,
}: {
  assetRef: string
  crop?: Partial<ImageCrop>
  onSave: (crop: ImageCrop) => void
  onClose: () => void
}) {
  const size = sizeFromRef(assetRef)
  const w = size?.w ?? 1
  const h = size?.h ?? 1
  const base = Math.max(VIEW_W / w, VIEW_H / h) // smallest scale that still covers the frame

  const initial = (() => {
    const l = crop?.left ?? 0
    const r = crop?.right ?? 0
    const t = crop?.top ?? 0
    const visibleW = (1 - l - r) * w
    const z = Math.min(4, Math.max(1, VIEW_W / visibleW / base))
    return {z, ox: l * w, oy: t * h}
  })()

  const [zoom, setZoom] = useState(initial.z)
  const [offset, setOffset] = useState({x: initial.ox, y: initial.oy}) // top-left of the frame, in original-image pixels
  const drag = useRef<{px: number; py: number; ox: number; oy: number} | null>(null)

  const scale = base * zoom
  const clamp = useCallback(
    (x: number, y: number, s: number) => ({
      x: Math.min(Math.max(0, x), Math.max(0, w - VIEW_W / s)),
      y: Math.min(Math.max(0, y), Math.max(0, h - VIEW_H / s)),
    }),
    [w, h],
  )

  function changeZoom(next: number) {
    // Zoom around the frame centre so the picture doesn't jump.
    const cx = offset.x + VIEW_W / scale / 2
    const cy = offset.y + VIEW_H / scale / 2
    const s = base * next
    setZoom(next)
    setOffset(clamp(cx - VIEW_W / s / 2, cy - VIEW_H / s / 2, s))
  }

  function save() {
    const vw = VIEW_W / scale
    const vh = VIEW_H / scale
    onSave({
      _type: 'sanity.imageCrop',
      left: offset.x / w,
      top: offset.y / h,
      right: Math.max(0, 1 - (offset.x + vw) / w),
      bottom: Math.max(0, 1 - (offset.y + vh) / h),
    })
  }

  if (!size) {
    return (
      <Dialog id="link-image-crop" header="Crop image" onClose={onClose} width={1}>
        <Box padding={4}>
          <Text size={1}>This image's size couldn't be read, so it can't be cropped here.</Text>
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog id="link-image-crop" header="Crop image" onClose={onClose} width={1}>
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1} muted>
            Drag the picture to move it, and use the − / + buttons or the slider to zoom. The frame is the exact shape of a card on the Link page.
          </Text>
          <Flex justify="center">
            <div
              style={{
                width: VIEW_W,
                height: VIEW_H,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 4,
                touchAction: 'none',
                cursor: 'grab',
                background: 'rgba(150,150,150,0.2)',
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                drag.current = {px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y}
              }}
              onPointerMove={(e) => {
                const d = drag.current
                if (!d) return
                setOffset(clamp(d.ox - (e.clientX - d.px) / scale, d.oy - (e.clientY - d.py) / scale, scale))
              }}
              onPointerUp={() => {
                drag.current = null
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Studio, not the public site */}
              <img
                src={urlFor({_type: 'image', asset: {_type: 'reference', _ref: assetRef}}).width(1400).url()}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: -offset.x * scale,
                  top: -offset.y * scale,
                  width: w * scale,
                  height: h * scale,
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </Flex>
          <Stack space={2}>
            <Flex justify="space-between" align="center">
              <Text size={1} weight="semibold">
                Zoom
              </Text>
              <Text size={1} muted>
                {zoom.toFixed(1)}x
              </Text>
            </Flex>
            <Flex gap={2} align="center">
              <Button icon={RemoveIcon} mode="ghost" fontSize={1} padding={2} aria-label="Zoom out" disabled={zoom <= 1} onClick={() => changeZoom(Math.max(1, zoom - 0.25))} />
              <style>{`
                .zoom-slider { -webkit-appearance: none; appearance: none; flex: 1; height: 28px; background: transparent; cursor: pointer; }
                .zoom-slider::-webkit-slider-runnable-track { height: 8px; border-radius: 4px; background: rgba(150,150,150,0.45); }
                .zoom-slider::-moz-range-track { height: 8px; border-radius: 4px; background: rgba(150,150,150,0.45); }
                .zoom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; margin-top: -7px; border-radius: 50%; background: #fff; border: 3px solid #2276fc; }
                .zoom-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 3px solid #2276fc; }
              `}</style>
              <input
                className="zoom-slider"
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => changeZoom(Number(e.currentTarget.value))}
                aria-label="Zoom"
              />
              <Button icon={AddIcon} mode="ghost" fontSize={1} padding={2} aria-label="Zoom in" disabled={zoom >= 4} onClick={() => changeZoom(Math.min(4, zoom + 0.25))} />
            </Flex>
          </Stack>
          <Flex gap={2} justify="flex-end">
            <Button text="Cancel" mode="ghost" fontSize={1} onClick={onClose} />
            <Button text="Save crop" tone="primary" fontSize={1} onClick={save} />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
