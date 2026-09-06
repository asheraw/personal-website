import {useEffect, useState} from 'react'
import {set, unset, useClient} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {Box, Button, Card, Flex, Select, Stack, Text, TextInput} from '@sanity/ui'
import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {urlFor} from '../lib/image'

type LinkItem = {
  _key: string
  _type: 'linkItem'
  image?: {_type: 'image'; asset?: {_type: 'reference'; _ref: string}; alt?: string}
  linkType: 'post' | 'external'
  post?: {_type: 'reference'; _ref: string}
  externalUrl?: string
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

// A 3-column preview grid matching the live /link page almost exactly --
// same aspect-[3/4] tiles, same title overlay -- instead of Sanity's
// built-in `layout: 'grid'` array option, which auto-fits tiles by panel
// width (however many ~100px tiles happen to fit, not a fixed count) and
// so can't be pinned to a real "3, like the live page" match (Asher's own
// ask, 2026-09-06). Owns the whole array (add/remove/reorder/edit) the
// same way DataGridInput.tsx does, rather than a lighter customization --
// Sanity doesn't offer a documented way to keep its own default per-item
// edit dialog while only swapping the grid's own column count.
export function LinkPageItemsInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange} = props
  const items = (value ?? []) as LinkItem[]
  const client = useClient({apiVersion: '2026-07-22'})

  const [postTitles, setPostTitles] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [postSearch, setPostSearch] = useState('')
  const [postResults, setPostResults] = useState<{_id: string; title: string}[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const refIds = items.filter((i) => i.linkType === 'post' && i.post?._ref).map((i) => i.post!._ref)
    if (refIds.length === 0) return
    client
      .fetch<{_id: string; title: string}[]>(`*[_id in $ids]{_id, title}`, {ids: refIds})
      .then((rows) => setPostTitles(Object.fromEntries(rows.map((r) => [r._id, r.title]))))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the set of referenced post ids actually changes
  }, [JSON.stringify(items.map((i) => i.post?._ref))])

  useEffect(() => {
    const q = postSearch.trim()
    if (!q) {
      setPostResults([])
      return
    }
    const handle = setTimeout(() => {
      client
        .fetch<{_id: string; title: string}[]>(`*[_type == "post" && title match $q] | order(title asc) [0...8]{_id, title}`, {
          q: `${q}*`,
        })
        .then(setPostResults)
    }, 250)
    return () => clearTimeout(handle)
  }, [postSearch, client])

  function patchItems(next: LinkItem[]) {
    onChange(set(next))
  }

  function updateItem(key: string, patchFn: (item: LinkItem) => LinkItem) {
    patchItems(items.map((i) => (i._key === key ? patchFn(i) : i)))
  }

  function addItem() {
    const key = randomKey()
    patchItems([...items, {_key: key, _type: 'linkItem', linkType: 'post'}])
    setEditingKey(key)
  }

  function removeItem(key: string) {
    patchItems(items.filter((i) => i._key !== key))
    if (editingKey === key) setEditingKey(null)
  }

  function moveItem(fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    const fromIdx = items.findIndex((i) => i._key === fromKey)
    const toIdx = items.findIndex((i) => i._key === toKey)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    patchItems(next)
  }

  async function handleImageUpload(key: string, file: File) {
    setUploading(true)
    try {
      const uploaded = await client.assets.upload('image', file, {filename: file.name})
      updateItem(key, (i) => ({...i, image: {_type: 'image', asset: {_type: 'reference', _ref: uploaded._id}, alt: i.image?.alt}}))
    } finally {
      setUploading(false)
    }
  }

  function tileLabel(item: LinkItem): string {
    if (item.linkType === 'external') return item.externalUrl || 'No URL set'
    return (item.post?._ref && postTitles[item.post._ref]) || 'No post picked'
  }

  const editing = items.find((i) => i._key === editingKey) ?? null

  return (
    <Stack space={3}>
      <Button icon={AddIcon} text="Add card" mode="ghost" fontSize={1} onClick={addItem} />

      {items.length === 0 ? (
        <Card padding={4} radius={2} border tone="transparent">
          <Text size={1} muted>
            No cards yet -- add one to start.
          </Text>
        </Card>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2}}>
          {items.map((item) => (
            <div
              key={item._key}
              draggable
              onDragStart={() => setDragKey(item._key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragKey) moveItem(dragKey, item._key)
                setDragKey(null)
              }}
              onClick={() => setEditingKey(item._key === editingKey ? null : item._key)}
              style={{
                position: 'relative',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'var(--card-muted-bg-color, rgba(150,150,150,0.12))',
                outline: editingKey === item._key ? '2px solid var(--card-focus-ring-color, #2276fc)' : 'none',
              }}
              title="Click to edit, drag to reorder"
            >
              {item.image?.asset?._ref && (
                <img
                  src={urlFor(item.image).width(300).height(400).fit('crop').url()}
                  alt=""
                  style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  insetInline: 0,
                  bottom: 0,
                  padding: '16px 6px 6px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
                }}
              >
                <Text size={0} style={{color: 'white', fontWeight: 600, lineHeight: 1.2}}>
                  {tileLabel(item)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Card padding={3} radius={2} border tone="transparent">
          <Stack space={3}>
            <Flex justify="space-between" align="center">
              <Text size={1} weight="semibold">
                Edit card
              </Text>
              <Flex gap={2}>
                <Button icon={TrashIcon} text="Delete" mode="ghost" tone="critical" fontSize={1} onClick={() => removeItem(editing._key)} />
                <Button text="Done" mode="ghost" fontSize={1} onClick={() => setEditingKey(null)} />
              </Flex>
            </Flex>

            <Stack space={2}>
              <Text size={1} muted>
                Image
              </Text>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(editing._key, file)
                  e.target.value = ''
                }}
              />
              <TextInput
                fontSize={1}
                placeholder="Alt text (optional)"
                value={editing.image?.alt ?? ''}
                onChange={(e) => {
                  const alt = e.currentTarget.value
                  updateItem(editing._key, (i) => ({...i, image: i.image ? {...i.image, alt} : i.image}))
                }}
              />
            </Stack>

            <Stack space={2}>
              <Text size={1} muted>
                Links to
              </Text>
              <Select
                fontSize={1}
                value={editing.linkType}
                onChange={(e) => {
                  const linkType = e.currentTarget.value as 'post' | 'external'
                  updateItem(editing._key, (i) => ({...i, linkType}))
                }}
              >
                <option value="post">A post on this site</option>
                <option value="external">An external URL</option>
              </Select>
            </Stack>

            {editing.linkType === 'post' ? (
              <Stack space={2}>
                <Text size={1} muted>
                  Post{editing.post?._ref && postTitles[editing.post._ref] ? `: ${postTitles[editing.post._ref]}` : ''}
                </Text>
                <TextInput
                  fontSize={1}
                  placeholder="Search posts by title…"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.currentTarget.value)}
                />
                {postResults.length > 0 && (
                  <Stack space={1}>
                    {postResults.map((p) => (
                      <Button
                        key={p._id}
                        text={p.title}
                        mode="ghost"
                        fontSize={1}
                        style={{textAlign: 'left', justifyContent: 'flex-start'}}
                        onClick={() => {
                          updateItem(editing._key, (i) => ({...i, post: {_type: 'reference', _ref: p._id}}))
                          setPostTitles((prev) => ({...prev, [p._id]: p.title}))
                          setPostSearch('')
                          setPostResults([])
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            ) : (
              <Stack space={2}>
                <Text size={1} muted>
                  External URL
                </Text>
                <TextInput
                  fontSize={1}
                  placeholder="https://…"
                  value={editing.externalUrl ?? ''}
                  onChange={(e) => {
                    const externalUrl = e.currentTarget.value
                    updateItem(editing._key, (i) => (externalUrl ? {...i, externalUrl} : {...i, externalUrl: undefined}))
                  }}
                />
              </Stack>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
