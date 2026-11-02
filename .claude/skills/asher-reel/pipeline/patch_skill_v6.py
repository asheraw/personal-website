p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## v6 rules (2026-11-02, after Claude Reel 1 feedback round 2)
- **Previews first, NOT video.** For a new reel send ONLY the preview page: one finished (end-of-scene) still per scene + why-this-style + hook options + thumbnail. Stills cost far fewer tokens than rendering and checking a cut. Render the video only after Asher approves the stills.
- **Preview checklist = SHORT** (about 8 items, <= 6 words each). No long sentences.
- **Speed**: play at 1.0x. Use SP=1.1 only if the cut is >= ~85 s (limit 90 s). Panel timing hints must match the speed used (hints written at 1.1x need x1.1 at 1.0x; re-check `at()` errors).
- **Layout for the Imperfect-offers series (v7)**: Asher stays in the LOWER half, no full-screen intro, no push-down, no cut-out/pop-out (his black cap on black background matted badly). Window top 1030, src crop x460 y90, soft fade on the top edge (no hard line crossing cap/chin). Asher will revisit zoom/crop effects next series.
- **Thumbnail (series 11-02)**: hook "I Copied EXPERTS. Sold Zero." with Zero circled, small "but why?", then mugshot polaroids with bar over eyes (Dan, Alex, Codie; first names only, heads cropped from `Materials/`, `thumb/crop_heads.py`, `thumb/thumb3.mjs`). Video frame 0 = this thumbnail for 2 frames.
- **Other-platforms ending** (asheraw.com/link): Whisper writes "asheroll.com": it is a transcription error, he says it right; map to "asheraw.com/link". End card: FIND IT AT / asheraw.com/link / THE FIRST TAB; keep ~1.2 s tail after the last word.
- **Render scripts must stop on error** (`set -e`, no `| tail` after render commands): a silent failed board render once produced a video with stale panel timing.
- Icon overlays must not cover card text (put icons at the card's top-right corner, ~90 px).

'''
if 'v6 rules' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
