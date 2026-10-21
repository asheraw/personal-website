"use client";

import { useRef, useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { CONTACT_INFO } from "@/components/asher/data";
import { ContactForm } from "@/components/asher/ContactForm";
import { track } from "@/lib/analytics";

const PILL =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono-stage text-xs uppercase tracking-[0.16em] transition-colors";
const PILL_IDLE = "border-amber-faint text-ivory/90 hover:border-spotlight/40 hover:text-spotlight";

// Three ways to reach Asher as pills: WhatsApp and Email are plain links; the
// third opens the contact form underneath on click/tap, so the page isn't
// dominated by a long form nobody asked for yet. Used on /connect and as the
// "Contact options" reusable snippet inside posts.
export function ContactPills() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      track({ action: "contact_form_opened", category: "contact" });
      window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  };

  return (
    <div className="my-8 flex flex-col items-center gap-3">
      <p className="font-mono-stage text-[10px] uppercase tracking-[0.25em] text-stone/50">Prefer to reach me directly?</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a href={CONTACT_INFO.whatsappUrl} target="_blank" rel="noreferrer" className={`${PILL} ${PILL_IDLE}`}>
          <MessageCircle size={14} aria-hidden />
          WhatsApp
        </a>
        <a href={`mailto:${CONTACT_INFO.email}`} className={`${PILL} ${PILL_IDLE}`}>
          <Mail size={14} aria-hidden />
          Email
        </a>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="contact-pills-form"
          className={`${PILL} ${open ? "border-spotlight/60 bg-spotlight/10 text-spotlight" : PILL_IDLE}`}
        >
          <Send size={14} aria-hidden />
          Send a message
        </button>
      </div>

      {open && (
        <div
          id="contact-pills-form"
          ref={panelRef}
          className="mt-4 w-full animate-in fade-in-0 slide-in-from-top-2 rounded-2xl border border-amber-faint bg-stage/40 p-6 text-left duration-200 sm:p-8"
        >
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/70">/ send_a_message</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ivory">Send a message directly</h2>
          <p className="mt-2 text-sm text-stone/70">Fill in the form and Asher will get back to you. For a faster reply, use WhatsApp above.</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      )}
    </div>
  );
}
