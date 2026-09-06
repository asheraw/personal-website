import {DocumentIcon} from '@sanity/icons/Document'
import {defineField, defineType} from 'sanity'
import {SlugAutoGenerateInput} from '../components/SlugAutoGenerateInput'

// Every one of these already-existing top-level routes would silently
// shadow a Page with the same slug (Next.js always resolves a literal,
// more-specific route before falling back to the root [slug] catch-all --
// see src/app/(site)/[slug]/page.tsx) -- blocked here so an editor finds
// out in Studio's own validation, not by publishing a Page that quietly
// never renders.
export const RESERVED_PAGE_SLUGS = ['blog', 'connect', 'link', 'privacy', 'studio', 'api']

// A generic content type for one-off static pages -- asheraw.com/about,
// /terms, whatever comes next -- living directly at the site root
// (asheraw.com/whatever-slug), not nested under /page/. Deliberately does
// NOT replace linkPage or the hand-coded /connect route: those are already
// working, purpose-built for their specific jobs (a curated card list, a
// handful of connected-account fields) -- this exists for the actual gap,
// a plain new page with nowhere to live without writing code each time.
export const pageType = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Lives at asheraw.com/<this>, not under /page/.',
      options: {source: 'title'},
      components: {input: SlugAutoGenerateInput},
      validation: (rule) =>
        rule.required().custom((slug) => {
          const current = slug?.current
          if (current && RESERVED_PAGE_SLUGS.includes(current)) {
            return `"${current}" is already a real page on the site (asheraw.com/${current}) -- pick a different slug.`
          }
          return true
        }),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / meta description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160).warning('Past ~160 characters this gets cut off in Google and social previews.'),
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title override (optional)',
      type: 'string',
      description: 'Leave blank to just use the page title.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Google (noindex)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare: ({title, slug}) => ({
      title: title || 'Untitled page',
      subtitle: slug ? `asheraw.com/${slug}` : 'No slug yet',
    }),
  },
})
