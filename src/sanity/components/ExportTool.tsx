import {useState} from 'react'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import JSZip from 'jszip'
import {buildMarkdownFile, type ExportPost} from '../../lib/exportMarkdown'
import {ALL_POSTS_EXPORT_QUERY} from '../lib/queries'

type Status = 'idle' | 'loading' | 'zipping' | 'done' | 'error'

// The "full collection" half of the spec's Markdown export -- every
// published post as its own real .md file (frontmatter + body), zipped
// client-side. Deliberately only exports *published* posts (the default
// query perspective already excludes drafts -- see RUNBOOK.md's note on
// this API version's perspective handling), since an export meant to leave
// the building shouldn't include work still mid-draft.
export function ExportTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [status, setStatus] = useState<Status>('idle')
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')

  async function handleExportAll() {
    setStatus('loading')
    setError('')
    try {
      const posts = await client.fetch<ExportPost[]>(ALL_POSTS_EXPORT_QUERY)
      setCount(posts.length)
      setStatus('zipping')

      const zip = new JSZip()
      const usedNames = new Set<string>()
      for (const post of posts) {
        const {filename, content} = buildMarkdownFile(post)
        // Two posts can't share a slug in this schema, but stay defensive
        // rather than silently letting one overwrite the other in the zip.
        const safeName = usedNames.has(filename) ? `${filename.replace(/\.md$/, '')}-${post.publishedAt ?? ''}.md` : filename
        usedNames.add(safeName)
        zip.file(safeName, content)
      }

      const blob = await zip.generateAsync({type: 'blob'})
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `asheraw-blog-export-${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Export
          </Text>
          <Text size={1} muted>
            Every published post as a real, portable Markdown file — the &ldquo;no vendor lock-in&rdquo;
            escape hatch. Drafts aren&rsquo;t included; export a single post (including its own drafts) from
            that post&rsquo;s own editor instead, via the &ldquo;Export as Markdown&rdquo; button.
          </Text>
        </Stack>

        <Card padding={4} radius={3} border>
          <Stack space={4}>
            <Text size={2} weight="semibold">
              Full archive
            </Text>
            <Text size={1} muted>
              Downloads one .zip containing every published post as its own .md file — title, date, author,
              categories, tags, and excerpt as frontmatter, the post body converted to plain Markdown
              underneath. Images link to their existing Sanity URLs rather than being bundled in, so the zip
              stays small.
            </Text>
            <Flex align="center" gap={3}>
              <Button
                text={
                  status === 'loading'
                    ? 'Fetching posts…'
                    : status === 'zipping'
                      ? 'Building zip…'
                      : status === 'done'
                        ? 'Downloaded — export again'
                        : 'Download all posts as Markdown (.zip)'
                }
                tone="primary"
                disabled={status === 'loading' || status === 'zipping'}
                onClick={handleExportAll}
              />
              {(status === 'loading' || status === 'zipping') && <Spinner muted />}
              {status === 'done' && (
                <Badge tone="positive" fontSize={0}>
                  {count} posts
                </Badge>
              )}
            </Flex>
            {status === 'error' && <Text tone="critical">{error}</Text>}
          </Stack>
        </Card>
      </Stack>
    </Box>
  )
}
