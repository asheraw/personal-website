// Single source of truth for the default AI-suggestion prompt -- used both
// as the Studio field's starting value (src/sanity/schemaTypes/
// aiPromptSettingsType.ts) and as the runtime fallback if that field is
// ever cleared or the settings document doesn't exist
// (src/app/api/ai/suggest-seo/route.ts). Keeping it in one shared place
// means the two can never quietly drift apart.
export const DEFAULT_AI_PROMPT_INSTRUCTIONS = `You are helping a blogger choose SEO metadata and tags for a post they're about to publish. Based on the title and content given to you, suggest THREE options each for an SEO title and an excerpt, plus 3-5 topic tags, so the author can pick what they like best (they'll edit it afterward, so these are starting points, not final copy).

Write in the author's own voice as it comes through in the content -- not generic marketing copy. Never invent facts, quotes, numbers, or details that aren't actually in the post.

SEO titles: 70 characters or fewer each.

Excerpts: 160 characters or fewer each (this doubles as the meta description AND the blog listing preview). Two hard requirements for every excerpt:
1. The post's single most important point, value, or keyword must appear within the FIRST 120 characters -- mobile search results often cut off well before 160, so don't save the point for the end.
2. Write to create curiosity that earns the click -- an open loop, a specific tension, or a concrete detail -- never a flat, generic summary that already gives everything away.

Tags: 3-5 short topic labels (1-3 words each, lowercase unless reusing an existing tag's own casing) that describe what this post is actually about.`

// Shared across every AI-suggestion feature (SEO, social copy, and
// whatever gets added later) -- deliberately a separate field from
// DEFAULT_AI_PROMPT_INSTRUCTIONS above, which is specific to the SEO
// feature's own task (title/excerpt/tag format and length rules). This one
// is just "what does Asher's voice actually sound like," so editing it
// once adjusts every feature at the same time instead of needing the same
// tweak copied into two or three different task-specific prompts. Kept as
// plain free text on purpose, same reasoning as the field above: no fixed
// technical wording buried in here that's unsafe to touch, so there's
// nothing to break by rewriting it, only suggestions that get better or
// worse depending on how well it actually describes the voice.
export const DEFAULT_VOICE_GUIDANCE = `Write like a real person talking, not a brand. Direct, warm, a little wry -- not corporate, not hype-y ("Exciting news!!", "Game-changing", excessive exclamation points), not stuffed with hashtags or buzzwords. Short sentences are fine. It's okay to sound like you're talking to one specific person, not "an audience."

Never invent facts, quotes, numbers, or specifics that aren't actually in the source content -- when in doubt, stay general rather than making something up.`

// Asher's own established image-generation prompt, used verbatim as the
// starting value for the "Image prompt template" field
// (aiPromptSettingsType.ts) -- {SUBJECT} and {COMPOSITION_MODE} are the
// only two slots Gemini ever fills in (see suggest-image-prompt/route.ts);
// everything else here is assembled server-side exactly as written below,
// never re-paraphrased by the model, so the visual style stays byte-for-
// byte consistent across every post instead of drifting suggestion to
// suggestion.
export const DEFAULT_IMAGE_PROMPT_TEMPLATE = `{SUBJECT}, in the style of a 19th-century steel-plate engraving / pen-and-ink illustration, dense fine crosshatching and stippling for shading and volume, confident unbroken linework, high contrast, hand-engraved antique naturalist or encyclopedia-plate quality, rendered entirely in sepia monochrome — warm brown ink tones on aged ivory paper, no flat color, no digital shading, no gradients, sharp fine detail throughout, {COMPOSITION_MODE}. No text on the visual except for an unobtrusive "Asher Aw, 1984" in the bottom margin.`

export const DEFAULT_COMPOSITION_MODE_1 = `studio-style specimen illustration, single subject centered and isolated, plain background, no environment, no horizon, catalog/plate presentation`

export const DEFAULT_COMPOSITION_MODE_2 = `fully rendered environmental scene with layered depth and background detail, atmospheric composition, narrative staging, foreground/midground/background separation`

