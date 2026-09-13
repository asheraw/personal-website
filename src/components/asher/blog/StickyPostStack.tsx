"use client";

import { PostCard } from "@/components/asher/blog/PostCard";
import type { PostSummary } from "@/sanity/lib/queries";

// Sticky "pin and stack" scroll effect for long single-column post lists
// (category/tag/author pages) -- each card pins under the header while the
// reader scrolls past it, then the next card's own sticky box slides up and
// visually covers it. Relies on plain CSS `position: sticky` stacking order
// (a later sticky sibling naturally paints over an earlier one once both
// are "stuck" -- no manual z-index needed, no scroll-linked JS) plus an
// opaque background on each wrapper so the cover is a real cover, not a
// transparent overlap. Not used on the main /blog index -- that page shows
// 3 cards per row, where a pin-and-cover effect doesn't make sense.
//
// pb-32 scroll buffer, content flush at the top of the box (not vertically
// centered) -- Asher's categories run into the dozens of posts
// (Authenticity alone is 45), so a full viewport-height pin per card would
// make the longest category an extremely long scroll; this keeps the pin
// clearly visible without being that extreme. Flush-top matters too: an
// earlier centered version left empty space above the card inside its own
// (opaque) wrapper, and during the brief moment a wrapper had reached its
// sticky position but its content hadn't "caught up" to the very top yet,
// that gap let a sliver of the previous card show through above it. Content
// starting right at the wrapper's own top edge means there's never a gap
// for that to happen in.
export function StickyPostStack({ posts }: { posts: PostSummary[] }) {
  return (
    <div>
      {posts.map((post, index) => (
        <div key={post._id} id={`post-${post._id}`} className="sticky top-16 bg-stage pb-32 pt-2">
          <PostCard post={post} priority={index === 0} index={index} />
        </div>
      ))}
    </div>
  );
}
