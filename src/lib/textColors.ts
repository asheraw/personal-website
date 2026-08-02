// Single source of truth for the rich-text "Text color" mark -- shared
// between the Studio schema (options list in the annotation field) and the
// frontend renderer (mapping a stored name to a CSS variable), so the two
// can't quietly drift apart.
//
// Deliberately a closed set of *named* colors, not a hex/RGB picker. Each
// name resolves to a CSS custom property (--tc-<value>, defined in
// globals.css) with one shade tuned for dark mode and a separately-chosen
// shade for light mode -- picking "Yellow" can't produce illegible
// bright-yellow-on-white text, because there's no raw hex value for a
// writer to get wrong in the first place; the site controls both shades.
export const TEXT_COLORS = [
  { title: "Red", value: "red" },
  { title: "Orange", value: "orange" },
  { title: "Yellow", value: "yellow" },
  { title: "Green", value: "green" },
  { title: "Teal", value: "teal" },
  { title: "Blue", value: "blue" },
  { title: "Purple", value: "purple" },
  { title: "Pink", value: "pink" },
] as const;

export type TextColorValue = (typeof TEXT_COLORS)[number]["value"];

const VALID_VALUES = new Set<string>(TEXT_COLORS.map((c) => c.value));

export function isTextColorValue(value: unknown): value is TextColorValue {
  return typeof value === "string" && VALID_VALUES.has(value);
}
