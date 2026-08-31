import {useEffect, useState} from 'react'
import {set, unset} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {Box, Button, Card, Flex, Grid, Select, Stack, Text, TextInput} from '@sanity/ui'
import {ErrorMessage} from './ErrorMessage'

type GifResult = {id: string; title: string; thumbUrl: string; url: string; originalUrl: string}
type GifValue = {url?: string; thumbUrl?: string; title?: string; displaySize?: string; float?: string; caption?: string}
type SearchResponse = {gifs?: GifResult[]; hasMore?: boolean; nextOffset?: number}

const DISPLAY_SIZES: {value: string; label: string}[] = [
  {value: 'small', label: 'Small'},
  {value: 'medium', label: 'Medium'},
  {value: 'original', label: 'Original (fills the column)'},
  {value: 'wide', label: 'Wide (breaks out of the column on desktop)'},
]

// Same three options as Image's own float field (blockContentType.ts),
// only ever relevant for a small/medium GIF -- Asher's ask (2026-08-31),
// same reasoning as the photo version: Wide/Original already fill or
// exceed the column, nothing left to wrap text around.
const FLOAT_OPTIONS: {value: string; label: string}[] = [
  {value: 'none', label: 'No (default)'},
  {value: 'left', label: 'Float left (text wraps on the right)'},
  {value: 'right', label: 'Float right (text wraps on the left)'},
]

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
// "Choose a different GIF"), and a small confirmation preview once `url`
// is set. Picking patches url/thumbUrl/title directly via `onChange` -- no
// upload, no /api/gif-upload equivalent, since the whole point is skipping
// Sanity's asset storage.
export function GifPickerInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const gifValue = (value ?? {}) as GifValue
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'loadingMore' | 'done' | 'error'>('idle')
  const [changing, setChanging] = useState(false)

  const showPicker = !gifValue.url || changing
  const trimmedQuery = query.trim()

  useEffect(() => {
    if (!showPicker) return
    // Don't hit Giphy at all until there's something to actually search
    // for -- Asher's own ask, to cut the API call this used to fire the
    // moment the panel opened (pre-loading trending GIFs, same as the
    // public comment form's picker still does on purpose there).
    if (!trimmedQuery) {
      setGifs([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    const timer = setTimeout(() => {
      fetch(`/api/gif-search?q=${encodeURIComponent(trimmedQuery)}`)
        .then((res) => res.json())
        .then((data: SearchResponse) => {
          if (data.gifs) {
            setGifs(data.gifs)
            setHasMore(!!data.hasMore)
            setNextOffset(data.nextOffset ?? data.gifs.length)
            setStatus('done')
          } else {
            setStatus('error')
          }
        })
        .catch(() => setStatus('error'))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmedQuery, showPicker])

  function loadMore() {
    setStatus('loadingMore')
    fetch(`/api/gif-search?q=${encodeURIComponent(trimmedQuery)}&offset=${nextOffset}`)
      .then((res) => res.json())
      .then((data: SearchResponse) => {
        if (data.gifs) {
          setGifs((prev) => [...prev, ...data.gifs!])
          setHasMore(!!data.hasMore)
          setNextOffset(data.nextOffset ?? nextOffset + data.gifs.length)
          setStatus('done')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }

  function pickGif(gif: GifResult) {
    // Patched as three separate field-level paths, NOT a whole-object
    // `set({url, thumbUrl, title})` with no path -- that form replaces
    // this node's entire stored value, silently dropping `_type`/`_key`
    // since neither is among the fields being set, corrupting the block.
    // Confirmed the hard way: this was the actual cause of the error
    // Asher hit trying to insert a GIF the first time.
    onChange([set(gif.originalUrl, ['url']), set(gif.thumbUrl, ['thumbUrl']), set(gif.title, ['title'])])
    setChanging(false)
  }

  if (!showPicker) {
    return (
      <Stack space={4}>
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
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Display size
          </Text>
          <Select
            fontSize={1}
            value={gifValue.displaySize || 'original'}
            onChange={(e) => {
              const nextSize = e.currentTarget.value
              // Wide/Original have nothing left to wrap text around --
              // clear a previously-set float rather than leaving a stale
              // value that only matters again if size gets switched back.
              const patches = [set(nextSize, ['displaySize'])]
              if ((nextSize === 'wide' || nextSize === 'original') && gifValue.float && gifValue.float !== 'none') {
                patches.push(set('none', ['float']))
              }
              onChange(patches)
            }}
          >
            {DISPLAY_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Stack>
        {(gifValue.displaySize === 'small' || gifValue.displaySize === 'medium') && (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Wrap text around it
            </Text>
            <Select
              fontSize={1}
              value={gifValue.float || 'none'}
              onChange={(e) => onChange(set(e.currentTarget.value, ['float']))}
            >
              {FLOAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Stack>
        )}
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Caption (optional)
          </Text>
          <Text size={1} muted>
            Shown beneath the GIF. The description Giphy provides is used as alt text automatically and
            isn&rsquo;t editable here -- this is a separate, visible caption.
          </Text>
          <TextInput
            fontSize={1}
            value={gifValue.caption || ''}
            onChange={(e) => {
              const next = e.currentTarget.value
              onChange(next ? set(next, ['caption']) : unset(['caption']))
            }}
          />
        </Stack>
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
      {status === 'error' && <ErrorMessage>Couldn&rsquo;t load GIFs — try again.</ErrorMessage>}
      <Box style={{maxHeight: 400, overflowY: 'auto'}}>
        {!trimmedQuery && (
          <Text size={1} muted style={{textAlign: 'center', padding: 12}}>
            Search for a GIF above.
          </Text>
        )}
        {trimmedQuery && (
          <Stack space={3}>
            <Grid columns={3} gap={2}>
              {status === 'loading' && (
                <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
                  Loading…
                </Text>
              )}
              {status !== 'loading' && gifs.length === 0 && status !== 'error' && (
                <Text size={1} muted style={{gridColumn: 'span 3', textAlign: 'center', padding: 12}}>
                  No results.
                </Text>
              )}
              {gifs.map((gif) => (
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
            {hasMore && status !== 'loading' && (
              <Flex justify="center">
                <Button
                  text={status === 'loadingMore' ? 'Loading…' : 'Load more'}
                  mode="ghost"
                  disabled={status === 'loadingMore'}
                  onClick={loadMore}
                />
              </Flex>
            )}
          </Stack>
        )}
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
