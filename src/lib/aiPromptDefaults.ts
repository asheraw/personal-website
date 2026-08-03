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
