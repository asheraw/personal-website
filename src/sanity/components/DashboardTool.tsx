import {useEffect, useState} from 'react'
import {useTheme} from '@sanity/ui'
import {useClient} from 'sanity'
import {AddDocumentIcon} from '@sanity/icons/AddDocument'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LinkIcon} from '@sanity/icons/Link'
import {CommentIcon} from '@sanity/icons/Comment'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {ShareIcon} from '@sanity/icons/Share'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {BugIcon} from '@sanity/icons/Bug'
import {SearchIcon} from '@sanity/icons/Search'
import {ComponentIcon} from '@sanity/icons/Component'
import {EditIcon} from '@sanity/icons/Edit'
import {usePendingCommentCount} from '../hooks/usePendingCommentCount'
import {usePendingContactCount} from '../hooks/usePendingContactCount'
import {openDocumentInStudio} from '../lib/openPostInStudio'
import {relativeTime} from '../lib/relativeTime'

// Landing screen (see sanity.config.ts -- this tool is prepended before
// Sanity's own default tools, which is what makes it the first thing shown
// at bare /studio). Asher's own priority list, in order: quick actions,
// comments/contact, distribution, pending issues, stats -- this mirrors
// that exactly rather than an arbitrary layout.
//
// Every stat here already has a real tool/document behind it -- this
// doesn't duplicate data, it surfaces counts from the same sources
// NotFoundHitsTool/ErrorLogTool/ContentHealthTool/etc. already show, so a
// number here always matches what you'd see clicking through.
//
// Look (2026-10-31, Asher's ask to make Studio more visually appealing and
// fun to use, in the spirit of ACE Studio): everything here is drawn with the
// plain CSS block below instead of Sanity UI's Card/Badge, so the tool can
// have its own warm palette (the site's amber), light + dark, count-up
// numbers, status colours and a little celebration when nothing is pending.
// Data hooks, queries and links are unchanged. All motion stops under
// prefers-reduced-motion.
//
// Traffic/Google Analytics is deliberately not here: this project has no
// server-side GA integration today (checked -- no @google-analytics/data
// dependency, no service-account env vars), and wiring one up is a real
// new integration (Google Cloud service account, new credentials), not a
// dashboard-layout decision. Asher confirmed (2026-08-11) he's not pursuing
// it for now, so there's no placeholder card here either -- just this note,
// in case it comes up again later.

type DashboardData = {
  linkIssues: number
  notFoundPending: number
  errorPending: number
  searchPending: number
  scheduledCount: number
  consent: {acceptedCount?: number; declinedCount?: number} | null
  feedbackCount: number
  publishedCount: number
  lastPublished: {title?: string; publishedAt?: string} | null
  auditIssues: number
  socialNeeded: number
}

type Counts = Omit<DashboardData, 'auditIssues' | 'socialNeeded'>

// Nested-structure links (Site Admin's own sub-items) use Sanity's real
// pane-URL format -- groups joined by `;` -- verified by reading Sanity's
// own router source rather than assumed; see structure.tsx for the
// explicit .id() values these paths depend on (an unset id defaults to
// camelCase(title), which gets genuinely ambiguous for a title like
// "404 Hits", so those ids are pinned by hand there). Top-level tools
// (Comments, Distribution, Editorial Calendar, Content Health) use their
// registered `name` from sanity.config.ts directly -- a different,
// simpler mechanism (name-based routing, not pane-stack topology), not
// the kind of guess that broke the old "open post" links (see RUNBOOK.md).
// notFoundHits/errorLog/searchQueries/cookies are all direct Site Admin
// children (briefly grouped one level deeper inside a "Logs" folder on
// 2026-08-11, flattened back out the same day on Asher's own reversal --
// "no need to put them too far in, you're right"). cookies points at the
// single merged Insights+Copy+Feedback pane (also 2026-08-11, second pass).
const LINKS = {
  comments: '/studio/comments',
  distribution: '/studio/distribution',
  calendar: '/studio/editorial-calendar',
  contentHealth: '/studio/content-health',
  contactSubmissions: '/studio/structure/siteAdmin;contactSubmissions',
  notFoundHits: '/studio/structure/siteAdmin;notFoundHits',
  errorLog: '/studio/structure/siteAdmin;errorLog',
  searchQueries: '/studio/structure/siteAdmin;searchQueries',
  cookies: '/studio/structure/siteAdmin;cookies',
}

