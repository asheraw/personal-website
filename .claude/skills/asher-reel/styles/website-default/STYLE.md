---
name: website-default
description: Default nested style of asher-reel - the asheraw.com website look used for the "Leaving Job at 42" video. Animated HTML/GSAP scenes on the top panel; footage slides down.
---

# Website default ("Leaving Job at 42")

Design system: `D:\Work\00 Resources\Asher Aw Design System` (read it first; Playfair Display italic headlines, Montserrat, gold `#f0b865`/`#b8924a`, near-black `#0a0807`, ivory `#f5efe4`). This is the default for reels unless another style is chosen.

Reference project: `D:\Work\Social Media\2026\10-03 Leaving Job at 42\edit` (full 88 s result `..\Leaving Job at 42 - FINAL.mp4`). Reference files in `reference/`:
- `template.html`: all 25 scenes + the GSAP timeline (HyperFrames composition). Edit this, never the generated index.html.
- `build.mjs`: reads `transcript.json` (Parakeet via `npx hyperframes transcribe`), bakes soundtrack + sfx stem, writes index.html.

## Look and layout
- Panel is 1000 px tall at the top; footage slides down 350 px at about 1.8 s. Subtitles Montserrat 800, max 3 words, sentence case, KEYWORDS caps + gold, centred x=535 just above the head. Tiny gold logo top-right unless told to remove.
- Essentials in x 130-940, y 250-1436. No `scene_01` eyebrow labels.
- Sound: music + risers + SFX, pre-mixed (HyperFrames mixer lowers voice about 3-4 dB with many audio inputs), muxed on the render. Original music was generated (`music/make_music_full.py`); for new reels use tracks from the project `Music` folder.
- Preview first: render the first 5 s / 15 s, get approval, then the full cut.

## Build steps
1. Transcribe (Parakeet or Whisper), copy `reference/` into `<project>/edit`.
2. Write scenes in `src/template.html` with GSAP on one paused timeline `window.__timelines["main"]`; `node build.mjs` generates index.html.
3. `npx hyperframes check`, `snapshot`, `render`; pre-mix audio; mux with loudnorm (see SKILL.md step 8).

Lint gotchas: one root composition per folder, no timed wrapper around video, use `set`+`to` not repeated `fromTo`, audio needs an id, `data-layout-allow-overlap/overflow` where needed.

When used inside asher-reel, the shared pipeline (edl, mix2, build for subtitles/zoom) still applies; only the panel scenes come from this template.
