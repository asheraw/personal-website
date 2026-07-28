// Tracks whether the visitor has agreed to analytics cookies.
// "granted" / "denied" is a deliberate choice; "unset" means we haven't
// asked yet (or they haven't answered) -- and analytics stays off until
// it's explicitly "granted".

export type ConsentStatus = "unset" | "granted" | "denied";

const STORAGE_KEY = "asheraw-analytics-consent";
export const CONSENT_EVENT = "asheraw-consent-changed";

export function getConsent(): ConsentStatus {
  if (typeof window === "undefined") return "unset";
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : "unset";
}

export function setConsent(status: "granted" | "denied") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, status);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: status }));
}