// A plain external shortcut, not a live number -- checked directly against
// Netlify's own API docs (2026-08-27): there's no endpoint for credit
// balance/usage, only account/payment-method management. Pulling this in
// live would mean reverse-engineering Netlify's own undocumented internal
// dashboard API, unsupported and liable to break without notice, so this
// is just a one-click shortcut to the real page instead.
const NETLIFY_BILLING_URL = 'https://app.netlify.com/teams/asheraw/billing/general'

// Deliberately doesn't also fetch posts/aiOutputLog -- usePostIssueCounts
// below covers those (audit issues + social-copy-needed both derive from
// the same two lists, so they share one fetch rather than pulling the same
// data twice across two hooks). Also deliberately doesn't compute a
// per-variant breakdown here anymore -- that lives in CookiesTool.tsx now,
// which has real room for it; this card only needs the overall total.
const QUERY = `{
  "linkIssues": count(*[_type == "linkCheck" && ok == false && (status == "pending" || !defined(status))]),
  "notFoundPending": count(*[_type == "notFoundHit" && (status == "pending" || !defined(status))]),
  "errorPending": count(*[_type == "errorLog" && (status == "pending" || !defined(status))]),
  "searchPending": count(*[_type == "searchQueryLog" && (status == "pending" || !defined(status))]),
  "scheduledCount": count(*[_id in path("drafts.**") && _type == "post" && !defined(trashedAt) && defined(scheduledPublishAt)]),
  "consent": *[_id == "consentLog"][0]{acceptedCount, declinedCount},
  "feedbackCount": count(*[_type == "cookieFeedback"]),
  "publishedCount": count(*[_type == "post" && !defined(trashedAt) && defined(publishedAt) && publishedAt <= now()]),
  "lastPublished": *[_type == "post" && !defined(trashedAt) && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc)[0]{title, publishedAt}
}`

// Mirrors ContentAuditTool.tsx's own issuesFor() exactly, dismissed checks
// included -- this count feeds the Dashboard's "Content Health issues"
// card, and it needs to agree with what that tool actually shows, or the
// two numbers silently drift apart the first time a check gets dismissed.
function activeIssueCount(p: {
  mainImage?: unknown
  hasAltText: boolean
  excerpt?: string
  categories?: unknown[]
  contentAuditDismissed?: string[]
}): number {
  const dismissed = new Set(p.contentAuditDismissed ?? [])
  let count = 0
  if (!p.mainImage) {
    if (!dismissed.has('hasImage')) count++
  } else if (!p.hasAltText && !dismissed.has('hasAltText')) count++
  if (!p.excerpt && !dismissed.has('hasExcerpt')) count++
  if (!p.categories?.length && !dismissed.has('hasCategory')) count++
  return count
}

type DraftPost = {_id: string; title?: string; _updatedAt: string}

// Every open draft IS a "still being worked on" post by definition -- a
// draft document only exists in Sanity while there's unpublished/unsaved-
// to-live work sitting on it. Asher's own ask: he kept having to go
// Structure -> Posts to find where he left off, when the Dashboard is
// already his landing screen.
function useDraftPosts(): DraftPost[] | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [drafts, setDrafts] = useState<DraftPost[] | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      // perspective: 'raw' -- same requirement as scheduledCount below,
      // the default query perspective excludes drafts.* documents entirely.
      .fetch<DraftPost[]>(
        `*[_type == "post" && !defined(trashedAt) && !defined(shelvedAt) && _id in path("drafts.**")] | order(_updatedAt desc){_id, title, _updatedAt}`,
        {},
        {perspective: 'raw'}
      )
      .then((res) => {
        if (!cancelled) setDrafts(res)
      })
      .catch(() => {
        if (!cancelled) setDrafts([])
      })
    return () => {
      cancelled = true
    }
  }, [client])

  return drafts
}

