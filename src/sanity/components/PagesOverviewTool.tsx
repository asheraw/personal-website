import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Badge, Box, Button, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {DataTable, type DataTableColumn, type DataTableRow} from './DataTable'
import {openDocumentInStudio} from '../lib/openPostInStudio'

const SITE_URL = 'https://asheraw.com'

// Every one of these is fully hardcoded -- confirmed by reading each file,
// not assumed: zero Sanity fetches in any of them. Listed here (not turned
// into fake Sanity documents -- that would let someone edit a document
// that quietly does nothing to the live page) so "everything on the site"
// stays visible in one place, exactly what Asher asked for. Adding a
// future hardcoded page is a one-line addition to this array, not new
// component code.
const HARDCODED_PAGES: {title: string; url: string; filePath: string}[] = [
  {title: 'Home', url: '/', filePath: 'src/app/(site)/page.tsx'},
  {title: 'Blog', url: '/blog', filePath: 'src/app/(site)/blog/page.tsx'},
  {title: 'Connect', url: '/connect', filePath: 'src/app/(site)/connect/page.tsx'},
  {title: 'Privacy Policy', url: '/privacy', filePath: 'src/app/(site)/privacy/page.tsx'},
]

type PageDoc = {_id: string; title?: string; slug?: string}
type LinkPageDoc = {_id: string} | null

type PageRow = DataTableRow & {
  title: string
  urlLabel: string
  url: string
  source: 'Studio' | 'Code'
  editLabel: string
  onEdit?: () => void
}

// One flat, single-click list of every page on the site -- Studio-managed
// (the generic `page` type, Link Page) and code-managed (Home, Blog,
// Connect, Privacy) together, same as how "Posts" shows every post in one
// click instead of a click-through-to-a-sub-list. Registered directly as
// the Pages sidebar item's own component (see structure.tsx), not nested
// under an extra "All Pages" list item.
export function PagesOverviewTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [pages, setPages] = useState<PageDoc[] | null>(null)
  const [linkPage, setLinkPage] = useState<LinkPageDoc>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      client.fetch<PageDoc[]>(`*[_type == "page"] | order(title asc){_id, title, "slug": slug.current}`),
      client.fetch<LinkPageDoc>(`*[_type == "linkPage"][0]{_id}`),
    ]).then(([p, lp]) => {
      if (cancelled) return
      setPages(p)
      setLinkPage(lp)
    })
    return () => {
      cancelled = true
    }
  }, [client])

  if (pages === null) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const rows: PageRow[] = [
    ...pages.map((p) => ({
      id: p._id,
      title: p.title || 'Untitled page',
      urlLabel: p.slug ? `${SITE_URL}/${p.slug}` : '(no slug yet)',
      url: p.slug ? `${SITE_URL}/${p.slug}` : '',
      source: 'Studio' as const,
      editLabel: 'Open',
      onEdit: () => openDocumentInStudio('page', p._id),
    })),
    ...(linkPage
      ? [
          {
            id: linkPage._id,
            title: 'Link Page',
            urlLabel: `${SITE_URL}/link`,
            url: `${SITE_URL}/link`,
            source: 'Studio' as const,
            editLabel: 'Open',
            onEdit: () => openDocumentInStudio('linkPage', linkPage._id),
          },
        ]
      : []),
    ...HARDCODED_PAGES.map((hp) => ({
      id: hp.url,
      title: hp.title,
      urlLabel: `${SITE_URL}${hp.url === '/' ? '' : hp.url}`,
      url: `${SITE_URL}${hp.url === '/' ? '' : hp.url}`,
      source: 'Code' as const,
      editLabel: hp.filePath,
      onEdit: undefined,
    })),
  ]

  const columns: DataTableColumn[] = [
    {id: 'title', label: 'Page', sortable: true},
    {
      id: 'urlLabel',
      label: 'URL',
      render: (row) => (
        <a href={(row as PageRow).url} target="_blank" rel="noreferrer" style={{color: 'inherit'}}>
          {(row as PageRow).urlLabel}
        </a>
      ),
    },
    {
      id: 'source',
      label: 'Managed',
      sortable: true,
      render: (row) => (
        <Badge tone={(row as PageRow).source === 'Studio' ? 'primary' : 'default'} fontSize={0}>
          {(row as PageRow).source}
        </Badge>
      ),
    },
    {
      id: 'edit',
      label: '',
      render: (row) => {
        const r = row as PageRow
        return r.onEdit ? (
          <Button text={r.editLabel} mode="ghost" fontSize={1} padding={2} onClick={r.onEdit} />
        ) : (
          <Text size={0} muted style={{fontFamily: 'monospace'}}>
            {r.editLabel}
          </Text>
        )
      },
    },
  ]

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Text size={1} muted>
          Every page on asheraw.com, Studio-managed and code-managed together. A code-managed page&rsquo;s
          &ldquo;Open&rdquo; column shows the file to edit instead of a document -- there&rsquo;s no document
          behind it to open.
        </Text>
        <DataTable columns={columns} rows={rows} emptyMessage="No pages yet." />
      </Stack>
    </Box>
  )
}
