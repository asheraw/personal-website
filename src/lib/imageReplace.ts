// Pure logic for Media Library -> "Replace image" (MediaLibraryTool.tsx).
// Sanity assets are immutable and content-addressed -- there's no "overwrite
// this asset's bytes" operation. Replacing an image means: upload the new
// file as its own new asset, then walk every document that references the
// old asset's _id and repoint each reference to the new one. Deliberately
// generic rather than hardcoded to mainImage/body/socialImage -- an image
// can appear in a post's main image, its social image, inside body
// portable text (including gallery arrays), an author's avatar, or site
// settings, and a hardcoded field list would silently miss whichever one
// isn't covered yet. Walking the whole document tree and diffing per
// top-level field covers all of them uniformly -- the same "whole-field
// snapshot" approach bulkOperations.ts already uses for its undo log,
// which this feature logs into (`bulkOperationLog`, operationType
// "replaceImage") so it gets the same History/Undo support for free.

export type ImageFieldChange = {
  documentId: string;
  documentType: string;
  documentTitle: string;
  fieldPath: string;
  previousValue: unknown;
  newValue: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Returns [value, didChange]. Only rebuilds objects/arrays on a branch that
// actually contains the old asset ref, so untouched branches keep their
// original identity rather than every field being needlessly cloned.
function deepReplaceRef(value: unknown, oldId: string, newId: string): [unknown, boolean] {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const [v, c] = deepReplaceRef(item, oldId, newId);
      if (c) changed = true;
      return c ? v : item;
    });
    return changed ? [next, true] : [value, false];
  }
  if (isPlainObject(value)) {
    if (value._ref === oldId) {
      return [{ ...value, _ref: newId }, true];
    }
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const [nv, c] = deepReplaceRef(v, oldId, newId);
      next[k] = c ? nv : v;
      if (c) changed = true;
    }
    return changed ? [next, true] : [value, false];
  }
  return [value, false];
}

const SYSTEM_FIELDS = new Set(["_id", "_rev", "_type", "_createdAt", "_updatedAt"]);

/** Diffs one already-fetched document against an old/new asset id pair -- every top-level field that references the old asset gets one change entry, whole-field-snapshot style. */
export function computeImageReplaceChanges(
  doc: Record<string, unknown>,
  oldAssetId: string,
  newAssetId: string,
): ImageFieldChange[] {
  const title = (doc.title as string) || (doc.name as string) || (doc._id as string);
  const changes: ImageFieldChange[] = [];
  for (const [key, val] of Object.entries(doc)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    const [newVal, changed] = deepReplaceRef(val, oldAssetId, newAssetId);
    if (changed) {
      changes.push({
        documentId: doc._id as string,
        documentType: doc._type as string,
        documentTitle: title,
        fieldPath: key,
        previousValue: val,
        newValue: newVal,
      });
    }
  }
  return changes;
}

export function summarizeImageReplace(filename: string, changes: ImageFieldChange[]): string {
  const docs = new Set(changes.map((c) => c.documentId)).size;
  return `Replaced "${filename}" in ${docs} place${docs === 1 ? "" : "s"}`;
}
