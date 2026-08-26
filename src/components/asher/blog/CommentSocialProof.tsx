import Link from "next/link";

export type CommentStats = { totalComments: number; authorReplies: number };
export type Testimonial = { _id: string; name: string; message: string | null; createdAt: string; postTitle: string; postSlug: string };

// A quiet "real conversation happens here" signal near the top of /blog --
// Asher's own framing, playing off the e-commerce "John from Australia just
// bought X" pattern but adapted honestly: no fake recency ("2 min ago" on a
// comment that's actually from 2023 would just be dishonest), a real count
// instead. Not a link/CTA on its own -- Asher explicitly didn't need this
// to be clickable, it's proof, not a pitch.
export function CommentSocialProof({ stats, testimonial }: { stats: CommentStats; testimonial: Testimonial | null }) {
  if (stats.totalComments === 0) return null;

  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-amber-faint bg-card/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="font-mono-stage text-[11px] uppercase tracking-[0.16em] text-stone/70">
        {stats.totalComments.toLocaleString()} comment{stats.totalComments === 1 ? "" : "s"} from readers
        {stats.authorReplies > 0 && (
          <>
            {" "}
            · <span className="text-spotlight">{stats.authorReplies.toLocaleString()}</span> personally replied to
            by Asher
          </>
        )}
      </p>

      {testimonial?.message && (
        <p className="max-w-md text-sm leading-relaxed text-stone/85 sm:border-l sm:border-amber-faint sm:pl-5">
          &ldquo;{testimonial.message}&rdquo;
          <span className="mt-1 block font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">
            — {testimonial.name}, on{" "}
            <Link href={`/blog/${testimonial.postSlug}`} className="transition-colors hover:text-spotlight">
              {testimonial.postTitle}
            </Link>
          </span>
        </p>
      )}
    </div>
  );
}
