import {useEffect, useState} from 'react'
import {Card, Flex, Grid, Text, Stack, Badge, Spinner, Box} from '@sanity/ui'
import {useClient} from 'sanity'

type UsedByPost = {title: string; slug: string | null}
type ImageAsset = {
  _id: string
  url: string
  originalFilename: string | null
  size: number
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
export function MediaLibraryTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [assets, setAssets] = useState<ImageAsset[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<ImageAsset[]>(
        `*[_type == "sanity.imageAsset"] | order(_createdAt desc) {
          _id,
          url,
          originalFilename,
          size,
          "usedBy": *[_type == "post" && references(^._id)]{title, "slug": slug.current}
        }`,
      )
      .then((result) => {
        if (!cancelled) setAssets(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [client])

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
            {assets.length} image{assets.length === 1 ? '' : 's'} uploaded · {unused.length} not currently used
            in any post
          </Text>
        </Stack>
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
              </Stack>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Box>
  )
}
