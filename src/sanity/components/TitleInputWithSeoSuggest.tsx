import {useFormValue} from 'sanity'
import type {StringInputProps} from 'sanity'
import {Stack} from '@sanity/ui'
import {SuggestSeoButton} from './SuggestSeoButton'
import type {PostDraft} from './SuggestSeoShared'

// Inlines the same "Suggest SEO & Excerpt" button already available from
// the Publish button's overflow menu (suggestSeo.tsx) and the SEO Preview
// tab (SuggestSeoButton.tsx, SeoPreviewView.tsx), right underneath the
// Title field itself -- Asher's own ask (2026-08-29): this is one of only
// two AI-assist actions he wants living in the actual writing flow instead
// of behind "...", specifically because title is the field it most
// directly affects (alternative headlines patch straight into it).
//
// `useFormValue` reads sibling fields the same way PrimaryCategoryInput.tsx
// already does -- a field-level input component only gets its own value via
// props, not the rest of the document, so sourcing body/tags/slug (needed
// for the actual suggestion request) has to go through this hook instead.
// `_id` needs the `drafts.` prefix stripped the same way SeoPreviewView.tsx
// already does, since useDocumentOperation (inside SuggestSeoButton) wants
// the bare document id.
export function TitleInputWithSeoSuggest(props: StringInputProps) {
  const rawId = useFormValue(['_id']) as string | undefined
  const documentId = rawId?.replace(/^drafts\./, '')
  const source: PostDraft = {
    title: useFormValue(['title']) as string | undefined,
    body: useFormValue(['body']),
    tags: useFormValue(['tags']) as string[] | undefined,
    slug: useFormValue(['slug']) as {current?: string} | undefined,
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      {documentId && <SuggestSeoButton documentId={documentId} source={source} />}
    </Stack>
  )
}
