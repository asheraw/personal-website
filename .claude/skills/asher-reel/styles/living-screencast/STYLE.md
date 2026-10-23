---
name: living-screencast
description: Nested style of asher-reel - Living Screencast (lemo-opuscar living-screencast). A redrawn dark app world (chat, meeting, notes, rehearsal) in HTML/CSS with a pixel mascot as "the AI", camera push-ins and pixel-wipe transitions. First used for Reel 4 (AI-built offers you cannot defend).
---

# Living Screencast

Library spec: `C:\Users\Admin\lemo-opuscar\styles\living-screencast\STYLE.md`. This version is HTML (not canvas): page 1920x1080, rendered by `node core/render/video.mjs` (page contract: `window.render(t)`, `window.DUR`, `window.EV`, `window.READY`) and downscaled to the 960x540 panel.

## How it works (see `reference/`)
- `film.js` builds the whole DOM once (windows: chat, meet, notes, reh, cta + popups), then `render(t)` sets every style from time. `a(word, near)` gives the final-reel time a spoken word starts. Scenes are `BND` boundaries (A chat, B meeting, C chat/defend, D notes, E rehearsal, F call to action) with pixel-block wipes.
- Mascot (mint pixel robot, `drawMascot`) stands on the top edge of anchor elements via live DOM offsets (`off(el)`), hops between anchors (`PLAN`), poses: eyes, arms, sweat, pencil, shield, mail. Hide it where it should not appear.
- Camera = list `CAM` of [time, target element or [x,y], zoom]; zoom softened (1 + (z-1)*.45); zoom >= 1, whips with ease. Clamp keeps the world on screen.
- `?variant=web`: link-page screenshot (`img/linkpage.png`) with a red circle on the tile + "this one!". Instagram: DM card typing "DEFEND" then "and I'll send you the link".
- Sound events: key (typing), notif, swish, blip, select, error, hit, chime, coin, door, swirl (synth in mix2.py). Music for Reel 4: "Back to Business - William Benckert".

## Gotchas
- Whisper stretched the first/last word timestamps (speech starts after silence, last word ran to the end): fix in edl.mjs from the real audio (silence.json).
- Do not build the same window twice in a list of "active windows" (it hid the chat window once).
- Keep overlays out of captions/text lines (e.g. the "Not yours yet" badge overlapped the live caption).
- Text sizes: UI text >= 44 px in the 1920 page so it stays legible in the 960 panel.
- Leave >= 1 s tail so the last typed line completes.
