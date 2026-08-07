import {TrashIcon} from '@sanity/icons/Trash'
import {defineField, defineType} from 'sanity'

// Marks a `sanity.imageAsset` as trashed -- same companion-document trick
// as imageAssetAltType.ts, for the same reason: `sanity.imageAsset` is a
// Sanity system type and can't be extended with custom fields directly, so
// there's nowhere on the asset itself to put a `trashedAt` field the way
// commentType.ts's own trashedAt field works for comments. `assetId` is a
// plain string (the real asset's own `_id`), not a `reference`, for the
// exact same reason imageAssetAltType.ts's own assetId field is a plain
// string -- `sanity.imageAsset` isn't a valid reference target.
//
// Same 30-day retention as comments (see /api/cron/purge-trash and
// TRASH_RETENTION_DAYS in MediaLibraryTool.tsx) -- the daily purge cron
// deletes both this document and the real asset once trashedAt is 30+ days
// old, but only after re-confirming the asset isn't still referenced by
// any post (the same `references()` check MediaLibraryTool.tsx's own
// "Used in N posts" badge already runs) -- a post that still points at a
// trashed image shouldn't have that image actually deleted out from under
// it just because nobody restored it in time.
export const imageAssetTrashType = defineType({
  name: 'imageAssetTrash',
  title: 'Image Asset Trash',
  type: 'document',
  icon: TrashIcon,
  fields: [
    defineField({name: 'assetId', title: 'Image asset ID', type: 'string', readOnly: true}),
    defineField({name: 'trashedAt', title: 'Trashed at', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {assetId: 'assetId', trashedAt: 'trashedAt'},
    prepare: ({assetId, trashedAt}) => ({
      title: assetId || '(unknown asset)',
      subtitle: trashedAt ? `Trashed ${new Date(trashedAt).toLocaleDateString()}` : undefined,
    }),
  },
})