function usePostIssueCounts(): {auditIssues: number; socialNeeded: number} | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [result, setResult] = useState<{auditIssues: number; socialNeeded: number} | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<{
        posts: {
          _id: string
          mainImage?: unknown
          hasAltText: boolean
          excerpt?: string
          categories?: unknown[]
          contentAuditDismissed?: string[]
        }[]
        socialDraftedSlugs: string[]
      }>(`{
        "posts": *[_type == "post" && !defined(trashedAt) && defined(slug.current)]{
          _id, mainImage, "hasAltText": defined(coalesce(mainImage.alt, *[_type == "imageAssetAlt" && assetId == ^.mainImage.asset._ref][0].altText)), excerpt, categories, contentAuditDismissed
        },
        "socialDraftedSlugs": *[_type == "aiOutputLog" && feature == "social"].postSlug
      }`)
      .then(({posts, socialDraftedSlugs}) => {
        if (cancelled) return
        const auditIssues = posts.filter((p) => activeIssueCount(p) > 0).length
        const socialNeeded = posts.length - new Set(socialDraftedSlugs).size
        setResult({auditIssues, socialNeeded: Math.max(0, socialNeeded)})
      })
      .catch(() => {
        if (!cancelled) setResult({auditIssues: 0, socialNeeded: 0})
      })
    return () => {
      cancelled = true
    }
  }, [client])

  return result
}

// The Link Page is a single document; the Quick actions button opens it directly
// (same intent URL the Pages list uses) instead of Structure -> Pages -> Link Page.
// raw perspective so it still resolves if only a draft exists.
function useLinkPageId(): string | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<string | null>(`*[_type == "linkPage"] | order(_id asc)[0]._id`, {}, {perspective: 'raw'})
      .then((res) => {
        if (!cancelled && res) setId(res.replace(/^drafts\./, ''))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [client])

  return id
}

function useDashboardCounts(): Counts | null {
  const client = useClient({apiVersion: '2026-07-22'})
  const [data, setData] = useState<Counts | null>(null)

  useEffect(() => {
    let cancelled = false
    client
      // perspective: 'raw' -- scheduledCount needs to see drafts.* documents,
      // which the default query perspective excludes entirely; same
      // requirement EditorialCalendarTool already has for the same reason.
      .fetch<Counts>(QUERY, {}, {perspective: 'raw'})
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        // Leave counts unset -- individual cards show a dash rather than a
        // wrong number if a fetch fails.
      })
    return () => {
      cancelled = true
    }
  }, [client])

  return data
}

// How long since a draft was last edited, and so how close the nightly job
// (purge-trash route) is to shelving it -- same 30-day rule, so the chip on
// each row tells the truth about what will happen to it.
const SHELVE_AFTER_DAYS = 30
function idleDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function greetingFor(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Numbers ease up from 0 on first load -- small, but it's what makes the
// page feel alive rather than static. Skipped under reduced motion.
function CountUp({value}: {value: number}) {
  const [shown, setShown] = useState(0)
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const still = reduced || value === 0
  useEffect(() => {
    if (still) return
    const start = performance.now()
    const duration = 700
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, still])
  return <>{still ? value : shown}</>
}

type Tone = 'warn' | 'bad' | 'neutral'

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'warn',
  href,
  big,
  index = 0,
}: {
  icon: React.ComponentType
  label: string
  value: number | null
  tone?: Tone
  href: string
  // The one card Asher's priority order puts first (pending comments) is
  // drawn larger, so the page has a single focal point.
  big?: boolean
  index?: number
}) {
  const state = value === null ? 'loading' : value === 0 ? 'good' : tone
  return (
    <a
      href={href}
      className={`ds-stat ds-${state}${big ? ' ds-big' : ''}`}
      style={{animationDelay: `${index * 45}ms`}}
    >
      <span className="ds-tile">
        <Icon />
      </span>
      <span className="ds-stat-label">{label}</span>
      {value === null ? (
        <span className="ds-skel" aria-label="Loading" />
      ) : (
        <span className="ds-num">
          <CountUp value={value} />
        </span>
      )}
      {value === 0 && <span className="ds-tick">All clear</span>}
    </a>
  )
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <section className="ds-section">
      <h2 className="ds-h2">{title}</h2>
      {children}
    </section>
  )
}

