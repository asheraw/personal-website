# Transcript: "Almost Didn't Buy Claude Pro" post (iteration 2)

## Task

Write a blog post for asheraw.com, in Asher's voice, about almost not buying Claude Pro, using the revised `asher-voice` skill's full workflow (including running the draft through `no-ai-slop` for generic AI tells, deferring to asher-voice's overrides on fragments, ellipses, question-headers, and callback endings).

This is iteration 2 of this exact eval. The skill itself was revised between iteration 1 and this run based on Asher's direct feedback on the iteration-1 `with_skill` draft: he called it "bad" and "too dry and to the point," said "I expand into stories, and how I felt about things. You cut it short really quickly... this is like tasting the salted peanut shell instead of having the peanut," and asked for posts built explicitly on one of four narrative frameworks (PAS / Story Spine / 3-Act / Hero's Journey) with the pivotal scene dramatized close to real time rather than summarized, and realizations that feel earned rather than dropped in as one-liners. He also flagged mechanical issues: no em dashes (not accessible on his keyboard), British/Singapore spelling, no American-only idioms, and no invented internal feelings.

Given facts only (no invention allowed beyond these):
- Went cold turkey on nearly every software subscription for years after being burned by GrooveFunnels, a CMS platform that promised to replace WordPress, turned out buggy, and messed up an affiliate commission he was owed.
- Defaults to free tools and is reluctant to pay for anything recurring, even AI tools, despite teaching AI classes for a living.
- Was building his new website with free AI tools (GLM at z.ai).
- Was waiting for an open-source model, Kimi K3, to release so he wouldn't have to pay.
- Kimi K3 never opened up to consumers, so he finally bought Claude Pro.
- Within the first day of having Claude Pro, he built a proper CMS, backups, a blog page, and more, more progress than he'd made in months on the free tools.

## Steps taken

1. **Invoked the `asher-voice` skill** and read its full SKILL.md as returned by the Skill tool. This version leads with the exact feedback quote above and a rewritten "Length and depth" section stating that 300-450 word drafts read as a pitch, not a post, and that a real post runs 800-1500 words with the middle (agitation/struggle) not compressed.

2. **Read both reference files in full**, as instructed:
   - `references/voice-examples.md`, for calibration on hook openers, question-headers, callback endings (setup/payoff pairs), fragments, ellipses, And/But/So openers, concrete specifics, honesty-marker adverbs, P.S. usage, the dramatized pivotal-scene examples (the ketosis collapse, the forgotten-line dress rehearsal), the "never em dashes" hard rule, and the British/Singapore spelling examples.
   - `references/story-frameworks.md`, which turned out to already use this exact story as its own PAS example: "Confession: I Taught AI for Months Before I Ever Paid for It." Problem: defaults to free tools even as an AI trainer. Agitate: the GrooveFunnels trauma, the drawn-out Kimi K3 wait, the discomfort of the contradiction. Solve: buying Claude Pro and getting a day's progress that outpaced months of free-tool tinkering. This confirmed PAS as the framework before drafting.

3. **Looked at the iteration-1 record for this same eval** (`iteration-1/eval-claude-subscription-confession/`), specifically:
   - `with_skill/outputs/post.md`: the actual "bad" draft Asher gave feedback on. ~500 words, six short sections, no dramatized scene, a realization ("Funny how the discipline and the mistake can look exactly the same from the inside") dropped in without being earned by any real struggle beforehand. This is precisely the failure mode to avoid.
   - `with_skill/transcript.md`: confirmed the earlier run had access to the same given facts and made similar structural choices (cold-turkey callback ending, GrooveFunnels/Kimi K3/CMS beats) but compressed everything into short paragraphs without ever slowing down for a scene.
   - `without_skill/outputs/post.md`: contains two concrete errors flagged as things to avoid: an invented internal feeling ("I was quietly proud of the fact that I wasn't paying for any of them myself," not supported by and arguably contradicted by the given facts about hiding the habit) and an American idiom ("Card on file") plus at least one em dash. Used this as a checklist of specific traps to route around.

