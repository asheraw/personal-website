---
name: pixel-rpg
description: Nested style of asher-reel - 16-bit Pixel RPG panel (lemo-opuscar pixel-rpg). The reel's story told as game screens - menus, item lists, level-up, locked door, quest scroll, item-get. First used for Reel 3 (a course = grinding XP in the village instead of launching).
---

# 16-bit Pixel RPG (lemo-opuscar `pixel-rpg`)

Library spec: `C:\Users\Admin\lemo-opuscar\styles\pixel-rpg\STYLE.md`. Engine files (px.js palette/FB/mosaic, font.js, ui.js) come from the library demo. If `styles\pixel-rpg\demo` is missing: in PowerShell run `$env:MSYS_NO_PATHCONV=1; git sparse-checkout add '/styles/pixel-rpg/demo/'` inside the library (git-bash path mangling breaks the sparse list). Never reuse the demo's story.

## How it works
- Panel = 320x180 indexed framebuffer (ENDESGA-32 palette). Page canvas 1920x1080, downscaled to the 960x540 panel. Transitions are mosaic + step-darken (never alpha fades) at each scene boundary; 0.34 s kept pause per scene change (HOLD in edl.mjs).
- `reference/film.js` is Reel 3's whole film. Pattern: `a(word, near)` gives the final-reel time a spoken word starts; each scene is `scenes[i] = (fb, t, u) => {...}` using helpers (`hero`, `person`, `building`, `scroll`, `laptop`, `key`, `lock`, `bar`, `check`, `cross`, `sparkles`, `win` windows, `typed`). Sound cues: `E(t, type)` with blip, select, tick, coin, error, levelup, fanfare, door, chime, hit, swirl (synthesised in mix2.py).
- Hero (Asher: cap with white mark, glasses, black sleeveless with white print) is drawn from boxes in `hero()`.
- `?variant=web`: the link-page screenshot is dithered to the palette with a pixel circle on the tile and "THIS ONE!". Instagram: a "COMMENT <KEYWORD>" message window.
- Font lacks some glyphs: `$` and `&` were added to font.js. Check any new character exists (`grep "^def(" font.js`) or it prints `?`.
- `pipeline/run-reel.sh ig|web` runs the whole chain for a reel; `pipeline/sheet.mjs` makes contact sheets of stills (`node core/render/still.mjs <board> t1 t2 ...`).
- Music is chosen per reel from `Music\` (Reel 3 used "Space Worm - AGST").

## Gotchas
- Keep window text inside borders (font is about 6 px per character); check stills for overflow.
- Leave at least 1 s tail after the last spoken word so the last window finishes (edl3 keeps trailing silence up to the range end).
- Wording fixes for the script live in edl.mjs: numbers as digits, "know-how", "Once you've got", drop "can".