const CONFETTI = Array.from({length: 14}, (_, i) => i)

const CSS = `
.ds{--bg:#faf6ef;--panel:#fffdf9;--sunk:#f1eadd;--ink:#2d2619;--muted:#7a6f5c;--line:#e6dcc8;--accent:#b8842e;--accent-ink:#fff;--accent-soft:#f6e8c9;--good:#2f8a57;--good-soft:#dcf1e4;--warn:#a8680f;--warn-soft:#f8ead2;--bad:#c2412d;--bad-soft:#f7dcd6;--shadow:0 1px 2px rgba(60,40,10,.06),0 10px 26px -14px rgba(60,40,10,.22);
  min-height:100%;background:var(--bg);color:var(--ink);font-family:"Atkinson Hyperlegible",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45}
.ds.ds-dark{--bg:#17130d;--panel:#211b12;--sunk:#120f0a;--ink:#f1e9d8;--muted:#a89c85;--line:#3a3022;--accent:#f0b865;--accent-ink:#2a1d07;--accent-soft:#3a2c14;--good:#5cc489;--good-soft:#163525;--warn:#e0a94a;--warn-soft:#3a2b12;--bad:#ef7a66;--bad-soft:#3d1c16;--shadow:0 1px 2px rgba(0,0,0,.35),0 12px 28px -14px rgba(0,0,0,.7)}
.ds *{box-sizing:border-box}
.ds a{color:inherit;text-decoration:none}
.ds-wrap{max-width:980px;margin:0 auto;padding:28px 20px 56px;display:flex;flex-direction:column;gap:30px}
.ds-rise{animation:ds-rise .45s cubic-bezier(.22,1,.36,1) both}
@keyframes ds-rise{from{opacity:0;transform:translateY(10px)}}

.ds-hero{position:relative;overflow:hidden;border-radius:20px;padding:26px 26px 24px;background:linear-gradient(135deg,var(--accent-soft),var(--panel) 70%);border:1px solid var(--line);box-shadow:var(--shadow)}
.ds-hero:after{content:"";position:absolute;right:-60px;top:-70px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,var(--accent) 0%,transparent 70%);opacity:.22;animation:ds-breathe 6s ease-in-out infinite}
@keyframes ds-breathe{50%{transform:scale(1.12);opacity:.3}}
.ds-hello{margin:0;font-family:"Bricolage Grotesque","Arial Narrow",system-ui,sans-serif;font-size:34px;line-height:1.1;letter-spacing:-.02em;font-weight:700}
.ds-hello span{color:var(--accent)}
.ds-sub{margin:8px 0 0;color:var(--muted);font-size:16px;max-width:560px;position:relative;z-index:1}
.ds-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;position:relative;z-index:1}
.ds-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:var(--panel);border:1px solid var(--line);font-size:13px;color:var(--muted)}
.ds-chip b{color:var(--ink);font-variant-numeric:tabular-nums}

.ds-celebrate{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.ds-confetti{position:absolute;top:-10px;width:8px;height:12px;border-radius:2px;opacity:0;animation:ds-fall 1.8s ease-in forwards}
@keyframes ds-fall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(190px) rotate(420deg)}}

.ds-section{display:flex;flex-direction:column;gap:12px}
.ds-h2{margin:0;display:flex;align-items:center;gap:12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.ds-h2:after{content:"";flex:1;height:1px;background:var(--line)}

.ds-actions{display:flex;flex-wrap:wrap;gap:10px}
.ds-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink);font:inherit;font-weight:700;cursor:pointer;box-shadow:var(--shadow);transition:transform .15s,border-color .15s,background .15s}
.ds-btn:hover{transform:translateY(-2px);border-color:var(--accent)}
.ds-btn:active{transform:scale(.97)}
.ds-btn svg{font-size:20px}
.ds-btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.ds-btn-primary:hover{background:var(--accent);filter:brightness(1.07)}
.ds-btn:focus-visible,.ds-stat:focus-visible,.ds-draft:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media(max-width:600px){.ds-btn{flex:1 1 100%;padding:15px 20px}}

.ds-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.ds-grid.ds-two{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.ds-stat{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px 14px;padding:16px 18px;border-radius:16px;background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);animation:ds-rise .45s cubic-bezier(.22,1,.36,1) both;transition:transform .15s,border-color .15s}
.ds-stat:hover{transform:translateY(-3px);border-color:var(--accent)}
.ds-stat:active{transform:scale(.985)}
.ds-tile{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:var(--sunk);color:var(--muted);font-size:22px;transition:transform .25s}
.ds-stat:hover .ds-tile{animation:ds-wig .5s}
@keyframes ds-wig{25%{transform:rotate(-12deg)}75%{transform:rotate(9deg)}}
.ds-stat-label{font-size:14px;color:var(--muted);font-weight:600;min-width:0}
.ds-num{font-family:"Bricolage Grotesque","Arial Narrow",system-ui,sans-serif;font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.ds-tick{grid-column:2 / 4;font-size:12px;font-weight:700;color:var(--good);letter-spacing:.04em}
.ds-skel{width:44px;height:28px;border-radius:8px;background:linear-gradient(90deg,var(--sunk) 25%,var(--line) 50%,var(--sunk) 75%);background-size:200% 100%;animation:ds-shimmer 1.2s linear infinite}
@keyframes ds-shimmer{to{background-position:-200% 0}}
.ds-warn .ds-tile{background:var(--warn-soft);color:var(--warn)}
.ds-warn .ds-num{color:var(--warn)}
.ds-warn{border-color:color-mix(in srgb,var(--warn) 35%,var(--line))}
.ds-bad .ds-tile{background:var(--bad-soft);color:var(--bad)}
.ds-bad .ds-num{color:var(--bad)}
.ds-bad{border-color:color-mix(in srgb,var(--bad) 35%,var(--line))}
.ds-good .ds-tile{background:var(--good-soft);color:var(--good)}
.ds-good .ds-num{color:var(--good)}
.ds-neutral .ds-num{color:var(--ink)}
.ds-big{padding:22px 24px;grid-column:1 / -1;background:linear-gradient(135deg,var(--accent-soft),var(--panel) 60%)}
.ds-big .ds-tile{width:54px;height:54px;font-size:28px}
.ds-big .ds-stat-label{font-size:17px;color:var(--ink)}
.ds-big .ds-num{font-size:44px}

.ds-drafts{display:flex;flex-direction:column;gap:8px}
.ds-draft{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;width:100%;padding:12px 16px;text-align:left;font:inherit;color:inherit;border-radius:14px;border:1px solid var(--line);background:var(--panel);box-shadow:var(--shadow);cursor:pointer;animation:ds-rise .45s cubic-bezier(.22,1,.36,1) both;transition:transform .15s,border-color .15s}
.ds-draft:hover{transform:translateX(4px);border-color:var(--accent)}
.ds-draft .ds-tile{width:34px;height:34px;font-size:18px}
.ds-draft-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ds-draft-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);white-space:nowrap}
.ds-pill{padding:3px 10px;border-radius:999px;font-weight:700;font-size:11px;letter-spacing:.03em;background:var(--good-soft);color:var(--good)}
.ds-pill.ds-p-warn{background:var(--warn-soft);color:var(--warn)}
.ds-pill.ds-p-bad{background:var(--bad-soft);color:var(--bad)}
@media(max-width:600px){.ds-draft{grid-template-columns:auto 1fr}.ds-draft-meta{grid-column:2}}
.ds-more{margin:0;color:var(--muted);font-size:13px}

.ds-stat.ds-info{grid-template-columns:auto 1fr}
.ds-info-text{font-size:15px;font-weight:600}
.ds-info-label{display:block;font-size:12px;color:var(--muted);font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:2px}

@media(prefers-reduced-motion:reduce){.ds *,.ds *:before,.ds *:after{animation:none!important;transition:none!important}}
`

