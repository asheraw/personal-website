import { cookies } from "next/headers";
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";

// Called by Sanity Studio's "Preview" button. Requires SANITY_API_READ_TOKEN
// to be set -- see BACKUP_AND_RECOVERY_GUIDE.md-style setup notes in
// RUNBOOK.md for how to create and add it.
const { GET: enableDraftMode } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
});

// Wraps next-sanity's own handler to cap how long draft mode stays on.
// Upstream sets the __prerender_bypass cookie with no expiry (a session
// cookie), which sounds harmless but isn't in practice -- a visitor's
// browser that never fully closes (very common: "continue where you left
// off", most mobile browsers) can be stuck seeing "Previewing a draft" on
// every blog post, indefinitely, with no way to know why or how to turn it
// off short of finding the "Exit preview" link. This adds a 4-hour expiry
// on top of the same cookie -- long enough for one real editing/preview
// session, short enough that it can't linger for days.
export async function GET(request: Request) {
  try {
    return await enableDraftMode(request);
  } finally {
    // Runs even though the handler above throws to trigger its redirect --
    // the cookie is already set on the shared, request-scoped cookie store
    // by that point, so this just tightens its expiry, not its value.
    const store = await cookies();
    const bypass = store.get("__prerender_bypass");
    if (bypass) {
      const isSecure = process.env.NODE_ENV === "production";
      store.set({
        name: "__prerender_bypass",
        value: bypass.value,
        httpOnly: true,
        path: "/",
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        maxAge: 60 * 60 * 4,
      });
    }
  }
}
