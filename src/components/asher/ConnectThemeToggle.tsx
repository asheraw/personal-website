"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/asher/ThemeProvider";
import { track } from "@/lib/analytics";

// /connect is a deliberately minimal, header-less link-in-bio page, so
// this is a standalone toggle rather than the full SiteHeader -- it was
// previously the one page on the site with no way to switch themes at all.
export function ConnectThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        track({ action: "theme_toggle", category: "ui", label: `${theme === "dark" ? "dark_to_light" : "light_to_dark"}_connect` });
        toggleTheme();
      }}
      className="fixed right-5 top-5 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-faint bg-stage/60 text-stone/80 backdrop-blur-sm transition-all hover:border-spotlight/50 hover:text-spotlight sm:right-8 sm:top-8"
      aria-label={theme === "dark" ? "Turn on the lights" : "Turn off the lights"}
      title={theme === "dark" ? "Turn on the lights" : "Turn off the lights"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
