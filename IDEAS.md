# Ideas — Good to Have, Not Now

A running list of things that came up, got seriously considered, and were deliberately set aside — not
forgotten, not silently dropped. Different from the phase gaps tracked in `ACE_PRD.md` / `ACE_MASTER_SPEC.md`
(the original spec's roadmap): these are ideas that came up along the way, usually while building something
else, that don't have a phase or a deadline. Check here before re-suggesting one of these from scratch, and
add to here — don't just mention in chat — whenever a real idea gets a "good idea, not now."

Newest first. Each entry: what it is, why it's not built, and what would make it worth revisiting.

---

## Notify a commenter by email when Asher replies

**What:** when Asher replies to a comment from Studio, email the original commenter to let them know —
the other half of the notification loop (Asher already gets emailed when someone comments; commenters get
nothing back right now).

**Why not now:** raised 2026-07-31 alongside a real concern — an email sent *to a stranger* (not to
yourself) is exactly where spam-filtering gets strict, and landing in someone's spam folder would be worse
than not emailing at all. Doing this properly needs its own sending domain with real authentication (SPF/
DKIM/DMARC set up for it specifically), not just reusing the contact form's `hello@asheraw.com` sender,
which was only ever verified for mail Asher sends to himself.

**Worth revisiting when:** comment volume is high enough that "did they even see my reply" becomes a real
question, and there's appetite to set up a properly authenticated sending domain (a real, one-time piece of
infrastructure work, not just a code change).

---

## Figma-style inline highlight comments

**What:** instead of (or alongside) the comment box at the bottom of a post, let a reader highlight a
specific passage of text and leave a comment anchored right there.

**Why not now:** considered 2026-07-31 in place of extending the existing top-level/threaded comment system,
and turned down for three concrete reasons:
1. **Mobile.** Selecting text on a phone already triggers the browser's own native selection handles and
   copy/paste menu — a custom "add a comment" popup has to fight that, and doesn't do so reliably across
   browsers/OS combinations.
2. **Anchoring drifts.** A comment anchored to an exact span of text breaks (or needs ongoing fuzzy-matching
   to relocate itself) whenever that paragraph is edited later — permanent complexity added to every future
   edit of older posts, not a one-time build cost.
3. **Wrong tool for a blog.** Inline annotation earns its keep on documents people are *jointly editing*
   (Figma, Notion, Google Docs) or crowdsourced annotation (Genius) — a reader responding to a finished,
   published post is a different, better-served-by-threaded-comments use case.

**A lighter middle ground**, if the underlying appeal (react to a specific passage) comes back up:
"highlight to share" — select text, get a floating button that pre-fills a quote-and-link share (X,
WhatsApp, copy-link) for that exact passage. No persistent anchoring, no thread infrastructure, no fight
with mobile's native selection UI — a one-shot action, not something that has to keep pointing at a specific
span forever. Worth considering as its own small feature, separate from comments entirely, if this comes up
again.

**Worth revisiting when:** there's a specific, concrete reason readers want to react to individual passages
rather than the post as a whole — not just "this would be neat."
