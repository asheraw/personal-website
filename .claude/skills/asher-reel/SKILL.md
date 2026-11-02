---
name: asher-reel
description: Make Asher's vertical (1080x1920) talking-head reels from raw webcam clips plus a script - trim dead air, subtitles, colour grade, music + sound design, an animated top panel in a chosen style, two exports (Instagram "Comment KEYWORD" + other platforms "link in bio"), and a thumbnail. Use when Asher asks for a reel, short, or vertical video from raw clips, mentions the Offer Regrets series, or names a style (whiteboard, pixel RPG, living screencast, website default). Nested styles live under styles/; add new ones there.
---

# asher-reel

Built from the Offer Regrets reels (Oct 2026, Reels 1-4 done) and the "Leaving Job at 42" video. Asher is a non-developer: explain in plain language with analogies, no unexplained jargon. He often uses /caveman for replies. He is warm and enthusiastic; keep progress updates short and concrete.

## Workflow with Asher (follow this order)
1. **Read the script** for the reel and the raw clip(s) in `Raws\`. Transcribe (step 2 below). If two takes exist, pick the cleaner one and say which and why.
2. **Suggest a style** from the lemo-opuscar library (`C:\Users\Admin\lemo-opuscar\styles\`, index in `styles\README.md`) or the nested styles below. Give ONE clear recommendation with why it fits the story beat by beat, 2 alternatives, and the risk (new engine = longer build). Let him choose. Vary styles between reels.
3. **Build and deliver the INSTAGRAM version only.** Show it, list what is in it and what to look at, wait for approval. (He explicitly asked for one video first from Reel 4 on.)
4. **After approval, render the other-platforms version** (WEB), check its ending, report.
5. **Thumbnail (ALWAYS ask at the end):** "Want a thumbnail for this reel?" He wants one per reel (platforms ask for a first frame/thumbnail). See Thumbnail section.
6. Then move to the next reel (steps 1-2 again). Update this skill after each reel with what was learned.

## Nested styles (top panel animation)
| Style | Folder | Use when |
|---|---|---|
| **website-default** (DEFAULT) | `styles/website-default/` | Nothing else requested. asheraw.com look: dark, gold, Playfair + Montserrat; HTML/GSAP scenes. "Leaving Job at 42". |
| **whiteboard-explainer** | `styles/whiteboard-explainer/` | Hand + marker on a "Stage" board. Reels 1-2. |
| **pixel-rpg** | `styles/pixel-rpg/` | Game-like: menus, level-up, locked door, quest scroll. Reel 3. |
| **halftone-dossier** | `styles/halftone-dossier/` | Challenges, verdicts, "case file" arguments. Reel 6. |
| **game-show** | `styles/game-show/` | Scores, rounds, judges, quizzes, "price of a yes". Reel 7. |
| **pictogram-motion** | `styles/pictogram-motion/` | Lists/catalogues of things added or steps: one card per item. Reel 8. |
| **news-package** | `styles/news-package/` | Interview / bulletin / explainer-with-steps stories: strap, rundown rows, counters, stamps. Reel 5. |
| **living-screencast** | `styles/living-screencast/` | Software/AI/chat stories: redrawn app world + pixel mascot. Reel 4. |

Adding a style: new folder `styles/<slug>/` with `STYLE.md` (what it is, how to build the panel, reference files, gotchas) + a row above. Layout, audio, captions, QC are shared; only the panel differs. Library styles are specs only: read `styles/<slug>/STYLE.md`, write your OWN treatment/story, get the demo engine with `LEMO_OPUSCAR_HOME=/c/Users/Admin/lemo-opuscar sh ~/.claude/skills/lemo-opuscar/scripts/setup.sh demo <slug>` (if the demo folder stays missing, in PowerShell `$env:MSYS_NO_PATHCONV=1; git sparse-checkout add '/styles/<slug>/demo/'` inside the library). Never reuse a demo's story.

## Fixed layout (all styles)
- Canvas 1080x1920. Safe area for essentials: x 130-940, y 250-1436.
- Panel top: 960x540 inside a 972x552 gold frame (`#b8924a`, 6px) at left 54, top 284. Gold seam line at y 996. The panel page renders at 1920x1080 (`node core/render/video.mjs`) and is downscaled.
- Person below: 4:3 window 1080x810 at y 1000 (video 1440x810 at left -169). Match head height between takes.
- Captions: Montserrat 800, <=3 words, sentence case, only KEYWORDS in CAPS + gold `#f0b865`, centred at y 868. No `scene_NN` labels. Keep panel overlays out of this lane.
- Slow push-in on the person 1.0 to 1.09 plus a punch-in (1.26-1.38) on a key word about every 6-7 s (build.mjs `ZOOM_PLAN`, word + earliest final time + scale, alternating origin).
- Background `#0a0807` with soft gold glow at top.

