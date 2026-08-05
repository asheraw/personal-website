import {useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {useClient} from 'sanity'
import {DownloadIcon} from '@sanity/icons/Download'
import {buildMarkdownFile, type ExportPost} from '../../lib/exportMarkdown'
import {POST_EXPORT_BY_ID_QUERY} from '../lib/queries'

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], {type: 'text/markdown;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// One post, one .md file, downloaded straight from the document editor --
// the "per post" half of the spec's Markdown export. Refetches the
// document by its own _id (rather than trying to resolve refs from
// props.draft by hand) so it goes through the exact same
// POST_EXPORT_PROJECTION the bulk "Export all posts" tool uses --
// guarantees the two can never quietly render the same post differently.
// {perspective: 'raw'} is required here specifically because this can run
// on an unpublished draft -- see RUNBOOK.md's "gotcha" on this API
// version's default query perspective silently excluding drafts.
export function createExportMarkdownAction(): DocumentActionComponent {
  const ExportMarkdownAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const client = useClient({apiVersion: '2026-07-22'})
    const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')

    async function handleExport() {
      setStatus('busy')
      try {
        const id = props.draft?._id ?? props.published?._id ?? props.id
        const post = await client.fetch<ExportPost | null>(POST_EXPORT_BY_ID_QUERY, {id}, {perspective: 'raw'})
        if (!post) throw new Error('Could not load this post for export.')
        const {filename, content} = buildMarkdownFile(post)
        downloadTextFile(filename, content)
        setStatus('idle')
      } catch {
        setStatus('error')
      }
    }

    return {
      label: status === 'busy' ? 'Exporting…' : status === 'error' ? 'Export failed -- try again' : 'Export as Markdown',
      icon: DownloadIcon,
      disabled: status === 'busy',
      tone: status === 'error' ? 'critical' : undefined,
      onHandle: () => {
        handleExport()
      },
    }
  }

  return ExportMarkdownAction
}
