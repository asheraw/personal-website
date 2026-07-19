"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { GameCanvas, ZONE_LABELS } from "./GameCanvas";
import { ISO_ZONE_LABELS } from "./IsometricWorld";
import { PlaySections } from "./PlaySections";
import { track } from "@/lib/analytics";

// Lazy-load the 3D world so it doesn't affect initial page load
const World3D = dynamic(() => import("./World3D").then(m => m.World3D), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-amber-faint bg-stage">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-spotlight/30 border-t-spotlight" />
        <p className="font-mono-stage text-xs uppercase tracking-[0.2em] text-stone/60">Loading 3D world…</p>
      </div>
    </div>
  ),
});

const ZONE_LABELS_3D = ISO_ZONE_LABELS; // same labels

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
    const root = contentRef.current; if (!root) return;
    const el = root.querySelector(`[data-section-id="${zoneId}"]`); if (!el) return;
    isProgrammaticScroll.current = true;
    const target = el as HTMLElement;
    const offset = target.offsetTop;
    root.scrollTo({ top: offset, behavior: "smooth" });
    setActiveSection(zoneId);
    track({ action: "play_zone_enter", category: "play", label: zoneId });
    window.setTimeout(() => { isProgrammaticScroll.current = false; }, 900);
  }, []);

  const zoneLabels = playVersion === "v3" ? ZONE_LABELS_3D : ZONE_LABELS;
  const currentZoneInfo = zoneLabels[activeSection] || zoneLabels.hero;

  return (
    <div className="px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <p className="font-mono-stage text-xs uppercase tracking-[0.32em] text-spotlight/80">/ play_mode · interactive</p>
            {/* Version toggle */}
            <div className="flex items-center rounded-full border border-amber-faint bg-stage/40 p-0.5">
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
              {playVersion === "v3" ? (
                <World3D activeSection={activeSection} onZoneEnter={handleZoneEnter} />
              ) : (
                <GameCanvas activeSection={activeSection} onZoneEnter={handleZoneEnter} />
              )}
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
