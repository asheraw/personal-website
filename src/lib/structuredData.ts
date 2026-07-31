/**
 * Breadcrumb structured data (schema.org BreadcrumbList), built per-page
 * from that page's own real breadcrumb trail -- see each usage for the
 * items passed in. One shape, defined once, so every page's JSON-LD stays
 * in the same format.
 */
export type BreadcrumbItem = { name: string; url: string };

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
