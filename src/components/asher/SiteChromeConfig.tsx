"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "story" | "play";
export type SiteContext = "home" | "blog" | "connect" | "404";

type ChromeConfig = {
  mode: Mode;
  setMode?: (m: Mode) => void;
  context: SiteContext;
  footer: boolean;
};

const DEFAULT_CONFIG: ChromeConfig = { mode: "story", setMode: undefined, context: "home", footer: true };

const ChromeConfigContext = createContext<{
  config: ChromeConfig;
  register: (overrides: Partial<ChromeConfig>) => void;
  reset: () => void;
}>({ config: DEFAULT_CONFIG, register: () => {}, reset: () => {} });

// Wraps the whole (site) route group once, in the shared layout, so
// SiteHeader/SiteFooter can render globally instead of every page having to
// remember to place (and keep correctly wired) its own copy.
export function SiteChromeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ChromeConfig>(DEFAULT_CONFIG);

  const register = (overrides: Partial<ChromeConfig>) =>
    setConfig((prev) => ({
      mode: overrides.mode ?? prev.mode,
      setMode: overrides.setMode ?? prev.setMode,
      context: overrides.context ?? prev.context,
      footer: overrides.footer ?? prev.footer,
    }));
  const reset = () => setConfig(DEFAULT_CONFIG);

  return (
    <ChromeConfigContext.Provider value={{ config, register, reset }}>
      {children}
    </ChromeConfigContext.Provider>
  );
}

export function useSiteChromeConfig() {
  return useContext(ChromeConfigContext).config;
}

// Mount (renders nothing) on any page that needs to override the shared
// header/footer -- e.g. the homepage's Story/Play toggle, a distinct
// analytics context label, or hiding the footer on a deliberately minimal
// page. Resets to the default config on unmount so an override can never
// leak onto the next page.
export function ConfigureSiteChrome({ mode, setMode, context, footer }: Partial<ChromeConfig>) {
  const { register, reset } = useContext(ChromeConfigContext);
  useEffect(() => {
    register({ mode, setMode, context, footer });
    return reset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, setMode, context, footer]);
  return null;
}
