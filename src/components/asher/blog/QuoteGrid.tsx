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
export type QuoteGridWeight = "regular" | "bold";
export type QuoteGridSize = "regular" | "small";

// Three genuinely different visual treatments for the same data (photo +
// name + role + quote), picked per-block via the "Layout" field -- built
// this way specifically so Asher can drop the same set of quotes into a
// post, try each layout, and see which one actually reads best in context
// instead of only ever having one fixed look.
//
// `weight` controls the quote text's own font-weight, independent of
// layout -- added after Asher used several Quote Grids back to back on
// one post and found the bolder weight (the default when this shipped)
// tiring to read at that volume, even though it reads fine as an accent
// for one or two grids on their own. Regular is now the default for that
// reason; Bold stays available for whenever a heavier, more attention-
// grabbing single grid is actually what's wanted.
//
// `size` is the same idea, one step further -- a second, independent knob
// (not folded into `weight`) since "smaller" and "bolder" are different
// asks that can combine either way (a dense list of short Small quotes,
// or one Bold-but-Small pull-quote).
export function QuoteGrid({
  entries,
  layout,
  weight = "regular",
  size = "regular",
}: {
  entries: QuoteEntry[];
  layout: QuoteGridLayout;
  weight?: QuoteGridWeight;
  size?: QuoteGridSize;
}) {
  if (!entries?.length) return null;
  if (layout === "spotlight") return <SpotlightLayout entries={entries} weight={weight} size={size} />;
  if (layout === "minimal") return <MinimalLayout entries={entries} weight={weight} size={size} />;
  return <CardsLayout entries={entries} weight={weight} size={size} />;
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
function CardsLayout({
  entries,
  weight,
  size,
}: {
  entries: QuoteEntry[];
  weight: QuoteGridWeight;
  size: QuoteGridSize;
}) {
  const quoteWeightClass = weight === "bold" ? "font-medium" : "font-normal";
  const quoteSizeClass = size === "small" ? "text-xs" : "text-sm";
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
          <p className={`relative mt-4 whitespace-pre-wrap leading-relaxed text-ivory/90 ${quoteSizeClass} ${quoteWeightClass}`}>
            {entry.quote}
          </p>
        </div>
      ))}
    </div>
  );
}

// "Spotlight" -- full-width rows that alternate left/right, photo big and
// up front, quote set in larger italic display type. More editorial and
// dynamic than a grid; best suited to a small handful of quotes rather
// than a long list, since each one takes real vertical space.
//
// The quote text itself is sans-serif here and in Minimal below (not
// font-display/Playfair, unlike the decorative quotation marks and avatar
// initials elsewhere in this file, which stay serif on purpose -- those
// are single glyphs, not something a reader has to actually read). A
// serif display face set in italic at body-copy sizes is genuinely harder
// to read than sans-serif italic -- Playfair's italic cut narrows the
// letterforms further, worse right when the point is a reader parsing a
// full sentence, not admiring one large character.
function SpotlightLayout({
  entries,
  weight,
  size,
}: {
  entries: QuoteEntry[];
  weight: QuoteGridWeight;
  size: QuoteGridSize;
}) {
  const quoteWeightClass = weight === "bold" ? "font-medium" : "font-normal";
  const quoteSizeClass = size === "small" ? "text-base" : "text-lg";
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
              <p className={`italic leading-snug text-ivory ${quoteSizeClass} ${quoteWeightClass}`}>
                &ldquo;{entry.quote}&rdquo;
              </p>
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
function MinimalLayout({
  entries,
  weight,
  size,
}: {
  entries: QuoteEntry[];
  weight: QuoteGridWeight;
  size: QuoteGridSize;
}) {
  const quoteWeightClass = weight === "bold" ? "font-medium" : "font-normal";
  const quoteSizeClass = size === "small" ? "text-lg" : "text-xl";
  return (
    <div className="my-8 divide-y divide-amber-faint border-y border-amber-faint">
      {entries.map((entry) => (
        // Between-entry gap stays py-6, unchanged -- the complaint was
        // specifically the outer top/bottom rules, not the spacing between
        // quotes. Previously `first:pt-0 last:pb-0` zeroed out padding
        // right where those outer border-y lines are, so the very first
        // and last quote sat flush against the rule with no breathing room
        // at all. Given more room than py-6 (not just restored to it),
        // since the outer rule reads as a stronger visual break than the
        // divider between two quotes and looked tight even at equal
        // padding.
        <div key={entry._key} className="py-6 first:pt-8 last:pb-8">
          <p className={`italic leading-snug text-ivory/95 ${quoteSizeClass} ${quoteWeightClass}`}>
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
