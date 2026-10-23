---
name: pictogram-motion
description: Nested style of asher-reel - Pictogram Motion (lemo-opuscar pictogram-motion). A beat-locked flash-card catalogue: a square-grid disc pattern with sliding rows, a faceless geometric pictogram figure on a sun disc, huge slab-sans titles, mono HUD index "07 / 23" and a tick progress bar, one hue per chapter. First used for Reel 8 (tweaking your offer for months).
---

# Pictogram Motion ("The things we keep adding")

Library spec: `C:\Users\Admin\lemo-opuscar\styles\pictogram-motion\STYLE.md`. Pure canvas 1920x1080 (`render(ctx, t)`), downscaled to the 960x540 panel.

## Built in `reference/film.js`
- `C` catalogue: one row per card `[start word, near, hue, chapter, title, sub, pose, prop, arg]` (23 cards for an 88 s script). Add/remove rows, nothing else changes. Hues coral/teal/saffron/violet/forest/night, each in five tones (`tones()`).
- `pattern()` draws discs, half-discs, concentric arcs on a grid with rows drifting in alternating directions; `figure()` draws a faceless pictogram with round-capped limbs (poses: tweak, point, add, shrug, think, hunch, up, sign, self); `props()` draws blocks, dial, doc, zero ring, calendar, tower, ?, WOW bubble, 1-2-3 discs, eye, article.
- Title: Arial Black auto-fitted (`fit()` also checks no word exceeds the width), mask slide-up per line; sub line; HUD chapter + index; tick progress bar. Card change = row-slide transition. Last card = ink card with COMMENT TRIM (IG) or link card (WEB).
- Arcs need `Math.max(0, r)`: a back-ease overshoot gave a negative radius and crashed the render.

## Edit with one NG (Reel 8 pattern, see `reference/combine_example.mjs`)
Main take + NG 1 inline: NG's stumble ("to a product, to a product, to a prospect") replaces the main's clean sentence, then the main take continues. The card shows the stutter growing in the sub line. IG under 90 s: this reel is 75 s.

## Gotchas
- Cut the NG piece AFTER its last word (silence mid-point finder picked a point inside the fumble once).
- `sed 's/Reel 7/Reel 8/'` also renames comment markers that a later python patch searches for: re-check marker strings after copying scripts between reels.
- Music for Reel 8: "Lend a Hand - Ryan James Carr".
