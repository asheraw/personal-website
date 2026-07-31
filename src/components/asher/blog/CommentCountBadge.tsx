import Link from "next/link";
import { MessageCircle } from "lucide-react";

// Shared between the blog listing cards and the post page's own byline row
// so both stay in sync -- same icon, same "click through to #comments"
// behavior, same "hide entirely at zero" rule (a visible "0" reads as
// discouraging, an absent badge just reads as "no strong opinion yet").
export function CommentCountBadge({ slug, count }: { slug: string; count?: number }) {
  if (!count) return null;
  return (
    <Link
      href={`/blog/${slug}#comments`}
      className="inline-flex items-center gap-1 transition-colors hover:text-spotlight print:hidden"
    >
      <MessageCircle size={12} />
      {count}
    </Link>
  );
}
