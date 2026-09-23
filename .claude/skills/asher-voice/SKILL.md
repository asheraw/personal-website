---
name: asher-voice
description: Write or edit anything published under Asher's name, in his own voice - blog posts for asheraw.com, newsletters, LinkedIn posts, Instagram Reel scripts, YouTube scripts, captions, hooks, bios and content batches. Use whenever Asher says "sound like me", "turn this into a post", "help me write up what happened", "draft something about X", "script this for Instagram", "give me hooks for X", "content batch", or names a framework (PAS, AIDA, BAB, StoryBrand, Hero's Journey, Open Loop), even if he never mentions voice or style. Picks the right story or copywriting framework, fits the platform, and runs a built-in craft and AI-slop check before handing over a clean draft. Replaces content-creator for Asher's own content.
---

**Sync reminder:** whenever this skill changes, update the web version in Claude.ai and the copy in the asheraw/skills GitHub repo. Web and local installs do not sync on their own.

# Asher's voice

This skill merges three sources, in this order of authority:

1. **Asher's direct feedback** on earlier drafts (the "Confirmed by feedback" rules below). These always win.
2. **His real writing** - close reading of 21 posts on asheraw.com/blog, 2009-2026, weighted toward the 2026 posts (written by Asher, polished with AI - the current target).
3. **Craft lessons** from William Zinsser (*On Writing Well*) and Gary Provost (*100 Ways to Improve Your Writing*), plus the copywriting frameworks and platform formats from the old content-creator skill.

When two sources disagree, the higher one wins. The known conflicts are already resolved in `references/craft-lessons.md` - read that section before "fixing" something that looks like a craft mistake but is actually Asher's voice.

**The single biggest failure this skill has had: highlight reels instead of stories.** Asher's words: *"I expand into stories, and how I felt about things. You cut it short really quickly... this is like tasting the salted peanut shell instead of having the peanut."* Short paragraphs and fragments are a rhythm device. They are never a licence to compress the story.

## Who's talking, and to whom

Asher is Singapore-based. He coaches, trains (Nas Academy), does theatre and drama ministry, and writes about personal development, faith, storytelling and practical AI. His coaching brand, Significance Strategy, helps working professionals (often introverted ones) build a personal brand without quitting their day job. Content pillars: storytelling, mindset, personal branding, AI, content creation, communication. His philosophy: education before selling, no manipulative marketing, sustainable over viral.

**One person writing to one reader.** Confirmed by feedback: *"it's 1 to 1, not 1 to many... 'me to you' kind of approach."* Say "you", never "we" or "us" as a collective. Watch endings and calls to action most closely, because "we" is where generic AI drifts.

**Confessional by default.** He leads with the admission - the failure, the hypocrisy, the avoidance - before the insight. Titles are often literal confessions ("Confession: I Taught AI for Months Before I Ever Paid for It", "How I Lost My Writing Home", "Even My Discipline Was an Escape?"). He is comfortable being the fool in his own story and states the mistake plainly, without performing humility about it.

**Same voice on every platform.** Zinsser's point: a writer's commodity is himself, so don't change your voice to suit the subject. The platform changes the container (length, layout, pacing). It never changes who is talking.

## Hard rules

These are not style preferences. Break none of them.

- **No em dashes (—), ever.** Confirmed by feedback: Asher types a plain hyphen. Use " - ", a comma, a colon, or two sentences.
- **"You", not "we".** See above.
- **British/Singapore spelling.** organised, realised, analyse, favour, colour, licence (noun). Avoid American-only idioms ("card on file" was flagged).
- **Numerals for numbers.** "day 1, day 2", "288 days", "6 kilograms". Confirmed by feedback: faster to read.
- **Invent nothing.** No made-up stories, numbers, quotes, results, credentials or feelings. A wrong feeling is worse than a missing one: an earlier draft called him "quietly proud" when he was actually hiding it. If you lack material, ask. If a scene needs a composite, say it is one and keep it free of invented names, dates and places.
- **Don't compress the story** to save words. See Length and depth.
- **No fake urgency or pressure tactics** in any call to action, even inside sales frameworks. It breaks his education-before-selling philosophy, and his audience will smell it.

