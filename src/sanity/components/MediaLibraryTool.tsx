import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {useClient} from 'sanity'
import {isAnimatedGifUrl} from '../../lib/isAnimatedGif'
import {UploadIcon} from '@sanity/icons/Upload'
import {SyncIcon} from '@sanity/icons/Sync'
import {DocumentZipIcon} from '@sanity/icons/DocumentZip'
import {ErrorMessage} from './ErrorMessage'
import {
  computeImageReplaceChanges,
  computeBatchReplaceChanges,
  summarizeImageReplace,
  summarizeBatchCompress,
  type ImageFieldChange,
  type AssetSwap,
} from '../../lib/imageReplace'
import {compressImageFile, MIN_SIZE_TO_COMPRESS} from '../../lib/imageCompress'

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

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

const PAGE_SIZE = 60
const TRASH_RETENTION_DAYS = 30
const SEARCH_DEBOUNCE_MS = 400

type SortOption = 'newest' | 'oldest' | 'filename' | 'largest' | 'unused'

const SORT_OPTIONS: {value: SortOption; label: string}[] = [
  {value: 'newest', label: 'Newest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'filename', label: 'Filename A–Z'},
  {value: 'largest', label: 'Largest file first'},
  {value: 'unused', label: 'Unused only'},
]

// One shared place for how a chosen sort translates to GROQ -- used by both
// the paginated library query and the search query below, so picking
// "Unused only" then searching doesn't quietly drop back to showing used
// images again.
function sortClauses(sort: SortOption): {order: string; extraFilter: string} {
  switch (sort) {
    case 'oldest':
      return {order: 'order(_createdAt asc)', extraFilter: ''}
    case 'filename':
      return {order: 'order(originalFilename asc)', extraFilter: ''}
    case 'largest':
      return {order: 'order(size desc)', extraFilter: ''}
    case 'unused':
      return {
        order: 'order(_createdAt desc)',
        extraFilter: ' && count(*[_type == "post" && references(^._id)]) == 0',
      }
    case 'newest':
    default:
      return {order: 'order(_createdAt desc)', extraFilter: ''}
  }
}

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
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [lightboxAssetId, setLightboxAssetId] = useState<string | null>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)

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
  const [compressionResults, setCompressionResults] = useState<{filename: string; originalSize: number; compressedSize: number}[] | null>(null)

  // ---- One-time "Compress existing photos" scan -- unlike the automatic
  // per-upload compression above, this walks the WHOLE library once,
  // compressing anything already-uploaded that's still full-size.
  type CompressCandidate = {
    assetId: string
    url: string
    originalFilename: string | null
    originalSize: number
    compressedFile: File
    compressedSize: number
  }
  const [compressLibraryOpen, setCompressLibraryOpen] = useState(false)
  const [libraryScanPhase, setLibraryScanPhase] = useState<'idle' | 'scanning' | 'preview' | 'working' | 'done'>('idle')
  const [libraryScanProgress, setLibraryScanProgress] = useState<{done: number; total: number} | null>(null)
  const [libraryCandidates, setLibraryCandidates] = useState<CompressCandidate[] | null>(null)
  const [librarySkippedCount, setLibrarySkippedCount] = useState(0)
  const [libraryWorkProgress, setLibraryWorkProgress] = useState<{done: number; total: number} | null>(null)
  const [libraryDoneSummary, setLibraryDoneSummary] = useState<{imageCount: number; savedBytes: number; docCount: number} | null>(null)
  const [libraryError, setLibraryError] = useState<string | null>(null)

  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const [replacingAsset, setReplacingAsset] = useState<ImageAsset | null>(null)
  const [replaceStep, setReplaceStep] = useState<'pick' | 'confirm' | 'working'>('pick')
  const [replaceNewAsset, setReplaceNewAsset] = useState<{_id: string; url: string; originalFilename: string | null} | null>(null)
  const [replaceChanges, setReplaceChanges] = useState<ImageFieldChange[] | null>(null)
  const [replaceCompression, setReplaceCompression] = useState<{originalSize: number; compressedSize: number} | null>(null)
  const [replaceBusy, setReplaceBusy] = useState(false)
  const [replaceError, setReplaceError] = useState<string | null>(null)

  const loadPage = useCallback(
    (offset: number) => {
      const {order, extraFilter} = sortClauses(sortOption)
      return client.fetch<ImageAsset[]>(
        `*[_type == "sanity.imageAsset" && ${NOT_TRASHED_FILTER}${extraFilter}] | ${order} [${offset}...${offset + PAGE_SIZE + 1}] ${LIBRARY_PROJECTION}`,
      )
    },
    [client, sortOption],
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
    const {order, extraFilter} = sortClauses(sortOption)
    client
      .fetch<ImageAsset[]>(
        `*[_type == "sanity.imageAsset" && originalFilename match $term && ${NOT_TRASHED_FILTER}${extraFilter}] | ${order} [0...100] ${LIBRARY_PROJECTION}`,
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
  }, [searchTerm, sortOption, client])

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

  // Auto-loads the next page once the sentinel below the grid scrolls into
  // view, instead of waiting for a "Load more" click. Only wired up for the
  // default browse view -- search already returns up to 100 results in one
  // shot with nothing further to page through.
  useEffect(() => {
    if (viewingTrash || searchTerm || !hasMore) return
    const el = loadMoreSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) loadMore()
      },
      {rootMargin: '400px'},
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [viewingTrash, searchTerm, hasMore, loadingMore, loadMore])

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

  const lightboxIndex = useMemo(
    () => (visibleAssets ?? []).findIndex((a) => a._id === lightboxAssetId),
    [visibleAssets, lightboxAssetId],
  )
  const lightboxAsset = lightboxIndex >= 0 ? (visibleAssets ?? [])[lightboxIndex] : null
  const showPrev = useCallback(() => {
    const list = visibleAssets ?? []
    if (lightboxIndex > 0) setLightboxAssetId(list[lightboxIndex - 1]._id)
  }, [visibleAssets, lightboxIndex])
  const showNext = useCallback(() => {
    const list = visibleAssets ?? []
    if (lightboxIndex >= 0 && lightboxIndex < list.length - 1) setLightboxAssetId(list[lightboxIndex + 1]._id)
  }, [visibleAssets, lightboxIndex])

  useEffect(() => {
    if (!lightboxAssetId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxAssetId(null)
      else if (e.key === 'ArrowLeft') showPrev()
      else if (e.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxAssetId, showPrev, showNext])

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
      // Same safety check the daily purge cron runs -- a document could have
      // started using this image again after it was trashed (restored
      // elsewhere, re-inserted from an old export, or repointed here by
      // "Replace image"), and deleting the real asset out from under
      // something that still points at it would leave a broken image on
      // the live site. Checks every document type, not just posts -- an
      // author avatar or site settings image can reference it too.
      const stillUsed = await client.fetch<number>(`count(*[references($id)])`, {id: trashDoc.assetId})
      if (stillUsed > 0) {
        setSaveError('That image is now used again -- restore it instead of deleting.')
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
    setCompressionResults(null)
    const uploaded: ImageAsset[] = []
    const failures: string[] = []
    const shrunk: {filename: string; originalSize: number; compressedSize: number}[] = []
    for (const file of imageFiles) {
      try {
        // Compressed automatically, same squeeze tinypng.com does, just
        // in-browser at upload time -- nothing on the site ever displays
        // an image bigger than this needs to be (see imageCompress.ts).
        const {file: toUpload, compressed, originalSize, compressedSize} = await compressImageFile(file)
        if (compressed) shrunk.push({filename: file.name, originalSize, compressedSize})
        const result = await client.assets.upload('image', toUpload, {filename: toUpload.name})
        uploaded.push({
          _id: result._id,
          url: result.url,
          originalFilename: result.originalFilename ?? toUpload.name,
          size: result.size,
          usedBy: [],
          defaultAlt: null,
        })
      } catch {
        failures.push(file.name)
      }
      setUploadProgress((prev) => (prev ? {done: prev.done + 1, total: prev.total} : prev))
    }
    if (shrunk.length > 0) setCompressionResults(shrunk)
    if (uploaded.length > 0) {
      setAssets((prev) => (prev ? [...uploaded, ...prev] : uploaded))
    }
    if (failures.length > 0) {
      setUploadError(`${failures.length} file${failures.length === 1 ? '' : 's'} failed to upload: ${failures.join(', ')}`)
    }
    setUploading(false)
    setUploadProgress(null)
  }

  function openReplaceDialog(asset: ImageAsset) {
    setReplacingAsset(asset)
    setReplaceStep('pick')
    setReplaceNewAsset(null)
    setReplaceChanges(null)
    setReplaceCompression(null)
    setReplaceError(null)
  }

  function closeReplaceDialog() {
    setReplacingAsset(null)
    setReplaceStep('pick')
    setReplaceNewAsset(null)
    setReplaceChanges(null)
    setReplaceCompression(null)
    setReplaceError(null)
    setReplaceBusy(false)
  }

  // Uploads the new file as its own asset (Sanity assets are immutable --
  // there's no "overwrite this asset's bytes" call), then finds every
  // document referencing the OLD asset and computes what would need to
  // change to repoint each one -- shown as a confirm step before anything
  // is actually written.
  async function handleReplaceFileSelected(file: File) {
    if (!replacingAsset) return
    setReplaceBusy(true)
    setReplaceError(null)
    try {
      const oldId = replacingAsset._id
      const {file: toUpload, compressed, originalSize, compressedSize} = await compressImageFile(file)
      if (compressed) setReplaceCompression({originalSize, compressedSize})
      const uploaded = await client.assets.upload('image', toUpload, {filename: toUpload.name})
      const referencingDocs = await client.fetch<Record<string, unknown>[]>(`*[references($id)]`, {id: oldId})
      const changes = referencingDocs.flatMap((doc) => computeImageReplaceChanges(doc, oldId, uploaded._id))
      setReplaceNewAsset({_id: uploaded._id, url: uploaded.url, originalFilename: uploaded.originalFilename ?? toUpload.name})
      setReplaceChanges(changes)
      setReplaceStep('confirm')
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : 'Something went wrong uploading that file.')
    } finally {
      setReplaceBusy(false)
    }
  }

  async function confirmReplace() {
    if (!replacingAsset || !replaceNewAsset || !replaceChanges) return
    setReplaceStep('working')
    setReplaceError(null)
    try {
      const oldId = replacingAsset._id
      const newId = replaceNewAsset._id
      const now = new Date().toISOString()

      // Every change is grouped by document first -- a single post can have
      // both, say, its mainImage AND a body gallery pointing at the same
      // photo, and a transaction patch can only call .set() once per
      // document, not once per field.
      const byDoc = new Map<string, ImageFieldChange[]>()
      for (const c of replaceChanges) {
        const list = byDoc.get(c.documentId) ?? []
        list.push(c)
        byDoc.set(c.documentId, list)
      }
      const tx = client.transaction()
      for (const [docId, docChanges] of byDoc) {
        const setObj: Record<string, unknown> = {}
        for (const c of docChanges) setObj[c.fieldPath] = c.newValue
        tx.patch(client.patch(docId).set(setObj))
      }
      // Carries the old image's default alt text over to the new asset, and
      // sends the old one to Trash rather than deleting it outright --
      // same 30-day safety net as everything else here, in case a
      // replacement turns out to be wrong.
      if (replacingAsset.defaultAlt) {
        tx.createOrReplace({_id: altDocId(newId), _type: 'imageAssetAlt', assetId: newId, altText: replacingAsset.defaultAlt})
      }
      tx.createOrReplace({_id: trashDocId(oldId), _type: 'imageAssetTrash', assetId: oldId, trashedAt: now})
      await tx.commit()

      await client.create({
        _type: 'bulkOperationLog',
        performedAt: now,
        operationType: 'replaceImage',
        summary: summarizeImageReplace(replacingAsset.originalFilename ?? 'image', replaceChanges),
        changes: replaceChanges.map((c) => ({
          postId: c.documentId,
          postTitle: c.documentTitle,
          fieldPath: c.fieldPath,
          previousValue: JSON.stringify(c.previousValue),
        })),
      })

      const newAssetEntry: ImageAsset = {
        _id: newId,
        url: replaceNewAsset.url,
        originalFilename: replaceNewAsset.originalFilename,
        size: 0,
        usedBy: replacingAsset.usedBy,
        defaultAlt: replacingAsset.defaultAlt,
      }
      const swap = (list: ImageAsset[]) => [newAssetEntry, ...list.filter((a) => a._id !== oldId)]
      setAssets((prev) => (prev ? swap(prev) : prev))
      setSearchResults((prev) => (prev ? swap(prev) : prev))
      closeReplaceDialog()
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : 'Something went wrong replacing that image -- nothing was changed.')
      setReplaceStep('confirm')
    }
  }

  function openCompressLibrary() {
    setCompressLibraryOpen(true)
    setLibraryScanPhase('idle')
    setLibraryCandidates(null)
    setLibrarySkippedCount(0)
    setLibraryDoneSummary(null)
    setLibraryError(null)
  }

  function closeCompressLibrary() {
    setCompressLibraryOpen(false)
    setLibraryScanPhase('idle')
    setLibraryScanProgress(null)
    setLibraryCandidates(null)
    setLibrarySkippedCount(0)
    setLibraryWorkProgress(null)
    setLibraryDoneSummary(null)
    setLibraryError(null)
  }

  // Scans the WHOLE library once, pre-filtering by Sanity's already-known
  // asset size (no point downloading a photo just to learn it's already
  // small) before actually fetching+compressing candidates. Anything that
  // doesn't end up meaningfully smaller (compressImageFile's own
  // shrink-or-skip check) is silently left out of the results rather than
  // shown as a candidate that wouldn't really help.
  async function scanLibraryForCompression() {
    setLibraryScanPhase('scanning')
    setLibraryError(null)
    try {
      const all = await client.fetch<{_id: string; url: string; originalFilename: string | null; size: number}[]>(
        `*[_type == "sanity.imageAsset" && ${NOT_TRASHED_FILTER} && size >= ${MIN_SIZE_TO_COMPRESS}]{_id, url, originalFilename, size}`,
      )
      setLibraryScanProgress({done: 0, total: all.length})
      const candidates: CompressCandidate[] = []
      let skipped = 0
      for (const asset of all) {
        try {
          const res = await fetch(asset.url)
          const blob = await res.blob()
          const sourceFile = new File([blob], asset.originalFilename ?? 'photo', {type: blob.type})
          const result = await compressImageFile(sourceFile)
          if (result.compressed) {
            candidates.push({
              assetId: asset._id,
              url: asset.url,
              originalFilename: asset.originalFilename,
              originalSize: result.originalSize,
              compressedFile: result.file,
              compressedSize: result.compressedSize,
            })
          } else {
            skipped++
          }
        } catch {
          skipped++
        }
        setLibraryScanProgress((prev) => (prev ? {done: prev.done + 1, total: prev.total} : prev))
      }
      setLibraryCandidates(candidates)
      setLibrarySkippedCount(skipped)
      setLibraryScanPhase('preview')
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : 'Something went wrong scanning the library.')
      setLibraryScanPhase('idle')
    }
  }

  async function confirmCompressLibrary() {
    if (!libraryCandidates || libraryCandidates.length === 0) return
    setLibraryScanPhase('working')
    setLibraryError(null)
    setLibraryWorkProgress({done: 0, total: libraryCandidates.length})
    try {
      const swaps: AssetSwap[] = []
      const uploadedByOldId = new Map<string, {_id: string; url: string; originalFilename: string | null}>()
      for (const c of libraryCandidates) {
        const uploaded = await client.assets.upload('image', c.compressedFile, {filename: c.compressedFile.name})
        swaps.push({oldAssetId: c.assetId, newAssetId: uploaded._id})
        uploadedByOldId.set(c.assetId, {_id: uploaded._id, url: uploaded.url, originalFilename: uploaded.originalFilename ?? c.compressedFile.name})
        setLibraryWorkProgress((prev) => (prev ? {done: prev.done + 1, total: prev.total} : prev))
      }

      const oldIds = swaps.map((s) => s.oldAssetId)
      const referencingDocs = await client.fetch<Record<string, unknown>[]>(`*[references($ids)]`, {ids: oldIds})
      const changes = computeBatchReplaceChanges(referencingDocs, swaps)

      const byDoc = new Map<string, ImageFieldChange[]>()
      for (const c of changes) {
        const list = byDoc.get(c.documentId) ?? []
        list.push(c)
        byDoc.set(c.documentId, list)
      }
      const tx = client.transaction()
      for (const [docId, docChanges] of byDoc) {
        const setObj: Record<string, unknown> = {}
        for (const c of docChanges) setObj[c.fieldPath] = c.newValue
        tx.patch(client.patch(docId).set(setObj))
      }
      const now = new Date().toISOString()
      for (const c of libraryCandidates) {
        const newAsset = uploadedByOldId.get(c.assetId)!
        const existingAlt = (await client.getDocument(altDocId(c.assetId)).catch(() => null)) as {altText?: string} | null
        if (existingAlt?.altText) {
          tx.createOrReplace({_id: altDocId(newAsset._id), _type: 'imageAssetAlt', assetId: newAsset._id, altText: existingAlt.altText})
        }
        tx.createOrReplace({_id: trashDocId(c.assetId), _type: 'imageAssetTrash', assetId: c.assetId, trashedAt: now})
      }
      await tx.commit()

      await client.create({
        _type: 'bulkOperationLog',
        performedAt: now,
        operationType: 'replaceImage',
        summary: summarizeBatchCompress(libraryCandidates.length, changes),
        changes: changes.map((c) => ({
          postId: c.documentId,
          postTitle: c.documentTitle,
          fieldPath: c.fieldPath,
          previousValue: JSON.stringify(c.previousValue),
        })),
      })

      const savedBytes = libraryCandidates.reduce((sum, c) => sum + (c.originalSize - c.compressedSize), 0)
      const newEntries: ImageAsset[] = libraryCandidates.map((c) => {
        const newAsset = uploadedByOldId.get(c.assetId)!
        return {
          _id: newAsset._id,
          url: newAsset.url,
          originalFilename: newAsset.originalFilename,
          size: c.compressedSize,
          usedBy: [],
          defaultAlt: null,
        }
      })
      const oldIdSet = new Set(oldIds)
      const swapList = (list: ImageAsset[]) => [...newEntries, ...list.filter((a) => !oldIdSet.has(a._id))]
      setAssets((prev) => (prev ? swapList(prev) : prev))
      setSearchResults((prev) => (prev ? swapList(prev) : prev))

      setLibraryDoneSummary({
        imageCount: libraryCandidates.length,
        savedBytes,
        docCount: new Set(changes.map((c) => c.documentId)).size,
      })
      setLibraryScanPhase('done')
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : 'Something went wrong compressing the library -- some photos may already be done; check before retrying.')
      setLibraryScanPhase('preview')
    }
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
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleReplaceFileSelected(file)
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
              priority over this. Drag photos anywhere on this page to upload them — large ones are
              compressed automatically on the way in.
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
              <Button text="Compress Library" icon={DocumentZipIcon} mode="ghost" onClick={openCompressLibrary} />
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
        {compressionResults && compressionResults.length > 0 && (
          <Card padding={3} radius={2} tone="positive" border>
            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Text size={1} weight="medium">
                  Compressed on the way in, same as tinypng.com would — total saved:{' '}
                  {formatBytes(compressionResults.reduce((sum, r) => sum + (r.originalSize - r.compressedSize), 0))}
                </Text>
                <Button text="Dismiss" mode="bleed" fontSize={0} onClick={() => setCompressionResults(null)} />
              </Flex>
              {compressionResults.map((r) => (
                <Text key={r.filename} size={0} muted>
                  · {r.filename}: {formatBytes(r.originalSize)} → {formatBytes(r.compressedSize)}
                </Text>
              ))}
            </Stack>
          </Card>
        )}
        {saveError && <ErrorMessage>{saveError}</ErrorMessage>}

        {!viewingTrash && (
          <Flex gap={2} wrap="wrap">
            <Box flex={1} style={{minWidth: 200}}>
              <TextInput
                fontSize={1}
                placeholder="Search by filename…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.currentTarget.value)}
                clearButton={searchInput.length > 0}
                onClear={() => setSearchInput('')}
              />
            </Box>
            <Select
              fontSize={1}
              style={{width: 180}}
              value={sortOption}
              onChange={(e) => setSortOption(e.currentTarget.value as SortOption)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Flex>
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
            <Grid columns={[2, 3, 4, 5, 6, 7]} gap={3}>
              {(visibleAssets ?? []).map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  selectMode={selectMode}
                  selected={selectedIds.has(asset._id)}
                  onToggleSelected={() => toggleSelected(asset._id)}
                  onOpenLightbox={() => setLightboxAssetId(asset._id)}
                  draftValue={drafts[asset._id] ?? asset.defaultAlt ?? ''}
                  onDraftChange={(value) => setDrafts((prev) => ({...prev, [asset._id]: value}))}
                  saving={savingId === asset._id}
                  saveDisabled={drafts[asset._id] === undefined || drafts[asset._id] === (asset.defaultAlt ?? '')}
                  onSave={() => saveAlt(asset._id, drafts[asset._id] ?? '')}
                  onReplace={() => openReplaceDialog(asset)}
                />
              ))}
            </Grid>
            {!searchTerm && hasMore && (
              <>
                <div ref={loadMoreSentinelRef} style={{height: 1}} />
                {loadingMore && (
                  <Flex justify="center" padding={3}>
                    <Spinner muted />
                  </Flex>
                )}
              </>
            )}
          </>
        )}
      </Stack>

      {replacingAsset && (
        <Dialog
          id="replace-image"
          header="Replace image"
          onClose={replaceStep === 'working' ? undefined : closeReplaceDialog}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Flex align="center" gap={3}>
                <img
                  src={`${replacingAsset.url}?w=100&h=100&fit=crop`}
                  alt=""
                  style={{width: 64, height: 64, borderRadius: 4, objectFit: 'cover', flexShrink: 0}}
                />
                <Stack space={2} style={{flex: 1, minWidth: 0}}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {replacingAsset.originalFilename ?? 'Untitled'}
                  </Text>
                  <Text size={0} muted>
                    {replacingAsset.usedBy.length > 0
                      ? `Used in ${replacingAsset.usedBy.length} post${replacingAsset.usedBy.length === 1 ? '' : 's'}`
                      : 'Not currently used anywhere'}
                  </Text>
                </Stack>
              </Flex>

              {replaceError && <ErrorMessage>{replaceError}</ErrorMessage>}

              {replaceStep === 'pick' && (
                <Stack space={3}>
                  <Text size={1} muted>
                    Sanity can&rsquo;t overwrite a photo&rsquo;s file in place, but this uploads a new one and
                    swaps it in everywhere the old one is used — main image, body galleries, anywhere else it
                    appears — so nothing needs re-placing by hand. The old photo moves to Trash afterward
                    (recoverable for 30 days), and its alt text carries over automatically.
                  </Text>
                  <Button
                    text={replaceBusy ? 'Uploading…' : 'Choose new photo'}
                    tone="primary"
                    icon={SyncIcon}
                    loading={replaceBusy}
                    disabled={replaceBusy}
                    onClick={() => replaceFileInputRef.current?.click()}
                  />
                </Stack>
              )}

              {(replaceStep === 'confirm' || replaceStep === 'working') && replaceNewAsset && replaceChanges && (
                <Stack space={3}>
                  <Flex align="center" gap={3}>
                    <img
                      src={`${replacingAsset.url}?w=80&h=80&fit=crop`}
                      alt=""
                      style={{width: 48, height: 48, borderRadius: 4, objectFit: 'cover'}}
                    />
                    <Text size={1} muted>
                      →
                    </Text>
                    <img
                      src={`${replaceNewAsset.url}?w=80&h=80&fit=crop`}
                      alt=""
                      style={{width: 48, height: 48, borderRadius: 4, objectFit: 'cover'}}
                    />
                  </Flex>
                  {replaceCompression && (
                    <Text size={0} muted>
                      Compressed on the way in, same as tinypng.com would: {formatBytes(replaceCompression.originalSize)} →{' '}
                      {formatBytes(replaceCompression.compressedSize)}
                    </Text>
                  )}
                  {replaceChanges.length === 0 ? (
                    <Text size={1}>
                      This photo isn&rsquo;t currently used anywhere, so replacing it will just swap it in the
                      library — nothing else needs to change.
                    </Text>
                  ) : (
                    <Stack space={2}>
                      <Text size={1}>
                        This will update {new Set(replaceChanges.map((c) => c.documentId)).size} document
                        {new Set(replaceChanges.map((c) => c.documentId)).size === 1 ? '' : 's'}:
                      </Text>
                      {[...new Map(replaceChanges.map((c) => [c.documentId, c.documentTitle])).values()]
                        .slice(0, 8)
                        .map((title, i) => (
                          <Text key={i} size={0} muted>
                            · {title}
                          </Text>
                        ))}
                      {new Set(replaceChanges.map((c) => c.documentId)).size > 8 && (
                        <Text size={0} muted>
                          +{new Set(replaceChanges.map((c) => c.documentId)).size - 8} more
                        </Text>
                      )}
                    </Stack>
                  )}
                  <Flex gap={2}>
                    <Button
                      text={replaceStep === 'working' ? 'Replacing…' : 'Replace'}
                      tone="primary"
                      loading={replaceStep === 'working'}
                      disabled={replaceStep === 'working'}
                      onClick={confirmReplace}
                    />
                    <Button text="Cancel" mode="ghost" disabled={replaceStep === 'working'} onClick={closeReplaceDialog} />
                  </Flex>
                </Stack>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}

      {compressLibraryOpen && (
        <Dialog
          id="compress-library"
          header="Compress existing photos"
          onClose={libraryScanPhase === 'scanning' || libraryScanPhase === 'working' ? undefined : closeCompressLibrary}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              {libraryError && <ErrorMessage>{libraryError}</ErrorMessage>}

              {libraryScanPhase === 'idle' && (
                <Stack space={3}>
                  <Text size={1} muted>
                    Automatic compression only applies to new uploads — this checks every photo already in
                    the library (300KB or larger; anything smaller is skipped) and offers to shrink whichever
                    ones would actually benefit, the same way &ldquo;Replace image&rdquo; does one photo at a
                    time, just for all of them at once. A confirm step shows exactly what would change before
                    anything happens.
                  </Text>
                  <Button text="Scan library" tone="primary" icon={DocumentZipIcon} onClick={scanLibraryForCompression} />
                </Stack>
              )}

              {libraryScanPhase === 'scanning' && (
                <Flex align="center" gap={3}>
                  <Spinner />
                  <Text size={1}>
                    Checking {libraryScanProgress?.done ?? 0}/{libraryScanProgress?.total ?? 0}…
                  </Text>
                </Flex>
              )}

              {(libraryScanPhase === 'preview' || libraryScanPhase === 'working') && libraryCandidates && (
                <Stack space={3}>
                  {libraryCandidates.length === 0 ? (
                    <Text size={1}>
                      Nothing to do — every photo in the library is either already small or wouldn&rsquo;t
                      shrink meaningfully by recompressing.
                      {librarySkippedCount > 0 && ` (${librarySkippedCount} checked, none needed it.)`}
                    </Text>
                  ) : (
                    <>
                      <Text size={1}>
                        {libraryCandidates.length} photo{libraryCandidates.length === 1 ? '' : 's'} can be
                        compressed, saving{' '}
                        {formatBytes(libraryCandidates.reduce((sum, c) => sum + (c.originalSize - c.compressedSize), 0))}
                        {librarySkippedCount > 0 &&
                          ` (${librarySkippedCount} other${librarySkippedCount === 1 ? '' : 's'} already small enough, left alone)`}
                        . Same safety net as Replace image: alt text carries over, originals go to Trash
                        (recoverable for 30 days), and this shows up in Bulk Operations &rsquo; History with a
                        real Undo.
                      </Text>
                      <Box style={{maxHeight: 240, overflowY: 'auto'}}>
                        <Stack space={1}>
                          {libraryCandidates.map((c) => (
                            <Text key={c.assetId} size={0} muted textOverflow="ellipsis">
                              · {c.originalFilename ?? 'Untitled'}: {formatBytes(c.originalSize)} →{' '}
                              {formatBytes(c.compressedSize)}
                            </Text>
                          ))}
                        </Stack>
                      </Box>
                      {libraryScanPhase === 'working' ? (
                        <Flex align="center" gap={3}>
                          <Spinner />
                          <Text size={1}>
                            Compressing {libraryWorkProgress?.done ?? 0}/{libraryWorkProgress?.total ?? 0}…
                          </Text>
                        </Flex>
                      ) : (
                        <Flex gap={2}>
                          <Button text="Compress all" tone="primary" onClick={confirmCompressLibrary} />
                          <Button text="Cancel" mode="ghost" onClick={closeCompressLibrary} />
                        </Flex>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {libraryScanPhase === 'done' && libraryDoneSummary && (
                <Stack space={3}>
                  <Text size={1}>
                    Done — compressed {libraryDoneSummary.imageCount} photo
                    {libraryDoneSummary.imageCount === 1 ? '' : 's'}, saving{' '}
                    {formatBytes(libraryDoneSummary.savedBytes)}
                    {libraryDoneSummary.docCount > 0 &&
                      ` across ${libraryDoneSummary.docCount} document${libraryDoneSummary.docCount === 1 ? '' : 's'}`}
                    .
                  </Text>
                  <Button text="Done" mode="ghost" onClick={closeCompressLibrary} />
                </Stack>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}

      {lightboxAsset && (
        <Dialog
          id="asset-lightbox"
          header={lightboxAsset.originalFilename ?? 'Untitled'}
          onClose={() => setLightboxAssetId(null)}
          width={3}
        >
          <Box padding={4}>
            <Stack space={4}>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {lightboxIndex > 0 && (
                  <Button
                    aria-label="Previous image"
                    icon={ChevronLeftIcon}
                    mode="bleed"
                    style={{position: 'absolute', left: 0, zIndex: 1}}
                    onClick={showPrev}
                  />
                )}
                <img
                  // A width transform on an animated GIF hangs Sanity's CDN
                  // outright (confirmed directly -- the request just never
                  // resolves, not a quick failure), so GIFs are served
                  // untouched here, same "never transform a GIF" rule
                  // already applied everywhere else on the site.
                  src={isAnimatedGifUrl(lightboxAsset.url) ? lightboxAsset.url : `${lightboxAsset.url}?w=1600`}
                  alt={lightboxAsset.originalFilename ?? 'Untitled image'}
                  style={{maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', display: 'block'}}
                />
                {visibleAssets && lightboxIndex < visibleAssets.length - 1 && (
                  <Button
                    aria-label="Next image"
                    icon={ChevronRightIcon}
                    mode="bleed"
                    style={{position: 'absolute', right: 0, zIndex: 1}}
                    onClick={showNext}
                  />
                )}
              </div>
              <Stack space={2}>
                <Text size={1}>{formatBytes(lightboxAsset.size)}</Text>
                {lightboxAsset.usedBy.length > 0 ? (
                  <Stack space={1}>
                    <Badge tone="positive" fontSize={0}>
                      Used in {lightboxAsset.usedBy.length} post{lightboxAsset.usedBy.length === 1 ? '' : 's'}
                    </Badge>
                    {lightboxAsset.usedBy.map((post) => (
                      <Text key={post.slug ?? post.title} size={0} muted>
                        · {post.title}
                      </Text>
                    ))}
                  </Stack>
                ) : (
                  <Badge tone="caution" fontSize={0}>
                    Not used
                  </Badge>
                )}
              </Stack>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Box>
  )
}

function AssetCard({
  asset,
  selectMode,
  selected,
  onToggleSelected,
  onOpenLightbox,
  draftValue,
  onDraftChange,
  saving,
  saveDisabled,
  onSave,
  onReplace,
}: {
  asset: ImageAsset
  selectMode: boolean
  selected: boolean
  onToggleSelected: () => void
  onOpenLightbox: () => void
  draftValue: string
  onDraftChange: (value: string) => void
  saving: boolean
  saveDisabled: boolean
  onSave: () => void
  onReplace: () => void
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
            onClick={selectMode ? undefined : onOpenLightbox}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              cursor: selectMode ? undefined : 'zoom-in',
            }}
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
            <Button text="Replace" icon={SyncIcon} mode="ghost" fontSize={0} padding={2} onClick={onReplace} />
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
