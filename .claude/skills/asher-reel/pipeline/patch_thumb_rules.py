p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
a = s.index('- **Thumbnails v2 layout')
b = s.index('- Asher renamed finals')
new = '''- **Thumbnails v3 (CURRENT, Asher 2026-10-28: "get the click")**: it is NOT a series, so NO series label and NO reel number. Layout 1080x1920: a HUGE hook (3 lines, <= ~9 characters per line, 170-240 px, Montserrat 800, Title Case, ONLY the main keyword in CAPS + gold), below it a bold simple graphic that shows the idea (big 8/10, 99% bar, tower of courses, $0, etc.), a framed expressive photo of Asher (grade A) beside it, WOBBLY hand-drawn red circle(s) + a hand-drawn arrow + a short handwritten note (<= 16 characters, Patrick Hand) to create curiosity. Keep key content inside y 230-1750 (IG grid crops 3:4). Be creative per reel: the graphic alone, or Asher alone, are allowed; the goal is the click. Generator: `pipeline/thumbnail-v3-gen.mjs` (edit the T list: hook, face, gfx html, note, circle, arrow). Output `N Title - thumbnail v3.png`.
'''
s = s[:a] + new + s[b:]
s = s.replace('Use the same hook as the thumbnail.', 'Use the same hook words as the thumbnail (Title Case, one CAPS keyword).')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
