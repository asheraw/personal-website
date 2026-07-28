'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineLocations} from 'sanity/presentation'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {withAutoPublishDate} from './src/sanity/actions/publishWithDate'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    actions: (prev, context) => {
      if (context.schemaType !== 'post') return prev
      return prev.map((action) =>
        (action as {action?: string}).action === 'publish' ? withAutoPublishDate(action) : action
      )
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
