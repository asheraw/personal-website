import {SparklesIcon} from '@sanity/icons/Sparkles'
import {CogIcon} from '@sanity/icons/Cog'
import {ComponentIcon} from '@sanity/icons/Component'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {WrenchIcon} from '@sanity/icons/Wrench'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {DownloadIcon} from '@sanity/icons/Download'
import {EditIcon} from '@sanity/icons/Edit'
import {SearchIcon} from '@sanity/icons/Search'
import type {StructureResolver} from 'sanity/structure'
import {ReferencedByPostsView} from './components/ReferencedByPostsView'
import {SeoPreviewView} from './components/SeoPreviewView'
import {NotFoundHitsTool} from './components/NotFoundHitsTool'
import {ContactSubmissionsTool} from './components/ContactSubmissionsTool'
import {ExportTool} from './components/ExportTool'
import {BulkOperationsTool} from './components/BulkOperationsTool'
import {SearchQueriesTool} from './components/SearchQueriesTool'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Blog')
    .items([
      // Custom child so every post also gets an "SEO Preview" tab
      // alongside the normal Editor form -- approximate Google/social
      // previews, character-count guidance, and the same "worth a look"
      // checklist the pre-publish dialog shows, but visible the whole
      // time you're writing instead of only right before Publish.
      S.listItem()
        .title('Posts')
        .schemaType('post')
        .child(
          S.documentTypeList('post')
            .title('Posts')
            .child((postId) =>
              S.document()
                .documentId(postId)
                .schemaType('post')
                .views([S.view.form(), S.view.component(SeoPreviewView).title('SEO Preview')]),
            ),
        ),
      // Custom child (instead of the plain documentTypeListItem default) so
      // each category gets a second "Posts" tab alongside the normal Editor
      // form -- shows which posts use it before you decide to delete it.
      S.listItem()
        .title('Categories')
        .schemaType('category')
        .child(
          S.documentTypeList('category')
            .title('Categories')
            .child((categoryId) =>
              S.document()
                .documentId(categoryId)
                .schemaType('category')
                .views([
                  S.view.form(),
                  S.view
                    .component((props) => <ReferencedByPostsView {...props} itemLabel="category" />)
                    .title('Posts'),
                ]),
            ),
        ),
      S.documentTypeListItem('author').title('Authors'),
      S.divider(),
      // Same "Posts" tab pattern as categories -- see which posts insert a
      // given snippet before editing or deleting it.
      S.listItem()
        .title('Reusable Snippets')
        .icon(ComponentIcon)
        .schemaType('snippet')
        .child(
          S.documentTypeList('snippet')
            .title('Reusable Snippets')
            .child((snippetId) =>
              S.document()
                .documentId(snippetId)
                .schemaType('snippet')
                .views([
                  S.view.form(),
                  S.view
                    .component((props) => <ReferencedByPostsView {...props} itemLabel="snippet" />)
                    .title('Used in'),
                ]),
            ),
        ),
      S.divider(),
      // Social Shares moved to a top-nav tool (see sanity.config.ts) --
      // folded into the Distribution dashboard alongside drafted-copy
      // status and a manual engagement log, instead of a standalone list.
      S.documentTypeListItem('redirect').title('Redirects'),
      S.divider(),
      // Occasional admin/maintenance tools, grouped under one named entry
      // instead of each getting its own top-nav slot (2026-08-05 cleanup --
      // the top bar had grown to 14 items). S.component() embeds the exact
      // same tool components that used to live in sanity.config.ts's
      // `tools` array -- nothing lost, just organized by how often each one
      // actually gets opened. Comments, Distribution, and Calendar stayed
      // in the top nav since those are daily/frequent, not occasional.
      S.listItem()
        .title('Site Admin')
        .icon(WrenchIcon)
        .child(
          S.list()
            .title('Site Admin')
            .items([
              S.listItem()
                .title('404 Hits')
                .icon(LinkRemovedIcon)
                .child(S.component(NotFoundHitsTool).title('404 Hits')),
              S.listItem()
                .title('Contact Submissions')
                .icon(EnvelopeIcon)
                .child(S.component(ContactSubmissionsTool).title('Contact Submissions')),
              S.listItem()
                .title('Export')
                .icon(DownloadIcon)
                .child(S.component(ExportTool).title('Export')),
              S.listItem()
                .title('Bulk Operations')
                .icon(EditIcon)
                .child(S.component(BulkOperationsTool).title('Bulk Operations')),
              S.listItem()
                .title('Search Queries')
                .icon(SearchIcon)
                .child(S.component(SearchQueriesTool).title('Search Queries')),
            ]),
        ),
      S.divider(),
      // Singletons: always open one fixed document, never a list -- there
      // should only ever be exactly one of each.
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('AI Suggestion Settings')
        .icon(SparklesIcon)
        .child(S.document().schemaType('aiPromptSettings').documentId('aiPromptSettings')),
      // Review queue for AI Workspace -- every suggestion either AI feature
      // has made, and whether it was actually used. Not a queue that
      // blocks anything, purely a browsable record.
      S.listItem()
        .title('AI Output Log')
        .icon(DocumentsIcon)
        .schemaType('aiOutputLog')
        .child(
          S.documentTypeList('aiOutputLog')
            .title('AI Output Log')
            .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Cookie Consent Log')
        .icon(BarChartIcon)
        .child(S.document().schemaType('consentLog').documentId('consentLog')),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() &&
          ![
            'post',
            'category',
            'author',
            'contactSubmission',
            'notFoundHit',
            'aiPromptSettings',
            'siteSettings',
            'snippet',
            'comment',
            'redirect',
            'consentLog',
            'shareLog',
            'aiOutputLog',
            'linkCheck',
            'imageAssetAlt',
            'bulkOperationLog',
            'searchQueryLog',
          ].includes(item.getId()!),
      ),
    ])
