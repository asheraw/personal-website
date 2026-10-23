---
name: whiteboard-explainer
description: Nested style of asher-reel. Hand + marker draws the story on a dark "Stage" whiteboard, built with the lemo-opuscar library's whiteboard engine. Used for the Offer Regrets reels.
---

# Whiteboard explainer (lemo-opuscar)

Library: `C:\Users\Admin\lemo-opuscar` (clone/update with the `lemo-opuscar` skill's `scripts/setup.sh`; github.com/lemomo-ai/lemo-opuscar). More lemo-opuscar styles can be added as new sibling folders under `styles/`; read `lemo-opuscar/styles/<slug>/STYLE.md`.

## Look
"Stage" board variant: dark cream-free board `#0f0c0a`-ish with faint grid and gold glow, ivory ink, gold `G` pen, red `Rd` pen, black/ivory `K` pen. Handwriting = EMS Tech single-stroke font; gold Playfair italic "turn words" (wipe in with sparkle). Merged with Asher's site palette. Engine patched with `LOOKS`, grid, glow, blend (`reference/engine/wb.js`). Sticky notes: dark ink `#1b1714` on cream paper, trim `#c44d3f`.

## How to build a panel
1. Copy `reference/` (`index.html`, `main.js`, `film.js`, `chk.mjs`, `mock.js`, `engine/`, `fonts/`) to `reel-N-board/`. `main.js` defaults the look to `stage` and exposes `window.CHK`.
2. Write `film.js` scenes: it is the Reel 2 film (exemplar). Helpers: `at(word, near)`/`end()` (word times), `T()` handwritten text (registered for the scan), `D(pen, shapes, start, end)` draw wrapper (starts no earlier than camera arrival `ARR`), `block`, `person`, `turn()`, `POPQ`, `RISE`, `ER` (erase), `CUE`. Scenes are regions (A..H) on a big board; camera whips between them at `HOLD` times (+ `LATE` delay per scene when writing needs longer).
3. Time map `X = M(V(t))`: clip time -> reel (ranges.json) -> final (warp.json). Files `ranges*.json`, `warp*.json`, `words_clip.json`, `hold.json` must sit next to index.html (copy from `reel-N`). `?variant=web` switches CTA (`_web` files).
4. Run from the library: `cd C:\Users\Admin\lemo-opuscar`
   - events: `node core/render/events.mjs "<board>" [--q variant=web --out <board>/events_web.json]`
   - video: `node core/render/video.mjs "<board>" --fps 30 --workers 6 [--q variant=web] --out "<board>/out/board.mp4"`
   - stills: `node core/render/still.mjs "<board>" <t...>`
   - copy `board.mp4` to `reel-N/assets/board.mp4` then run mix2.py, build.mjs, render.
5. Run the chk scan: OUT (off-board), OVERLAP, DUPLICATE (same word twice), BUBBLE (text must stay inside speech bubble), erase-aware.

## Gotchas
- Pen write speed has a floor: `D(...)` end time is a minimum, not a guarantee. If text is half-written at a scene change, start earlier or set `LATE[scene]` so the camera waits.
- Number/words visible twice ("99%") look bad: scan flags it.
- Each reel's 4 pens park off-board; do not overlap two pens on the same label.
- Sticky-note text must use dark ink.
- No squeak/swoosh/eraser sounds: mix2.py only uses pop/turn/riser/hit/chime/magnet cues.
- Board is 960x540 render; at the end the Instagram cut adds a "Comment KEYWORD" DM note; the web cut shows the link-page card (`img/linkpage.png`).
