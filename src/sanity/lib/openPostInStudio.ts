// Shared by every tool with an "open this in Studio" button (ContentAuditTool,
// DistributionDashboardTool, LinkCheckerTool, ...) -- opens a document
// straight into its own Studio editor, in the same tab: every caller is
// already inside Studio itself clicking to go work on a document, not
// switching away from something else worth keeping open (Asher's own ask,
// 2026-09-06 -- unlike Presentation preview, which deliberately opens
// alongside the editor in its own tab).
//
// Uses Sanity's own "intent" URL scheme (documented, stable, resolved
// dynamically at runtime by Studio's router) rather than constructing a
// structure-tool pane path (`/studio/structure/<paneId>;<id>`) by hand --
// that first version *looked* right (it types, it builds) but never
// actually opened the editor when clicked, because a pane path depends on
// exactly how structure.tsx nests things, which isn't something to
// hand-guess from outside the structure tree. `intent/edit` doesn't care
// about pane topology at all -- it finds the document by id/type and opens
// whatever the right editor view is, however structure.tsx is shaped.
export function openDocumentInStudio(schemaType: 'post' | 'snippet' | 'page' | 'linkPage', id: string) {
  window.location.href = `/studio/intent/edit/id=${encodeURIComponent(id)};type=${schemaType}/`
}

export function openPostInStudio(postId: string) {
  openDocumentInStudio('post', postId)
}
