import {useMemo} from 'react'
import {useEditState} from 'sanity'
import {Badge, Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {urlFor} from '../lib/image'
import {getChecklistIssues, type PostDraft} from '../actions/prepareForPublish'

type PostForPreview = PostDraft & {
  slug?: {current?: string}
  socialImage?: unknown
  noIndex?: boolean
}

const SITE_HOST = 'asheraw.com'
// Same thresholds already used by the "Suggest SEO & Excerpt" action and
// the seoTitle/excerpt schema fields themselves -- kept in sync
// deliberately so this preview never contradicts guidance shown
// elsewhere in the same document.
const TITLE_LIMIT = 70
const DESCRIPTION_LIMIT = 160

function CharCount({length, limit}: {length: number; limit: number}) {
  const tone = length === 0 ? undefined : length > limit ? 'critical' : length > limit * 0.85 ? 'caution' : 'positive'
  return (
    <Text size={0} muted={!tone} style={tone ? {color: `var(--card-${tone}-fg-color)`} : undefined}>
      {length}/{limit} characters
    </Text>
  )
}

// A persistent "SEO Preview" tab on every post (wired in structure.tsx,
// alongside the normal Editor form) -- an approximate Google
// search-result preview and social share card, updating as the draft
// autosaves, plus the same "worth a look" checklist the pre-publish
// dialog shows, but visible the whole time you're writing instead of only
// as a one-time popup right before Publish.
export function SeoPreviewView(props: {documentId: string}) {
  const publishedId = props.documentId.replace(/^drafts\./, '')
  const {draft, published, ready} = useEditState(publishedId, 'post')
  const doc = (draft ?? published) as PostForPreview | null

  const title = doc?.seoTitle || doc?.title || ''
  const description = doc?.excerpt || ''
  const slug = doc?.slug?.current
  const socialImage = doc?.socialImage ?? doc?.mainImage
  const issues = useMemo(() => getChecklistIssues(doc ?? null), [doc])

  if (!ready) {
    return (
      <Box padding={4}>
        <Text muted size={1}>
          Loading…
        </Text>
      </Box>
    )
  }

  return (
    <Box padding={4} style={{maxWidth: 480}}>
      <Stack space={5}>
        <Text size={1} muted>
          Approximate previews of how this post shows up in a Google search result and when shared on social —
          not pixel-perfect (every platform renders slightly differently), but close enough to catch a title
          that&rsquo;s too long or a missing description before it goes live. Updates as the draft autosaves.
        </Text>

        {issues.length > 0 && (
          <Card padding={3} radius={2} tone="caution" border>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Worth a look
              </Text>
              {issues.map((issue) => (
                <Text key={issue} size={1}>
                  · {issue}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {doc?.noIndex && (
          <Card padding={3} radius={2} tone="critical" border>
            <Flex align="center" gap={2}>
              <Badge tone="critical">Hidden from search</Badge>
              <Text size={1}>None of this matters until &ldquo;Hide from search engines&rdquo; is off.</Text>
            </Flex>
          </Card>
        )}

        <Stack space={3}>
          <Heading size={1}>Google search result</Heading>
          <Card padding={4} radius={2} border style={{background: '#fff'}}>
            <Text size={1} style={{color: '#202124', fontFamily: 'arial, sans-serif'}}>
              {SITE_HOST}
              {slug ? ` › blog › ${slug}` : ''}
            </Text>
            <Box marginTop={1}>
              <Text size={3} style={{color: '#1a0dab', fontFamily: 'arial, sans-serif', lineHeight: 1.3}}>
                {title || '(no title set)'}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text size={1} style={{color: '#4d5156', fontFamily: 'arial, sans-serif', lineHeight: 1.5}}>
                {description || '(no description set — Google will pull a snippet from the post body instead)'}
              </Text>
            </Box>
          </Card>
          <Flex gap={4}>
            <CharCount length={title.length} limit={TITLE_LIMIT} />
            <CharCount length={description.length} limit={DESCRIPTION_LIMIT} />
          </Flex>
        </Stack>

        <Stack space={3}>
          <Heading size={1}>Social share card</Heading>
          <Card radius={2} border style={{maxWidth: 380, overflow: 'hidden'}}>
            {socialImage ? (
              <img
                src={urlFor(socialImage).width(600).height(315).fit('crop').url()}
                alt=""
                style={{width: '100%', display: 'block', aspectRatio: '1.91 / 1', objectFit: 'cover'}}
              />
            ) : (
              <Flex align="center" justify="center" style={{aspectRatio: '1.91 / 1', background: '#e4e6eb'}}>
                <Text size={1} muted>
                  No image set
                </Text>
              </Flex>
            )}
            <Box padding={3} style={{background: '#f0f2f5'}}>
              <Text size={0} style={{color: '#65676b', textTransform: 'uppercase', letterSpacing: '0.02em'}}>
                {SITE_HOST}
              </Text>
              <Box marginTop={1}>
                <Text size={1} weight="semibold" style={{color: '#050505'}}>
                  {title || '(no title set)'}
                </Text>
              </Box>
              <Box marginTop={1}>
                <Text size={1} style={{color: '#65676b'}}>
                  {description || '(no description set)'}
                </Text>
              </Box>
            </Box>
          </Card>
        </Stack>
      </Stack>
    </Box>
  )
}
