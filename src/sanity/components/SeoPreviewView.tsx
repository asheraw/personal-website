import {useMemo} from 'react'
import {useEditState} from 'sanity'
import {Badge, Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {urlFor} from '../lib/image'
import {getChecklistIssues, type PostDraft} from '../actions/prepareForPublish'
import {SuggestSeoButton} from './SuggestSeoButton'

type PostForPreview = PostDraft & {
  slug?: {current?: string}
  socialImage?: unknown
  useBrandedSocialCard?: boolean
  noIndex?: boolean
  // Not read by anything else in this view -- added purely to pass through
  // as the source data for SuggestSeoButton below, same fields
  // suggestSeo.tsx's own document action already reads from props.draft/
  // props.published.
  body?: unknown
  tags?: string[]
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
  const brandedCardUrl = doc?.useBrandedSocialCard && slug ? `/api/og/${slug}` : null
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

        <Box>
          <SuggestSeoButton documentId={publishedId} source={doc} />
        </Box>

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
            {brandedCardUrl ? (
              <img
                key={brandedCardUrl}
                src={brandedCardUrl}
                alt=""
                style={{width: '100%', display: 'block', aspectRatio: '1.91 / 1', objectFit: 'cover'}}
              />
            ) : socialImage ? (
              <img
                src={urlFor(socialImage).width(600).height(315).fit('crop').crop('focalpoint').url()}
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
          <Text size={0} muted>
            This is the crop used for OG/X/LinkedIn/WhatsApp previews (1.91:1) — the one that actually ships.
          </Text>
        </Stack>

        <Stack space={3}>
          <Heading size={1}>Other platform crops</Heading>
          <Text size={0} muted>
            Not currently used anywhere on the site (nothing publishes to Instagram/TikTok automatically) —
            here purely so a crop can be checked before pasting this image manually into another platform&rsquo;s
            own composer. All three use the same focal point set on the image itself (Studio&rsquo;s image editor
            → click the image → drag the circle) — dragging it updates every crop below and above together, not
            just one.
          </Text>
          <Flex gap={3} wrap="wrap">
            <Stack space={2} style={{width: 160}}>
              <Card radius={2} border style={{overflow: 'hidden'}}>
                {socialImage ? (
                  <img
                    src={urlFor(socialImage).width(320).height(320).fit('crop').crop('focalpoint').url()}
                    alt=""
                    style={{width: '100%', display: 'block', aspectRatio: '1 / 1', objectFit: 'cover'}}
                  />
                ) : (
                  <Flex align="center" justify="center" style={{aspectRatio: '1 / 1', background: '#e4e6eb'}}>
                    <Text size={0} muted>
                      No image
                    </Text>
                  </Flex>
                )}
              </Card>
              <Text size={0} muted style={{textAlign: 'center'}}>
                Square (1:1)
              </Text>
            </Stack>
            <Stack space={2} style={{width: 160}}>
              <Card radius={2} border style={{overflow: 'hidden'}}>
                {socialImage ? (
                  <img
                    src={urlFor(socialImage).width(320).height(400).fit('crop').crop('focalpoint').url()}
                    alt=""
                    style={{width: '100%', display: 'block', aspectRatio: '4 / 5', objectFit: 'cover'}}
                  />
                ) : (
                  <Flex align="center" justify="center" style={{aspectRatio: '4 / 5', background: '#e4e6eb'}}>
                    <Text size={0} muted>
                      No image
                    </Text>
                  </Flex>
                )}
              </Card>
              <Text size={0} muted style={{textAlign: 'center'}}>
                Vertical (4:5)
              </Text>
            </Stack>
          </Flex>
        </Stack>
      </Stack>
    </Box>
  )
}