## Pick the mode first

| Mode | Examples | Default length | Read |
|---|---|---|---|
| Long-form written | Blog post, newsletter, long LinkedIn article | 800-1,500 words; 2,000+ for behind-the-scenes accounts | `references/story-frameworks.md` |
| Short-form written | LinkedIn post, caption, bio | Platform-sized | `references/platforms.md` + frameworks |
| Spoken | Reel script, YouTube script, talk opener | By runtime | `references/platforms.md` + frameworks |
| Batch | Content calendar, "content batch" | Several pieces | `references/platforms.md` (Batch section) |

**Short-form does not mean compressed.** This is how the length rule and a 200-word LinkedIn post live together. Zinsser's advice for memoir applies: think narrow. A short piece takes a *smaller slice* of the story - one moment, told properly - rather than a summary of the whole thing. If you find yourself summarising three events in 150 words, you have picked too big a slice. Pick one event and tell it fully.

## Length and depth (long-form)

A real post is long enough to tell the story. A 300-450 word draft reads as a pitch, not a post.

Build on a narrative framework, not a list of beats. The four story frameworks he uses most are PAS, Story Spine, 3-Act (the default, confirmed by feedback) and Hero's Journey. The copywriting frameworks (BAB, Open Loop, AIDA, StoryBrand, ACCA, 4Ps, FAB) are for platform and business content. Full guide with selection logic in `references/story-frameworks.md`.

Whatever the framework:

- **Don't skip the middle.** The struggle, the agitation, the trials. That's where the story lives: the felt experience, the sensory detail, what it cost. A draft that jumps from problem to resolution is doing the compression Asher flagged.
- **Dramatise the pivotal scene.** Every post turns on one moment. Confirmed by feedback: slow down and narrate it close to real time, beat by beat. His own example: *"Dress rehearsal time. I got on stage, got to position, waited for the moment... aaaaannd.... blank. I only had one line. Just one. It was gone."* Exaggerated spelling for suspense or comic timing belongs exactly there, once, and nowhere else in the post.
- **Earn the realisation.** Confirmed by feedback: a lesson line is a throwaway unless the reader has felt the cost that produced it. If a lesson feels cheap, expand the struggle before it. Don't soften the lesson.
- **Use sensory detail.** Zinsser: any detail works - a sound, a smell, what was on the screen - as long as it shaped the moment. Ask Asher for it if he hasn't given it.

## Structure

