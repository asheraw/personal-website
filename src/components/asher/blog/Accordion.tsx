"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PortableText } from "@portabletext/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { restrictedRichTextComponents } from "./restrictedRichTextComponents";

export function Accordion({ title, content }: { title?: string; content?: unknown[] }) {
  const [open, setOpen] = useState(false);
  const hasContent = Array.isArray(content) && content.length > 0;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-amber-faint">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-semibold text-ivory transition-colors hover:text-spotlight"
      >
        <span>{title || "Details"}</span>
        <ChevronDown size={18} className={cn("shrink-0 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && hasContent && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-amber-faint px-5 py-4 text-stone/85">
              <PortableText value={content as never} components={restrictedRichTextComponents} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
