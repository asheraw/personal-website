"use client";

import { SiteHeader } from "@/components/asher/SiteHeader";
import { BootHero } from "@/components/asher/BootHero";
import { ThreePillars } from "@/components/asher/ThreePillars";
import { StageSection } from "@/components/asher/StageSection";
import { CoachingSection } from "@/components/asher/CoachingSection";
import { FaithSection } from "@/components/asher/FaithSection";
import { AtAGlance } from "@/components/asher/AtAGlance";
import { TwoCallings } from "@/components/asher/TwoCallings";
import { Philosophy } from "@/components/asher/Philosophy";
import { BookingCTA } from "@/components/asher/BookingCTA";
import { SiteFooter } from "@/components/asher/SiteFooter";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-stage text-ivory">
      <SiteHeader />
      <main>
        <BootHero />
        <ThreePillars />
        <StageSection />
        <CoachingSection />
        <FaithSection />
        <AtAGlance />
        <TwoCallings />
        <Philosophy />
        <BookingCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
