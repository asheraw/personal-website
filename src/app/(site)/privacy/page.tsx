import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_INFO } from "@/components/asher/data";

const SITE_URL = "https://asheraw.com";
const TITLE = "Privacy Policy";
const DESCRIPTION = "What asheraw.com collects, why, and how to have it removed -- in plain English.";
// Hand-edited, not pulled from Sanity -- unlike post content, legal text
// shouldn't be freely editable from Studio without a second pair of eyes,
// and it changes rarely enough that a code change (reviewed like any other)
// is the right amount of friction. Bump this whenever the wording below
// actually changes.
const LAST_UPDATED = "August 2, 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: { type: "website", url: `${SITE_URL}/privacy`, siteName: "Asher Aw", title: TITLE, description: DESCRIPTION },
};

const TLDR = [
  "We only collect your name, email, or message when you type them in yourself -- through the contact form or a comment. Nothing is collected before that.",
  "A comment's email address is never shown publicly. Only Asher can see it.",
  "Analytics tracking is off by default, including heatmaps and session recordings. It only turns on if you click “Accept” on the cookie banner, and you can decline it entirely.",
  "We never sell your data, and there are no ad trackers or retargeting pixels on this site.",
  "Your IP address is logged briefly on submissions, only to catch spam — not to track what you do on the site.",
  "We use a small number of trusted services (listed below) to run the site — never to profit from your data.",
  "There's no email newsletter yet, but if one launches: joining is opt-in only, and a sponsor paying to be mentioned in an email is not the same as us selling your email address to anyone — we don't do the second one, ever.",
  "Want anything deleted? Email us and we’ll remove it — no forms, no runaround.",
];

