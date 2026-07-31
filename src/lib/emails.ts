/**
 * HTML (+ plain-text fallback) for the reply-notification email sent to a
 * commenter who opted in to "notify me on reply". Deliberately built to
 * push the reader back to the site rather than inviting an email reply --
 * this address isn't set up to receive or parse inbound mail, so the CTA
 * is the whole point, not a courtesy.
 */

const BRAND_AMBER = "#d99846";
const BRAND_STAGE = "#1a1208";
const BRAND_IVORY = "#f3e9d4";

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReplyNotificationEmail({
  replierName,
  message,
  postTitle,
  postUrl,
  unsubscribeUrl,
}: {
  replierName: string;
  message: string;
  postTitle: string;
  postUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `${replierName} replied on "${postTitle}"`;
  const preview = escapeHtml(truncate(message, 160));

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f0b06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none;font-size:1px;color:#0f0b06;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(replierName)} just replied to your comment on asheraw.com
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0b06;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:${BRAND_STAGE};border:1px solid rgba(217,152,70,0.25);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_AMBER};font-weight:600;">
                  Asher Aw &middot; Blog
                </p>
                <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:${BRAND_IVORY};font-weight:600;">
                  You've got a reply
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(243,233,212,0.75);">
                  <strong style="color:${BRAND_IVORY};">${escapeHtml(replierName)}</strong> replied on
                  &ldquo;${escapeHtml(postTitle)}&rdquo;:
                </p>
                <p style="margin:14px 0 0;padding:14px 16px;background:rgba(217,152,70,0.06);border-left:2px solid rgba(217,152,70,0.5);border-radius:4px;font-size:14px;line-height:1.6;color:${BRAND_IVORY};font-style:italic;">
                  ${preview}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <a href="${postUrl}" style="display:inline-block;background:${BRAND_AMBER};color:${BRAND_STAGE};text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:12px 24px;border-radius:999px;">
                  View &amp; Reply on the Blog
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;border-top:1px solid rgba(217,152,70,0.15);">
                <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:rgba(243,233,212,0.4);">
                  You're getting this because you asked to be notified about replies to your comment on
                  asheraw.com. This stops automatically after 30 days with no new replies, or you can
                  <a href="${unsubscribeUrl}" style="color:rgba(217,152,70,0.7);">unsubscribe now</a>.
                  This address doesn't accept replies -- please use the link above instead.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${replierName} replied on "${postTitle}":

"${truncate(message, 160)}"

View & reply: ${postUrl}

---
You're getting this because you asked to be notified about replies to your comment on asheraw.com. This stops automatically after 30 days with no new replies, or unsubscribe now: ${unsubscribeUrl}
This address doesn't accept replies -- please use the link above instead.`;

  return { subject, html, text };
}
