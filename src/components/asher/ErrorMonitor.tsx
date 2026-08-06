"use client";

import { useEffect } from "react";

// Catches the two categories of client-side JS error that (site)/error.tsx
// *can't* see -- React's error-boundary mechanism only catches errors
// thrown during rendering, not ones thrown inside an event handler (a
// button's onClick) or an unhandled promise rejection (an async function
// that throws without a .catch()). Both of those just become invisible
// uncaught exceptions in a visitor's own browser console otherwise, with
// nothing here to ever know they happened. Runs regardless of cookie
// consent -- same reasoning as 404/search-query tracking: this reports
// bugs in the site's own code, not anything about the visitor, and never
// sends an IP address (see errorLogType.ts / /api/track-error).
export function ErrorMonitor() {
  useEffect(() => {
    const report = (message: string, stack: string | undefined, source: "error" | "unhandledrejection") => {
      fetch("/api/track-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stack, source, path: window.location.pathname }),
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      report(event.message || "Unknown error", event.error?.stack, "error");
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
      report(message, reason instanceof Error ? reason.stack : undefined, "unhandledrejection");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