export default function PrivacyPage() {
  return (
    <main id="main-content" className="relative min-h-screen bg-stage px-5 pt-28 pb-24 text-ivory sm:px-8 sm:pt-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(240,184,101,0.12) 0%, transparent 60%)" }} />
      <div className="relative mx-auto max-w-3xl">
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.3em] text-spotlight/70">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.01em] text-ivory sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-stone/60">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 leading-8 text-ivory/90">
          Nobody actually reads a privacy policy, and asheraw.com isn&rsquo;t going to pretend otherwise. Here&rsquo;s
          the whole thing in plain English first. The full, detailed version is below it for anyone who wants it.
        </p>

        <div className="mt-8 rounded-2xl border border-spotlight/30 bg-spotlight/[0.04] p-6 sm:p-8">
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.22em] text-spotlight/80">
            The 30-second version
          </p>
          <ul className="mt-4 space-y-3">
            {TLDR.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ivory/90 sm:text-base">
                <span className="mt-1 text-spotlight" aria-hidden="true">
                  &bull;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 space-y-10 text-base leading-8 text-ivory/90">
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Who this is</h2>
            <p className="mt-3">
              asheraw.com is Asher Aw&rsquo;s personal site &mdash; a blog and portfolio, not a company collecting
              data at scale. This policy covers everything the site itself collects. It doesn&rsquo;t cover other
              websites it might link to.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Information we collect</h2>
            <h3 className="mt-6 font-display text-lg font-semibold text-ivory">What you type in yourself</h3>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-ivory">Contact form:</strong> your name, email, phone number (optional), and
                message.
              </li>
              <li>
                <strong className="text-ivory">Comments:</strong> your name, email, and comment text. The email is
                stored so Asher can reply if needed &mdash; it&rsquo;s never displayed publicly.
              </li>
              <li>
                <strong className="text-ivory">Reply notifications (optional):</strong> if you check &ldquo;email me
                if there&rsquo;s a reply&rdquo; on a comment, that email is used only to send you that one
                notification, and the subscription automatically expires after 30 days of inactivity. You can
                unsubscribe with one click from any notification email.
              </li>
            </ul>
            <h3 className="mt-6 font-display text-lg font-semibold text-ivory">What&rsquo;s collected automatically</h3>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-ivory">IP address:</strong> logged when you submit the contact form or a
                comment, purely to catch spam and abuse (e.g. blocking repeat submissions from an address already
                marked as spam). It isn&rsquo;t used to track your activity on the site.
              </li>
              <li>
                <strong className="text-ivory">Analytics (only with your consent):</strong> if you click
                &ldquo;Accept&rdquo; on the cookie banner, Google Analytics (via Google Tag Manager) collects
                standard usage data &mdash; pages visited, general location (country/city level), device type. This
                stays off entirely if you click &ldquo;Decline,&rdquo; or if you never respond to the banner.
              </li>
              <li>
                <strong className="text-ivory">Heatmaps &amp; session recordings (only with your consent):</strong>{" "}
                also gated by the same cookie banner, Microsoft Clarity records how visitors move through and click
                on the site &mdash; used to spot where a page is confusing or a feature is hard to find, not to
                identify who&rsquo;s visiting. Clarity masks the contents of text fields (like the comment or
                contact form) by default, so what you type isn&rsquo;t captured in a recording even while it&rsquo;s
                on.
              </li>
              <li>
                <strong className="text-ivory">Broken-link tracking:</strong> if you land on a 404 page, the URL you
                tried to reach and the page that linked you there get logged, so Asher can fix broken links. This
                isn&rsquo;t tied to you personally in any way &mdash; no IP address, no identifying information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">
              How this information is used
            </h2>
            <p className="mt-3">Only for the reason you gave it to us in the first place:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Responding to a message sent through the contact form.</li>
              <li>Moderating and, where relevant, replying to a comment.</li>
              <li>Sending a reply notification you specifically opted into.</li>
              <li>Understanding, in aggregate, how the site is used (only with analytics consent).</li>
              <li>Spotting and blocking spam.</li>
            </ul>
            <p className="mt-3">
              Nothing here is ever sold, rented, or shared with advertisers, and there&rsquo;s no cross-site ad
              tracking or retargeting on this site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">
              If a newsletter launches
            </h2>
            <p className="mt-3">
              There&rsquo;s no email newsletter on asheraw.com today, but it&rsquo;s a real possibility down the
              line &mdash; so this is written ahead of time rather than after the fact:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Joining would always be opt-in. You&rsquo;d type your own email into a dedicated subscribe form
                &mdash; leaving a comment or using the contact form would never add you to it.
              </li>
              <li>
                Every issue would carry a one-click unsubscribe link, honored immediately, no login or account
                needed.
              </li>
              <li>
                <strong className="text-ivory">Sponsoring the newsletter is not the same as selling your data,
                and this site will never confuse the two.</strong>{" "}
                If an issue is ever sponsored, that means a
                sponsor paid to have their own message included in an email Asher writes and sends himself
                &mdash; it does not mean they receive your email address, or anything else about you. You&rsquo;d
                always be hearing from asheraw.com, never directly from a sponsor. Your email address is not
                sold, rented, or handed over to anyone, sponsored issue or not.
              </li>
            </ul>
            <p className="mt-3">
              Once a newsletter actually exists, this section (and the &ldquo;Third-party services&rdquo; list
              below, if a dedicated email-marketing tool ends up handling it) will be updated with the real
              details &mdash; not left as a placeholder.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Cookies</h2>
            <p className="mt-3">
              This site uses a small note saved in your browser to remember whether you accepted or declined
              analytics &mdash; that choice is respected until you clear your browser data or change your mind. If
              you accept, Google Analytics and Microsoft Clarity each set their own standard cookies to do their
              job. If you decline (or never answer), neither loads and no analytics cookies are set at all. No
              cookies are used for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">
              Third-party services this site relies on
            </h2>
            <p className="mt-3">
              Running a site at all means trusting a handful of infrastructure providers to do specific jobs. Here&rsquo;s
              every one of them, and what each actually touches:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-ivory">Sanity</strong> &mdash; stores everything submitted through the
                contact form and comments.
              </li>
              <li>
                <strong className="text-ivory">Resend</strong> &mdash; delivers the emails this site sends (a contact
                form notification to Asher, a reply notification to you if you opted in). Doesn&rsquo;t see anything
                beyond the content of that one email.
              </li>
              <li>
                <strong className="text-ivory">Vercel</strong> &mdash; hosts the site itself.
              </li>
              <li>
                <strong className="text-ivory">Google Analytics / Google Tag Manager</strong> &mdash; only loads if
                you accept the cookie banner. See &ldquo;Cookies&rdquo; above.
              </li>
              <li>
                <strong className="text-ivory">Microsoft Clarity</strong> &mdash; heatmaps and session recordings,
                also only loads if you accept the cookie banner. See &ldquo;Cookies&rdquo; above.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">How long we keep it</h2>
            <p className="mt-3">
              Contact messages and comments are kept so Asher can respond to and moderate them, and aren&rsquo;t
              deleted on any fixed schedule. A comment moved to Trash is permanently deleted after 30 days if not
              restored. If you&rsquo;d like something removed sooner, see below &mdash; it&rsquo;s a quick request,
              not a formal process.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Your choices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Decline analytics cookies at any time from the consent banner.</li>
              <li>Unsubscribe from a reply notification with one click, from any notification email.</li>
              <li>
                Ask for a comment, contact submission, or any other data tied to you to be corrected or deleted, by
                emailing{" "}
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-spotlight underline underline-offset-2 hover:decoration-spotlight">
                  {CONTACT_INFO.email}
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Children&rsquo;s privacy</h2>
            <p className="mt-3">
              This site isn&rsquo;t directed at children, and no information is knowingly collected from anyone under
              13. If you believe a child has submitted information here, contact us and it&rsquo;ll be removed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Changes to this policy</h2>
            <p className="mt-3">
              If this page changes in any meaningful way, the &ldquo;Last updated&rdquo; date at the top will change
              with it. Worth a glance every so often, but there&rsquo;s no separate notification system for policy
              updates.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ivory">Questions?</h2>
            <p className="mt-3">
              Just ask. Email{" "}
              <a href={`mailto:${CONTACT_INFO.email}`} className="text-spotlight underline underline-offset-2 hover:decoration-spotlight">
                {CONTACT_INFO.email}
              </a>{" "}
              or use the{" "}
              <Link href="/connect" className="text-spotlight underline underline-offset-2 hover:decoration-spotlight">
                Connect
              </Link>{" "}
              page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
