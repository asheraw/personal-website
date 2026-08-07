import {useCallback, useEffect, useRef, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useClient} from 'sanity'
import {UploadIcon} from '@sanity/icons/Upload'
import {ErrorMessage} from './ErrorMessage'

type UsedByPost = {title: string; slug: string | null}
type ImageAsset = {
  _id: string
  url: string
  originalFilename: string | null
  size: number
  usedBy: UsedByPost[]
  defaultAlt: string | null
}
type TrashedAsset = {
  _id: string
  assetId: string
  trashedAt: string
  asset: {url: string; originalFilename: string | null} | null
  usedBy: UsedByPost[]
}

// A custom Studio Tool (registered in sanity.config.ts) rather than a
// document-type list, since image assets (`sanity.imageAsset`) aren't a
// content type editors browse the normal way -- they're picked from
// inside an image field's own dialog. This is the missing "which posts
// use this image" view the PRD calls for at the media-library level,
// built the same way the category-level version already was: one GROQ
// query using `references()` so it doesn't need to know every field an
// image could be embedded in (main image, social image, or inside the
// post body) -- `references()` checks the whole document tree.
// Deterministic 1:1 id -- lets saving a default alt text be a plain
// createOrReplace (no separate "does one already exist" lookup needed)
// and keeps the mapping obvious to read directly in Vision/the API.
function altDocId(assetId: string): string {
  return `imgalt-${assetId}`
}
function trashDocId(assetId: string): string {
  return `imgtrash-${assetId}`
}

const PAGE_SIZE = 60
const TRASH_RETENTION_DAYS = 30
const SEARCH_DEBOUNCE_MS = 400

const LIBRARY_PROJECTION = `{
  _id,
  url,
  originalFilename,
  size,
  "usedBy": *[_type == "post" && references(^._id)]{title, "slug": slug.current},
  "defaultAlt": *[_type == "imageAssetAlt" && assetId == ^._id][0].altText
}`

// Same "not (_id in ...)" subquery-in-filter both the paginated library
// query and the search query use, so a just-trashed asset disappears from
// both immediately rather than only one of them.
const NOT_TRASHED_FILTER = `!(_id in *[_type == "imageAssetTrash"].assetId)`

