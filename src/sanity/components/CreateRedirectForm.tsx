import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Button, Card, Checkbox, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'

type Option = {value: string; label: string; group: string}

const STATIC_PAGES: Option[] = [
  {value: '/', label: 'Home', group: 'Page'},
  {value: '/blog', label: 'Blog index', group: 'Page'},
  {value: '/connect', label: 'Connect', group: 'Page'},
  {value: '/privacy', label: 'Privacy policy', group: 'Page'},
]

// Inline "turn this 404 into a redirect" form, opened directly from a row in
// NotFoundHitsTool -- so fixing a broken link doesn't mean leaving that tool,
// finding the path again, and switching to Structure -> Redirects by hand.
// Search-as-you-type over existing posts/categories/authors/static pages
// (same TextInput + filtered dropdown pattern as TagsAutocompleteInput.tsx),
// since typing the destination path from memory is exactly the kind of typo
// that creates a *second* broken link.
export function CreateRedirectForm({
  fromPath,
  onCreated,
  onCancel,
}: {
  fromPath: string
  onCreated: () => void
  onCancel: () => void
}) {
  const client = useClient({apiVersion: '2026-07-22'})
  const [options, setOptions] = useState<Option[] | null>(null)
  const [query, setQuery] = useState('')
  const [to, setTo] = useState('')
  const [permanent, setPermanent] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    Promise.all([
      client.fetch<{title: string; slug: string}[]>(
        `*[_type == "post" && defined(slug.current)]{title, "slug": slug.current}`,
      ),
      client.fetch<{title: string; slug: string}[]>(
        `*[_type == "category" && defined(slug.current)]{title, "slug": slug.current}`,
      ),
      client.fetch<{name: string; slug: string}[]>(
        `*[_type == "author" && defined(slug.current)]{name, "slug": slug.current}`,
      ),
    ]).then(([posts, categories, authors]) => {
      setOptions([
        ...STATIC_PAGES,
        ...posts.map((p) => ({value: `/blog/${p.slug}`, label: p.title, group: 'Post'})),
        ...categories.map((c) => ({value: `/blog/category/${c.slug}`, label: c.title, group: 'Category'})),
        ...authors.map((a) => ({value: `/blog/author/${a.slug}`, label: a.name, group: 'Author'})),
      ])
    })
  }, [client])

  const suggestions =
    query && options
      ? options
          .filter(
            (o) =>
              o.label.toLowerCase().includes(query.toLowerCase()) ||
              o.value.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 8)
      : []

  function pick(option: Option) {
    setTo(option.value)
    setQuery(option.value)
    setFocused(false)
  }

  async function handleCreate() {
    if (!to.trim()) return
    setStatus('saving')
    setError('')
    try {
      const duplicate = await client.fetch<number>(`count(*[_type == "redirect" && from == $from])`, {
        from: fromPath,
      })
      if (duplicate > 0) {
        setError('A redirect from this path already exists.')
        setStatus('error')
        return
      }
      await client.create({_type: 'redirect', from: fromPath, to: to.trim(), permanent})
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <Card padding={3} radius={2} tone="primary" border>
      <Stack space={3}>
        <Text size={1} weight="medium">
          New redirect
        </Text>
        <Flex align="center" gap={2}>
          <Text size={1} muted style={{fontFamily: 'monospace', whiteSpace: 'nowrap'}}>
            {fromPath}
          </Text>
          <Text size={1} muted>
            →
          </Text>
          <Box style={{position: 'relative', flex: 1}}>
            <TextInput
              value={query || to}
              placeholder="Search posts/pages, or type a path or URL"
              onChange={(event) => {
                const val = event.currentTarget.value
                setQuery(val)
                setTo(val)
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
            />
            {focused && suggestions.length > 0 && (
              <Card
                radius={2}
                shadow={2}
                style={{position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4}}
              >
                <Stack space={0}>
                  {suggestions.map((option) => (
                    <Box
                      key={option.value}
                      as="button"
                      type="button"
                      padding={3}
                      onClick={() => pick(option)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                      }}
                    >
                      <Text size={1}>{option.label}</Text>
                      <Text size={0} muted style={{fontFamily: 'monospace'}}>
                        {option.group} · {option.value}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </Card>
            )}
            {focused && query && !options && (
              <Card
                padding={2}
                radius={2}
                shadow={2}
                style={{position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4}}
              >
                <Flex align="center" gap={2}>
                  <Spinner muted />
                  <Text size={1} muted>
                    Loading existing pages…
                  </Text>
                </Flex>
              </Card>
            )}
          </Box>
        </Flex>
        <Flex align="center" gap={2}>
          <Checkbox checked={permanent} onChange={() => setPermanent((p) => !p)} />
          <Text size={1}>Permanent (301)</Text>
        </Flex>
        {status === 'error' && (
          <Text size={1} tone="critical">
            {error}
          </Text>
        )}
        <Flex gap={2}>
          <Button
            text={status === 'saving' ? 'Creating…' : 'Create redirect'}
            tone="positive"
            fontSize={1}
            disabled={!to.trim() || status === 'saving'}
            onClick={handleCreate}
          />
          <Button text="Cancel" mode="ghost" fontSize={1} disabled={status === 'saving'} onClick={onCancel} />
        </Flex>
      </Stack>
    </Card>
  )
}
