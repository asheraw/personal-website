import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {contactSubmissionType} from './contactSubmissionType'
import {aiPromptSettingsType} from './aiPromptSettingsType'
import {notFoundHitType} from './notFoundHitType'
import {siteSettingsType} from './siteSettingsType'
import {snippetType} from './snippetType'
import {commentType} from './commentType'
import {redirectType} from './redirectType'
import {consentLogType} from './consentLogType'
import {shareLogType} from './shareLogType'
import {aiOutputLogType} from './aiOutputLogType'
import {linkCheckType} from './linkCheckType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, categoryType, postType, authorType, contactSubmissionType, aiPromptSettingsType, notFoundHitType, siteSettingsType, snippetType, commentType, redirectType, consentLogType, shareLogType, aiOutputLogType, linkCheckType],
}