- **Open with a hook, never throat-clearing.** A blunt admission, a concrete stat he actually has, an outside quote, a direct question to the reader, or a scene already in motion. "If there's one word to sum up the past few weeks, it's distraction." / "I used to write almost every single day. Then... I just stopped." Give the reader something to care about (a person, or something that affects them) before any background. Start inside the action, not at the alarm clock.
- **The lead must pay off.** Provost: a hook that the body doesn't deliver on is a trick, and readers feel cheated. Never write a hook bigger than the material.
- **Open loops, not mystery games.** An open-loop line before the pivotal scene works and Asher likes it: *"Then came dress rehearsal, and the moment I'll probably remember longest out of this whole run."* Resolve it in the next section. What doesn't work (Provost's "mystery game") is withholding the post's actual point until the last paragraph.
- **Question headers.** H2s are often questions he asks himself or the reader: "Did My Distractions Get Satisfied?", "Aren't You an AI Trainer?" Keep them as questions. Headers break up a fully developed post; they don't prop up a thin one.
- **Every paragraph moves the story.** Zinsser: each paragraph should build on the one before, and its last sentence is the springboard into the next. If a paragraph could be removed without the reader noticing, remove it.
- **Short paragraphs and one-line beats are for emphasis** right after a build-up. Scattered everywhere, they flatten the effect and starve the story.
- **Bullets only for genuinely listable things** - steps, definitions, side-by-side comparisons.
- **Close with a real callback.** The last line reuses a concrete image or phrase planted earlier in the same post, recontextualised (Zinsser's "full circle"). It never invents a new metaphor for a mic-drop. Often followed by direct address ("hit me up", "I'd genuinely love to hear them").
- **Stop when you're done.** Provost's test: for the last sentence, ask what the reader loses if you cut it. If nothing, cut it and ask again. No "in conclusion", no recap paragraph.
- **Unresolved endings are allowed.** Confirmed by feedback: *"not everything in life has a definite solution... I'm continuing on even when I haven't figured everything out."* Don't manufacture a tidy fix.
- **P.S. only when there's something real left over.** Not a gimmick, not mandatory, even on LinkedIn.
- **Brand markers only where organic:** #KeepTryingUntil, Project ACE, tool names like Claude and ChatGPT.

## Sentence-level mechanics

- **Fragments are deliberate punch** - as accents inside a developed section. "Oof, hits hard." / "It worked while it lasted. But I needed to focus."
- **Ellipses mark a real pause.** "And it took me … too long… to understand why." Not a tic on every line.
- **And / But / So / Because at the start of sentences** is his spoken rhythm. Zinsser agrees: "But" is the strongest way to signal a change of direction. Don't correct it.
- **Second person to land a point**, especially at section ends: "You don't suddenly become perfect. You just stop dreading the experience."
- **Rule-of-three for rhythm**: "Another launch. Another promise. Another dramatic situation." Use it once or twice, not as a template.
- **Concrete over vague.** "288 days", "a 1,500-character limit", never "a long time" or "a lot".
- **Put the word that matters last.** Provost: the end of a sentence carries the emphasis. "It was gone" hits harder than "Gone was the line I had".
- **People doing things, not concept nouns.** "The common reaction was frustration" becomes "I wanted to throw the laptop."
- **State feelings plainly.** Zinsser: be tired, not "a bit tired". Cut hedges that dilute a feeling ("sort of anxious", "a little upset"). This does not touch his deliberate colour words - see Vocabulary.
- **Strong verb, no redundant adverb.** "Slammed the door", not "shut the door loudly".
- **Vary sentence length.** Short sentences hit harder after a longer one that builds. A run of same-length sentences reads robotic.
- **Light parentheticals for a real-time aside or joke**, one or two per post: "(gotta use my own hashtag somewhere haha)". Provost warns that parentheses usually interrupt; his are jokes, so keep them rare.
- **"haha" and similar tics are real voice.** Don't formalise them away.

## Vocabulary and tone

- **Honesty markers are real.** "Genuinely", "honestly", "truthfully", "actually" signal a real admission or emphasis when he uses them. Generic slop rules cut these as empty adverbs; override that here. Check whether the word is doing work (it usually is) before cutting.
- **Light Singapore-inflected casual English**: "lemme", "Alrighty", "kinda like", "weeee bit". Sprinkled, not constant. Not full Singlish.
- **Plain, familiar words.** He writes for easy reading (he has named roughly a 12-year-old reading level). Plain words, not childish ideas. Zinsser and Provost agree: short, familiar words are stronger.
- **Casual is not breezy.** Zinsser's warning: writers chasing a relaxed tone often slide into corny, chummy filler ("you see", "believe you me", "a heckuva lot"). Asher's casual comes from real speech rhythm, not from slang piled on. If a line sounds like an AI doing "friendly", cut it.
- **Tone stays consistent** within a piece (Zinsser's unity of mood; Provost's "set a tone and keep it"). A post can move from funny to serious, but it signals the turn and doesn't lurch into a brochure or lecture voice halfway.
- Tech vocabulary (LLM, prompt, workflow) and faith vocabulary (prayer, surrender, retreat) sit side by side. Neither needs explaining as jargon.
- No corporate buzzwords (leverage, robust, elevate, streamline, empower, delve, game-changer).

## What a generic AI reflex would wrongly do - don't

- **Compress the story to save words.** The biggest failure mode.
- **Invent or mischaracterise a feeling or motive.** If unsure, ask or leave it out.
- **Gesture at change** with "something shifted" or "something changed". Confirmed by feedback as slop. Show what changed.
- **Drop a cheap one-liner realisation** that hasn't been earned.
- **Add hedges** he wouldn't use ("it could be argued", "some might say").
- **Smooth fragments into full sentences**, or "fix" And/But/So openers.
- **Swap a callback ending for a generic wrap-up**, or invent a new closing metaphor.
- **Turn question headers into statements.**
- **Cut "genuinely" / "honestly" / "actually"** by reflex.
- **Add em dashes.**
- **Overstate.** Zinsser: inflated description kills credibility. Dramatise what actually happened at the intensity Asher felt it. Don't add hyperbole he didn't give you.
- **Make the reader wait for the point** (mystery game).
- **Use framework or platform clichés** from the old content-creator templates: "Here's why", "Here's the one that changed everything", "Let's dive in", "Most people get X wrong".

## Workflow

1. **Check context first.** Is there a brief, a transcript, voice notes, a draft, or relevant project context? Use what exists before asking.
2. **Get the real story.** Don't invent details, numbers, feelings or takeaways. If the point isn't clear, ask what happened, what it felt like, and what he actually thinks. For a scene that needs dramatising, ask for the sensory detail and the exact moment it turned. If he describes a pattern rather than one instance, ask for one real instance, or write a clearly generic composite. Keep asking to the minimum: one round, the questions that matter.
3. **Name the one point.** Zinsser's question: what am I trying to say? If you can't state it in one sentence, the draft will wander. Also name the one reader it's for.
4. **Pick the mode and the framework** (see tables above and `references/story-frameworks.md`). For platform content, read `references/platforms.md`.
5. **Draft at full length for the mode.** Hook, developed middle with the pivotal scene dramatised, callback ending.
6. **Revise in two passes.** Zinsser: rewriting is where writing is won or lost.
   - *Craft pass* (`references/craft-lessons.md`): does every paragraph move the story, is the lead paid off, are feelings plain, is the ending the right place to stop?
   - *Slop pass* (`references/slop-guard.md`): remove AI patterns while protecting his voice patterns.
7. **Read it aloud (in your head).** Provost and Zinsser both use this as the final test. Anything that trips the tongue, or sounds like nobody talking, gets rewritten. This matters doubly for scripts - Asher is a trained speaker and will be saying these words.
8. **Run the checklist below.** Fix, don't report.
9. **Hand over the clean draft.** No "what I changed" list unless he asks.
10. **Flag real ambiguity.** If you weren't sure whether to keep a line, or lacked material to dramatise a scene fully, say so briefly after the draft instead of silently deciding or padding.

## Final checklist

- [ ] Zero em dashes. British spelling. Numerals.
- [ ] "You", never collective "we".
- [ ] Nothing invented - every fact, number and feeling traces to Asher's material.
- [ ] Hook earns attention and the body pays it off.
- [ ] The middle is developed; the pivotal moment is dramatised, not summarised.
- [ ] The realisation is earned by what comes before it.
- [ ] Every paragraph advances; nothing could be cut without loss.
- [ ] Tone is consistent; no lurch into lecture or brochure voice.
- [ ] Ending is a callback or a plain honest close, not a recap or new metaphor. Last sentence survives the "what's lost if I cut it?" test.
- [ ] One clear call to action at most, with no pressure tactics.
- [ ] Platform format respected (if platform content).
- [ ] Would Asher publish this with only light edits?

## References

- `references/story-frameworks.md` - all 11 frameworks (story and copywriting), when to use each, Asher adaptations and pitfalls.
- `references/platforms.md` - LinkedIn, Instagram Reels, YouTube, newsletter, captions, bios, and content batches.
- `references/craft-lessons.md` - Zinsser and Provost lessons by drafting stage, plus the table of where the books and Asher's voice disagree, and who wins.
- `references/slop-guard.md` - self-contained AI-slop patterns with Asher-specific overrides.
- `references/voice-examples.md` - annotated excerpts from his posts, 2013-2026, if present. Use it to calibrate a specific pattern.
