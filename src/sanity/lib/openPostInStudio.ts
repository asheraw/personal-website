// Shared by every tool with an "Open post" button (ContentAuditTool,
// DistributionDashboardTool, ...) -- opens a post straight into its own
// Studio editor in a new tab, rather than the live site.
export function openPostInStudio(postId: string) {
  window.open(`/studio/structure/post;${postId}`, '_blank')
}
