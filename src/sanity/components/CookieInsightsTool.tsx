import {useEffect, useState} from 'react'
import {Badge, Box, Card, Flex, Grid, Spinner, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {useClient} from 'sanity'

// Cookie Consent Log and Cookie Taste Feedback merged into one tool
// (2026-08-11) -- same reasoning ContentHealthTool already established for
// Content Audit + Link Checker: real overlap (both are "how did the cookie
// banner do"), no reason to be two separate sidebar entries.
//
// The Consent tab deliberately does NOT render consentLogType's `entries[]`
// as a list of rows -- that's Sanity's default array-field editor, and it's
// exactly what Asher flagged as unhelpful once it grows past a handful of
// items ("Recent choices... Declined/Accepted as items... not helpful the
// longer it gets"). This shows aggregate numbers instead: totals, accept
// rate, and the per-variant breakdown -- the same GROQ pattern
// DashboardTool.tsx's card already uses, just given real room here instead
// of a cramped dashboard tile.

type View = 'consent' | 'feedback'

type VariantStat = {label: string; accepted: number; declined: number}

type ConsentData = {
  acceptedCount: number
  declinedCount: number
  variantBreakdown: VariantStat[]
}

// Variants are editable in Studio now (Cookie Banner Copy), not a fixed
// three -- Asher can add or delete them freely. So the breakdown can't be
// three hardcoded GROQ count() queries anymore; this fetches the current
// variant list (id + label) and the raw entries once, then groups client-
// side, so it stays correct as variants come and go. An entry whose
// variant key doesn't match any *current* variant (one that's since been
// deleted, or the "fallback" id used if a visitor's fetch ever failed)
// still shows up, labeled honestly rather than silently dropped.
function useConsentData(): ConsentData | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [data, setData] = useState<ConsentData | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<{
        acceptedCount: number
        declinedCount: number
        variantsMeta: {_key: string; label: string}[]
        entries: {choice: string; variant?: string}[]
      }>(`{
        "acceptedCount": *[_id == "consentLog"][0].acceptedCount,
        "declinedCount": *[_id == "consentLog"][0].declinedCount,
        "variantsMeta": *[_type == "cookieBannerCopy"][0].variants[]{_key, label},
        "entries": *[_id == "consentLog"][0].entries[]{choice, variant}
      }`)
      .then(({acceptedCount, declinedCount, variantsMeta, entries}) => {
        if (cancelled) return
        const labelFor = new Map(variantsMeta.map((v) => [v._key, v.label]))
        const counts = new Map<string, {accepted: number; declined: number}>()
        for (const e of entries) {
          if (!e.variant) continue
          const bucket = counts.get(e.variant) ?? {accepted: 0, declined: 0}
          if (e.choice === 'accepted') bucket.accepted++
          else if (e.choice === 'declined') bucket.declined++
          counts.set(e.variant, bucket)
        }
        const variantBreakdown: VariantStat[] = [...counts.entries()]
          .map(([key, stat]) => ({
            label: labelFor.get(key) ?? (key === 'fallback' ? 'Fallback (Sanity fetch failed)' : `Deleted variant (${key})`),
            ...stat,
          }))
          .sort((a, b) => b.accepted + b.declined - (a.accepted + a.declined))
        setData({acceptedCount, declinedCount, variantBreakdown})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [client])

  return data
}

function ConsentView() {
  const data = useConsentData()

  if (!data) return <Spinner muted />

  const total = (data.acceptedCount ?? 0) + (data.declinedCount ?? 0)
  const rate = total ? Math.round(((data.acceptedCount ?? 0) / total) * 100) : null

  return (
    <Stack space={4}>
      <Card padding={4} radius={3} shadow={1}>
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Text size={1} muted>
              Overall
            </Text>
            <Text size={4} weight="bold">
              {data.acceptedCount ?? 0} accepted · {data.declinedCount ?? 0} declined
            </Text>
          </Stack>
          {rate !== null && (
            <Badge tone={rate >= 50 ? 'positive' : 'caution'} fontSize={2} padding={3}>
              {rate}% accept rate
            </Badge>
          )}
        </Flex>
      </Card>

      <Stack space={2}>
        <Text size={1} weight="semibold" muted>
          By copy variant (since 2026-08-11 -- older entries predate variant tracking)
        </Text>
        <Card padding={4} radius={3} shadow={1}>
          {data.variantBreakdown.length === 0 ? (
            <Text size={1} muted>
              No variant data yet.
            </Text>
          ) : (
            <Stack space={3}>
              {data.variantBreakdown.map((v) => {
                const variantTotal = v.accepted + v.declined
                const variantRate = variantTotal ? Math.round((v.accepted / variantTotal) * 100) : null
                return (
                  <Flex key={v.label} align="center" justify="space-between" gap={3}>
                    <Text size={1}>{v.label}</Text>
                    <Text size={1} muted>
                      {`${v.accepted} accepted · ${v.declined} declined (${variantRate}%)`}
                    </Text>
                  </Flex>
                )
              })}
            </Stack>
          )}
        </Card>
      </Stack>
    </Stack>
  )
}

type FeedbackDoc = {
  _id: string
  _createdAt: string
  colours: number
  taste: number
  texture: number
  comment?: string
}

function useFeedbackData(): FeedbackDoc[] | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [data, setData] = useState<FeedbackDoc[] | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<FeedbackDoc[]>(
        `*[_type == "cookieFeedback"] | order(_createdAt desc) [0...30]{_id, _createdAt, colours, taste, texture, comment}`,
      )
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [client])

  return data
}

