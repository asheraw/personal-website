import {SparklesIcon} from '@sanity/icons/Sparkles'
import {CogIcon} from '@sanity/icons/Cog'
import {ComponentIcon} from '@sanity/icons/Component'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {ShareIcon} from '@sanity/icons/Share'
import {DocumentsIcon} from '@sanity/icons/Documents'
import type {StructureResolver} from 'sanity/structure'
import {ReferencedByPostsView} from './components/ReferencedByPostsView'
import {SeoPreviewView} from './components/SeoPreviewView'

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
      // Contact Submissions moved to a top-nav tool (see sanity.config.ts) --
      // a genuine table view with a Handled checkbox and delete, instead of
      // clicking into each submission's own document.
      S.documentTypeListItem('redirect').title('Redirects'),
      // Default-sorted by total shares (most-shared post first) rather
      // than creation date -- that's the actually useful question here
      // ("what's getting shared"), not "what was shared most recently."
      S.listItem()
        .title('Social Shares')
        .icon(ShareIcon)
        .schemaType('shareLog')
        .child(
          S.documentTypeList('shareLog')
            .title('Social Shares')
            .defaultOrdering([{field: 'totalShares', direction: 'desc'}]),
        ),
      // 404 Hits moved to a top-nav tool (see sanity.config.ts) -- a single
      // overview page listing every path, instead of clicking into each
      // one's own document.
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
          ].includes(item.getId()!),
      ),
    ])
