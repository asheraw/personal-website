import {useEffect, useState} from 'react'
import {set} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {Box, Button, Card, Flex, Grid, Stack, Text, TextInput} from '@sanity/ui'
import {ErrorMessage} from './ErrorMessage'

type GifResult = {id: string; title: string; thumbUrl: string; url: string; originalUrl: string}
type GifValue = {url?: string; thumbUrl?: string; title?: string}

const SEARCH_DEBOUNCE_MS = 350

// Replaces the externalGif object's whole edit form -- Asher's own ask
// (2026-08-29): a standalone GIF block in the body, alongside Image/
// Divider/Callout in the same toolbar, that hotlinks straight to Giphy's
// own URL instead of downloading and re-uploading into Sanity (what the
// old "Insert GIF" image-field asset source did, now removed --
// GiphyAssetSource.tsx and /api/gif-upload were deleted with it). Reuses
// the exact same /api/gif-search proxy the deleted asset source and the
// public comment form both already share -- no second Giphy integration.
//
// Two states: search-and-pick (shown until something's chosen, or after
// "Choose a different GIF"), and a small confirmation preview once
// `url` is set. Picking just patches url/thumbUrl/title directly via
// `onChange` -- no upload, no /api/gif-upload equivalent, since the whole
// point is skipping Sanity's asset storage.
export function GifPickerInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const gifValue = (value ?? {}) as GifValue
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [changing, setChanging] = useState(false)

  const showPicker = !gifValue.url || changing

  useEffect(() => {
    if (!showPicker) return
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
  }, [query, showPicker])

  function pickGif(gif: GifResult) {
    onChange(set({url: gif.originalUrl, thumbUrl: gif.thumbUrl, title: gif.title}))
    setChanging(false)
  }

  if (!showPicker) {
    return (
      <Stack space={3}>
        <Card radius={2} border overflow="hidden" style={{maxWidth: 240}}>
          {/* eslint-disable-next-line @next/next/no-img-element -- external Giphy hotlink, not a Next page */}
          <img
            src={gifValue.thumbUrl || gifValue.url}
            alt={gifValue.title || ''}
            style={{width: '100%', display: 'block'}}
          />
        </Card>
        <Text size={1} muted>
          Hotlinked straight to Giphy -- nothing was uploaded to Sanity. If Giphy ever takes this GIF down,
          it&rsquo;ll stop showing here too.
        </Text>
        <Flex>
          <Button text="Choose a different GIF" mode="ghost" onClick={() => setChanging(true)} />
        </Flex>
      </Stack>
    )
  }

  return (
    <Stack space={4}>
      <TextInput
        fontSize={1}
        placeholder="Search Giphy…"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {loadError && <ErrorMessage>Couldn&rsquo;t load GIFs — try again.</ErrorMessage>}
      <Box style={{maxHeight: 400, overflowY: 'auto'}}>
        <Grid columns={3} gap={2}>
          {gifs === null && !loadError && (
            <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
              Loading…
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
      <Flex align="center" justify="space-between">
        <Text size={0} muted>
          Powered by GIPHY
        </Text>
        {gifValue.url && <Button text="Cancel" mode="ghost" onClick={() => setChanging(false)} />}
      </Flex>
    </Stack>
  )
}
