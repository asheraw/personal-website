# Transcript: "Almost Didn't Buy Claude Pro" post

## Task
Write a blog post for asheraw.com, in Asher's voice, about almost not buying Claude Pro — using the `asher-voice` skill's full workflow (including running the draft through `no-ai-slop` for generic AI tells while deferring to asher-voice's overrides on fragments, ellipses, question-headers, and callback endings).

Given facts only (no invention allowed beyond these):
- Went cold turkey on nearly every software subscription for years after being burned by GrooveFunnels — a CMS platform that promised to replace WordPress, turned out buggy, and messed up an affiliate commission he was owed.
- Defaults to free tools and is reluctant to pay for anything recurring, even AI tools, despite teaching AI classes for a living.
- Was building his new website with free AI tools (GLM at z.ai).
- Was waiting for an open-source model, Kimi K3, to release so he wouldn't have to pay.
- Kimi K3 never opened up to consumers, so he finally bought Claude Pro.
- Within the first day of having Claude Pro, he built a proper CMS, backups, a blog page, and more — more progress than he'd made in months on the free tools.

## Steps taken

1. **Invoked the `asher-voice` skill.** Read its SKILL.md content (returned inline by the Skill tool): who's talking, structure rules (hook opener, question-headers, short paragraphs, sparing bullets, callback endings, P.S. as genuine aside), sentence-level mechanics (fragments, ellipses as real pauses, And/But/So openers, second person at landing points, rule-of-three, concrete numbers, light parentheticals, rare em dashes), vocabulary/tone notes (honesty-marker adverbs like "genuinely"/"honestly"/"actually" are to be kept, not cut), and the explicit list of things a generic "helpful AI" reflex would wrongly do (add hedging, smooth fragments, flatten question-headers, invent new closing metaphors instead of callbacks, cut honesty adverbs, add em dashes/corporate buzzwords by default).

2. **Read `references/voice-examples.md` in full**, as the skill instructs, to calibrate on real excerpts organized by pattern: hook openers, question-headers, callback endings (with their setup/payoff pairs), fragments, ellipses, And/But/So openers, concrete specifics, direct reader address, confessional framing, Singapore-inflected casual English, honesty-marker adverbs, and P.S. usage. Noted that some existing real post titles ("Confession: I Taught AI for Months Before I Ever Paid for It," "Did I Regret Getting Claude Pro?") cover adjacent ground to this task — used that as a signal to keep this post's title and specific beats (GrooveFunnels, Kimi K3, the one-day CMS build) distinct rather than reusing lines or headers from those examples verbatim.

3. **Created the output directory** for this eval run (`.../with_skill/outputs/`), since it didn't exist yet.

4. **Invoked the `no-ai-slop` skill** per the asher-voice workflow's step 3, and read its `eval.md` checklist (banned words, empty adverbs/phrases, binary contrasts, throat-clearing, colon reveals, importance puffery, weasel attribution, fake-profound kickers, summary-recap endings, formatting slop, em-dash discipline) to know what to check the draft against — while treating asher-voice's overrides (fragments, ellipses, question-headers, callback endings) as taking precedence per the task instructions.

5. **Drafted the post** (`draft-v1.md` in scratchpad) using only the given facts:
   - Title as a literal confession, matching the pattern in the voice examples.
   - Hook opener stating the tension directly (teaches AI for a living, almost didn't pay for AI).
   - GrooveFunnels section with the specific facts given: promised to replace WordPress, turned buggy, messed up an affiliate commission.
   - A question-header ("Even the AI Tools I Teach People to Use?") to land the irony of a professional AI trainer avoiding paid AI tools.
   - The GLM/z.ai and Kimi K3 details exactly as given, no invented model specs or release dates.
   - A section on the first-day Claude Pro results (CMS, backups, blog page), using the "months vs. one day" contrast the user actually gave, rendered as a short punchy fragment pair ("Months. One day.") consistent with the voice example "Another launch. Another promise. Another dramatic situation."
   - A closing section that reuses the "cold turkey" image planted in paragraph 2, rather than inventing a new closing metaphor — this is the callback-ending pattern the skill calls out explicitly.
   - A genuine P.S. aside about the irony of being an AI trainer late to paying for AI, matching the "real afterthought, not a running gimmick" pattern from the reference file.

6. **Checked the draft against `no-ai-slop`'s eval.md**, applying asher-voice's overrides where they conflict:
   - Found one violation: "Here's the confession part:" was a throat-clearing/colon-reveal opener (banned pattern, not covered by any asher-voice override) — removed it, letting the cold-turkey line open directly.
   - Verified no banned buzzwords (leverage, robust, elevate, etc.), no weasel attribution, no importance puffery, no synonym cycling, no summary-recap ending, no decorative em dashes (none used, matching the voice note that em dashes are rare in Asher's actual writing).
   - Confirmed the fragments ("Cold turkey.", "Yeah. Even those.", "Months. One day."), the ellipsis in the P.S., the mixed declarative/question H2 headers, and the callback ending were all intentional per asher-voice's explicit overrides — left them as-is rather than "fixing" them per no-ai-slop's defaults.
   - Confirmed the honesty-marker adverbs ("honestly," "actually") were kept per the vocabulary note, not cut as filler.

7. **Wrote the final draft** to the required output path as `post.md`, unchanged from the checked version other than the one throat-clearing fix made in step 6.

## Decisions and why

- **No invented numbers or details.** The user did not give a dollar figure for Claude Pro, a timeframe in exact days/weeks for the "years" of cold turkey, or a dollar amount for the affiliate commission — none of those were fabricated. Where the task said "years," "months," and "within the first day," those exact phrasings were kept rather than sharpened into invented specifics.
- **Distinct from adjacent real posts.** Because the voice-examples reference file surfaces real post titles and lines on very similar territory (paying for AI, regretting/not-regretting Claude Pro), care was taken not to reuse those exact headers or lines — this post earns its own title and its own specific angle (GrooveFunnels backstory + Kimi K3 wait) built only from what the user provided for this task.
- **Callback ending over new metaphor.** no-ai-slop's default would flag an ending like "Cold turkey kept me safe from GrooveFunnels. It also kept me from Claude Pro..." as a "fake-profound kicker" since it's a summarizing final line. asher-voice explicitly overrides this for callback endings that reuse an image already planted earlier (here, "cold turkey" from paragraph 2) — so it was kept per the skill's explicit instruction to defer to asher-voice on this point.
- **Question-headers used, not all headers.** Per the voice-examples note that headers are "frequently" but not exclusively questions, the post mixes declarative headers ("What GrooveFunnels Did To Me," "What Happened Next") with question headers ("Even the AI Tools I Teach People to Use?," "So Was Cold Turkey the Right Call?").
