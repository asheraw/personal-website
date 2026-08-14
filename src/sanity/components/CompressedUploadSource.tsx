import {useEffect, useRef, useState} from 'react'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import type {AssetSource, AssetSourceComponentProps} from '@sanity/types'
import {DocumentZipIcon} from '@sanity/icons/DocumentZip'
import {compressImageFile} from '../../lib/imageCompress'

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

// A second, additional entry in every image field's "add image" menu,
// alongside Studio's own untouched default "Upload" -- deliberately NOT a
// replacement for it. Media library's upload/replace flows already
// compress automatically by default (see imageCompress.ts); doing the same
// for uploads made directly inside a post would mean overriding Studio's
// built-in upload mechanism for every image field site-wide, which isn't
// something that can be interactively verified in an environment without
// an authenticated Studio session -- too risky for the editor Asher uses
// daily. This instead sits next to the default, unchanged option: pick it
// when a squeeze is wanted, same behavior Media library's own uploads get,
// with the actual before/after size shown once it's done.
function CompressedUploadSourceComponent(props: AssetSourceComponentProps) {
  const client = useClient({apiVersion: '2026-07-22'})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [result, setResult] = useState<{originalSize: number; compressedSize: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Opens the OS file picker immediately on mount, instead of making
  // picking "Upload (compressed)" from the menu just the first of two
  // taps before anything actually happens -- Asher's own ask, since this
  // panel (like every asset source) renders wherever Studio's own image
  // field decides to put an open source's UI, sometimes well below the
  // fold on a phone, so reaching a manual "Choose photo" button meant
  // scrolling to find it first. The drag zone and button stay as a
  // fallback below for whenever the browser doesn't allow a file input
  // to be opened programmatically (or the reader dismisses the native
  // picker without choosing anything) -- this only ever fires once, on
  // the very first mount, never re-opening the OS picker on its own
  // after an upload error or a later re-render. Placed before the
  // `action !== 'upload'` early return below, not after -- a hook can
  // never come after a conditional return, or it stops being called in
  // the same order every render.
  useEffect(() => {
    fileInputRef.current?.click()
  }, [])

  // Sanity lists every registered image source under both the Upload
  // *and* Select buttons unconditionally -- confirmed by reading
  // @sanity/types' own AssetSource definition, not assumed: there's no
  // field on it for "upload only," so this shows up as a menu option
  // under Select too even though it only makes sense for a brand-new
  // file. Can't remove the menu item itself, but the blank dead-end this
  // used to render when picked from Select (a bare `return null`, no
  // explanation) is fixable -- Asher flagged it as exactly the kind of
  // confusing "nothing happened" this whole panel exists to avoid.
  if (props.action && props.action !== 'upload') {
    return (
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1}>&ldquo;Upload (compressed)&rdquo; only applies to a brand-new file — there&rsquo;s nothing to select here.</Text>
          <Text size={1} muted>
            Everything already in the Media library was squeezed on the way in already (same automatic
            compression, just done once, up front) — close this and pick &ldquo;default&rdquo; instead to choose
            from it.
          </Text>
          <Flex justify="flex-end">
            <Button text="Close" mode="ghost" onClick={props.onClose} />
          </Flex>
        </Stack>
      </Box>
    )
  }

  async function handleFile(file: File) {
    setStatus('working')
    setError(null)
    setResult(null)
    try {
      const {file: toUpload, compressed, originalSize, compressedSize} = await compressImageFile(file)
      if (compressed) setResult({originalSize, compressedSize})
      const uploaded = await client.assets.upload('image', toUpload, {filename: toUpload.name})
      props.onSelect([{kind: 'assetDocumentId', value: uploaded._id}])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong uploading that file.')
      setStatus('error')
    }
  }

  return (
    <Box padding={4}>
      <input
        ref={fileInputRef}
        type="file"
        accept={props.accept || 'image/*'}
        style={{display: 'none'}}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <Stack space={4}>
        <Text size={1} muted>
          Same automatic squeeze Media library&rsquo;s own uploads get — large photos are resized and
          re-compressed on the way in, shown here once it&rsquo;s done.
        </Text>
        {error && (
          <Card padding={3} radius={2} tone="critical" border>
            <Text size={1}>{error}</Text>
          </Card>
        )}
        {status === 'working' ? (
          <Flex align="center" justify="center" gap={3} padding={4}>
            <Spinner />
            <Text size={1}>Compressing and uploading…</Text>
          </Flex>
        ) : (
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
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
          >
            <Stack space={3}>
              <Text size={1} align="center" muted>
                Drag a photo here, or
              </Text>
              <Flex justify="center">
                <Button
                  text={status === 'error' ? 'Try again' : 'Choose photo'}
                  tone="primary"
                  onClick={() => fileInputRef.current?.click()}
                />
              </Flex>
            </Stack>
          </Card>
        )}
        {result && (
          <Text size={0} muted>
            Compressed: {formatBytes(result.originalSize)} → {formatBytes(result.compressedSize)}
          </Text>
        )}
        <Flex justify="flex-end">
          <Button text="Cancel" mode="ghost" onClick={props.onClose} />
        </Flex>
      </Stack>
    </Box>
  )
}

export const compressedUploadSource: AssetSource = {
  name: 'compressed-upload',
  title: 'Upload (compressed)',
  icon: DocumentZipIcon,
  component: CompressedUploadSourceComponent,
  uploadMode: 'component',
}
