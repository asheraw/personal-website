// Tracks whether the visitor has agreed to analytics cookies.
// "granted" / "denied" is a deliberate choice; "unset" means we haven't
// asked yet (or they haven't answered, or their last answer expired) --
// and analytics stays off until it's explicitly "granted".

export type ConsentStatus = "unset" | "granted" | "denied";

const STORAGE_KEY = "asheraw-analytics-consent";
export const CONSENT_EVENT = "asheraw-consent-changed";

// Re-prompt after this long, for BOTH accept and decline -- asked for
// directly (2026-08-11): traffic is low enough that a one-time-forever
// choice means each visitor only ever contributes one data point, ever,
// and someone who declined has no way to change their mind short of
// clearing browser storage by hand. A week strikes a balance between
// "meaningfully more data" and "not re-asking a returning reader on every
// single tab they open" (which sessionStorage would do).
const REPROMPT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type StoredConsent = {status: "granted" | "denied"; timestamp: number};

function readStored(): StoredConsent | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      ((parsed as StoredConsent).status === "granted" || (parsed as StoredConsent).status === "denied") &&
      typeof (parsed as StoredConsent).timestamp === "number"
    ) {
      return parsed as StoredConsent;
    }
  } catch {
    // Falls through to the legacy-format check below.
  }
  // Pre-2026-08-11 format was a bare "granted"/"denied" string with no
  // timestamp -- can't know how old that choice is, so treat it as expired
  // rather than either trusting it forever or wiping it silently. The
  // visitor sees the banner once more on their next visit, then re-enters
  // the normal 7-day cycle like everyone else.
  return null;
}

export function getConsent(): ConsentStatus {
  if (typeof window === "undefined") return "unset";
  const stored = readStored();
  if (!stored) return "unset";
  if (Date.now() - stored.timestamp > REPROMPT_AFTER_MS) return "unset";
  return stored.status;
}

export function setConsent(status: "granted" | "denied") {
  if (typeof window === "undefined") return;
  const stored: StoredConsent = {status, timestamp: Date.now()};
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: status }));
}
