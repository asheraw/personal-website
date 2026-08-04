// Shown automatically on any post with at least one affiliate link
// (bodyHasAffiliateLinks) -- writers never have to remember to add this by
// hand, and it can't be forgotten on one post while present on another.
export function AffiliateDisclosure() {
  return (
    <p className="mt-6 text-xs italic leading-relaxed text-stone/60">
      This post contains one or more affiliate links. If you buy something through one, I may earn a small
      commission at no extra cost to you.
    </p>
  );
}
