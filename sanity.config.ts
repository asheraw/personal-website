'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineLocations, defineDocuments} from 'sanity/presentation'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {withAutoPublishDate} from './src/sanity/actions/publishWithDate'
import {withPrePublishChecklist} from './src/sanity/actions/prepareForPublish'
import {openInPresentationAction} from './src/sanity/actions/openInPresentation'
import {createSuggestSeoAction} from './src/sanity/actions/suggestSeo'
import {createSuggestSocialCopyAction} from './src/sanity/actions/suggestSocialCopy'
import {createSuggestImagePromptAction} from './src/sanity/actions/suggestImagePrompt'
import {createExportAction} from './src/sanity/actions/exportPost'
import {withCategoryDeleteGuard} from './src/sanity/actions/categoryDeleteGuard'
import {MediaLibraryTool} from './src/sanity/components/MediaLibraryTool'
import {CommentsTool} from './src/sanity/components/CommentsTool'
import {CommentsToolIcon} from './src/sanity/components/CommentsToolIcon'
import {StudioNavbar} from './src/sanity/components/StudioNavbar'
import {NotFoundHitsTool} from './src/sanity/components/NotFoundHitsTool'
import {ContactSubmissionsTool} from './src/sanity/components/ContactSubmissionsTool'
import {LinkCheckerTool} from './src/sanity/components/LinkCheckerTool'
import {DistributionDashboardTool} from './src/sanity/components/DistributionDashboardTool'
import {EditorialCalendarTool} from './src/sanity/components/EditorialCalendarTool'
import {ExportTool} from './src/sanity/components/ExportTool'
import {ContentAuditTool} from './src/sanity/components/ContentAuditTool'
import {BulkOperationsTool} from './src/sanity/components/BulkOperationsTool'
import {ImageIcon} from '@sanity/icons/Image'
import {ClockIcon} from '@sanity/icons/Clock'
import {EditIcon} from '@sanity/icons/Edit'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {LinkIcon} from '@sanity/icons/Link'
import {ShareIcon} from '@sanity/icons/Share'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {DownloadIcon} from '@sanity/icons/Download'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  studio: {
    components: {
      // Floating "N comments need review" badge, always visible regardless
      // of which tool is open -- see StudioNavbar/CommentsNavbarBadge for
      // why this replaced relying on the Comments tool's own icon slot.
      navbar: StudioNavbar,
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
      const withDateAction = prev.map((action) =>
        (action as {action?: string}).action === 'publish'
          ? withPrePublishChecklist(withAutoPublishDate(action))
          : action
      )
      // Publish must stay the primary (first) action -- Studio renders
      // whichever action is first as the big prominent button. Everything
      // else goes after it as secondary actions instead.
      return [
        withDateAction[0],
        openInPresentationAction,
        createSuggestSeoAction(),
        createSuggestSocialCopyAction(),
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
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  tools: (prev) => [
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
    // 404 hits, one overview page instead of clicking into each path's own
    // document -- most-hit paths first, with a per-path expandable full hit
    // log (every timestamp + referrer) for spotting scanning/bruteforcing
    // patterns rather than just first/last seen.
    {name: 'not-found-hits', title: '404 Hits', icon: LinkRemovedIcon, component: NotFoundHitsTool},
    // Contact form submissions, table view -- one overview page with a
    // Handled checkbox and delete, instead of clicking into each
    // submission's own document.
    {
      name: 'contact-submissions',
      title: 'Contact Submissions',
      icon: EnvelopeIcon,
      component: ContactSubmissionsTool,
    },
    // Broken-link checker, external-link monitor, and affiliate-link
    // registry in one tool -- every link inside a post/snippet's own text,
    // checked live and re-checked weekly (vercel.json cron).
    {name: 'link-checker', title: 'Link Checker', icon: LinkIcon, component: LinkCheckerTool},
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
    // Export -- the "no vendor lock-in" escape hatch. Every published post,
    // in whichever of five formats (Markdown/JSON/HTML/EPUB/PDF) is picked,
    // zipped client-side. The per-post equivalent (works on an unpublished
    // draft too) lives as the "Export…" document action button, not here.
    {name: 'export', title: 'Export', icon: DownloadIcon, component: ExportTool},
    // Missing-metadata check -- no featured image, no alt text, no
    // excerpt, no category -- across every published post. Deliberately
    // not "stale by age": asked Asher directly and old posts aging isn't
    // something he wants flagged for a personal blog with no expiring
    // content.
    {name: 'content-audit', title: 'Content Audit', icon: ClockIcon, component: ContentAuditTool},
    // Bulk field edits (tag/category/author) and search & replace across
    // many posts at once, both with a real undo log (Studio -> Bulk
    // Operations -> History). See bulkOperationLogType.ts and
    // src/lib/bulkOperations.ts for the actual change-computation logic.
    {name: 'bulk-operations', title: 'Bulk Operations', icon: EditIcon, component: BulkOperationsTool},
  ],
})
