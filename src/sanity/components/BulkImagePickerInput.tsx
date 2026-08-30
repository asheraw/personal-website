import {useCallback, useEffect, useRef, useState} from 'react'
import {Badge, Box, Button, Card, Checkbox, Dialog, Flex, Grid, Heading, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useClient} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {UploadIcon} from '@sanity/icons/Upload'

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
 * The dialog this opens covers both ways to add several photos at once:
 * selecting existing ones already in the library (the original ask), and
 * uploading several brand-new files directly (Asher's follow-up ask,
 * 2026-08-30) -- each uploaded file appends to the gallery the moment it
 * finishes, same as a single default upload already does.
 *
 * `renderDefault(props)` still renders everything Sanity's own input
 * already does (reordering, per-item remove, the existing one-at-a-time
 * add) -- this only adds a second, faster path alongside it, same
 * "wrap, don't replace" approach as SavedStatusInput.tsx.
 */
export function BulkImagePickerInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault, onItemAppend, value} = props
  const client = useClient({apiVersion: '2026-07-22'})
  // What's already sitting in this field, right now -- reopening the
  // picker after adding a batch used to show every tile unchecked again,
  // with nothing distinguishing "already in the gallery" from "not added
  // yet," so re-adding the same photo by mistake was easy. Every already-
  // present asset gets marked and made unselectable here instead of just
  // pre-checking its box, since re-selecting and re-adding it would still
  // create a real duplicate -- this makes that impossible, not just visible.
  const alreadyAddedIds = new Set(
    (value ?? [])
      .map((item) => (item as {asset?: {_ref?: string}}).asset?._ref)
      .filter((ref): ref is string => Boolean(ref))
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assets, setAssets] = useState<LibraryAsset[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const scrollBoxRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Uploading brand-new files, not just picking existing ones -- Asher's
  // own ask (2026-08-30), after asking whether this dialog could also take
  // new files instead of only ever selecting from what's already in the
  // library. Each file appends to the gallery the moment it finishes
  // uploading, same as Sanity's own default one-at-a-time upload already
  // does -- no separate "confirm" step, since choosing to upload a file
  // already is the confirmation. One failed file doesn't stop the rest of
  // the batch; its filename shows in an error list instead.
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{done: number; total: number} | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setUploading(true)
    setUploadErrors([])
    setUploadProgress({done: 0, total: files.length})
    const errors: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const uploaded = await client.assets.upload('image', file, {filename: file.name})
        onItemAppend({_type: 'image', _key: randomKey(), asset: {_type: 'reference', _ref: uploaded._id}} as never)
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`)
      }
      setUploadProgress({done: i + 1, total: files.length})
    }
    setUploading(false)
    setUploadErrors(errors)
  }

  function addSelected() {
    for (const id of selectedIds) {
      onItemAppend({_type: 'image', _key: randomKey(), asset: {_type: 'reference', _ref: id}} as never)
    }
    closeDialog()
  }

  // Shared by the Dialog's own onClose (X / click outside / Escape) and
  // the Cancel button -- both used to just hide the dialog via
  // setDialogOpen(false), leaving `selectedIds` untouched. Since this
  // component itself never unmounts (only the Dialog's JSX conditionally
  // renders), that state survived a close/reopen: pick some photos,
  // Cancel, reopen, and the same tiles showed as already selected even
  // though nothing had actually been added. Confirmed and fixed
  // 2026-08-30.
  function closeDialog() {
    setDialogOpen(false)
    setSelectedIds(new Set())
    setSearchInput('')
    setUploadErrors([])
    setUploadProgress(null)
  }

  return (
    <Stack space={3}>
      <Button
        text="Add multiple from Media Library"
        icon={ImagesIcon}
        mode="ghost"
        onClick={() => setDialogOpen(true)}
      />
      {/* The list/upload UI directly below is Sanity's own default array
          input -- kept, not replaced, since it's still the right tool for
          adding (or uploading) one photo at a time. This line exists
          because the two sitting stacked with no explanation read as two
          competing ways to do the same thing, when they're actually for
          two different situations. */}
      <Text size={0} muted>
        Or add one at a time below — upload a new photo, search a GIF, or pick a single one from the library.
      </Text>
      {renderDefault(props)}
      {dialogOpen && (
        <Dialog id="bulk-image-picker" header="Add photos from Media Library" onClose={closeDialog} width={2}>
          <Box padding={4}>
            <Stack space={4}>
              <Stack space={3}>
                <Heading size={1}>Upload new photos</Heading>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{display: 'none'}}
                  onChange={(e) => {
                    if (e.target.files) uploadFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <Card
                  padding={4}
                  radius={2}
                  border
                  tone={dragOver ? 'primary' : 'transparent'}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files)
                  }}
                >
                  {uploading ? (
                    <Flex align="center" justify="center" gap={3}>
                      <Spinner />
                      <Text size={1}>
                        Uploading {uploadProgress?.done ?? 0} of {uploadProgress?.total ?? 0}…
                      </Text>
                    </Flex>
                  ) : (
                    <Stack space={3}>
                      <Text size={1} align="center" muted>
                        Drag photos here, or
                      </Text>
                      <Flex justify="center">
                        <Button
                          text="Choose photos"
                          icon={UploadIcon}
                          tone="primary"
                          onClick={() => fileInputRef.current?.click()}
                        />
                      </Flex>
                    </Stack>
                  )}
                </Card>
                {uploadErrors.length > 0 && (
                  <Card padding={3} radius={2} tone="critical" border>
                    <Stack space={1}>
                      {uploadErrors.map((err) => (
                        <Text key={err} size={1}>
                          {err}
                        </Text>
                      ))}
                    </Stack>
                  </Card>
                )}
              </Stack>
              <Heading size={1}>Or pick from what&rsquo;s already in the library</Heading>
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
                      const alreadyAdded = alreadyAddedIds.has(a._id)
                      const selected = selectedIds.has(a._id)
                      return (
                        <Card
                          key={a._id}
                          radius={2}
                          padding={1}
                          tone={alreadyAdded ? 'positive' : selected ? 'primary' : 'default'}
                          onClick={alreadyAdded ? undefined : () => toggle(a._id)}
                          style={{cursor: alreadyAdded ? 'default' : 'pointer', position: 'relative', opacity: alreadyAdded ? 0.7 : 1}}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              zIndex: 1,
                            }}
                          >
                            {alreadyAdded ? (
                              <Badge tone="positive" fontSize={0}>
                                Added
                              </Badge>
                            ) : (
                              <div style={{background: 'rgba(255,255,255,0.9)', borderRadius: 4, padding: 2}}>
                                <Checkbox checked={selected} readOnly />
                              </div>
                            )}
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
                  <Button text="Cancel" mode="ghost" onClick={closeDialog} />
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
