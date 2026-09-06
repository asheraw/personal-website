import {useEffect, useState} from 'react'
import {useDocumentOperation, useEditState} from 'sanity'
import {Box, Card, Dialog, Flex, Grid, Spinner, Stack, Text} from '@sanity/ui'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {ShareIcon} from '@sanity/icons/Share'
import {EditIcon} from '@sanity/icons/Edit'
import {ComponentIcon} from '@sanity/icons/Component'
import {ImagesIcon} from '@sanity/icons/Images'
import {ImageIcon} from '@sanity/icons/Image'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import type {ComponentType} from 'react'
import {logUsage, useSeoSuggestions, SuggestSeoDialogBody} from './SuggestSeoShared'
import {useSocialSuggestions, SocialCopyResults} from './SuggestSocialCopyShared'
import {useLinkedInPostSuggestion, LinkedInPostResults} from './SuggestLinkedInPostShared'
import {useVideoScriptSuggestion, VideoScriptResults} from './SuggestVideoScriptShared'
import {useImageCarouselSuggestion, ImageCarouselResults} from './SuggestImageCarouselShared'
import {useFeaturedImageGeneration, FeaturedImageResults} from './GenerateFeaturedImageShared'
import {DataTable, type DataTableColumn, type DataTableRow} from './DataTable'
import {useClient} from 'sanity'

type PostForTools = {
  title?: string
  body?: unknown
  tags?: string[]
  slug?: {current?: string}
}

type ToolKey = 'seo' | 'social' | 'linkedin' | 'video' | 'carousel' | 'image'

const FEATURE_LABEL: Record<string, string> = {
  seo: 'SEO & excerpt',
  social: 'Social copy',
  imagePrompt: 'Image prompt',
  featuredImage: 'Featured image',
  linkedinTrim: 'LinkedIn post',
  videoScript: 'Video script',
  imageCarousel: 'Image carousel',
}

// Formats a camelCase/snake_case JSON key as a readable label -- "seoTitles"
// -> "Seo Titles", "on_screen_direction" -> "On Screen Direction".
function labelFromKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// Every AI feature's `output` field is raw JSON, but a different shape per
// feature (SEO: titles/excerpts/tags; social: x/linkedin/facebook; video
// script: scenes; ...) -- rather than six bespoke renderers, one small
// recursive one that turns arbitrary JSON into labeled sections and lists
// reads as an actual reference panel instead of a debugging dump.
function JsonPrettyView({value, depth = 0}: {value: unknown; depth?: number}) {
  if (value === null || value === undefined || value === '') return null
  if (Array.isArray(value)) {
    return (
      <Stack space={3}>
        {value.map((item, i) =>
          typeof item === 'object' && item !== null ? (
            <Card key={i} padding={3} radius={2} border tone="transparent">
              <JsonPrettyView value={item} depth={depth + 1} />
            </Card>
          ) : (
            <Text key={i} size={1}>
              {String(item)}
            </Text>
          ),
        )}
      </Stack>
    )
  }
  if (typeof value === 'object') {
    return (
      <Stack space={4}>
        {Object.entries(value as Record<string, unknown>).map(([key, v]) => (
          <Stack key={key} space={2}>
            <Text size={0} weight="semibold" muted style={{letterSpacing: '0.06em', textTransform: 'uppercase'}}>
              {labelFromKey(key)}
            </Text>
            <JsonPrettyView value={v} depth={depth + 1} />
          </Stack>
        ))}
      </Stack>
    )
  }
  return (
    <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
      {String(value)}
    </Text>
  )
}

type AiLogDoc = {
  _id: string
  feature: string
  _createdAt: string
  used?: boolean
  usedActions?: {action?: string}[]
  output?: string
}

