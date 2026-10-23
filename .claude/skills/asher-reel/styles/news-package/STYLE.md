---
name: news-package
description: Nested style of asher-reel - Broadcast News Package (lemo-opuscar news-package). A flat graphics bulletin "The Offer Desk": sting that becomes the channel bug, a lower-third strap whose words flip, rundown rows, split-flap counter, bars on one scale, stamps, vertical gold band wipes. First used for Reel 5 (AI interviews you).
---

# Broadcast News Package ("The Offer Desk")

Library spec: `C:\Users\Admin\lemo-opuscar\styles\news-package\STYLE.md` (the style is the package system + cutting rules, not a drawing style). This version is HTML (1920x1080 page, `window.render(t)`), downscaled to the 960x540 panel. Own bulletin, no real news facts, so no source line; bar scenes carry the `SCHEMATIC / DIAGRAM` corner tag.

## Package used (see `reference/film.js`, `index.html`)
- Colours: ink `#121417`/`#1b1e23`/`#22262c`, accent = Asher's gold `#f0b865` (light `#f8d08a`, dark `#d99846`), paper `#f4f1e8`, olive `#6e5a1e`, alarm `#fe6b3d` ONLY for the retake/BREAKING screen. Fonts: Windows `Bahnschrift` (condensed via `font-variation-settings: "wdth" 70`) + `Consolas` mono; no web fonts needed.
- Sting 0-1.4 s (plate slams in, flies to top right and becomes the bug), strap (tab + paper strap + ink end block) from 1.45 s whose headline flips up every beat (`STRAP` list), rundown rows with number blocks, split-flap counter tiles (`counter()`), bars (`.bar`, one scale), stamps (land from 1.9x), vertical wipe between stories (gold 84 px band + ink 5 px + 14 px edge) drawn on a canvas above the stage, hard cut + white flash for a retake.
- Scene map for Reel 5: 0 AI writes -> interviews (word flip), 1 tidy-draft bars + NOT YOU stamp, 2 before/flipped cards, 3 RETAKE alarm, 4 take-2 waveform + AI asks, 5 rundown of the 3 questions + ONLY YOU stamp, 6 voice notes -> AI -> first draft with red strike marks, 7 blank page vs correcting bars + "YOU IN THE OFFER" counter, 8 recap rows ticked, 9 quote card with underline on the key word, 10 profile (15+ YEARS counter, head -> offer card, article, FREE PROMPT), 11 end card (IG: "COMMENT SPEAK"; WEB: link-page card with circled tile + "THIS ONE!").
- Plate text must fit the plate: 70 px for "OFFER DESK" in the 520 px plate (80 px clipped). Keep text inside circles with flex centring.

## Using an NG/retake in the edit (Reel 5 pattern)
When Asher fumbles and says "let me redo that": cut a combined source `src.mp4` = NG take (0 -> end of the fumble) + main take (from the same sentence, shifted), merge the transcripts (shift main words by the join offset, saved as `tx_w/Reel N combined.json`), point `silence.mjs`/`mix2.py` at `src.mp4`, grade it into `assets/reel-N.mp4`, and let the rest of the pipeline run unchanged. build.mjs adds a white flash at the cut (second occurrence of the retake's first word) and the panel shows a red BREAKING/RETAKE graphic with a hard cut. Example patch: `reference/patch_edl_retake_example.py`. Keep the real audio (no bleep).

## Gotchas
- Strap starts after the sting; for the first strap entry there is no "previous" headline (it showed a ghost duplicate).
- Rundown rows flip in on the word that starts each question (`rowIn`), counter steps on beats.
- Mix: new event types `flash` (NG pop), `tick`, `swish`, `chime`.
- Music for Reel 5: "Hands - Heyson" (Asher asked to avoid the 8-bit-ish pick).