## Pipeline (copy `pipeline/` into `_work\reel-N`, replace "Reel 4" with the reel name; `run-reel.sh ig|web` runs everything)
1. **Inputs**: `Raws\Reel N.mp4`, script in `Claude text.txt` / `ChatGPT text.txt`. Script text is the truth for wording; fix Whisper mishearings with FIX/patch code in edl.mjs (digits for numbers like "2"/"3" if the script uses them, "know-how", "Comment"/"DEFEND" etc.).
2. **Transcribe**: `D:\Work\whisper-env\Scripts\python.exe pipeline/whisper_tx.py "<raw>.mp4" "_work/tx_w/Reel N.json"`.
   **WARNING:** Whisper stretches timestamps over silences (first words can start at 0 while speech begins at ~4.8 s; last word can run to the end). Always check `silence.json` and hand-fix the first words, the last word and the CTA start in edl.mjs, otherwise words fall outside the range and vanish.
3. **Silence**: `node silence.mjs` (ffmpeg silencedetect). Trim from silences, never from ASR end times.
4. **Edit list**: `edl.mjs` (word fixes, `IN`, `RANGES` for IG `[[IN, endOfMainBody],[ctaStart, ctaEnd+~0.9]]` and WEB `[[IN, endOfClickLine+~0.9]]`, `HOLD` = clip times of scene changes inside silences) then `edl3.mjs` (trim gaps >0.22 s, 1.05x speed, keep 0.34 s pauses at HOLDs, keep trailing silence up to the range end, writes edl.json/words.json/warp.json). Copy `ranges.json hold.json words_clip.json` into the board folder (run-reel.sh does).
5. **Panel**: build with the chosen style in `_work\reel-N-board`. Hints are in CLIP time; `X = M(V(t))` maps to final time; `a(word, near)` = final start of a spoken word. Events (`window.EV`) drive sound.
6. **Audio**: `mix2.py` pre-mixes voice (atempo 1.05) + SFX from events (pop, blip, select, key, notif, swish, error, hit, chime, coin, door, swirl, levelup, fanfare, riser, magnet; no marker squeak/swoosh/eraser) + music ducked ~15.5 dB under voice (`../../Music/<file>`, set in mix2.py; vary per reel). Pre-mix then mux (HyperFrames mixer lowers voice).
7. **Compose**: `build.mjs` -> index.html (video segments from the graded `assets/reel-N.mp4`, subtitles, zooms); `npx hyperframes render -o renders/silent.mp4 --fps 30`. Build writes KEYS (gold keywords) and ZOOM_PLAN per reel.
8. **Mux + loudness**: `ffmpeg -i silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart out.mp4`. Expect -14 to -14.5 LUFS.
9. **Exports**: IG ends "Comment KEYWORD and I'll send you the link" (replaces "Click the link in my bio"; the IG range skips the "Click the link" line). WEB ends "Click the link in my bio" with the link-page card (`img/linkpage.png`, tile "The Regret of the Offer You Never Launched" circled + "this one!"). Run IG first; `sh run-reel.sh web` sets `WEB=1` and `--q variant=web`.
10. **Colour grade** (Reel 3 onward; Reels 1-2 stay as they are). GRADE A (approved 2026-10-23), pre-grade the raw into `assets/reel-N.mp4` (person only, not the panel): `ffmpeg -i "Raws/Reel N.mp4" -vf "eq=contrast=1.12:brightness=0.02:saturation=1.18:gamma=0.95,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.03:bm=-0.03,curves=all='0/0 0.25/0.21 0.75/0.79 1/1'" -c:v libx264 -crf 14 -preset fast -an -pix_fmt yuv420p assets/reel-N.mp4`.
11. **Music**: pick per reel from `Music\` (Asher keeps adding tracks; you cannot audition, choose by name/mood and tell him which). Used so far: R2 New Moon Energy, R3 Space Worm, R4 Back to Business. Never store the Epidemic Sound API key anywhere.

## Thumbnail (one per reel, named `Offer Regrets N - Thumbnail.png`)
Layout (same as `pipeline/thumbnail-template.html`, 1080x1920): gold glow, "OFFER REGRETS" label + gold logo near y 340, panel image in a gold-framed box (960x552 at top 440, a still of the reel's panel, full view not zoomed: whiteboard = light board built in HTML; pixel = `still.mjs` frame; screencast = `still.mjs --q full=1`), seam at y 1036, graded frame of Asher below (pick an expressive frame with eyes open and hands out; 4-6 candidates via ffmpeg), a one-line Montserrat caption (62-84 px, keyword in gold) at y 1625 that fits inside the frame. Render with `npx hyperframes snapshot --at 0.1` in the thumbnail folder and copy the PNG to the project root. Patch helper: `pipeline/thumbnail-patch.mjs`. Reel 1 and 2 thumbnails use the ungraded frame (match their video); Reel 3+ use grade A.

## Hard limits and lessons added 2026-10-23
- **Instagram reels must be UNDER 90 s (real limit).** Check `ffprobe` duration before delivering. Levers: `SP` in edl3.mjs (1.1 works and still sounds natural), `MINGAP` .19, `TRANS_KEEP` .3, skip the "Click the link" sentence in the IG cut, trim NG material to the minimum. Reel 6 went 92.6 s -> 87.9 s this way.
- Titles/text in panels: check every long headline fits (Arial Black is wide), nothing duplicated (a headline and a stamp saying the same words), nothing finishing after the scene ends; strike-throughs are a red line, not a black bar; end-card text goes on a solid card.
- ChatGPT-script reels (7 = ChatGPT Reel 1, 8 = ChatGPT Reel 2; navy cap): same pipeline; Whisper mishears there too ("wrangle" = "rare angle", "years" = "yes"). Fix in edl.mjs.
- Run order that worked overnight: IG v1 + thumbnail for each reel, web version only after approval (Reel 6 web was approved in advance).
- Windows quirks: the shell hook blocks heredocs combined with redirects (use the Write tool + small python patch files), and `\n` typed into python/sed patches can become real newlines (use `chr(92)`).

## Hook + thumbnail rules added 2026-10-28 (Asher: old thumbnails were not clickworthy)
- **Every reel gets a text HOOK at the very top of the video** (y ~96-280, above the panel; fine if the IG feed crop hides it). 3-7 words, big Montserrat 800, keyword gold. Set `HOOK="LINE 1|LINE 2 with <b>GOLD</b>"` when running `node build.mjs` (run-reel.sh: export HOOK first). Use the same hook words as the thumbnail (Title Case, one CAPS keyword).
- **Thumbnails v3 (CURRENT, Asher 2026-10-28: "get the click")**: it is NOT a series, so NO series label and NO reel number. Layout 1080x1920: a HUGE hook (3 lines, <= ~9 characters per line, 170-240 px, Montserrat 800, Title Case, ONLY the main keyword in CAPS + gold), below it a bold simple graphic that shows the idea (big 8/10, 99% bar, tower of courses, $0, etc.), a framed expressive photo of Asher (grade A) beside it, WOBBLY hand-drawn red circle(s) + a hand-drawn arrow + a short handwritten note (<= 16 characters, Patrick Hand) to create curiosity. Keep key content inside y 230-1750 (IG grid crops 3:4). Be creative per reel: the graphic alone, or Asher alone, are allowed; the goal is the click. Generator: `pipeline/thumbnail-v3-gen.mjs` (edit the T list: hook, face, gfx html, note, circle, arrow). Output `N Title - thumbnail v3.png`.
- Asher renamed finals to `N Title - IG.mp4`, `N Title.mp4` (other platforms) and `N Title - thumbnail.png`; follow that naming for new reels.

## Layout v4 (from "Imperfect offers" set, 2026-11-02; source clips are now 1920x1080, Asher in a yellow cap + white glasses)
Asher's 4 rules: (1) thumbnail is FRAME 0 of the video; (2) start with him in full view, then a swift push-down into the lower window; (3) his cap/head POPS OUT above the window border (Kallaway style); (4) every reel ships with a review page (`N Title - preview.html`) with checklist + storyboard + a "what to change" box per scene + hook/thumbnail boxes + "Copy all feedback" button. Blank box = no change. Hook text sits at the very top the whole video.
- Pipeline for this layout lives in `pipeline/v4/`: `bake.py` (graded 1920x1080 `person.mp4` cut per edl.json + mediapipe selfie matte -> `popP.mp4` (person x matte on black) and `popM.mp4` (inverted matte), 1080x750 slices; mask limited to the head area, largest blob only), `build4.mjs` (composition: thumb frame 0, full-screen -> window tween at T0=0.7 s, window top y1050 / 810 high, pop layers use `mix-blend-mode` multiply (popM) + plus-lighter (popP) and must NOT sit inside a transformed or z-indexed parent; zoom via CSS variables --d/--p/--ox so all three person layers share one transform), `run4.sh`, `make_preview.mjs` + `preview_spec.json` (review page), `film builder` example in `styles/halftone-dossier/reference/build_film_claude1.py`.
- Window crop: src x 460-1540, y 270-1080 at scale 1 (face center x ~1000); captions at y 852 (moved up from 868), hook at y 56-240, panel frame y 284.
- mediapipe 1.2 only has the tasks API: download `selfie_segmenter.tflite` with urllib (the shell hook blocks curl -o); python at `d:\Work\whisper-env`.
- Board film reads FINAL-time `words.json` + `edl.json` (no clip->reel mapping needed): `at(word, nearFinalTime)`.
- Retakes/endings: take the best sentence pieces from different takes and splice at silences (e.g. "...and my prompts," + "comment PERFECT and I'll send it to you.").
- Trial Reels: Claude Reel 5 has alternative first lines (file "05a"), and Asher wants an experimental version that shows mostly him and cuts to the animation only for the key points. Not built yet.
- Project folder 11-02: scripts.txt has Claude Reels 1-5 and ChatGPT Reels 6-10 ({n} blocks); the link goes to asheraw.com/link -> https://asheraw.com/blog/the-perfect-offer-doesnt-exist-until. IG ending: "comment PERFECT and I'll send it to you".

## v5 updates (2026-11-02, Asher's feedback on Claude Reel 1)
- **Cut-out uses Robust Video Matting** (cloned `D:\Work\RobustVideoMatting`, weights rvm_resnet50.pth, torch cu121 in `d:\Work\whisper-env`). `pipeline/v4/bake.py` writes FULL-FRAME 1920x1080 `popP.mp4`/`popM.mp4` (mask limited to head box x740-1380,y<650). In `build4.mjs` the person and both pop videos share one CSS transform (vars --tx --ty --s --d --p --ox, window top/height = --wt/--wh) so the head moves with the push-down: no pop-in. Do not put blend-mode videos inside a transformed/opacity parent.
- **Images instead of flat SVG**: `D:\Work\Assets` = Microsoft Fluent 3D emoji (3,145 PNGs, `python assets.py fluent "money bag"`, `find <word>`) + Google Noto Lottie (`assets.py lottie 1f4b8`, lottie-web installed). Use them for props, people, objects in every panel. For real photos of public figures use `commons_img.py`/`wiki_img.py` (often empty): ask Asher to drop photos in a folder.
- **Review workflow (saves tokens)**: do NOT render the full video for ideation. Send the storyboard first: one still per scene (the END state of each scene, so text is complete) + why this style was chosen vs runner-ups + hook options + thumbnail. Build the video only after he picks. A cheap low-res preview (360p, no audio mix) is allowed. The review page (`make_preview.mjs`) now shows scene-END frames and a "Why this style" card.
- Hook can be a full sentence (paragraph mode, auto-shrinks to fit ~215 px high); Asher's Reel 1 hook: "Here's how being smart by copying experts actually made me fail to make any sales for my offer".
- Text inside boxes: use `white-space:nowrap` with an auto-width card (left set, no fixed width) and test the END frame of each scene; stamps must sit fully inside x130-940 of the 960 panel (page x 0-1920 minus margins).
- Link screenshot: `Link screenshot.png` in the project folder (asheraw.com/link, left tab = the perfect-offer article) is shown on the "full article" scene with the left tab circled.
- Thumbnail idea that Asher asked for: mugshot polaroids of well-known experts with a black bar across the eyes, arrow to a circled "Zero", text "But WHY?". Generator: `_work/c1/thumb/thumb2.mjs` (drop photos in `experts/`).

## v6 rules (2026-11-02, after Claude Reel 1 feedback round 2)
- **Previews first, NOT video.** For a new reel send ONLY the preview page: one finished (end-of-scene) still per scene + why-this-style + hook options + thumbnail. Stills cost far fewer tokens than rendering and checking a cut. Render the video only after Asher approves the stills.
- **Preview checklist = SHORT** (about 8 items, <= 6 words each). No long sentences.
- **Speed**: play at 1.0x. Use SP=1.1 only if the cut is >= ~85 s (limit 90 s). Panel timing hints must match the speed used (hints written at 1.1x need x1.1 at 1.0x; re-check `at()` errors).
- **Layout for the Imperfect-offers series (v7)**: Asher stays in the LOWER half, no full-screen intro, no push-down, no cut-out/pop-out (his black cap on black background matted badly). Window top 1030, src crop x460 y90, soft fade on the top edge (no hard line crossing cap/chin). Asher will revisit zoom/crop effects next series.
- **Thumbnail (series 11-02)**: hook "I Copied EXPERTS. Sold Zero." with Zero circled, small "but why?", then mugshot polaroids with bar over eyes (Dan, Alex, Codie; first names only, heads cropped from `Materials/`, `thumb/crop_heads.py`, `thumb/thumb3.mjs`). Video frame 0 = this thumbnail for 2 frames.
- **Other-platforms ending** (asheraw.com/link): Whisper writes "asheroll.com": it is a transcription error, he says it right; map to "asheraw.com/link". End card: FIND IT AT / asheraw.com/link / THE FIRST TAB; keep ~1.2 s tail after the last word.
- **Render scripts must stop on error** (`set -e`, no `| tail` after render commands): a silent failed board render once produced a video with stale panel timing.
- Icon overlays must not cover card text (put icons at the card's top-right corner, ~90 px).

## v7 (Claude Reel 2, storyboard-first)
- **Storyboard-only first delivery.** `pipeline/v4/make_preview.mjs` builds `N Title - preview.html` from board stills (no video): LEFT = scene end-frames + "what to change" box each, RIGHT (sticky, always visible) = thumbnail now / video later + hook, thumbnail, overall boxes + "Copy all feedback". Where-this-points / checklist / why-this-style sit at the BOTTOM (nothing to change there). Stills: `node core/render/still.mjs <board> <times...>` at (next scene start - 0.45 s); spec lists scene starts.
- Pipeline per reel (series 11-02): `_work/cN/` (whisper tx, edl.mjs, edl3.mjs, mix2.py, run4.sh) + `_work/cN-board/` (build_film3.py writes film.js; index.html; img/ copied from `D:\Work\Assets\fluent-emoji`). Recordings now live in `Materials\`.
- Reel 2 style = Evidence Board (dark board, pinned polaroids, sticky notes, red stamps; HEARD green / ASSUMED red). Reel 1 = Halftone Dossier. Pick a different style per reel and explain why in the preview.
- Shell hook blocks heredocs that redirect output; write files with the Write/Edit tools and use `_work/snap.mjs <dir> <out.png>` to snapshot a HyperFrames page.
- Thumbnail rule: keep each hook line short enough (check width) or shrink font; no text off the edge.

## v8 (Claude Reel 2, storyboard round 2)
- **Preview page v3** (`pipeline/v4/make_preview.mjs`): click any frame or the thumbnail = lightbox (Esc/click closes); full-width layout; "Copy all feedback" button top-right; Hook = 3 radio options (spec `hooks`, first = default) + own-hook textbox that overrides. Hooks must tease the payoff BLIND (promise the result, never reveal the answer).
- **Memes**: `D:\Work\memecub\meme.py search "<phrase>" [--kind gif] [--get N]` (memecub API; key lives only in `D:\Work\memecub\.env`, never commit or write it into the skill). Wrapper drops anything with Chinese text (target market is not Chinese). GIFs are rendered by extracting frames to `img/<name>/fNNN.png` and toggling the frame `<img>`s by time (deterministic). Pause the speaker slightly during a meme with a sound bite; keep meme audio soft.
- **Fake top time bar** (video stage, build4.mjs): bar at the very top; first 40% fills fast, easing to the slow steady pace of the remaining 60% by the 35-40% mark, ending exactly with the video.
- **Sounds that are copyrighted (e.g. Street Fighter "Perfect")** cannot be fetched: ask Asher for the audio file.
- Reuse one character image across consecutive scenes (zoom, arrow + label, thought bubble) instead of swapping new pictures.

## Standing rules from Asher (do not re-learn)
- Text must FINISH writing/typing before the scene or camera moves on (failed twice on the whiteboard; pen write speed has a floor, so start earlier or delay the camera). Check a frame strip right before every scene change. Leave >= 1 s tail after the last spoken word so the last panel element completes (he complained when the ending cut off).
- No clipped/overlapping/duplicate text; keep text inside bubbles/windows; keep overlays out of the caption lane.
- No marker squeak, swoosh or eraser-rub sounds. No bleep: keep the real "la la" audio on NGs (flash + magnet). Keep NG outtakes for authenticity, end on real moments (hands down), never cut a gesture early.
- Cut dead air everywhere; zoom/camera movement regularly, not only at start/end.
- Subtitles follow the script wording (not Whisper): sentence case, keywords gold CAPS.
- Panels: legible ink on paper (dark on cream); equal-armed "+" etc.; never reuse a demo's story; the first reel in a new style is an experiment, so list what to look at.
- Don't push/commit unless asked. Claude Code blocks `claude mcp add`, wildcard `rm`, and some heredoc + redirect shell commands (dcg hook): write files with the Write tool or small scripts instead.
- Name finals `Reel N - Instagram vK.mp4`, `Reel N - Other platforms.mp4`, `Offer Regrets N - Thumbnail.png`; keep older versions; delete nothing of his.

## Project layout
Project root `D:\Work\Social Media\2026\10-22 Offer regrets` stays clean: `Raws\`, `Music\`, script files, FINAL deliverables. ALL working folders live in `_work\`: `tx_w` (transcripts), `reel-N\` (edl/mix/build/index.html/renders/assets), `reel-N-board\` (panel project, run from lemo-opuscar), `thumbnailN\`, `sheet.mjs` (contact sheets of stills). From `_work\reel-N`: raws `../../Raws`, music `../../Music`, transcripts `../tx_w`, board `../reel-N-board`. Offer Regrets scripts: `Claude text.txt` (Reels 1-6), `ChatGPT text.txt` (alt, Reels 7-8). Reel status (Oct 23 2026): 1,2 whiteboard (done), 3 pixel-rpg (done), 4 living-screencast (done), 5 news-package (done, music Hands), 6 halftone-dossier (done: IG v2 87.9 s + web + thumbnail; music Groove De Carnaval), 7 game-show (IG v1 + thumbnail, 79.9 s, from ChatGPT Reel 1; music Disc Me Bro), 8 pictogram-motion (IG v1 + thumbnail, 75.4 s, from ChatGPT Reel 2 + NG inline; music Lend a Hand). Reels 7 and 8 web versions wait for Asher's feedback. Asher wants to try other music than 8-bit-ish tracks.

## QC before delivering
Duration, -14 LUFS, frame strip across all scenes (use many times, contact sheet), the ending/CTA frames, subtitle spelling vs script, safe area, no dead air, panel text complete. Report plainly: what is in it, what to look at, then ask for approval before the other-platforms version.
