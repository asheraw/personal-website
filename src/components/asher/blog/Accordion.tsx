"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ title, content }: { title?: string; content?: string }) {
  const [open, setOpen] = useState(false);

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
        {open && content && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="whitespace-pre-wrap border-t border-amber-faint px-5 py-4 leading-relaxed text-stone/85">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
