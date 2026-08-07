import {useCallback, useEffect, useState} from 'react'
import {Card, Flex, Grid, Text, Stack, Badge, Spinner, Box, TextInput, Button} from '@sanity/ui'
import {useClient} from 'sanity'
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

export function MediaLibraryTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [assets, setAssets] = useState<ImageAsset[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(() => {
    return client.fetch<ImageAsset[]>(
      `*[_type == "sanity.imageAsset"] | order(_createdAt desc) {
        _id,
        url,
        originalFilename,
        size,
        "usedBy": *[_type == "post" && references(^._id)]{title, "slug": slug.current},
        "defaultAlt": *[_type == "imageAssetAlt" && assetId == ^._id][0].altText
      }`,
    )
  }, [client])

  useEffect(() => {
    let cancelled = false
    load()
      .then((result) => {
        if (!cancelled) setAssets(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [load])

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
      setAssets((prev) =>
        prev ? prev.map((a) => (a._id === assetId ? {...a, defaultAlt: trimmed || null} : a)) : prev,
      )
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

  if (error) {
    return (
      <Box padding={4}>
        <Text size={2} style={{color: 'var(--card-critical-fg-color, #c44)'}}>
          Couldn&apos;t load media library: {error}
        </Text>
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

  const unused = assets.filter((a) => a.usedBy.length === 0)

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Media library
          </Text>
          <Text size={1} muted>
            {`${assets.length} image${assets.length === 1 ? '' : 's'} uploaded · ${unused.length} not currently used in any post.`}{' '}
            Set a default alt text here to fill the gap automatically on any post that uses this image as its
            Featured Image and hasn&rsquo;t written its own — writing one for a specific post always takes
            priority over this.
          </Text>
        </Stack>
        {saveError && <ErrorMessage>Couldn&rsquo;t save that alt text: {saveError}</ErrorMessage>}
        <Grid columns={[2, 3, 4, 5]} gap={3}>
          {assets.map((asset) => (
            <Card key={asset._id} radius={2} shadow={1} padding={2} tone={asset.usedBy.length === 0 ? 'caution' : 'default'}>
              <Stack space={2}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'var(--card-code-bg-color, #f4f4f4)',
                  }}
                >
                  <img
                    src={`${asset.url}?w=200&h=200&fit=crop`}
                    alt={asset.originalFilename ?? 'Untitled image'}
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
                <Stack space={2}>
                  <TextInput
                    fontSize={0}
                    padding={2}
                    placeholder="Default alt text"
                    value={drafts[asset._id] ?? asset.defaultAlt ?? ''}
                    onChange={(event) =>
                      setDrafts((prev) => ({...prev, [asset._id]: event.currentTarget.value}))
                    }
                  />
                  <Button
                    text={savingId === asset._id ? 'Saving…' : 'Save'}
                    mode="ghost"
                    fontSize={0}
                    padding={2}
                    disabled={
                      savingId === asset._id ||
                      drafts[asset._id] === undefined ||
                      drafts[asset._id] === (asset.defaultAlt ?? '')
                    }
                    onClick={() => saveAlt(asset._id, drafts[asset._id] ?? '')}
                  />
                </Stack>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Box>
  )
}
