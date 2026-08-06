import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

// A few seconds' grace after Publish is clicked before calling
// /api/revalidate -- long enough for Sanity's own systems to settle after
// the publish operation is dispatched, so the revalidated page isn't
// racing a document that (from Sanity's own side) hasn't fully finished
// publishing yet.
const REVALIDATE_DELAY_MS = 4000

// Wraps the default Publish action for posts so the live site refreshes
// itself automatically a few seconds after every publish -- no separate
// step, no URL to remember, nothing for Asher to do differently. Exists
// because sanityFetch()'s own automatic cache-clearing (via Sanity's Live
// Content API pushing a live event through) isn't 100% reliable -- see
// RUNBOOK.md's "Publishing" section for the incident that showed this.
// This wrapper doesn't replace that mechanism, it's a second, independent
// path to the same result: whichever one actually fires first wins,
// nothing conflicts by having both.
//
// Best-effort only, same as this project's other background side effects
// (comment/contact notification emails, etc.) -- a failed or skipped call
// here never blocks Publish or shows an error; worst case the site just
// takes as long to catch up as it would have before this existed.
//
// Composed with withAutoPublishDate/withPrePublishChecklist in
// sanity.config.ts, same pattern as those two -- takes the original
// action as an argument rather than importing Sanity's default publish
// action directly, since Sanity doesn't expose it as a stable top-level
// export.
export function withRevalidateOnPublish(originalAction: DocumentActionComponent): DocumentActionComponent {
  const WrappedPublishAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const original = originalAction(props)
    if (!original) return null

    // The draft always has the slug this publish is about to make live --
    // passed through as ?path=/blog/<slug> so /api/revalidate can hit this
    // exact post's own URL directly, on top of the broader [slug]-pattern
    // revalidation it already does regardless of whether a path is given.
    const slug = (props.draft as {slug?: {current?: string}} | null)?.slug?.current
    const revalidateUrl = slug
      ? `/api/revalidate?path=${encodeURIComponent(`/blog/${slug}`)}`
      : '/api/revalidate'

    return {
      ...original,
      onHandle: () => {
        original.onHandle?.()
        setTimeout(() => {
          fetch(revalidateUrl).catch(() => {
            // Best-effort -- see comment above.
          })
        }, REVALIDATE_DELAY_MS)
      },
    }
  }

  return WrappedPublishAction
}