const RATING_EMOJI: Record<number, string> = {1: '😕', 2: '🙂', 3: '😋', 4: '🤩'}

function FeedbackView() {
  const docs = useFeedbackData()

  if (!docs) return <Spinner muted />
  if (docs.length === 0) {
    return (
      <Card padding={4} radius={3} tone="transparent">
        <Text size={1} muted>
          No submissions yet -- only reachable from the &ldquo;cookie tasting&rdquo; banner variant&rsquo;s
          own feedback link.
        </Text>
      </Card>
    )
  }

  const avg = (key: 'colours' | 'taste' | 'texture') =>
    (docs.reduce((sum, d) => sum + (d[key] ?? 0), 0) / docs.length).toFixed(1)

  return (
    <Stack space={4}>
      <Card padding={4} radius={3} shadow={1}>
        <Stack space={3}>
          <Text size={1} muted>
            Average of last {docs.length} submission{docs.length === 1 ? '' : 's'} (out of 4)
          </Text>
          <Grid columns={3} gap={3}>
            <Stack space={1}>
              <Text size={1} muted>
                Colours
              </Text>
              <Text size={3} weight="bold">
                {avg('colours')}
              </Text>
            </Stack>
            <Stack space={1}>
              <Text size={1} muted>
                Taste
              </Text>
              <Text size={3} weight="bold">
                {avg('taste')}
              </Text>
            </Stack>
            <Stack space={1}>
              <Text size={1} muted>
                Texture
              </Text>
              <Text size={3} weight="bold">
                {avg('texture')}
              </Text>
            </Stack>
          </Grid>
        </Stack>
      </Card>

      <Stack space={2}>
        <Text size={1} weight="semibold" muted>
          Recent submissions
        </Text>
        <Stack space={2}>
          {docs.map((d) => (
            <Card key={d._id} padding={3} radius={2} border>
              <Flex align="flex-start" justify="space-between" gap={3}>
                <Stack space={2} flex={1}>
                  <Text size={1}>
                    {RATING_EMOJI[d.colours]} colours · {RATING_EMOJI[d.taste]} taste · {RATING_EMOJI[d.texture]} texture
                  </Text>
                  {d.comment && (
                    <Text size={1} muted>
                      &ldquo;{d.comment}&rdquo;
                    </Text>
                  )}
                </Stack>
                <Text size={0} muted>
                  {new Date(d._createdAt).toLocaleDateString()}
                </Text>
              </Flex>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

export function CookieInsightsTool() {
  const [view, setView] = useState<View>('consent')

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={3} weight="bold">
              Cookie Insights
            </Text>
            <a href="/studio/structure/siteAdmin;logs;cookieInsights;bannerCopy" style={{fontSize: 12, textDecoration: 'underline'}}>
              Edit banner copy →
            </a>
          </Flex>
          <Text size={1} muted>
            How the cookie banner is doing -- accept/decline totals, the copy-variant experiment, and the
            anonymous taste-test feedback.
          </Text>
        </Stack>

        <TabList space={2}>
          <Tab id="consent-tab" aria-controls="consent-panel" label="Consent" selected={view === 'consent'} onClick={() => setView('consent')} />
          <Tab id="feedback-tab" aria-controls="feedback-panel" label="Feedback" selected={view === 'feedback'} onClick={() => setView('feedback')} />
        </TabList>

        {view === 'consent' && (
          <TabPanel id="consent-panel" aria-labelledby="consent-tab">
            <Box marginTop={3}>
              <ConsentView />
            </Box>
          </TabPanel>
        )}
        {view === 'feedback' && (
          <TabPanel id="feedback-panel" aria-labelledby="feedback-tab">
            <Box marginTop={3}>
              <FeedbackView />
            </Box>
          </TabPanel>
        )}
      </Stack>
    </Box>
  )
}
