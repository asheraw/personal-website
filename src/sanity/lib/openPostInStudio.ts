// Shared by every tool with an "open this in Studio" button (ContentAuditTool,
// DistributionDashboardTool, LinkCheckerTool, ...) -- opens a document
// straight into its own Studio editor in a new tab, rather than the live
// site. The URL's document-type segment matches the schema type name
// because structure.tsx's Posts/Reusable Snippets list items don't
// override their pane id, so it defaults to the schemaType -- confirmed
// working for 'post' already; 'snippet' follows the identical pattern.
export function openDocumentInStudio(schemaType: 'post' | 'snippet', id: string) {
  window.open(`/studio/structure/${schemaType};${id}`, '_blank')
}

export function openPostInStudio(postId: string) {
  openDocumentInStudio('post', postId)
}
