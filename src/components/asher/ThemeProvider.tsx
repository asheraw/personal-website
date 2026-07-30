"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always starts at "dark" -- must match the server-rendered value exactly,
  // since this initializer also runs as React's first CLIENT render during
  // hydration (not just on the server). Reading localStorage here directly
  // used to make that first client render diverge from the server's "dark"
  // output whenever a visitor had saved "light", which is a real content
  // mismatch (icon, aria-label, title all differ) -- React detects that and
  // discards + rebuilds the whole mismatched subtree client-side, which is
  // exactly the kind of thing that shows up as theme state going flaky
  // across full page loads/navigations. The useLayoutEffect below corrects
  // to the real saved theme synchronously before the next paint, so this
  // costs one extra pre-paint render pass, not a visible flash.
  const [theme, setThemeState] = useState<Theme>("dark");

  // Guards the one-time correction below so it can't fire again on a later
  // run of this same effect -- without it, a user's own toggle click (which
  // changes `theme` before localStorage has been updated to match) would
  // get read back and "corrected" right back to the stale saved value,
  // fighting every click.
  const hasSyncedFromStorage = useRef(false);

  // useLayoutEffect (not useEffect) so this resolves -- and any toggle
  // click updates the class -- before the next paint -- matches the
  // blocking <head> script's job of never letting a stale class linger
  // through a paint.
  useLayoutEffect(() => {
    if (!hasSyncedFromStorage.current) {
      hasSyncedFromStorage.current = true;
      const saved = window.localStorage.getItem("asher-theme");
      const resolved: Theme = saved === "light" || saved === "dark" ? saved : "dark";
      if (resolved !== theme) {
        setThemeState(resolved);
        return; // this effect re-runs once `theme` actually reflects `resolved`
      }
    }
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    window.localStorage.setItem("asher-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
