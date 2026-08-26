import Link from "next/link";
import { truncateText } from "@/lib/text";

export type CommentStats = { totalComments: number; authorReplies: number };
export type Testimonial = { _id: string; name: string; message: string | null; createdAt: string; postTitle: string; postSlug: string };

const MESSAGE_MAX_LENGTH = 160;

// A quiet "real conversation happens here" signal, tucked into the open
// margin beside the reading column on wide screens only -- the full-width
// version felt like clutter in the first fold, and there's no spare margin
// to put it in on mobile/tablet, so it's hidden entirely below 2xl. Message
// is truncated to a fixed length so the box's height stays predictable no
// matter which testimonial gets randomly picked on a given page load.
export function CommentSocialProof({ stats, testimonial }: { stats: CommentStats; testimonial: Testimonial | null }) {
  if (stats.totalComments === 0) return null;

  return (
    <aside className="absolute left-full top-0 ml-10 hidden w-64 2xl:block">
      <div className="rounded-2xl border border-amber-faint bg-card/30 px-5 py-4">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone/70">
          {stats.totalComments.toLocaleString()} comment{stats.totalComments === 1 ? "" : "s"} from readers
          {stats.authorReplies > 0 && (
            <>
              {" "}
              · <span className="text-spotlight">{stats.authorReplies.toLocaleString()}</span> replied to by
              Asher
            </>
          )}
        </p>

        {testimonial?.message && (
          <p className="mt-3 border-t border-amber-faint pt-3 text-sm leading-relaxed text-stone/85">
            &ldquo;{truncateText(testimonial.message, MESSAGE_MAX_LENGTH)}&rdquo;
            <span className="mt-2 block font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">
              — {testimonial.name}, on{" "}
              <Link href={`/blog/${testimonial.postSlug}`} className="transition-colors hover:text-spotlight">
                {testimonial.postTitle}
              </Link>
            </span>
          </p>
        )}
      </div>
    </aside>
  );
}