4. **Picked PAS as the framework**, matching the reference file's own worked example for this exact story:
   - **Problem**: teaches AI for a living, was the one person not paying for any of it.
   - **Agitate** (the section to not compress): the GrooveFunnels backstory in more detail than iteration 1 (what it promised, how it failed, the commission), the cold-turkey habit becoming a permanent default over years, the irony of an AI trainer building on free tools, the GLM/z.ai workflow, and real dwell time on the Kimi K3 wait ("kept half an eye on it, session after session... still telling myself the free option was coming") rather than jumping straight past it.
   - **Turn/pivotal scene**: "Then I Did The Thing I'd Spent Years Avoiding," an open-loop header, followed by slowing down on the decision to pay and then the first-day build, rendered beat by beat (CMS, then backups explicitly tied back to the GrooveFunnels money problem, then the blog page, then "more") instead of one summary sentence.
   - **Solve/earned realization**: a full section, "Was Cold Turkey Worth It?", that only lands after the reader has sat through the years-long habit and the wait, distinguishing the caution that was reasonable (getting burned once) from the cost it quietly created (months of slower progress on a tool that had nothing to do with GrooveFunnels).

5. **Drafted at full length** (`Write` to the output path), targeting 800-1500 words per the skill's guidance, using only the given facts. Deliberately avoided:
   - Any invented dollar figure for Claude Pro (an early draft line used "twenty-odd dollars, not a new mortgage" and was cut before finalizing, since no price was given).
   - Any invented feeling word beyond what the facts support (no "proud," "relieved," "embarrassed"; kept language tied directly to the given "reluctant," "burned," "waiting").
   - Any invented specific time marker not in the task (cut a draft phrase describing the build happening "in the same afternoon," since no time of day was given).
   - Em dashes (used commas, hyphens with spaces, and sentence breaks instead throughout).
   - American idioms and American spelling (used "maths," "way round it," and checked for accidental "-ize"/"-or" forms; found none needed).

6. **Checked word count**: 907 words after the first draft. Expanded the first-day build paragraph (line "Within the first day, I had a proper CMS built...") to give each item, CMS, backups, blog page, more, its own beat, matching the skill's instruction to dramatize the pivotal scene rather than compress it. This also ties the backups detail back to the GrooveFunnels money problem, an earned connection between two given facts rather than a new invented one. Final count: 942 words, inside the 800-1500 target range and roughly double the iteration-1 draft.

7. **Ran the draft through `no-ai-slop`** in detect mode, per the asher-voice workflow's step 3, applying asher-voice's overrides on fragments, ellipses, question-headers, and callback endings rather than no-ai-slop's defaults. Findings:
   - No em dashes, no banned buzzwords, no weasel attribution, no colon-reveal drama (the one colon present, "still my default setting: free first, always...," is a plain label/list use, not a dramatic reveal), no fake-profound kicker, no summary-recap ending, no formatting slop.
   - The closing lines ("I still teach AI for a living. I just also pay for it now...") are a callback to the opening sentence, kept per asher-voice's explicit override rather than flagged as a generic wrap-up.
   - Two minor tightenings made: trimmed a repeated "genuinely" (used four times in the original draft, diluting it as an honesty marker rather than reinforcing it) down to the two strongest instances, and softened a slightly generic-sounding transition ("Here's the part that's a bit much when you actually sit with it") to a more direct statement ("That's a bit much when you actually sit with it").

8. **Wrote the final draft** to `outputs/post.md` and this transcript, then computed `metrics.json`.

## Decisions and why

- **PAS over another framework.** The reference file's own example for this story is PAS, and the material fits it cleanly: a stated problem (paying for nothing recurring, even AI), a long agitate section with real cost (years of habit, a false hope in Kimi K3), and a clear solve (Claude Pro, one day's output).
- **Dramatized the first-day build rather than summarizing it**, giving CMS, backups, blog page, and "more" each their own beat, and connecting backups specifically back to the GrooveFunnels money problem, since that's a natural, earned link between two facts already given rather than a new one invented.
- **Did not invent Claude Pro's price, exact dates, or a feeling word beyond "reluctant"/"burned"/"waiting."** Where the task said "years," "months," and "within the first day," those exact phrasings were kept.
- **Reused "cold turkey" and "burned" as the two callback images**, planted in the opening third and paid off in the closing section, rather than inventing a new closing metaphor.
- **Nearly doubled the length of the iteration-1 with_skill draft** (942 words vs. ~500) specifically by not compressing the agitate section, which was the documented failure mode.
