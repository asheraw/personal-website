/**
 * Trims text to roughly maxLength characters without cutting a word in
 * half, and adds an ellipsis if anything was actually cut off.
 */
export function truncateText(text: string, maxLength = 200): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;
  return safeCut.trimEnd() + "…";
}
