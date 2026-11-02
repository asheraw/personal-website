p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## v7 (Claude Reel 2, storyboard-first)
- **Storyboard-only first delivery.** `pipeline/v4/make_preview.mjs` builds `N Title - preview.html` from board stills (no video): LEFT = scene end-frames + "what to change" box each, RIGHT (sticky, always visible) = thumbnail now / video later + hook, thumbnail, overall boxes + "Copy all feedback". Where-this-points / checklist / why-this-style sit at the BOTTOM (nothing to change there). Stills: `node core/render/still.mjs <board> <times...>` at (next scene start - 0.45 s); spec lists scene starts.
- Pipeline per reel (series 11-02): `_work/cN/` (whisper tx, edl.mjs, edl3.mjs, mix2.py, run4.sh) + `_work/cN-board/` (build_film3.py writes film.js; index.html; img/ copied from `D:\\Work\\Assets\\fluent-emoji`). Recordings now live in `Materials\\`.
- Reel 2 style = Evidence Board (dark board, pinned polaroids, sticky notes, red stamps; HEARD green / ASSUMED red). Reel 1 = Halftone Dossier. Pick a different style per reel and explain why in the preview.
- Shell hook blocks heredocs that redirect output; write files with the Write/Edit tools and use `_work/snap.mjs <dir> <out.png>` to snapshot a HyperFrames page.
- Thumbnail rule: keep each hook line short enough (check width) or shrink font; no text off the edge.

'''
if 'v7 (Claude Reel 2' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
