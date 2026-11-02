p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## Layout v4 (from "Imperfect offers" set, 2026-11-02; source clips are now 1920x1080, Asher in a yellow cap + white glasses)
Asher's 4 rules: (1) thumbnail is FRAME 0 of the video; (2) start with him in full view, then a swift push-down into the lower window; (3) his cap/head POPS OUT above the window border (Kallaway style); (4) every reel ships with a review page (`N Title - preview.html`) with checklist + storyboard + a "what to change" box per scene + hook/thumbnail boxes + "Copy all feedback" button. Blank box = no change. Hook text sits at the very top the whole video.
- Pipeline for this layout lives in `pipeline/v4/`: `bake.py` (graded 1920x1080 `person.mp4` cut per edl.json + mediapipe selfie matte -> `popP.mp4` (person x matte on black) and `popM.mp4` (inverted matte), 1080x750 slices; mask limited to the head area, largest blob only), `build4.mjs` (composition: thumb frame 0, full-screen -> window tween at T0=0.7 s, window top y1050 / 810 high, pop layers use `mix-blend-mode` multiply (popM) + plus-lighter (popP) and must NOT sit inside a transformed or z-indexed parent; zoom via CSS variables --d/--p/--ox so all three person layers share one transform), `run4.sh`, `make_preview.mjs` + `preview_spec.json` (review page), `film builder` example in `styles/halftone-dossier/reference/build_film_claude1.py`.
- Window crop: src x 460-1540, y 270-1080 at scale 1 (face center x ~1000); captions at y 852 (moved up from 868), hook at y 56-240, panel frame y 284.
- mediapipe 1.2 only has the tasks API: download `selfie_segmenter.tflite` with urllib (the shell hook blocks curl -o); python at `d:\\Work\\whisper-env`.
- Board film reads FINAL-time `words.json` + `edl.json` (no clip->reel mapping needed): `at(word, nearFinalTime)`.
- Retakes/endings: take the best sentence pieces from different takes and splice at silences (e.g. "...and my prompts," + "comment PERFECT and I'll send it to you.").
- Trial Reels: Claude Reel 5 has alternative first lines (file "05a"), and Asher wants an experimental version that shows mostly him and cuts to the animation only for the key points. Not built yet.
- Project folder 11-02: scripts.txt has Claude Reels 1-5 and ChatGPT Reels 6-10 ({n} blocks); the link goes to asheraw.com/link -> https://asheraw.com/blog/the-perfect-offer-doesnt-exist-until. IG ending: "comment PERFECT and I'll send it to you".

'''
if 'Layout v4' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
