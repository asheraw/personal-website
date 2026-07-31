"use client";

import { useState, useEffect, useCallback } from "react";
import { ConfigureSiteChrome, type Mode } from "@/components/asher/SiteChromeConfig";
import { BootHero } from "@/components/asher/BootHero";
import { ThreePillars } from "@/components/asher/ThreePillars";
import { StageSection } from "@/components/asher/StageSection";
import { CoachingSection } from "@/components/asher/CoachingSection";
import { FaithSection } from "@/components/asher/FaithSection";
import { AtAGlance } from "@/components/asher/AtAGlance";
import { TwoCallings } from "@/components/asher/TwoCallings";
import { Philosophy } from "@/components/asher/Philosophy";
import { BookingCTA } from "@/components/asher/BookingCTA";
import { ProgressionBar } from "@/components/asher/ProgressionBar";
import { PlayMode } from "@/components/asher/play/PlayMode";
import { track } from "@/lib/analytics";

export default function Home() {
  const [mode, setMode] = useState<Mode>("story");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // useCallback so this keeps a stable identity across renders -- it's
  // passed to <ConfigureSiteChrome />, whose effect re-registers with the
  // shared header/footer context every time this function reference
  // changes, so a fresh closure on every render would mean re-registering
  // (harmlessly, but needlessly) on every render instead of only when
  // `mode`/`isMobile` actually change.
  const handleSetMode = useCallback((m: Mode) => {
    if (isMobile) return;
    if (m === mode) return;
    track({ action: "mode_switch", category: "navigation", label: `${mode}_to_${m}` });
    if (m === "play") window.scrollTo({ top: 0, behavior: "auto" });
    setMode(m);
  }, [isMobile, mode]);

  const effectiveMode: Mode = isMobile ? "story" : mode;

  return (
    <div className="relative min-h-screen bg-stage text-ivory">
      <ConfigureSiteChrome mode={effectiveMode} setMode={handleSetMode} context="home" />
      <main id="main-content">
        {effectiveMode === "play" ? (
          <PlayMode />
        ) : (
          <>
            <BootHero />
            <ThreePillars />
            <StageSection />
            <CoachingSection />
            <FaithSection />
            <AtAGlance />
            <TwoCallings />
            <Philosophy />
            <BookingCTA />
          </>
        )}
      </main>
      {effectiveMode === "story" && <ProgressionBar />}
    </div>
  );
}
