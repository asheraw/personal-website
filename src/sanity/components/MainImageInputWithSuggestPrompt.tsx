import {useFormValue} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {Stack} from '@sanity/ui'
import {SuggestImagePromptButton} from './SuggestImagePromptButton'
import type {ImagePromptSource} from './SuggestImagePromptShared'

// Inlines the "Suggest Image Prompt" button right underneath the Featured
// Image field itself -- Asher's own ask (2026-08-29): drafting ideas for
// the photo he's about to add should live right where he's adding it,
// instead of behind the Publish button's "..." menu. Same
// useFormValue-for-sibling-fields pattern as TitleInputWithSeoSuggest.tsx.
export function MainImageInputWithSuggestPrompt(props: ObjectInputProps) {
  const source: ImagePromptSource = {
    title: useFormValue(['title']) as string | undefined,
    body: useFormValue(['body']),
    slug: useFormValue(['slug']) as {current?: string} | undefined,
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <SuggestImagePromptButton source={source} />
    </Stack>
  )
}
