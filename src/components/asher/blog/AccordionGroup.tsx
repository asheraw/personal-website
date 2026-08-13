import { Accordion } from "@/components/asher/blog/Accordion";

type AccordionGroupItem = { _key: string; title?: string; content?: unknown[] };

// Stacks several disclosure items at the same level -- an FAQ list, not a
// single one-off aside (that's still the plain Accordion block). Just maps
// onto the same Accordion component per item rather than a second visual
// treatment: no wrapping margin/spacing of its own, since adjacent
// Accordions already space themselves correctly via their own top/bottom
// margin collapsing against each other, same as any other two blocks
// stacked in the post body.
export function AccordionGroup({ items }: { items: AccordionGroupItem[] }) {
  if (!items?.length) return null;
  return (
    <>
      {items.map((item) => (
        <Accordion key={item._key} title={item.title} content={item.content} />
      ))}
    </>
  );
}