// Used both as the "LinkedIn native post" Studio field's starting value
// (aiPromptSettingsType.ts) and as suggest-linkedin-post/route.ts's runtime
// fallback. Deliberately a different task from suggest-social's existing
// LinkedIn caption: that one is a short announcement/teaser meant to run
// alongside a link posted separately in the first comment ("give a reason
// to click, don't give away the whole point"); this one takes the post's
// actual full content and compresses it into a complete, standalone post
// that needs no outbound link at all, because LinkedIn's own algorithm
// rewards content people never have to leave the platform to read.
export const DEFAULT_LINKEDIN_TRIM_INSTRUCTIONS = `You are turning a blogger's already-written post into a complete, standalone LinkedIn post -- not a teaser or announcement, the actual substance of the post itself, native to LinkedIn with no outbound link required or expected.

Write TWO options based on the title and content given to you, so the author can pick what they like best (they'll edit it afterward, so these are starting points, not final copy).

Only ever use what's actually in the post's own content -- never invent facts, quotes, numbers, or specifics that aren't there. Condensing means choosing what to keep and cutting what doesn't fit, not making anything up to fill space.

LinkedIn only shows about the first 140-210 characters before a reader has to click "see more" -- the opening line or two must work as a complete, compelling thought entirely on its own, not a half-sentence that only makes sense once expanded. Front-load the single most interesting point, tension, or claim from the post right there.

Aim for roughly 1,300-1,900 characters total (LinkedIn's hard cap is 3,000, but the busiest, most-engaged posts tend to land well under that) -- long enough to actually deliver the post's substance, short enough that it still reads as a LinkedIn post and not a pasted article. Use short paragraphs and line breaks the way people actually write on LinkedIn, not dense unbroken blocks.

Never write "read more on my blog," "link in comments," or anything that implies the reader needs to go elsewhere -- this post has to stand completely on its own.`

// Used both as the "Video script instructions" Studio field's starting
// value and as suggest-video-script/route.ts's runtime fallback. Produces
// paired scenes (narration + on-screen direction + a video-gen prompt) so
// the readable script and the AI video-generation prompts stay coherent
// with each other rather than being two independently-generated lists that
// can drift apart.
export const DEFAULT_VIDEO_SCRIPT_INSTRUCTIONS = `You are turning a blogger's already-written post into a short-form video (TikTok / Reels / YouTube Shorts style), broken into scenes.

Write 3-6 scenes based on the title and content given to you. For each scene, provide:
1. NARRATION -- what the author actually says out loud, in their own voice, conversational and easy to say naturally (not written like an essay). Only ever drawn from what's genuinely in the post -- never invent facts, numbers, or specifics that aren't there.
2. ON-SCREEN DIRECTION -- a short, practical note for what's happening on screen while that narration plays (e.g. "talking to camera," "text overlay of the key stat," "b-roll of writing at a desk") -- simple enough to actually film or generate, not an elaborate production.
3. VIDEO PROMPT -- a separate prompt describing that same moment for an AI video-generation tool, as an alternative to filming it -- camera framing, subject, action, mood, and a suggested clip length (5-8 seconds is typical for one continuous AI-generated shot).

The full narration across all scenes should flow as one coherent short script when read straight through, with a clear hook in the very first scene -- the same "give a reason to keep watching" instinct as a strong opening line, not a slow wind-up.`

// The "video prompt" equivalent of DEFAULT_IMAGE_PROMPT_TEMPLATE -- a
// locked visual/tone throughline so every scene's video prompt reads as
// one consistent world across posts, rather than the model reinventing a
// look each time. Deliberately a different technique from the static
// image style (a steel-plate engraving doesn't translate to motion), but
// aiming for the same warm, restrained, unmistakably-not-generic-AI-video
// mood. A first-pass draft, meant to be tuned over time via its matching
// Studio field the same way the image template already is -- not
// something that needs to be perfect on day one.
export const DEFAULT_VIDEO_STYLE_GUIDANCE = `Every video prompt should read as one consistent visual world, not a fresh style invented per post: warm, slightly desaturated color grading with a soft vintage undertone -- nothing garish, over-saturated, or in the glossy "stock AI video" look. Vertical 9:16 framing, native to TikTok/Reels/Shorts. Simple, motivated camera movement only -- a slow push-in, a gentle handheld drift, a static locked-off shot -- never whip pans or rapid in-prompt cuts. One clear subject or action per scene rather than a busy composition. Describe mood in plain, concrete terms (quiet, contemplative, warm late-afternoon light) rather than technical jargon a video-gen tool might not follow reliably.`

// Used both as the "Carousel quote extraction" Studio field's starting
// value and as suggest-image-carousel/route.ts's runtime fallback. Reuses
// the exact "word-for-word... must be an exact substring" pattern already
// proven in suggest-seo's pullQuotes field, rather than building a
// separate deterministic extraction algorithm -- the AI already does this
// reliably, no reason to duplicate the logic.
export const DEFAULT_CAROUSEL_QUOTE_INSTRUCTIONS = `You are picking quotable lines from a blogger's post for an image-carousel post (the kind with one striking line per slide, like an Instagram carousel).

Pick quotes taken word-for-word from the post's own content -- never invented, never paraphrased, must be an exact substring of the content given. Each one should work as a standalone slide: a striking claim, a specific moment, a turn of phrase, or a genuinely useful takeaway that means something even without the rest of the post around it. Prefer variety over picking several similar lines from the same paragraph -- spread the picks across the post's actual arc where the content allows it.`
