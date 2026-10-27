p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## Hook + thumbnail rules added 2026-10-28 (Asher: old thumbnails were not clickworthy)
- **Every reel gets a text HOOK at the very top of the video** (y ~96-280, above the panel; fine if the IG feed crop hides it). 3-7 words, big Montserrat 800, keyword gold. Set `HOOK="LINE 1|LINE 2 with <b>GOLD</b>"` when running `node build.mjs` (run-reel.sh: export HOOK first). Use the same hook as the thumbnail.
- **Thumbnails v2 layout (use for all future ones)**: HUGE hook at the top (3-7 words, 2 lines, auto-fit ~100-150 px, gold keyword), series label + big reel number "01" in the top row, panel image below at 960x540, Asher (grade A) at the bottom, logo bottom-right. Keep key content inside y 250-1680 (IG grid crops 3:4). No full caption, no thin fonts. Generator: `pipeline/thumbnail-v2-gen.mjs` (edit the T list; run from a folder with thumbnails' assets); output `N Title - thumbnail v2.png`.
- Asher renamed finals to `N Title - IG.mp4`, `N Title.mp4` (other platforms) and `N Title - thumbnail.png`; follow that naming for new reels.

'''
if 'Hook + thumbnail rules' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
