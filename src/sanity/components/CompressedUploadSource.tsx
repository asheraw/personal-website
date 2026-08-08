import {useRef, useState} from 'react'
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

  if (props.action && props.action !== 'upload') return null

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
