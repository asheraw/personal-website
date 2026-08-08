"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ZONE_LABELS } from "./GameCanvas";
import { ZONE_LABELS_3D } from "./World3D";
import { PlaySections } from "./PlaySections";
import { PlayLoader } from "./PlayLoader";
import { track } from "@/lib/analytics";

// Both dynamically imported -- the heaviest parts of the site, per Asher's
// own read of it, and neither needs to be in the initial page bundle: only
// one of the two ever renders at a time (the 2D/3D toggle below), so there
// was never a reason to ship both up front. World3D pulls in
// @react-three/fiber + three.js on top of its own component code; GameCanvas
// is lighter (plain 2D canvas API) but still gets the same treatment for a
// consistent loading experience switching between the two, not because it
// needs the code-split as urgently.
const World3D = dynamic(() => import("./World3D").then(m => m.World3D), {
  ssr: false,
  loading: () => <PlayLoader label="Loading 3D world…" />,
});
const GameCanvas = dynamic(() => import("./GameCanvas").then(m => m.GameCanvas), {
  ssr: false,
  loading: () => <PlayLoader label="Loading 2D world…" />,
});

type PlayVersion = "v1" | "v3";

export function PlayMode() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [playVersion, setPlayVersion] = useState<PlayVersion>("v3"); // Default to 3D
  const contentRef = useRef<HTMLDivElement>(null);
  const gamePanelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    const measure = () => {
      if (gamePanelRef.current) {
        const h = gamePanelRef.current.offsetHeight;
        setPanelHeight(h);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [playVersion]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => {
        if (isProgrammaticScroll.current) return;
        let best: { id: string; ratio: number } | null = null;
        entries.forEach((e) => { const el = e.target as HTMLElement; const id = el.dataset.sectionId; if (!id) return; if (!best || e.intersectionRatio > best.ratio) best = { id, ratio: e.intersectionRatio }; });
        if (best && best.ratio > 0.25) setActiveSection((prev) => (prev !== best!.id ? best!.id : prev));
      }, { root, threshold: [0.25, 0.5, 0.75] });
    root.querySelectorAll("[data-section-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleZoneEnter = useCallback((zoneId: string) => {
    // For "directions" zone, just update the status — don't scroll content panel
    if (zoneId === "directions") {
      setActiveSection("directions");
      return;
    }
    setActiveSection(zoneId);
    track({ action: "play_zone_enter", category: "play", label: zoneId });
    // The DOM measurement below (getBoundingClientRect x2) forces a
    // synchronous layout reflow -- cheap on its own, but this function is
    // called directly from inside World3D's useFrame loop and GameCanvas's
    // own requestAnimationFrame loop, every time the character crosses a
    // zone boundary. Forcing a reflow mid-frame, on top of that frame's own
    // Three.js/canvas render work, is exactly what caused the reported
    // freeze when walking toward a zone whose content sits far down the
    // page (more DOM below = more to lay out). setTimeout(0) pushes this
    // past the current frame's paint instead of blocking it -- confirmed
    // by reading both render loops, not a guess: neither loads any
    // image/model/texture per zone (everything is procedural geometry), so
    // there was never anything to actually "finish loading" here, just a
    // reflow that had nowhere good to run.
    window.setTimeout(() => {
      const root = contentRef.current; if (!root) return;
      const el = root.querySelector(`[data-section-id="${zoneId}"]`); if (!el) return;
      isProgrammaticScroll.current = true;
      const target = el as HTMLElement;
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - rootRect.top + root.scrollTop;
      root.scrollTo({ top: offset, behavior: "smooth" });
      window.setTimeout(() => { isProgrammaticScroll.current = false; }, 900);
    }, 0);
  }, []);

  const zoneLabels = playVersion === "v3" ? ZONE_LABELS_3D : ZONE_LABELS;
  const currentZoneInfo = zoneLabels[activeSection] || zoneLabels.hero;

  return (
    <div className="px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 text-center">
          <p className="font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">/ play_mode · interactive</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl">
            Walk Asher through <span className="italic text-spotlight-gradient">his world.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone/80">
            {playVersion === "v3"
              ? "Use arrow keys, WASD, or click a building to move Asher around the 3D world. When he enters a zone, the info on the right updates."
              : "Use arrow keys, WASD, or click a zone to move Asher. When he steps into a zone, the info on the right updates."}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div ref={gamePanelRef} className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-amber-faint bg-stage/40 p-3 sm:p-4">
              <div className="relative">
                {playVersion === "v3" ? (
                  <World3D activeSection={activeSection} onZoneEnter={handleZoneEnter} />
                ) : (
                  <GameCanvas activeSection={activeSection} onZoneEnter={handleZoneEnter} />
                )}
                {/* 2D/3D toggle — top-right of game zone, same line as instructions */}
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-amber-faint bg-stage/80 p-0.5 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setPlayVersion("v1")}
                      className={`rounded-full px-2.5 py-0.5 font-mono-stage text-[9px] uppercase tracking-[0.18em] transition-all ${playVersion === "v1" ? "bg-spotlight text-stage" : "text-stone/70 hover:text-ivory"}`}
                      aria-pressed={playVersion === "v1"}
                      title="2D top-down version"
                    >
                      2D
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayVersion("v3")}
                      className={`rounded-full px-2.5 py-0.5 font-mono-stage text-[9px] uppercase tracking-[0.18em] transition-all ${playVersion === "v3" ? "bg-spotlight text-stage" : "text-stone/70 hover:text-ivory"}`}
                      aria-pressed={playVersion === "v3"}
                      title="3D world"
                    >
                      3D
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-faint/60 bg-stage/60 px-4 py-2.5">
                <div className="flex items-center gap-2"><span className="h-2 w-2 animate-soft-blink rounded-full bg-spotlight" /><span className="font-mono-stage text-xs uppercase tracking-[0.2em] text-stone/70">Currently in</span><span className="font-display text-base font-semibold text-spotlight">{currentZoneInfo.label}</span></div>
                <span className="font-mono-stage text-xs uppercase tracking-[0.18em] text-stone/60">{currentZoneInfo.activity}</span>
              </div>
            </div>
          </div>
          <div
            ref={contentRef}
            className="rounded-2xl border border-amber-faint bg-stage/30 overflow-y-auto scrollbar-thin-amber overscroll-contain"
            style={panelHeight ? { height: `${panelHeight}px` } : undefined}
          >
            <PlaySections />
          </div>
        </div>
      </div>
    </div>
  );
}