// A persistent "AI Tools" tab on every post (wired in structure.tsx,
// alongside Editor / SEO Preview) -- one visible front door for the six AI
// generators that used to live buried in the Publish button's "..." menu
// (~14 items deep by the time all six were added). Each card opens the
// EXACT same generation dialog its document-action twin does -- both sides
// call the same Shared hook + result component, this file owns none of the
// actual fetch/state logic, only which dialog is currently open. Below the
// cards: a live table of this post's own aiOutputLog entries (which tool,
// when, whether it was actually used), the DataTable component's first
// real consumer.
export function AiToolsView(props: {documentId: string}) {
  const publishedId = props.documentId.replace(/^drafts\./, '')
  const client = useClient({apiVersion: '2026-07-22'})
  const {draft, published, ready} = useEditState(publishedId, 'post')
  const doc = (draft ?? published) as PostForTools | null
  const {patch} = useDocumentOperation(publishedId, 'post')

  const [openDialog, setOpenDialog] = useState<ToolKey | null>(null)
  const [aiLogs, setAiLogs] = useState<AiLogDoc[] | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [viewingLog, setViewingLog] = useState<AiLogDoc | null>(null)

  const seo = useSeoSuggestions(doc)
  const [currentTags, setCurrentTags] = useState<string[]>(() => doc?.tags ?? [])
  const social = useSocialSuggestions(doc)
  const linkedin = useLinkedInPostSuggestion(doc)
  const video = useVideoScriptSuggestion(doc)
  const carousel = useImageCarouselSuggestion(doc)
  const featuredImage = useFeaturedImageGeneration(doc, publishedId)

  async function loadLogs() {
    if (!doc?.slug?.current) return
    setLoadingLogs(true)
    try {
      const rows = await client.fetch<AiLogDoc[]>(
        `*[_type == "aiOutputLog" && postSlug == $slug] | order(_createdAt desc){_id, feature, _createdAt, used, usedActions[]{action}, output}`,
        {slug: doc.slug.current}
      )
      setAiLogs(rows)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Loads automatically once the post's slug is known -- a spinner that
  // never resolves until manually clicked reads as "actively working," not
  // "waiting for you," which was confusing (Asher's own report).
  useEffect(() => {
    if (doc?.slug?.current && aiLogs === null) loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the slug itself changes, not on every doc/aiLogs identity change
  }, [doc?.slug?.current])

  function openTool(tool: ToolKey, start: () => void, status: string) {
    setOpenDialog(tool)
    if (status === 'idle') start()
  }

  function closeAndRefresh() {
    setOpenDialog(null)
    loadLogs()
  }

  const tools: {key: ToolKey; title: string; description: string; icon: ComponentType; status: string; start: () => void}[] = [
    {key: 'seo', title: 'Suggest SEO & Excerpt', description: '3 titles, 3 excerpts, tags', icon: SparklesIcon, status: seo.status, start: seo.runSuggestion},
    {key: 'social', title: 'Draft Social Copy', description: 'X · LinkedIn · Facebook', icon: ShareIcon, status: social.status, start: social.runSuggestion},
    {key: 'linkedin', title: 'Draft LinkedIn Post', description: 'Full standalone native post', icon: EditIcon, status: linkedin.status, start: linkedin.run},
    {key: 'video', title: 'Draft Video Script', description: 'Scenes + video-gen prompts', icon: ComponentIcon, status: video.status, start: video.run},
    {key: 'carousel', title: 'Draft Image Carousel', description: 'Quote cards + backgrounds', icon: ImagesIcon, status: carousel.status, start: carousel.run},
    {key: 'image', title: 'Generate Featured Image', description: 'Renders & attaches', icon: ImageIcon, status: featuredImage.status, start: featuredImage.run},
  ]

  const logsById = new Map((aiLogs ?? []).map((log) => [log._id, log]))

  const rows: DataTableRow[] = (aiLogs ?? []).map((log) => ({
    id: log._id,
    tool: FEATURE_LABEL[log.feature] ?? log.feature,
    whenMs: new Date(log._createdAt).getTime(),
    whenLabel: new Date(log._createdAt).toLocaleDateString(),
    used: log.used ? '✓ Used' : 'Not used',
  }))

  const columns: DataTableColumn[] = [
    {id: 'tool', label: 'Tool', sortable: true},
    {id: 'whenMs', label: 'When', sortable: true, render: (row) => String(row.whenLabel)},
    {id: 'used', label: 'Used', sortable: true},
  ]

  if (!ready) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Text size={1} muted>
          Every AI generator for this post, in one place -- each card opens the same dialog its old menu item
          did, nothing new to learn.
        </Text>
        <Grid columns={[1, 2]} gap={3}>
          {tools.map((tool) => (
            <Card
              key={tool.key}
              as="button"
              padding={3}
              radius={2}
              border
              shadow={1}
              tone={tool.status === 'loading' ? 'transparent' : 'primary'}
              style={{textAlign: 'left', cursor: 'pointer', transition: 'transform 80ms ease'}}
              onClick={() => openTool(tool.key, tool.start, tool.status)}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Flex align="center" gap={3}>
                <Flex
                  align="center"
                  justify="center"
                  style={{width: 32, height: 32, borderRadius: 8, background: 'rgba(90,130,255,0.15)', flexShrink: 0}}
                >
                  <tool.icon />
                </Flex>
                <Stack space={2} flex={1}>
                  <Text size={1} weight="semibold">
                    {tool.title}
                  </Text>
                  <Text size={1} muted>
                    {tool.description}
                  </Text>
                </Stack>
                {tool.status === 'loading' ? <Spinner muted /> : <ArrowRightIcon style={{opacity: 0.4, flexShrink: 0}} />}
              </Flex>
            </Card>
          ))}
        </Grid>

        <Stack space={2}>
          <Text size={1} weight="semibold" muted style={{letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '11px'}}>
            Generated for this post
          </Text>
          {loadingLogs ? (
            <Flex align="center" gap={2} padding={2}>
              <Spinner muted />
              <Text size={1} muted>
                Loading…
              </Text>
            </Flex>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                reorderableColumns
                emptyMessage="Nothing generated for this post yet."
                onRowClick={(row) => {
                  const log = logsById.get(String(row.id))
                  if (log) setViewingLog(log)
                }}
              />
              {rows.length > 0 && (
                <Text size={0} muted>
                  Click a row to see what was generated.
                </Text>
              )}
            </>
          )}
        </Stack>
      </Stack>

      {openDialog === 'seo' && (
        <Dialog id="ai-tools-seo" header="AI-suggested SEO title, excerpt, tags & more" onClose={() => setOpenDialog(null)}>
          <SuggestSeoDialogBody
            status={seo.status}
            suggestions={seo.suggestions}
            error={seo.error}
            currentTags={currentTags}
            postTitle={doc?.title}
            onRetry={seo.runSuggestion}
            onClose={() => setOpenDialog(null)}
            onUseTitle={(text, logId) => {
              patch.execute([{set: {seoTitle: text}}])
              logUsage(logId, `Used SEO title: "${text}"`)
            }}
            onUseExcerpt={(text, logId) => {
              patch.execute([{set: {excerpt: text}}])
              logUsage(logId, `Used excerpt: "${text}"`)
            }}
            onUseHeadline={(text, logId) => {
              patch.execute([{set: {title: text}}])
              logUsage(logId, `Used alternative headline: "${text}"`)
            }}
            onAddTags={(selected, logId) => {
              const merged = Array.from(new Set([...currentTags, ...selected]))
              patch.execute([{set: {tags: merged}}])
              setCurrentTags(merged)
              logUsage(logId, `Added tags: ${selected.join(', ')}`)
            }}
          />
        </Dialog>
      )}

      {openDialog === 'social' && (
        <Dialog id="ai-tools-social" header="AI-drafted social captions" onClose={closeAndRefresh}>
          <Box padding={4}>
            <SocialCopyResults
              status={social.status}
              suggestions={social.suggestions}
              error={social.error}
              onRetry={social.runSuggestion}
              postUrl={doc?.slug?.current ? `https://asheraw.com/blog/${doc.slug.current}` : undefined}
            />
          </Box>
        </Dialog>
      )}

      {openDialog === 'linkedin' && (
        <Dialog id="ai-tools-linkedin" header="AI-drafted LinkedIn post" onClose={closeAndRefresh}>
          <Box padding={4}>
            <LinkedInPostResults status={linkedin.status} result={linkedin.result} error={linkedin.error} onRetry={linkedin.run} />
          </Box>
        </Dialog>
      )}

      {openDialog === 'video' && (
        <Dialog id="ai-tools-video" header="AI-drafted video script" onClose={closeAndRefresh}>
          <Box padding={4}>
            <VideoScriptResults status={video.status} result={video.result} error={video.error} onRetry={video.run} />
          </Box>
        </Dialog>
      )}

      {openDialog === 'carousel' && (
        <Dialog id="ai-tools-carousel" header="AI-generated carousel materials" onClose={closeAndRefresh}>
          <Box padding={4}>
            <ImageCarouselResults status={carousel.status} result={carousel.result} error={carousel.error} onRetry={carousel.run} />
          </Box>
        </Dialog>
      )}

      {openDialog === 'image' && (
        <Dialog id="ai-tools-image" header="AI-generated featured image" onClose={closeAndRefresh}>
          <Box padding={4}>
            <FeaturedImageResults
              status={featuredImage.status}
              result={featuredImage.result}
              error={featuredImage.error}
              onRetry={featuredImage.run}
              onClose={closeAndRefresh}
            />
          </Box>
        </Dialog>
      )}

      {viewingLog && (
        <Dialog
          id="ai-tools-view-log"
          header={`${FEATURE_LABEL[viewingLog.feature] ?? viewingLog.feature} — ${new Date(viewingLog._createdAt).toLocaleString()}`}
          onClose={() => setViewingLog(null)}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1} muted>
                {viewingLog.used ? '✓ At least one suggestion from this was used.' : 'Not used.'}
              </Text>
              {viewingLog.output ? (
                (() => {
                  try {
                    return <JsonPrettyView value={JSON.parse(viewingLog.output)} />
                  } catch {
                    // Not valid JSON (shouldn't normally happen -- every
                    // route logs its raw structured response) -- show the
                    // plain text rather than a blank panel.
                    return <Text size={1} style={{whiteSpace: 'pre-wrap'}}>{viewingLog.output}</Text>
                  }
                })()
              ) : (
                <Text size={1} muted>
                  No output recorded.
                </Text>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}
    </Box>
  )
}
