import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// GET (not POST) on purpose -- this is the one-click link inside a
// reply-notification email, and email clients only ever follow plain
// links. The comment's own _id is the token: Sanity ids are long, random,
// and never shown anywhere public, so this doesn't need a separate signed
// token on top -- the worst a guessed id could do is unsubscribe a random
// comment that was never subscribed in the first place.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    await writeClient
      .patch(id)
      .set({ notifyOnReply: false })
      .unset(["notifyExpiresAt"])
      .commit()
      .catch((error) => {
        // A comment that's already unsubscribed, or an invalid/old id,
        // shouldn't turn into a broken page for someone just trying to
        // stop getting emails -- show the same confirmation either way.
        console.error("[comments] Unsubscribe failed:", error);
      });
  }

  return new NextResponse(UNSUBSCRIBE_PAGE_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const UNSUBSCRIBE_PAGE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed · Asher Aw</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0b06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f3e9d4;">
    <div style="max-width:420px;padding:32px;text-align:center;">
      <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#d99846;font-weight:600;">
        Asher Aw &middot; Blog
      </p>
      <h1 style="margin:16px 0 0;font-size:24px;font-weight:600;">You're unsubscribed</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(243,233,212,0.75);">
        You won't get any more reply notifications for that comment. You can always leave a new comment and
        opt back in from there.
      </p>
      <a href="https://asheraw.com/blog" style="display:inline-block;margin-top:24px;background:#d99846;color:#1a1208;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:12px 24px;border-radius:999px;">
        Back to the Blog
      </a>
    </div>
  </body>
</html>`;
