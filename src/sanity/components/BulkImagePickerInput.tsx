import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Button, Card, Checkbox, Dialog, Flex, Grid, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useClient} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

type LibraryAsset = {_id: string; url: string; originalFilename: string | null}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

const PAGE_SIZE = 60
const SEARCH_DEBOUNCE_MS = 350

/**
 * Wraps the default array-of-images input (Sanity's own "More photos" field
 * on the Image block) with a "Add multiple from Media Library" button --
 * Asher's own gap, pointed out directly: he'd bulk-uploaded a batch of
 * photos into the Media library, then found there was no way to add more
 * than one at a time into a post's gallery, only the one-at-a-time
 * Upload/Select flow Sanity's default array input already has.
 *
 * `renderDefault(props)` still renders everything Sanity's own input
 * already does (reordering, per-item remove, the existing one-at-a-time
 * add) -- this only adds a second, faster path alongside it, same
 * "wrap, don't replace" approach as SavedStatusInput.tsx.
 */
export function BulkImagePickerInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault, onItemAppend} = props
  const client = useClient({apiVersion: '2026-07-22'})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assets, setAssets] = useState<LibraryAsset[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const scrollBoxRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [searchInput])

  const loadPage = useCallback(
    (offset: number) =>
      client.fetch<LibraryAsset[]>(
        `*[_type == "sanity.imageAsset"] | order(_createdAt desc) [${offset}...${offset + PAGE_SIZE + 1}]{_id, url, originalFilename}`
      ),
    [client]
  )

  // Only the plain browse view paginates -- a real search narrows results
  // enough that more than 100 matches is never realistically needed, same
  // reasoning MediaLibraryTool.tsx's own search already settled on.
  useEffect(() => {
    if (!dialogOpen) return
    let cancelled = false
    setAssets(null)
    if (searchTerm) {
      client
        .fetch<LibraryAsset[]>(
          `*[_type == "sanity.imageAsset" && originalFilename match $term] | order(_createdAt desc) [0...100]{_id, url, originalFilename}`,
          {term: `*${searchTerm}*`}
        )
        .then((result) => {
          if (!cancelled) {
            setAssets(result)
            setHasMore(false)
          }
        })
    } else {
      loadPage(0).then((result) => {
        if (cancelled) return
        setHasMore(result.length > PAGE_SIZE)
        setAssets(result.slice(0, PAGE_SIZE))
      })
    }
    return () => {
      cancelled = true
    }
  }, [dialogOpen, searchTerm, client, loadPage])

  const loadMore = useCallback(async () => {
    if (!assets) return
    setLoadingMore(true)
    try {
      const result = await loadPage(assets.length)
      setHasMore(result.length > PAGE_SIZE)
      setAssets((prev) => (prev ? [...prev, ...result.slice(0, PAGE_SIZE)] : result.slice(0, PAGE_SIZE)))
    } finally {
      setLoadingMore(false)
    }
  }, [assets, loadPage])

  useEffect(() => {
    if (!dialogOpen || searchTerm || !hasMore) return
    const el = sentinelRef.current
    const root = scrollBoxRef.current
    if (!el || !root) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) loadMore()
      },
      {root, rootMargin: '200px'}
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [dialogOpen, searchTerm, hasMore, loadingMore, loadMore])

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addSelected() {
    for (const id of selectedIds) {
      onItemAppend({_type: 'image', _key: randomKey(), asset: {_type: 'reference', _ref: id}} as never)
    }
    setDialogOpen(false)
    setSelectedIds(new Set())
    setSearchInput('')
  }

  return (
    <Stack space={3}>
      <Button
        text="Add multiple from Media Library"
        icon={ImagesIcon}
        mode="ghost"
        onClick={() => setDialogOpen(true)}
      />
      {renderDefault(props)}
      {dialogOpen && (
        <Dialog id="bulk-image-picker" header="Add photos from Media Library" onClose={() => setDialogOpen(false)} width={2}>
          <Box padding={4}>
            <Stack space={4}>
              <TextInput
                fontSize={1}
                placeholder="Search by filename…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.currentTarget.value)}
                clearButton={searchInput.length > 0}
                onClear={() => setSearchInput('')}
              />
              {!assets ? (
                <Flex justify="center" padding={4}>
                  <Spinner muted />
                </Flex>
              ) : assets.length === 0 ? (
                <Text size={1} muted>
                  No images found.
                </Text>
              ) : (
                <Box ref={scrollBoxRef} style={{maxHeight: 420, overflowY: 'auto'}}>
                  <Grid columns={[3, 4, 5]} gap={2}>
                    {assets.map((a) => {
                      const selected = selectedIds.has(a._id)
                      return (
                        <Card
                          key={a._id}
                          radius={2}
                          padding={1}
                          tone={selected ? 'primary' : 'default'}
                          onClick={() => toggle(a._id)}
                          style={{cursor: 'pointer', position: 'relative'}}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              zIndex: 1,
                              background: 'rgba(255,255,255,0.9)',
                              borderRadius: 4,
                              padding: 2,
                            }}
                          >
                            <Checkbox checked={selected} readOnly />
                          </div>
                          <img
                            src={`${a.url}?w=150&h=150&fit=crop`}
                            alt={a.originalFilename ?? 'Untitled image'}
                            loading="lazy"
                            style={{width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 4, display: 'block'}}
                          />
                        </Card>
                      )
                    })}
                  </Grid>
                  {!searchTerm && hasMore && (
                    <>
                      <div ref={sentinelRef} style={{height: 1}} />
                      {loadingMore && (
                        <Flex justify="center" padding={3}>
                          <Spinner muted />
                        </Flex>
                      )}
                    </>
                  )}
                </Box>
              )}
              <Flex justify="space-between" align="center">
                <Text size={1} muted>
                  {selectedIds.size} selected
                </Text>
                <Flex gap={2}>
                  <Button text="Cancel" mode="ghost" onClick={() => setDialogOpen(false)} />
                  <Button
                    text={`Add ${selectedIds.size || ''} photo${selectedIds.size === 1 ? '' : 's'}`.trim()}
                    tone="primary"
                    disabled={selectedIds.size === 0}
                    onClick={addSelected}
                  />
                </Flex>
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
