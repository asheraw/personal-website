---
name: microgame
description: Nested style of asher-reel - Microgame Frenzy (lemo-opuscar microgame). THE TWEAK-A-THON: one fixed home stage (violet sunburst, TV, hearts, stage badge, fuse timer, bean host in Asher's cap) and a different art medium per microgame (terminal, Swiss, blueprint, pixel, crayon, riso, cut paper). First used for Reel 8 (tweaking your offer for months), chosen after Asher found pictogram-motion too samey.
---

# Microgame Frenzy ("The Tweak-A-Thon")

Library spec: `C:\Users\Admin\lemo-opuscar\styles\microgame\STYLE.md`. Canvas 1920x1080 (`render(ctx, t)`), downscaled to the 960x540 panel.

## Built in `reference/film.js`
- `S` list = the show: `[start word, near, kind(home|game|fail), command word, medium, game id]`. `GAME[id](g, k, p)` draws each microgame in a 1240x560 TV window using `MEDIA[medium]` as background. Add a row + a function per beat.
- Fixed layer: sunburst, hearts (a `fail` costs one), STAGE counter, TV, fuse timer under the TV, bean host (Asher: cap, glasses, print) bouncing on the beat, command word slams then shrinks into a tag, NICE!/FAIL! stamp at the end of each game, "SPEED UP!" banners.
- Slip performed (Asher asked for this): glitch bars + `scratch` sound at each "to a product", red strike-through + ✗, then the corrected line with ✓.
- End: IG "COMMENT TRIM" card; WEB link card with circled tile and "THIS ONE!".

## Gotchas
- Beans need a size so they read (host bean 1.5); small beans inside games overlap cards: keep cards clear of them.
- Library says each game should be a different medium: vary them, and keep one hero silhouette marks (cap, glasses, print).
- Music Reel 8: "Miami - Lofive". `pipeline/bnd.mjs` prints final times of words for planning scene boundaries.
