import {useState} from 'react'
import {Badge, Box, Button, Card, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import JSZip from 'jszip'
import {buildMarkdownFile, type ExportPost} from '../../lib/exportMarkdown'
import {buildJsonFile} from '../../lib/exportJson'
import {buildHtmlFile} from '../../lib/exportHtml'
import {buildEpubBlob} from '../../lib/exportEpub'
import {downloadBlob} from '../../lib/downloadFile'
import {ALL_POSTS_EXPORT_QUERY} from '../lib/queries'

type Status = 'idle' | 'loading' | 'building' | 'done' | 'error'
type Format = 'markdown' | 'json' | 'html' | 'epub' | 'pdf'

const FORMAT_LABELS: Record<Format, string> = {
  markdown: 'Markdown (.md files, zipped)',
  json: 'JSON (.json files, zipped)',
  html: 'HTML (.html files, zipped)',
  epub: 'EPUB (one book, every post as a chapter)',
  pdf: 'PDF (one document, every post concatenated)',
}

// The "full collection" half of the spec's export tooling -- every
// published post, in whichever format is picked. Markdown/JSON/HTML each
// produce one file per post, zipped together; EPUB and PDF produce a
// single combined file instead (a book with every post as its own chapter,
// or a document with every post one after another) since neither format
// is naturally "many small files." Deliberately only exports *published*
// posts (the default query perspective already excludes drafts -- see
// RUNBOOK.md's note on this API version's perspective handling), since an
// export meant to leave the building shouldn't include work still
// mid-draft.
export function ExportTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [format, setFormat] = useState<Format>('markdown')
  const [status, setStatus] = useState<Status>('idle')
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')

  async function handleExportAll() {
    setStatus('loading')
    setError('')
    try {
      const posts = await client.fetch<ExportPost[]>(ALL_POSTS_EXPORT_QUERY)
      setCount(posts.length)
      setStatus('building')
      const date = new Date().toISOString().slice(0, 10)

      if (format === 'epub') {
        const blob = await buildEpubBlob(posts, {
          title: 'Asher Aw — Blog Archive',
          author: 'Asher Aw',
          identifier: 'asheraw-blog-archive',
        })
        downloadBlob(`asheraw-blog-archive-${date}.epub`, blob)
      } else if (format === 'pdf') {
        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({all: true}),
        })
        if (!res.ok) throw new Error('PDF export failed.')
        downloadBlob(`asheraw-blog-export-${date}.pdf`, await res.blob())
      } else {
        const zip = new JSZip()
        const usedNames = new Set<string>()
        for (const post of posts) {
          const {filename, content} =
            format === 'markdown' ? buildMarkdownFile(post) : format === 'json' ? buildJsonFile(post) : buildHtmlFile(post)
          // Two posts can't share a slug in this schema, but stay
          // defensive rather than silently letting one overwrite the
          // other in the zip.
          const safeName = usedNames.has(filename)
            ? `${filename.replace(/\.\w+$/, '')}-${post.publishedAt ?? ''}${filename.match(/\.\w+$/)?.[0] ?? ''}`
            : filename
          usedNames.add(safeName)
          zip.file(safeName, content)
        }
        const blob = await zip.generateAsync({type: 'blob'})
        downloadBlob(`asheraw-blog-export-${date}.zip`, blob)
      }
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
            Every published post, in a real, portable file — the &ldquo;no vendor lock-in&rdquo; escape
            hatch. Drafts aren&rsquo;t included; export a single post (including its own draft) from that
            post&rsquo;s own editor instead, via the &ldquo;Export…&rdquo; button.
          </Text>
        </Stack>

        <Card padding={4} radius={3} border>
          <Stack space={4}>
            <Text size={2} weight="semibold">
              Full archive
            </Text>
            <Stack space={2}>
              <Text size={1} weight="medium">
                Format
              </Text>
              <Select value={format} onChange={(e) => setFormat(e.currentTarget.value as Format)}>
                {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </Select>
            </Stack>
            <Text size={1} muted>
              Markdown/JSON/HTML link images to their existing Sanity URLs rather than bundling them in, so
              the zip stays small. EPUB actually downloads and bundles every image, since e-readers render
              offline. PDF links stay as clickable text (no live embeds), since a PDF is read the same way.
            </Text>
            <Flex align="center" gap={3}>
              <Button
                text={
                  status === 'loading'
                    ? 'Fetching posts…'
                    : status === 'building'
                      ? 'Building…'
                      : status === 'done'
                        ? 'Downloaded — export again'
                        : 'Download all posts'
                }
                tone="primary"
                disabled={status === 'loading' || status === 'building'}
                onClick={handleExportAll}
              />
              {(status === 'loading' || status === 'building') && <Spinner muted />}
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
