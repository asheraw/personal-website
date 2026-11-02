p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## v5 updates (2026-11-02, Asher's feedback on Claude Reel 1)
- **Cut-out uses Robust Video Matting** (cloned `D:\\Work\\RobustVideoMatting`, weights rvm_resnet50.pth, torch cu121 in `d:\\Work\\whisper-env`). `pipeline/v4/bake.py` writes FULL-FRAME 1920x1080 `popP.mp4`/`popM.mp4` (mask limited to head box x740-1380,y<650). In `build4.mjs` the person and both pop videos share one CSS transform (vars --tx --ty --s --d --p --ox, window top/height = --wt/--wh) so the head moves with the push-down: no pop-in. Do not put blend-mode videos inside a transformed/opacity parent.
- **Images instead of flat SVG**: `D:\\Work\\Assets` = Microsoft Fluent 3D emoji (3,145 PNGs, `python assets.py fluent "money bag"`, `find <word>`) + Google Noto Lottie (`assets.py lottie 1f4b8`, lottie-web installed). Use them for props, people, objects in every panel. For real photos of public figures use `commons_img.py`/`wiki_img.py` (often empty): ask Asher to drop photos in a folder.
- **Review workflow (saves tokens)**: do NOT render the full video for ideation. Send the storyboard first: one still per scene (the END state of each scene, so text is complete) + why this style was chosen vs runner-ups + hook options + thumbnail. Build the video only after he picks. A cheap low-res preview (360p, no audio mix) is allowed. The review page (`make_preview.mjs`) now shows scene-END frames and a "Why this style" card.
- Hook can be a full sentence (paragraph mode, auto-shrinks to fit ~215 px high); Asher's Reel 1 hook: "Here's how being smart by copying experts actually made me fail to make any sales for my offer".
- Text inside boxes: use `white-space:nowrap` with an auto-width card (left set, no fixed width) and test the END frame of each scene; stamps must sit fully inside x130-940 of the 960 panel (page x 0-1920 minus margins).
- Link screenshot: `Link screenshot.png` in the project folder (asheraw.com/link, left tab = the perfect-offer article) is shown on the "full article" scene with the left tab circled.
- Thumbnail idea that Asher asked for: mugshot polaroids of well-known experts with a black bar across the eyes, arrow to a circled "Zero", text "But WHY?". Generator: `_work/c1/thumb/thumb2.mjs` (drop photos in `experts/`).

'''
if 'v5 updates' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