export function DashboardTool() {
  const pendingComments = usePendingCommentCount()
  const pendingContacts = usePendingContactCount()
  const counts = useDashboardCounts()
  const postIssues = usePostIssueCounts()
  const draftPosts = useDraftPosts()
  const linkPageId = useLinkPageId()
  const dark = useTheme().sanity.color.dark
  const [now] = useState(() => new Date())

  const contentHealthTotal =
    counts && postIssues !== null ? counts.linkIssues + postIssues.auditIssues : null
  const totalPending =
    contentHealthTotal !== null && counts
      ? contentHealthTotal + counts.notFoundPending + counts.errorPending
      : null

  const summary = totalPending === 0 ? 'Nothing needs attention right now. Go write something.' : null

  const lastPublished = counts?.lastPublished?.publishedAt
  const dateLabel = now.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})

  return (
    <div className={`ds${dark ? ' ds-dark' : ''}`}>
      <style>{CSS}</style>
      <div className="ds-wrap">
        <header className="ds-hero ds-rise">
          {totalPending === 0 && (
            <div className="ds-celebrate" aria-hidden="true">
              {CONFETTI.map((i) => (
                <span
                  key={i}
                  className="ds-confetti"
                  style={{
                    left: `${6 + i * 6.6}%`,
                    background: ['var(--accent)', 'var(--good)', 'var(--bad)', 'var(--warn)'][i % 4],
                    animationDelay: `${(i % 5) * 90}ms`,
                  }}
                />
              ))}
            </div>
          )}
          <h1 className="ds-hello">
            {greetingFor(now.getHours())}, <span>Asher</span>.
          </h1>
          {summary && <p className="ds-sub">{summary}</p>}
          <div className="ds-chips">
            <span className="ds-chip">{dateLabel}</span>
            {counts && (
              <span className="ds-chip">
                <b>{counts.publishedCount}</b> posts live
              </span>
            )}
            {lastPublished && (
              <span className="ds-chip">
                Last one went out <b>{relativeTime(lastPublished)}</b>
              </span>
            )}
            {draftPosts !== null && draftPosts.length > 0 && (
              <span className="ds-chip">
                <b>{draftPosts.length}</b> draft{draftPosts.length === 1 ? '' : 's'} in progress
              </span>
            )}
          </div>
        </header>

        {draftPosts !== null && draftPosts.length > 0 && (
          <Section title="Continue a draft">
            <div className="ds-drafts">
              {draftPosts.slice(0, 5).map((post, i) => {
                const idle = idleDays(post._updatedAt)
                const left = SHELVE_AFTER_DAYS - idle
                const chipClass = left <= 7 ? 'ds-p-bad' : left <= 16 ? 'ds-p-warn' : ''
                return (
                  <button
                    key={post._id}
                    type="button"
                    className="ds-draft"
                    style={{animationDelay: `${i * 45}ms`}}
                    onClick={() => openDocumentInStudio('post', post._id.replace(/^drafts\./, ''))}
                  >
                    <span className="ds-tile">
                      <EditIcon />
                    </span>
                    <span className="ds-draft-title">{post.title || '(untitled post)'}</span>
                    <span className="ds-draft-meta">
                      Edited {relativeTime(post._updatedAt)}
                      <span className={`ds-pill ${chipClass}`}>
                        {left > 0 ? `Shelves in ${left}d` : 'Shelving tonight'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            {draftPosts.length > 5 && (
              <p className="ds-more">
                +{draftPosts.length - 5} more draft{draftPosts.length - 5 === 1 ? '' : 's'} — see Posts in
                Structure for the rest.
              </p>
            )}
          </Section>
        )}

        <Section title="Quick actions">
          <div className="ds-actions">
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={() => openDocumentInStudio('post', crypto.randomUUID())}
            >
              <AddDocumentIcon /> New post
            </button>
            {linkPageId && (
              <button type="button" className="ds-btn" onClick={() => openDocumentInStudio('linkPage', linkPageId)}>
                <LinkIcon /> Edit Link page
              </button>
            )}
            <a className="ds-btn" href={LINKS.calendar}>
              <CalendarIcon /> Schedule a post
            </a>
            <a className="ds-btn" href={NETLIFY_BILLING_URL} target="_blank" rel="noreferrer">
              <LaunchIcon /> Netlify usage &amp; credits
            </a>
          </div>
        </Section>

        <Section title="Comments & contact">
          <div className="ds-grid ds-two">
            <StatCard icon={CommentIcon} label="Pending comments" value={pendingComments} href={LINKS.comments} />
            <StatCard
              icon={EnvelopeIcon}
              label="Unread contact submissions"
              value={pendingContacts}
              href={LINKS.contactSubmissions}
              index={1}
            />
          </div>
        </Section>

        <Section title="Distribution">
          <div className="ds-grid ds-two">
            <StatCard
              icon={ShareIcon}
              label="Posts without social copy drafted"
              value={postIssues?.socialNeeded ?? null}
              href={LINKS.distribution}
            />
            <StatCard
              icon={CalendarIcon}
              label="Scheduled, not yet published"
              value={counts?.scheduledCount ?? null}
              tone="neutral"
              href={LINKS.calendar}
              index={1}
            />
          </div>
        </Section>

        <Section title="Pending issues">
          <div className="ds-grid">
            <StatCard icon={CheckmarkCircleIcon} label="Content Health issues" value={contentHealthTotal} href={LINKS.contentHealth} />
            <StatCard
              icon={LinkRemovedIcon}
              label="404 hits pending"
              value={counts?.notFoundPending ?? null}
              href={LINKS.notFoundHits}
              index={1}
            />
            <StatCard
              icon={BugIcon}
              label="Error log pending"
              value={counts?.errorPending ?? null}
              tone="bad"
              href={LINKS.errorLog}
              index={2}
            />
          </div>
        </Section>

        <Section title="Stats">
          <div className="ds-grid">
            <a href={LINKS.cookies} className="ds-stat ds-info ds-neutral">
              <span className="ds-tile">
                <ComponentIcon />
              </span>
              <span>
                <span className="ds-info-label">Cookie consent &amp; feedback</span>
                <span className="ds-info-text">
                  {counts?.consent
                    ? `${counts.consent.acceptedCount ?? 0} accepted · ${counts.consent.declinedCount ?? 0} declined · ${counts.feedbackCount ?? 0} taste-test${counts.feedbackCount === 1 ? '' : 's'}`
                    : '—'}
                </span>
              </span>
            </a>
            <StatCard
              icon={SearchIcon}
              label="Search queries needing a look"
              value={counts?.searchPending ?? null}
              tone="neutral"
              href={LINKS.searchQueries}
              index={1}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}
