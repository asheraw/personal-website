import {useEffect, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Spinner,
  Stack,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {useClient} from 'sanity'

// Cookie Consent Log, Cookie Taste Feedback, and Cookie Banner Copy merged
// into one tool (2026-08-11, second pass) -- real overlap, all three are
// "everything about the cookie banner" in one place, and the first pass
// (a folder with Insights/Banner Copy as separate sibling panes) still
// wasn't the single combined form Asher actually asked for: "can this not
// merge into a single form... shows the insights, then the copy." One page,
// three stacked sections -- Insights, then Copy, then Feedback -- not tabs.
//
// The Insights section deliberately does NOT render consentLogType's
// `entries[]` as a list of rows -- that's Sanity's default array-field
// editor, and it's exactly what Asher flagged as unhelpful once it grows
// past a handful of items. Aggregate numbers instead: totals, accept rate,
// per-variant breakdown.
//
// The Copy section edits `cookieBannerCopy.variants[]` with plain inputs,
// not Sanity's own document form -- possible now specifically because that
// schema moved off Portable Text to plain text/linkText/linkHref fields
// (see cookieBannerCopyType.ts) the same day, for the same reason: a real
// rich-text block editor isn't something you can mount standalone inside a
// custom Studio pane, only plain form fields are.

function key() {
  return Math.random().toString(36).slice(2, 10)
}

type VariantStat = {label: string; accepted: number; declined: number}

type ConsentData = {
  acceptedCount: number
  declinedCount: number
  variantBreakdown: VariantStat[]
}

// Variants are editable below, not a fixed three -- Asher can add or delete
// them freely. So the breakdown can't be hardcoded GROQ count() queries per
// id; this fetches the current variant list (key + label) and the raw
// entries once, then groups client-side, so it stays correct as variants
// come and go. An entry whose variant key doesn't match any *currently
// existing* variant (one that's since been deleted, or the "fallback" id
// used if a visitor's fetch ever failed) still shows up, labeled honestly
// rather than silently dropped.
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
          .map(([k, stat]) => ({
            label: labelFor.get(k) ?? (k === 'fallback' ? 'Fallback (Sanity fetch failed)' : `Deleted variant (${k})`),
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

function InsightsSection() {
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

type Variant = {
  _key: string
  label: string
  text: string
  linkText?: string
  linkHref?: string
  afterLink?: string
  declineLabel: string
  acceptLabel: string
  showTasteLink?: boolean
}

const BLANK_VARIANT = (): Variant => ({
  _key: key(),
  label: '',
  text: '',
  linkText: 'Privacy Policy',
  linkHref: '/privacy',
  afterLink: '',
  declineLabel: 'Decline',
  acceptLabel: 'Accept',
  showTasteLink: false,
})

function CopySection() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [variants, setVariants] = useState<Variant[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    client
      .fetch<{variants?: Variant[]} | null>(`*[_type == "cookieBannerCopy"][0]{variants}`)
      .then((doc) => setVariants(doc?.variants ?? []))
      .catch(() => setVariants([]))
  }, [client])

  function update(k: string, field: keyof Variant, value: string | boolean) {
    setSaved(false)
    setVariants((prev) => prev?.map((v) => (v._key === k ? {...v, [field]: value} : v)) ?? prev)
  }

  function remove(k: string) {
    setSaved(false)
    setVariants((prev) => prev?.filter((v) => v._key !== k) ?? prev)
  }

  function add() {
    setSaved(false)
    setVariants((prev) => [...(prev ?? []), BLANK_VARIANT()])
  }

  async function save() {
    if (!variants) return
    setSaving(true)
    try {
      await client
        .patch('cookieBannerCopy')
        .setIfMissing({_type: 'cookieBannerCopy', title: 'Cookie Banner Copy'})
        .set({variants})
        .commit({visibility: 'async'})
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (!variants) return <Spinner muted />

  return (
    <Stack space={4}>
      <Text size={1} muted>
        One is shown at random each time the cookie banner appears. If Link text is set, it&rsquo;s added
        right after the banner text with a space in between. Text after the link (optional) is added
        directly after it with no extra space -- start it with a space or punctuation yourself.
      </Text>

      <Stack space={3}>
        {variants.map((v) => (
          <Card key={v._key} padding={4} radius={3} border>
            <Stack space={3}>
              <Flex align="center" justify="space-between" gap={3}>
                <Box style={{flex: 1}}>
                  <TextInput
                    value={v.label}
                    placeholder="Label (Studio only, not shown to visitors)"
                    onChange={(e) => update(v._key, 'label', e.currentTarget.value)}
                  />
                </Box>
                <Button icon={TrashIcon} mode="bleed" tone="critical" onClick={() => remove(v._key)} aria-label="Remove variant" />
              </Flex>
              <TextArea
                value={v.text}
                rows={2}
                placeholder="Banner text"
                onChange={(e) => update(v._key, 'text', e.currentTarget.value)}
              />
              <Grid columns={2} gap={3}>
                <TextInput
                  value={v.linkText ?? ''}
                  placeholder="Link text (optional)"
                  onChange={(e) => update(v._key, 'linkText', e.currentTarget.value)}
                />
                <TextInput
                  value={v.linkHref ?? ''}
                  placeholder="Link URL"
                  onChange={(e) => update(v._key, 'linkHref', e.currentTarget.value)}
                />
              </Grid>
              <TextInput
                value={v.afterLink ?? ''}
                placeholder={'Text after the link (optional, e.g. " here. Click Accept to help me out, thanks!")'}
                onChange={(e) => update(v._key, 'afterLink', e.currentTarget.value)}
              />
              <Grid columns={2} gap={3}>
                <TextInput
                  value={v.declineLabel}
                  placeholder="Decline button text"
                  onChange={(e) => update(v._key, 'declineLabel', e.currentTarget.value)}
                />
                <TextInput
                  value={v.acceptLabel}
                  placeholder="Accept button text"
                  onChange={(e) => update(v._key, 'acceptLabel', e.currentTarget.value)}
                />
              </Grid>
              <Flex align="center" gap={2}>
                <Checkbox
                  checked={!!v.showTasteLink}
                  onChange={() => update(v._key, 'showTasteLink', !v.showTasteLink)}
                />
                <Text size={1}>Show the &ldquo;how was the cookie?&rdquo; feedback link</Text>
              </Flex>
            </Stack>
          </Card>
        ))}
      </Stack>

      <Flex align="center" gap={3}>
        <Button text="Add variant" icon={AddIcon} mode="ghost" onClick={add} />
        <Button
          text={saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save all changes'}
          tone="primary"
          disabled={saving || variants.length === 0}
          onClick={save}
        />
      </Flex>
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

function FeedbackSection() {
  const docs = useFeedbackData()

  if (!docs) return <Spinner muted />
  if (docs.length === 0) {
    return (
      <Card padding={4} radius={3} tone="transparent">
        <Text size={1} muted>
          No submissions yet -- only reachable from a variant with &ldquo;Show the feedback link&rdquo; turned
          on above.
        </Text>
      </Card>
    )
  }

  const avg = (k: 'colours' | 'taste' | 'texture') =>
    (docs.reduce((sum, d) => sum + (d[k] ?? 0), 0) / docs.length).toFixed(1)

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
                <Stack space={2} style={{flex: 1}}>
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

function SectionHeading({children}: {children: React.ReactNode}) {
  return (
    <Text size={2} weight="semibold">
      {children}
    </Text>
  )
}

export function CookiesTool() {
  return (
    <Box padding={4} style={{maxWidth: 720}}>
      <Stack space={5}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Cookies
          </Text>
          <Text size={1} muted>
            How the cookie banner is doing, what it says, and the anonymous taste-test feedback -- all in
            one place.
          </Text>
        </Stack>

        <Stack space={3}>
          <SectionHeading>Insights</SectionHeading>
          <InsightsSection />
        </Stack>

        <Stack space={3}>
          <SectionHeading>Copy</SectionHeading>
          <CopySection />
        </Stack>

        <Stack space={3}>
          <SectionHeading>Feedback</SectionHeading>
          <FeedbackSection />
        </Stack>
      </Stack>
    </Box>
  )
}
