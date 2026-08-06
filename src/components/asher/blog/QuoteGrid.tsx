import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

export type QuoteEntry = {
  _key: string;
  photo?: { asset?: { _ref: string }; alt?: string };
  name: string;
  role?: string;
  quote: string;
};

export type QuoteGridLayout = "cards" | "spotlight" | "minimal";

// Three genuinely different visual treatments for the same data (photo +
// name + role + quote), picked per-block via the "Layout" field -- built
// this way specifically so Asher can drop the same set of quotes into a
// post, try each layout, and see which one actually reads best in context
// instead of only ever having one fixed look.
export function QuoteGrid({ entries, layout }: { entries: QuoteEntry[]; layout: QuoteGridLayout }) {
  if (!entries?.length) return null;
  if (layout === "spotlight") return <SpotlightLayout entries={entries} />;
  if (layout === "minimal") return <MinimalLayout entries={entries} />;
  return <CardsLayout entries={entries} />;
}

// A photo, or (when none was added) a circle with the person's initial --
// so a quote without a photo still gets a visual anchor instead of leaving
// a lopsided gap next to the ones that have one.
function Avatar({ entry, size }: { entry: QuoteEntry; size: number }) {
  if (!entry.photo?.asset) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full border border-spotlight/30 bg-spotlight/10 font-display text-spotlight"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden="true"
      >
        {entry.name?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }
  return (
    <Image
      src={urlFor(entry.photo).width(size * 2).height(size * 2).fit("crop").url()}
      alt={entry.photo.alt ?? entry.name}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-amber-faint object-cover"
      style={{ width: size, height: size }}
    />
  );
}

// "Cards" -- a testimonial-wall grid. Each card gets a large, faint
// decorative quotation mark in the corner so it reads as a considered
// design, not just a bordered box with text in it.
function CardsLayout({ entries }: { entries: QuoteEntry[] }) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div
          key={entry._key}
          className="group relative overflow-hidden rounded-2xl border border-amber-faint bg-stage/40 p-5 transition-colors hover:border-spotlight/40"
        >
          <span
            className="pointer-events-none absolute -top-3 right-4 select-none font-display text-6xl text-spotlight/10"
            aria-hidden="true"
          >
            &rdquo;
          </span>
          <div className="relative flex items-center gap-3">
            <Avatar entry={entry} size={44} />
            <div>
              <p className="text-sm font-medium text-ivory">{entry.name}</p>
              {entry.role && (
                <p className="font-mono-stage text-[10px] uppercase tracking-[0.14em] text-stone/60">{entry.role}</p>
              )}
            </div>
          </div>
          <p className="relative mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ivory/90">{entry.quote}</p>
        </div>
      ))}
    </div>
  );
}

// "Spotlight" -- full-width rows that alternate left/right, photo big and
// up front, quote set in larger italic display type. More editorial and
// dynamic than a grid; best suited to a small handful of quotes rather
// than a long list, since each one takes real vertical space.
function SpotlightLayout({ entries }: { entries: QuoteEntry[] }) {
  return (
    <div className="my-8 space-y-8">
      {entries.map((entry, i) => {
        const reversed = i % 2 === 1;
        return (
          <div
            key={entry._key}
            className={`flex flex-col items-center gap-5 sm:items-start ${
              reversed ? "sm:flex-row-reverse" : "sm:flex-row"
            }`}
          >
            <Avatar entry={entry} size={72} />
            <div className={`flex-1 text-center sm:text-left ${reversed ? "sm:text-right" : ""}`}>
              <p className="font-display text-lg italic leading-snug text-ivory">&ldquo;{entry.quote}&rdquo;</p>
              <p className="mt-3 text-sm font-medium text-spotlight">
                {entry.name}
                {entry.role && <span className="font-normal text-stone/60"> — {entry.role}</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// "Minimal" -- a clean divided list, closer to a pull-quote than a card.
// Big quotation marks carry the visual weight instead of borders/boxes;
// the avatar shrinks to a small inline byline under each quote.
function MinimalLayout({ entries }: { entries: QuoteEntry[] }) {
  return (
    <div className="my-8 divide-y divide-amber-faint border-y border-amber-faint">
      {entries.map((entry) => (
        <div key={entry._key} className="py-6 first:pt-0 last:pb-0">
          <p className="font-display text-xl italic leading-snug text-ivory/95">
            <span className="text-spotlight" aria-hidden="true">
              &ldquo;
            </span>
            {entry.quote}
            <span className="text-spotlight" aria-hidden="true">
              &rdquo;
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar entry={entry} size={28} />
            <p className="font-mono-stage text-[10px] uppercase tracking-[0.16em] text-stone/60">
              {entry.name}
              {entry.role ? ` · ${entry.role}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
