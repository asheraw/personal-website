"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// Post-body headings play a short effect once they reach the reading zone (the
// upper ~65% of the screen), not the moment their top edge peeks in at the
// bottom where nobody is looking yet:
//   h2 types itself out letter by letter
//   h3 scrambles and settles left to right
//   h4 gets a highlighter sweep that fades back to plain text
// The real text is in the server-rendered HTML the whole time (search engines and
// no-JS readers see it), headings already inside the reading zone on load stay
// still, and "reduce motion" skips everything. Text is split into per-character
// spans so marks inside a heading (colour, bold) keep their formatting and the
// layout never shifts while it plays.

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+?";
const READING_LINE = 0.65;

function splitChars(root: HTMLElement): HTMLElement[] {
  const existing = root.querySelectorAll<HTMLElement>(".fx-c");
  if (existing.length) return Array.from(existing);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const chars: HTMLElement[] = [];
  for (const node of nodes) {
    const text = node.nodeValue ?? "";
    if (!text) continue;
    const frag = document.createDocumentFragment();
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        continue;
      }
      // One nowrap word per span, so a line can only break between words.
      const word = document.createElement("span");
      word.className = "fx-w";
      word.setAttribute("aria-hidden", "true");
      for (const ch of Array.from(part)) {
        const c = document.createElement("span");
        c.className = "fx-c";
        c.textContent = ch;
        c.dataset.c = ch;
        word.append(c);
        chars.push(c);
      }
      frag.append(word);
    }
    node.replaceWith(frag);
  }
  return chars;
}

export function AnimatedHeading({
  level,
  id,
  className,
  children,
}: {
  level: 2 | 3 | 4;
  id?: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inZone = el.getBoundingClientRect().top < window.innerHeight * READING_LINE;

    if (level === 4) {
      if (inZone) {
        el.classList.add("fx-mark-on");
        return;
      }
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            io.disconnect();
            el.classList.add("fx-mark-on");
          }
        },
        { rootMargin: "0px 0px -35% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }

    if (inZone) return;

    el.setAttribute("aria-label", el.textContent ?? "");
    const chars = splitChars(el);
    if (!chars.length) return;
    if (level === 3) {
      // Lock each letter's width so random glyphs can't reflow the lines.
      const widths = chars.map((c) => c.getBoundingClientRect().width);
      chars.forEach((c, i) => {
        c.style.display = "inline-block";
        c.style.width = `${widths[i]}px`;
        c.style.textAlign = "center";
      });
    }
    chars.forEach((c) => {
      c.textContent = c.dataset.c ?? "";
      c.style.opacity = "0";
    });

    const timers: number[] = [];
    let raf = 0;
    const finish = () => {
      chars.forEach((c) => {
        c.textContent = c.dataset.c ?? "";
        c.style.opacity = "1";
      });
    };

    const play = () => {
      if (level === 2) {
        const step = Math.min(40, 1100 / chars.length);
        chars.forEach((c, i) => timers.push(window.setTimeout(() => (c.style.opacity = "1"), i * step)));
        return;
      }
      const start = performance.now();
      const total = Math.min(1100, 400 + chars.length * 20);
      let lastSwap = 0;
      const tick = (now: number) => {
        const t = now - start;
        const swap = now - lastSwap > 60;
        if (swap) lastSwap = now;
        let done = true;
        chars.forEach((c, i) => {
          const settleAt = 200 + (i / chars.length) * (total - 200);
          if (t >= settleAt) {
            if (c.textContent !== c.dataset.c) c.textContent = c.dataset.c ?? "";
            c.style.opacity = "1";
          } else {
            done = false;
            c.style.opacity = "0.55";
            if (swap) c.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        });
        if (!done) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          play();
        } else if (e.boundingClientRect.top < 0) {
          // Scrolled or jumped straight past it: show it, no effect.
          io.disconnect();
          finish();
        }
      },
      { rootMargin: "0px 0px -35% 0px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      finish();
    };
  }, [level]);

  const props = { ref, id, className };
  if (level === 2) return <h2 {...props}>{children}</h2>;
  if (level === 3) return <h3 {...props}>{children}</h3>;
  return (
    <h4 {...props}>
      <span className="fx-mark">{children}</span>
    </h4>
  );
}
