import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {useClient} from 'sanity'
import {Box, Button, Grid, Stack, Text} from '@sanity/ui'
import {DownloadIcon} from '@sanity/icons/Download'
import {buildMarkdownFile, type ExportPost} from '../../lib/exportMarkdown'
import {buildJsonFile} from '../../lib/exportJson'
import {buildHtmlFile} from '../../lib/exportHtml'
import {buildEpubBlob, epubFilename} from '../../lib/exportEpub'
import {downloadBlob, downloadTextFile} from '../../lib/downloadFile'
import {POST_EXPORT_BY_ID_QUERY} from '../lib/queries'

type Format = 'markdown' | 'json' | 'html' | 'epub' | 'pdf'

const FORMAT_LABELS: Record<Format, string> = {
  markdown: 'Markdown (.md)',
  json: 'JSON (.json)',
  html: 'HTML (.html)',
  epub: 'EPUB (.epub)',
  pdf: 'PDF (.pdf)',
}

// One post, any of five formats, downloaded straight from the document
// editor -- the "per post" half of the spec's export tooling, grown from a
// single "Export as Markdown" button (still the default/first option) into
// a small format-picker dialog once JSON/HTML/EPUB/PDF joined it, following
// the same dialog pattern categoryDeleteGuard.tsx already established for
// showing a document action its own custom UI. Refetches by the document's
// own _id (rather than trying to resolve refs from props.draft by hand) so
// every format goes through the exact same POST_EXPORT_PROJECTION the bulk
// "Export all posts" tool uses -- guarantees per-post and full-archive
// exports can never quietly render the same post differently.
// {perspective: 'raw'} is required specifically because this can run on an
// unpublished draft -- see RUNBOOK.md's "gotcha" on this API version's
// default query perspective silently excluding drafts.
export function createExportAction(): DocumentActionComponent {
  const ExportAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const client = useClient({apiVersion: '2026-07-22'})
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState<Format | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    async function handleExport(format: Format) {
      setBusy(format)
      setErrorMsg('')
      try {
        const id = props.draft?._id ?? props.published?._id ?? props.id
        const post = await client.fetch<ExportPost | null>(POST_EXPORT_BY_ID_QUERY, {id}, {perspective: 'raw'})
        if (!post) throw new Error('Could not load this post for export.')

        if (format === 'markdown') {
          const {filename, content} = buildMarkdownFile(post)
          downloadTextFile(filename, content, 'text/markdown')
        } else if (format === 'json') {
          const {filename, content} = buildJsonFile(post)
          downloadTextFile(filename, content, 'application/json')
        } else if (format === 'html') {
          const {filename, content} = buildHtmlFile(post)
          downloadTextFile(filename, content, 'text/html')
        } else if (format === 'epub') {
          const blob = await buildEpubBlob([post], {
            title: post.title,
            author: post.author ?? 'Asher Aw',
            identifier: `asheraw-${post.slug}`,
          })
          downloadBlob(epubFilename(post.slug), blob)
        } else {
          const res = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({postId: id}),
          })
          if (!res.ok) throw new Error('PDF export failed.')
          downloadBlob(`${post.slug}.pdf`, await res.blob())
        }
        setBusy(null)
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Something went wrong.')
        setBusy(null)
      }
    }

    return {
      label: 'Export…',
      icon: DownloadIcon,
      onHandle: () => setOpen(true),
      dialog: open
        ? {
            type: 'dialog',
            header: 'Export this post',
            onClose: () => setOpen(false),
            content: (
              <Box padding={4}>
                <Stack space={4}>
                  <Text size={1} muted>
                    Downloads this post (including its own unpublished draft, if it has one).
                  </Text>
                  <Grid columns={2} gap={2}>
                    {(Object.keys(FORMAT_LABELS) as Format[]).map((format) => (
                      <Button
                        key={format}
                        text={busy === format ? 'Exporting…' : FORMAT_LABELS[format]}
                        mode="ghost"
                        tone={format === 'markdown' ? 'primary' : 'default'}
                        disabled={busy !== null}
                        onClick={() => handleExport(format)}
                      />
                    ))}
                  </Grid>
                  {errorMsg && <Text tone="critical">{errorMsg}</Text>}
                </Stack>
              </Box>
            ),
          }
        : null,
    }
  }

  return ExportAction
}
