import {SparklesIcon} from '@sanity/icons/Sparkles'
import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Blog')
    .items([
      S.documentTypeListItem('post').title('Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('author').title('Authors'),
      S.divider(),
      S.documentTypeListItem('contactSubmission').title('Contact Submissions'),
      S.divider(),
      // Singleton: always opens this one fixed document, never a list --
      // there should only ever be exactly one AI Suggestion Settings doc.
      S.listItem()
        .title('AI Suggestion Settings')
        .icon(SparklesIcon)
        .child(S.document().schemaType('aiPromptSettings').documentId('aiPromptSettings')),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() &&
          !['post', 'category', 'author', 'contactSubmission', 'aiPromptSettings'].includes(item.getId()!),
      ),
    ])