export function MediaLibraryTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assets, setAssets] = useState<ImageAsset[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ImageAsset[] | null>(null)
  const [searching, setSearching] = useState(false)

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmingTrashUsed, setConfirmingTrashUsed] = useState(false)
  const [trashBusy, setTrashBusy] = useState(false)

  const [viewingTrash, setViewingTrash] = useState(false)
  const [trashed, setTrashed] = useState<TrashedAsset[] | null>(null)
  const [trashActionBusyId, setTrashActionBusyId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{done: number; total: number} | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const loadPage = useCallback(
    (offset: number) => {
      return client.fetch<ImageAsset[]>(
        `*[_type == "sanity.imageAsset" && ${NOT_TRASHED_FILTER}] | order(_createdAt desc) [${offset}...${offset + PAGE_SIZE + 1}] ${LIBRARY_PROJECTION}`,
      )
    },
    [client],
  )

  const loadTrash = useCallback(() => {
    return client.fetch<TrashedAsset[]>(
      `*[_type == "imageAssetTrash"] | order(trashedAt desc) {
        _id, assetId, trashedAt,
        "asset": *[_type == "sanity.imageAsset" && _id == ^.assetId][0]{url, originalFilename},
        "usedBy": *[_type == "post" && references(^.assetId)]{title, "slug": slug.current}
      }`,
    )
  }, [client])

  useEffect(() => {
    let cancelled = false
    loadPage(0)
      .then((result) => {
        if (cancelled) return
        setHasMore(result.length > PAGE_SIZE)
        setAssets(result.slice(0, PAGE_SIZE))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [loadPage])

  useEffect(() => {
    if (!viewingTrash) return
    let cancelled = false
    setTrashed(null)
    loadTrash().then((result) => {
      if (!cancelled) setTrashed(result)
    })
    return () => {
      cancelled = true
    }
  }, [viewingTrash, loadTrash])

  // Debounced -- only runs a real query once typing settles, same 400ms
  // shape as CommentsTool's own search box, not on every keystroke.
  useEffect(() => {
    const trimmed = searchInput.trim()
    const id = setTimeout(() => setSearchTerm(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(null)
      return
    }
    let cancelled = false
    setSearching(true)
    client
      .fetch<ImageAsset[]>(
        `*[_type == "sanity.imageAsset" && originalFilename match $term && ${NOT_TRASHED_FILTER}] | order(_createdAt desc) [0...100] ${LIBRARY_PROJECTION}`,
        {term: `*${searchTerm}*`},
      )
      .then((result) => {
        if (!cancelled) {
          setSearchResults(result)
          setSearching(false)
        }
      })
      .catch(() => {
        if (!cancelled) setSearching(false)
      })
    return () => {
      cancelled = true
    }
  }, [searchTerm, client])

  async function loadMore() {
    if (!assets) return
    setLoadingMore(true)
    try {
      const result = await loadPage(assets.length)
      setHasMore(result.length > PAGE_SIZE)
      setAssets([...assets, ...result.slice(0, PAGE_SIZE)])
    } finally {
      setLoadingMore(false)
    }
  }

  async function saveAlt(assetId: string, altText: string) {
    setSavingId(assetId)
    setSaveError(null)
    try {
      const trimmed = altText.trim()
      if (trimmed) {
        await client.createOrReplace({
          _id: altDocId(assetId),
          _type: 'imageAssetAlt',
          assetId,
          altText: trimmed,
        })
      } else {
        // Blanking it out removes the fallback entirely rather than
        // leaving an empty-string override sitting around.
        await client.delete(altDocId(assetId)).catch(() => {})
      }
      const apply = (list: ImageAsset[]) =>
        list.map((a) => (a._id === assetId ? {...a, defaultAlt: trimmed || null} : a))
      setAssets((prev) => (prev ? apply(prev) : prev))
      setSearchResults((prev) => (prev ? apply(prev) : prev))
    } catch (err) {
      // Previously uncaught -- a failed write here (a permissions hiccup, a
      // dropped connection) became an unhandled promise rejection instead
      // of a message Asher could actually see, which is the most likely
      // explanation for this looking like the whole page had crashed
      // rather than one save quietly failing.
      setSaveError(err instanceof Error ? err.message : 'Something went wrong saving that alt text.')
    } finally {
      setSavingId(null)
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
    setConfirmingTrashUsed(false)
  }

  const visibleAssets = searchTerm ? searchResults : assets
  const selectedAssets = (visibleAssets ?? []).filter((a) => selectedIds.has(a._id))
  const selectedInUseCount = selectedAssets.filter((a) => a.usedBy.length > 0).length

  async function trashSelected() {
    if (selectedIds.size === 0) return
    if (selectedInUseCount > 0 && !confirmingTrashUsed) {
      setConfirmingTrashUsed(true)
      return
    }
    setTrashBusy(true)
    try {
      const now = new Date().toISOString()
      const tx = client.transaction()
      for (const id of selectedIds) {
        tx.createOrReplace({_id: trashDocId(id), _type: 'imageAssetTrash', assetId: id, trashedAt: now})
      }
      await tx.commit()
      const ids = selectedIds
      setAssets((prev) => (prev ? prev.filter((a) => !ids.has(a._id)) : prev))
      setSearchResults((prev) => (prev ? prev.filter((a) => !ids.has(a._id)) : prev))
      exitSelectMode()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong moving those to trash.')
      setConfirmingTrashUsed(false)
    } finally {
      setTrashBusy(false)
    }
  }

  async function restoreAsset(trashDoc: TrashedAsset) {
    setTrashActionBusyId(trashDoc._id)
    try {
      await client.delete(trashDoc._id)
      setTrashed((prev) => (prev ? prev.filter((t) => t._id !== trashDoc._id) : prev))
    } finally {
      setTrashActionBusyId(null)
    }
  }

  async function deleteForever(trashDoc: TrashedAsset) {
    setTrashActionBusyId(trashDoc._id)
    try {
      // Same safety check the daily purge cron runs -- a post could have
      // started using this image again after it was trashed (restored
      // elsewhere, or re-inserted from an old export), and deleting the
      // real asset out from under a post that still points at it would
      // leave a broken image on the live site.
      const stillUsed = await client.fetch<number>(
        `count(*[_type == "post" && references($id)])`,
        {id: trashDoc.assetId},
      )
      if (stillUsed > 0) {
        setSaveError('That image is now used by a post again -- restore it instead of deleting.')
        return
      }
      const tx = client.transaction().delete(trashDoc._id).delete(trashDoc.assetId)
      await tx.commit()
      setTrashed((prev) => (prev ? prev.filter((t) => t._id !== trashDoc._id) : prev))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong deleting that image.')
    } finally {
      setTrashActionBusyId(null)
      setConfirmingDeleteId(null)
    }
  }

  async function uploadFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setUploading(true)
    setUploadError(null)
    setUploadProgress({done: 0, total: imageFiles.length})
    const uploaded: ImageAsset[] = []
    const failures: string[] = []
    for (const file of imageFiles) {
      try {
        const result = await client.assets.upload('image', file, {filename: file.name})
        uploaded.push({
          _id: result._id,
          url: result.url,
          originalFilename: result.originalFilename ?? file.name,
          size: result.size,
          usedBy: [],
          defaultAlt: null,
        })
      } catch {
        failures.push(file.name)
      }
      setUploadProgress((prev) => (prev ? {done: prev.done + 1, total: prev.total} : prev))
    }
    if (uploaded.length > 0) {
      setAssets((prev) => (prev ? [...uploaded, ...prev] : uploaded))
    }
    if (failures.length > 0) {
      setUploadError(`${failures.length} file${failures.length === 1 ? '' : 's'} failed to upload: ${failures.join(', ')}`)
    }
    setUploading(false)
    setUploadProgress(null)
  }

  if (error) {
    return (
      <Box padding={4}>
        <ErrorMessage>Couldn&apos;t load media library: {error}</ErrorMessage>
      </Box>
    )
  }

  if (!assets) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box
      padding={4}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        uploadFiles(Array.from(e.dataTransfer.files))
      }}
      style={dragOver ? {outline: '2px dashed var(--card-focus-ring-color, #2276fc)', outlineOffset: -4} : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{display: 'none'}}
        onChange={(e) => {
          uploadFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      <Stack space={4}>
        <Flex align="flex-start" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Text size={3} weight="bold">
              Media library
            </Text>
            <Text size={1} muted>
              Set a default alt text here to fill the gap automatically on any post that uses an image as its
              Featured Image and hasn&rsquo;t written its own — writing one for a specific post always takes
              priority over this. Drag photos anywhere on this page to upload them.
            </Text>
          </Stack>
          <Flex gap={2} wrap="wrap">
            <Button
              text={viewingTrash ? 'Back to Library' : `Trash${trashed ? ` (${trashed.length})` : ''}`}
              mode={viewingTrash ? 'default' : 'ghost'}
              tone={viewingTrash ? 'primary' : undefined}
              onClick={() => {
                setViewingTrash((v) => !v)
                exitSelectMode()
              }}
            />
            {!viewingTrash && (
              <Button
                text={selectMode ? 'Cancel' : 'Select'}
                mode={selectMode ? 'default' : 'ghost'}
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              />
            )}
            {!viewingTrash && (
              <Button
                text="Upload Photos"
                icon={UploadIcon}
                tone="primary"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              />
            )}
          </Flex>
        </Flex>

        {uploadProgress && (
          <Card padding={3} radius={2} tone="primary" border>
            <Flex align="center" gap={3}>
              <Spinner />
              <Text size={1}>
                Uploading {uploadProgress.done}/{uploadProgress.total}…
              </Text>
            </Flex>
          </Card>
        )}
        {uploadError && <ErrorMessage>{uploadError}</ErrorMessage>}
        {saveError && <ErrorMessage>{saveError}</ErrorMessage>}

        {!viewingTrash && (
          <TextInput
            fontSize={1}
            placeholder="Search by filename…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            clearButton={searchInput.length > 0}
            onClear={() => setSearchInput('')}
          />
        )}

        {selectMode && (
          <Card padding={3} radius={2} tone={selectedIds.size > 0 ? 'primary' : 'transparent'} border>
            {confirmingTrashUsed ? (
              <Flex align="center" gap={2} wrap="wrap">
                <Text size={1}>
                  {selectedInUseCount} of {selectedIds.size} selected image{selectedIds.size === 1 ? '' : 's'} still
                  {selectedInUseCount === 1 ? ' appears' : ' appear'} in a post. Trashing it won&rsquo;t break
                  anything immediately, but it&rsquo;ll stop showing up if it&rsquo;s ever permanently deleted
                  later. Trash anyway?
                </Text>
                <Button text="Yes, trash them" tone="critical" fontSize={1} disabled={trashBusy} onClick={trashSelected} />
                <Button text="Cancel" mode="ghost" fontSize={1} disabled={trashBusy} onClick={() => setConfirmingTrashUsed(false)} />
              </Flex>
            ) : (
              <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                <Text size={1}>{selectedIds.size} selected</Text>
                <Button
                  text="Move to Trash"
                  tone="critical"
                  mode="ghost"
                  fontSize={1}
                  disabled={selectedIds.size === 0 || trashBusy}
                  loading={trashBusy}
                  onClick={trashSelected}
                />
              </Flex>
            )}
          </Card>
        )}

        {viewingTrash ? (
          trashed === null ? (
            <Flex align="center" justify="center" padding={6}>
              <Spinner muted />
            </Flex>
          ) : trashed.length === 0 ? (
            <Text size={1} muted>
              Trash is empty.
            </Text>
          ) : (
            <Stack space={3}>
              {trashed.map((t) => (
                <TrashedAssetCard
                  key={t._id}
                  trashDoc={t}
                  busy={trashActionBusyId === t._id}
                  confirmingDelete={confirmingDeleteId === t._id}
                  onConfirmDelete={() => setConfirmingDeleteId(t._id)}
                  onCancelConfirm={() => setConfirmingDeleteId(null)}
                  onRestore={() => restoreAsset(t)}
                  onDeleteForever={() => deleteForever(t)}
                />
              ))}
            </Stack>
          )
        ) : (
          <>
            {searching && (
              <Flex align="center" gap={2}>
                <Spinner muted />
                <Text size={1} muted>
                  Searching…
                </Text>
              </Flex>
            )}
            {searchTerm && !searching && searchResults?.length === 0 && (
              <Text size={1} muted>
                No images match &ldquo;{searchTerm}&rdquo;.
              </Text>
            )}
            <Grid columns={[2, 3, 4, 5]} gap={3}>
              {(visibleAssets ?? []).map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  selectMode={selectMode}
                  selected={selectedIds.has(asset._id)}
                  onToggleSelected={() => toggleSelected(asset._id)}
                  draftValue={drafts[asset._id] ?? asset.defaultAlt ?? ''}
                  onDraftChange={(value) => setDrafts((prev) => ({...prev, [asset._id]: value}))}
                  saving={savingId === asset._id}
                  saveDisabled={drafts[asset._id] === undefined || drafts[asset._id] === (asset.defaultAlt ?? '')}
                  onSave={() => saveAlt(asset._id, drafts[asset._id] ?? '')}
                />
              ))}
            </Grid>
            {!searchTerm && hasMore && (
              <Flex justify="center">
                <Button text={loadingMore ? 'Loading…' : 'Load more'} mode="ghost" loading={loadingMore} onClick={loadMore} />
              </Flex>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}

function AssetCard({
  asset,
  selectMode,
  selected,
  onToggleSelected,
  draftValue,
  onDraftChange,
  saving,
  saveDisabled,
  onSave,
}: {
  asset: ImageAsset
  selectMode: boolean
  selected: boolean
  onToggleSelected: () => void
  draftValue: string
  onDraftChange: (value: string) => void
  saving: boolean
  saveDisabled: boolean
  onSave: () => void
}) {
  return (
    <Card
      radius={2}
      shadow={1}
      padding={2}
      tone={selected ? 'primary' : asset.usedBy.length === 0 ? 'caution' : 'default'}
      onClick={selectMode ? onToggleSelected : undefined}
      style={selectMode ? {cursor: 'pointer'} : undefined}
    >
      <Stack space={2}>
        <div style={{position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 4, overflow: 'hidden', background: 'var(--card-code-bg-color, #f4f4f4)'}}>
          {selectMode && (
            <div style={{position: 'absolute', top: 6, left: 6, zIndex: 1, background: 'rgba(255,255,255,0.9)', borderRadius: 4, padding: 2}}>
              <Checkbox checked={selected} readOnly />
            </div>
          )}
          <img
            src={`${asset.url}?w=200&h=200&fit=crop`}
            alt={asset.originalFilename ?? 'Untitled image'}
            loading="lazy"
            style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
          />
        </div>
        <Text size={0} textOverflow="ellipsis" title={asset.originalFilename ?? undefined}>
          {asset.originalFilename ?? 'Untitled'}
        </Text>
        <Text size={0} muted>
          {(asset.size / 1024).toFixed(0)} KB
        </Text>
        {asset.usedBy.length > 0 ? (
          <Stack space={1}>
            <Badge tone="positive" fontSize={0}>
              Used in {asset.usedBy.length} post{asset.usedBy.length === 1 ? '' : 's'}
            </Badge>
            {asset.usedBy.slice(0, 3).map((post) => (
              <Text key={post.slug ?? post.title} size={0} muted textOverflow="ellipsis">
                · {post.title}
              </Text>
            ))}
            {asset.usedBy.length > 3 && (
              <Text size={0} muted>
                +{asset.usedBy.length - 3} more
              </Text>
            )}
          </Stack>
        ) : (
          <Badge tone="caution" fontSize={0}>
            Not used
          </Badge>
        )}
        {!selectMode && (
          <Stack space={2}>
            <TextInput
              fontSize={0}
              padding={2}
              placeholder="Default alt text"
              value={draftValue}
              onChange={(event) => onDraftChange(event.currentTarget.value)}
            />
            <Button text={saving ? 'Saving…' : 'Save'} mode="ghost" fontSize={0} padding={2} disabled={saving || saveDisabled} onClick={onSave} />
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

function TrashedAssetCard({
  trashDoc,
  busy,
  confirmingDelete,
  onConfirmDelete,
  onCancelConfirm,
  onRestore,
  onDeleteForever,
}: {
  trashDoc: TrashedAsset
  busy: boolean
  confirmingDelete: boolean
  onConfirmDelete: () => void
  onCancelConfirm: () => void
  onRestore: () => void
  onDeleteForever: () => void
}) {
  const purgeDate = new Date(+new Date(trashDoc.trashedAt) + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  return (
    <Card padding={3} radius={2} border>
      <Flex align="center" gap={3} wrap="wrap">
        {trashDoc.asset && (
          <img
            src={`${trashDoc.asset.url}?w=80&h=80&fit=crop`}
            alt=""
            loading="lazy"
            style={{width: 56, height: 56, borderRadius: 4, objectFit: 'cover', flexShrink: 0}}
          />
        )}
        <Stack space={2} style={{flex: 1, minWidth: 0}}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {trashDoc.asset?.originalFilename ?? '(asset already gone)'}
          </Text>
          <Text size={0} muted>
            Auto-deletes {purgeDate.toLocaleDateString()} unless restored or deleted now.
            {trashDoc.usedBy.length > 0 &&
              ` Still used in ${trashDoc.usedBy.length} post${trashDoc.usedBy.length === 1 ? '' : 's'} -- won't actually be deleted while that's true.`}
          </Text>
        </Stack>
        {confirmingDelete ? (
          <Flex align="center" gap={2} wrap="wrap">
            <Text size={1}>Delete forever?</Text>
            <Button text="Yes, delete forever" tone="critical" fontSize={1} disabled={busy} onClick={onDeleteForever} />
            <Button text="Cancel" mode="ghost" fontSize={1} disabled={busy} onClick={onCancelConfirm} />
          </Flex>
        ) : (
          <Flex gap={2}>
            <Button text="Restore" tone="positive" fontSize={1} disabled={busy} onClick={onRestore} />
            <Button text="Delete Forever" tone="critical" mode="ghost" fontSize={1} disabled={busy} onClick={onConfirmDelete} />
          </Flex>
        )}
      </Flex>
    </Card>
  )
}
