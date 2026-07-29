import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {contactSubmissionType} from './contactSubmissionType'
import {aiPromptSettingsType} from './aiPromptSettingsType'
import {notFoundHitType} from './notFoundHitType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, categoryType, postType, authorType, contactSubmissionType, aiPromptSettingsType, notFoundHitType],
}
