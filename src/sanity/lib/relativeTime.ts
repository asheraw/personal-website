// Extracted from CommentsTool.tsx the moment DashboardTool.tsx needed the
// exact same "2h ago" / "3d ago" formatting -- a second real consumer,
// not speculative sharing.
export function relativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})
}
