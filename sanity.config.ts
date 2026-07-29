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
import {withCategoryDeleteGuard} from './src/sanity/actions/categoryDeleteGuard'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
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
})
