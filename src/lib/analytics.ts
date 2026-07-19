export type TrackEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track({ action, category, label, value, ...rest }: TrackEvent) {
  if (typeof window === "undefined") return;
  const payload: Record<string, unknown> = {
    event: action,
    event_category: category,
    event_label: label,
    ...rest,
  };
  if (typeof value === "number") payload.value = value;
  if (window.dataLayer) window.dataLayer.push(payload);
  if (window.gtag) window.gtag("event", action, { event_category: category, event_label: label, value, ...rest });
  if (process.env.NODE_ENV === "development") console.log("[analytics]", payload);
}

export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined") return;
  if (window.dataLayer) window.dataLayer.push({ event: "page_view", page_path: url, page_title: title });
  if (process.env.NODE_ENV === "development") console.log("[analytics] page_view", url);
}
