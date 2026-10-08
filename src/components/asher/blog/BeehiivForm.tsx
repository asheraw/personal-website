"use client";

import { useEffect, useRef } from "react";

const LOADER_SRC = "https://subscribe-forms.beehiiv.com/v3/loader.js";

// Beehiiv's official signup embed. Their loader.js looks for its own
// <script data-beehiiv-form="..."> tag and puts the form next to it, so the
// tag is created inside this wrapper (not in the page HTML) once the
// component is on screen. Each embed gets its own fresh tag, so a form still
// appears after client-side navigation, and cleanup removes it again.
export function BeehiivForm({ formId }: { formId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;
    const script = document.createElement("script");
    script.src = LOADER_SRC;
    script.async = true;
    script.setAttribute("data-beehiiv-form", formId);
    wrapper.appendChild(script);
    return () => {
      wrapper.replaceChildren();
    };
  }, [formId]);

  return <div ref={ref} className="my-8" />;
}
