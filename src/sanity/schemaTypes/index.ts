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
import {imageAssetAltType} from './imageAssetAltType'
import {bulkOperationLogType} from './bulkOperationLogType'
import {searchQueryLogType} from './searchQueryLogType'
import {errorLogType} from './errorLogType'
import {imageAssetTrashType} from './imageAssetTrashType'
import {linkPageType} from './linkPageType'
import {cookieFeedbackType} from './cookieFeedbackType'
import {cookieBannerCopyType} from './cookieBannerCopyType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, categoryType, postType, authorType, contactSubmissionType, aiPromptSettingsType, notFoundHitType, siteSettingsType, snippetType, commentType, redirectType, consentLogType, shareLogType, aiOutputLogType, linkCheckType, imageAssetAltType, bulkOperationLogType, searchQueryLogType, errorLogType, imageAssetTrashType, linkPageType, cookieFeedbackType, cookieBannerCopyType],
}
