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
import {withCategoryDeleteGuard} from './src/sanity/actions/categoryDeleteGuard'
import {MediaLibraryTool} from './src/sanity/components/MediaLibraryTool'
import {CommentsTool} from './src/sanity/components/CommentsTool'
import {CommentsToolIcon} from './src/sanity/components/CommentsToolIcon'
import {StudioNavbar} from './src/sanity/components/StudioNavbar'
import {NotFoundHitsTool} from './src/sanity/components/NotFoundHitsTool'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'

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
  ],
})
