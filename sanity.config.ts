'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineLocations, defineDocuments} from 'sanity/presentation'

import {dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {withAutoPublishDate} from './src/sanity/actions/publishWithDate'
import {withPrePublishChecklist} from './src/sanity/actions/prepareForPublish'
import {withRevalidateOnPublish} from './src/sanity/actions/revalidateOnPublish'
import {openInPresentationAction} from './src/sanity/actions/openInPresentation'
import {createSuggestImagePromptAction} from './src/sanity/actions/suggestImagePrompt'
import {createExportAction} from './src/sanity/actions/exportPost'
import {withCategoryDeleteGuard} from './src/sanity/actions/categoryDeleteGuard'
import {MediaLibraryTool} from './src/sanity/components/MediaLibraryTool'
import {compressedUploadSource} from './src/sanity/components/CompressedUploadSource'
import {CommentsTool} from './src/sanity/components/CommentsTool'
import {CommentsToolIcon} from './src/sanity/components/CommentsToolIcon'
import {StudioNavbar} from './src/sanity/components/StudioNavbar'
import {DistributionDashboardTool} from './src/sanity/components/DistributionDashboardTool'
import {EditorialCalendarTool} from './src/sanity/components/EditorialCalendarTool'
import {ContentHealthTool} from './src/sanity/components/ContentHealthTool'
import {DashboardTool} from './src/sanity/components/DashboardTool'
import {ImageIcon} from '@sanity/icons/Image'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ShareIcon} from '@sanity/icons/Share'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {HomeIcon} from '@sanity/icons/Home'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  // Sanity's own Content Releases feature -- never explicitly set up, just
  // appears by default in Studio v6. Turned off: the Editorial Calendar
  // tool already covers real scheduling needs, and this was just adding a
  // top-nav item nobody uses. Vision (raw GROQ console, removed from
  // `plugins` below) went for the same reason -- a developer tool on a
  // site run by a non-technical owner.
  releases: {enabled: false},
  studio: {
    components: {
      // Floating "N comments need review" badge, always visible regardless
      // of which tool is open -- see StudioNavbar/CommentsNavbarBadge for
      // why this replaced relying on the Comments tool's own icon slot.
      navbar: StudioNavbar,
    },
  },
  form: {
    // Adds "Upload (compressed)" as a SECOND option alongside Studio's own
    // default "Upload" on every image field site-wide (post images, author
    // avatar, site settings) -- deliberately additive, not a replacement.
    // See CompressedUploadSource.tsx for why: replacing the default upload
    // mechanism everywhere isn't something that can be interactively
    // verified without a real Studio login, too risky for the editor Asher
    // uses daily. This only ever appends; the existing default source and
    // its behavior are completely untouched.
    image: {
      assetSources: (prev) => [...prev, compressedUploadSource],
    },
  },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'category') {
        return prev.map((action) =>
          (action as {action?: string}).action === 'delete' ? withCategoryDeleteGuard(action) : action
        )
      }
      if (context.schemaType !== 'post') return prev
      // Sanity's own built-in "Schedule publish" action (id: 'schedule')
      // requires the paid Scheduled Publishing add-on -- clicking it
      // without that plan just shows an upsell dialog, not a working
      // feature. This site has its own free scheduling already (the
      // "Schedule for later" field on the post itself, checked by a daily
      // cron -- see publish-scheduled/route.ts), so the built-in one is
      // pure confusion with no upside: dropped entirely rather than left
      // in the menu to be clicked by mistake (confirmed 2026-08-29, Asher
      // hit the paywall trying it).
      const withoutNativeSchedule = prev.filter((action) => (action as {action?: string}).action !== 'schedule')
      const withDateAction = withoutNativeSchedule.map((action) =>
        (action as {action?: string}).action === 'publish'
          ? withPrePublishChecklist(withAutoPublishDate(withRevalidateOnPublish(action)))
          : action
      )
      // Publish must stay the primary (first) action -- Studio renders
      // whichever action is first as the big prominent button. Everything
      // else goes after it as secondary actions instead.
      // Suggest SEO, Draft Social Copy, Draft LinkedIn Post, Draft Video
      // Script, Draft Image Carousel, and Generate Featured Image all moved
      // OUT of this menu into the post editor's own "AI Tools" tab
      // (structure.tsx) -- a visible tab beats a menu item buried ~14 deep.
      // Suggest Image Prompt stays here; it already has its own better
      // entry point right next to the Featured Image field
      // (MainImageInputWithSuggestPrompt.tsx), unrelated to this move.
      return [
        withDateAction[0],
        openInPresentationAction,
        createSuggestImagePromptAction(),
        createExportAction(),
        ...withDateAction.slice(1),
      ]
    },
  },
  plugins: [
    structureTool({structure}),
    // Live preview: click "Preview" on a post to see it rendered on the
    // real site -- including unpublished drafts -- with desktop/tablet/
    // mobile viewport switching built in. Requires SANITY_API_READ_TOKEN
    // to be set (see RUNBOOK.md).
    presentationTool({
      previewUrl: {
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      resolve: {
        // Lets Presentation figure out "which document is this page?" when
        // you're browsing a URL directly, instead of only when you arrive
        // via a document's own preview link.
        mainDocuments: defineDocuments([
          {
            route: '/blog/:slug',
            filter: `_type == "post" && slug.current == $slug`,
          },
        ]),
        locations: {
          post: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {title: doc?.title || 'Untitled post', href: `/blog/${doc?.slug}`},
                {title: 'Blog index', href: '/blog'},
              ],
            }),
          }),
        },
      },
    }),
  ],
  // Kept deliberately short (2026-08-05 cleanup) -- top nav had grown to 14
  // items across a session of shipping tools one at a time, never stepping
  // back to look at the whole bar together. What's left here is daily/
  // frequent-use tools only; occasional admin tools (404 Hits, Contact
  // Submissions, Export, Bulk Operations) moved into the Structure
  // sidebar's own "Site Admin" section instead (see structure.tsx) --
  // Structure Builder's S.component() embeds the exact same components,
  // nothing lost, just organized by how often each one actually gets
  // opened rather than all flattened into one bar.
  tools: (prev) => [
    // Prepended, not appended -- Studio renders whichever tool is first in
    // this array as the default view at the bare /studio root. Everything
    // else keeps its exact existing route (name-based, e.g. /studio/comments),
    // only what loads with no path changes. Asher's own ask (2026-08-11):
    // land on an overview instead of Structure/Posts by default.
    {name: 'dashboard', title: 'Dashboard', icon: HomeIcon, component: DashboardTool},
    ...prev,
    // A custom top-nav tool (not a document-type list, since image assets
    // aren't browsed that way) showing every uploaded image and which
    // posts actually use it -- the media-library-level equivalent of the
    // "Posts" tab already on every category.
    {name: 'media-library', title: 'Media', icon: ImageIcon, component: MediaLibraryTool},
    // Comment moderation queue -- one-click approve/reject instead of
    // opening, editing, and saving each comment document individually.
    // `icon` is a live component (polls every 30s, see
    // usePendingCommentCount) so a pending count *can* show as a badge on
    // it -- but Studio's navbar only renders this icon in narrow/overflow
    // contexts, showing tool names as plain text at normal widths, so it's
    // not reliably visible. The always-visible signal is the floating
    // navbar badge (studio.components.navbar -> StudioNavbar, above).
    {name: 'comments', title: 'Comments', icon: CommentsToolIcon, component: CommentsTool},
    // Distribution dashboard -- drafted-social-copy status, share counts,
    // and a manual engagement log, per post, replacing the plain Social
    // Shares list (folded into this instead of living alongside it).
    {
      name: 'distribution',
      title: 'Distribution',
      icon: ShareIcon,
      component: DistributionDashboardTool,
    },
    // Drag-and-drop month view -- published posts by publishedAt,
    // scheduled-but-unpublished drafts by scheduledPublishAt (auto-
    // published daily by /api/cron/publish-scheduled). Free: a plain
    // Studio tool patching a normal field, not Sanity's paid Schedule
    // Publishing feature.
    {name: 'editorial-calendar', title: 'Calendar', icon: CalendarIcon, component: EditorialCalendarTool},
    // Content Audit (missing metadata) and Link Checker (broken/affiliate
    // links) merged into one tabbed tool -- real overlap, both are "which
    // posts need a look" checks. See ContentHealthTool.tsx.
    {name: 'content-health', title: 'Content Health', icon: CheckmarkCircleIcon, component: ContentHealthTool},
  ],
})
