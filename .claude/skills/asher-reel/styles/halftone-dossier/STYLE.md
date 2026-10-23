---
name: halftone-dossier
description: Nested style of asher-reel - Halftone Dossier (lemo-opuscar halftone-dossier). A retro print case file: cream paper, overprinted halftone dots (cobalt + pink), black-weight slab headlines with pink misregistration shadows, rubber stamps that slam, redaction bars, dot-grid wipes. First used for Reel 6 (THE PEOPLE vs. YOUR COURSE).
---

# Halftone Dossier ("Case 0006: The People vs. Your Course")

Library spec: `C:\Users\Admin\lemo-opuscar\styles\halftone-dossier\STYLE.md`. HTML + canvas 1920x1080 page (`window.render(t)`), downscaled to the 960x540 panel.

## Built in `reference/film.js`
- Paper canvas (multiply overlay, mottling + vignette + fold), per-frame dust grain, halftone canvas under everything (`dots()` with a radial density field per scene + a pink edge layer), dot-grid wipe between scenes, HUD chips (CASE 0006, chapter chip, REC dot).
- Fonts are Windows system fonts (Rockwell Extra Bold did not load, so headlines fall back to Arial Black; sizes are tuned for Arial Black, which is WIDE: long headlines must be <= ~100 px or they overflow). Mono: Courier New. Hand: Comic Sans MS. Display: Cooper Black Std.
- Components: per-character headline pop (`chars()`), stamps (`stampIn`), redaction bars, cards, speech bubbles, mugshot card, crowd of "i" dots, robot, magnifier, folder + ticket, versus cards with a VS starburst.
- Story pattern used: charge -> witness (coachee) -> "no answer" -> NG fumble as "STRICKEN FROM THE RECORD" stamp + redaction bars -> retake -> flatterer -> question -> 3 checks as numbered cards -> verdict stamps -> next file -> CLOSED card (IG: COMMENT EDGE / WEB: link card).
- Strike-throughs: a red line grows over the text (not a black bar); keep text big (>= 80 px in the 1920 page) so it reads in the 960 panel.

## Edit with two NGs (Reel 6 pattern, see `reference/combine_example.mjs`)
Main clean take + NG A inserted right after the sentence it ruins ("I said that wrong, let's try that again", then the main take restarts at that sentence) + NG B used inline where the fumble corrects itself ("It will tell you... It won't tell you...") with no flash. `combine.mjs` cuts at silence mid-points, writes `src.mp4` and a merged transcript; flashes only at take changes back to main. Keep total under 90 s: Reel 6 needed SP=1.1 in edl3.mjs (and MINGAP .19, TRANS_KEEP .3).

## Gotchas
- JS strings written through shell/python patches: use `chr(92)` for backslashes (the `\n` escape got turned into a real newline once and broke the page).
- Scenes with only a headline look empty: show placeholder cards early and fill them as words are spoken.
- Web CTA heading must be <= 96 px.
- Music for Reel 6: "Groove De Carnaval - Usnow".
