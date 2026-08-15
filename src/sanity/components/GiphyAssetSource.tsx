import {useEffect, useState} from 'react'
import {Box, Button, Card, Flex, Grid, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import type {AssetSource, AssetSourceComponentProps} from '@sanity/types'
import {ImagesIcon} from '@sanity/icons/Images'
import {ErrorMessage} from './ErrorMessage'

type GifResult = {id: string; title: string; thumbUrl: string; url: string; originalUrl: string}

const SEARCH_DEBOUNCE_MS = 350

// A third entry in every image field's "add image" menu, alongside
// Studio's default "Upload" and "Upload (compressed)" -- Asher's own gap,
// pointed out directly: the comment form and his own Studio replies could
// both search and insert a Giphy GIF, but there was no way to bring one
// into a post's actual content. Reuses the exact same /api/gif-search
// proxy those two already share (no second Giphy key), then hands the
// chosen GIF's URL to /api/gif-upload to actually download it and create a
// real Sanity image asset -- an image FIELD needs a real asset reference,
// not just an external URL, unlike a comment's plain gifUrl string field.
function GiphyAssetSourceComponent(props: AssetSourceComponentProps) {
  if (props.action && props.action !== 'upload' && props.action !== 'select') {
    return (
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1}>Search Giphy and pick a GIF below to insert it here.</Text>
          <Flex justify="flex-end">
            <Button text="Close" mode="ghost" onClick={props.onClose} />
          </Flex>
        </Stack>
      </Box>
    )
  }

  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [inserting, setInserting] = useState(false)
  const [insertError, setInsertError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(false)
    const timer = setTimeout(() => {
      fetch(`/api/gif-search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.gifs) setGifs(data.gifs)
          else setLoadError(true)
        })
        .catch(() => setLoadError(true))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  async function pickGif(gif: GifResult) {
    setInserting(true)
    setInsertError(null)
    try {
      const res = await fetch('/api/gif-upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({gifUrl: gif.originalUrl, title: gif.title}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      props.onSelect([{kind: 'assetDocumentId', value: data.assetId}])
    } catch (err) {
      setInsertError(err instanceof Error ? err.message : 'Something went wrong bringing that GIF in.')
      setInserting(false)
    }
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <TextInput
          fontSize={1}
          placeholder="Search Giphy…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          disabled={inserting}
        />
        {insertError && <ErrorMessage>{insertError}</ErrorMessage>}
        {inserting ? (
          <Flex align="center" justify="center" gap={3} padding={4}>
            <Spinner />
            <Text size={1}>Bringing that GIF in…</Text>
          </Flex>
        ) : (
          <Box style={{maxHeight: 400, overflowY: 'auto'}}>
            <Grid columns={3} gap={2}>
              {gifs === null && !loadError && (
                <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
                  Loading…
                </Text>
              )}
              {loadError && (
                <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
                  Couldn&rsquo;t load GIFs — try again.
                </Text>
              )}
              {gifs && gifs.length === 0 && (
                <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
                  No results.
                </Text>
              )}
              {gifs?.map((gif) => (
                <Card key={gif.id} radius={2} overflow="hidden">
                  <button
                    type="button"
                    onClick={() => pickGif(gif)}
                    style={{border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, width: '100%', aspectRatio: '1', display: 'block'}}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF thumbnail, not a Next page */}
                    <img src={gif.thumbUrl} alt={gif.title} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
                  </button>
                </Card>
              ))}
            </Grid>
          </Box>
        )}
        <Flex align="center" justify="space-between">
          <Text size={0} muted>
            Powered by GIPHY
          </Text>
          <Button text="Cancel" mode="ghost" onClick={props.onClose} disabled={inserting} />
        </Flex>
      </Stack>
    </Box>
  )
}

export const giphyAssetSource: AssetSource = {
  name: 'giphy-gif',
  title: 'Insert GIF (Giphy)',
  icon: ImagesIcon,
  component: GiphyAssetSourceComponent,
  uploadMode: 'component',
}
