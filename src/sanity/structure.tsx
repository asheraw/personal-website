import {SparklesIcon} from '@sanity/icons/Sparkles'
import {CogIcon} from '@sanity/icons/Cog'
import {ComponentIcon} from '@sanity/icons/Component'
import type {StructureResolver} from 'sanity/structure'
import {ReferencedByPostsView} from './components/ReferencedByPostsView'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Blog')
    .items([
      S.documentTypeListItem('post').title('Posts'),
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
      S.documentTypeListItem('contactSubmission').title('Contact Submissions'),
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
          ].includes(item.getId()!),
      ),
    ])
