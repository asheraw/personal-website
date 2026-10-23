---
name: game-show
description: Nested style of asher-reel - Game Show Flat (lemo-opuscar game-show). THE OFFER SHOW: flat candy-coloured sets (stripes / dots / sunburst, one hue per round), toy beans that hop on the beat, round banners, scorecards, price tags, judgement words. First used for Reel 7 (AI gave my offer 8/10).
---

# Game Show Flat ("The Offer Show")

Library spec: `C:\Users\Admin\lemo-opuscar\styles\game-show\STYLE.md`. HTML page 1920x1080, downscaled to the 960x540 panel. Font: `Arial Rounded MT Bold` (Windows). Text strokes use ink `#1b1b2f` so they vanish on navy: put text on a cream card or white tag there.

## Built in `reference/film.js`
- 12 rounds = 12 `.g` groups, each with its own `set` (colour + scrolling pattern), a corner banner "ROUND N · NAME", round-specific props. Diagonal colour-band wipe between rounds, ink bar at the bottom that pulses on the beat.
- Beans (`bean()` + `hop()` which also scales them x1.6 from the bottom centre so they stay on the floor): contestant (yellow, offer box), AI judge (blue robot), buyer (green), "real person" with wallet.
- Pieces: scorecard "8/10" with pop + rotate, stamps "TOO BROAD", versus cards, coin rain, FREE PROMPT tag, end card on a cream card (IG: COMMENT VERDICT; WEB: link card).
- The script's inline slip ("AI's yes means nothing... costs it nothing") is shown as a struck-through card that changes to the corrected line.

## Gotchas
- Keep beans <= scale 1.6 and place tags above their heads, cards below their feet (bean heads got hidden behind tags).
- CTA text on a busy sunburst is unreadable: always put it on a cream card.
- Titles in navy sets need a white tag.
- Music for Reel 7: "Disc Me Bro - Basixx".
