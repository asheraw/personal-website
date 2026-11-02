p = '../SKILL.md'
s = open(p, encoding='utf-8').read()
add = '''## v8 (Claude Reel 2, storyboard round 2)
- **Preview page v3** (`pipeline/v4/make_preview.mjs`): click any frame or the thumbnail = lightbox (Esc/click closes); full-width layout; "Copy all feedback" button top-right; Hook = 3 radio options (spec `hooks`, first = default) + own-hook textbox that overrides. Hooks must tease the payoff BLIND (promise the result, never reveal the answer).
- **Memes**: `D:\\Work\\memecub\\meme.py search "<phrase>" [--kind gif] [--get N]` (memecub API; key lives only in `D:\\Work\\memecub\\.env`, never commit or write it into the skill). Wrapper drops anything with Chinese text (target market is not Chinese). GIFs are rendered by extracting frames to `img/<name>/fNNN.png` and toggling the frame `<img>`s by time (deterministic). Pause the speaker slightly during a meme with a sound bite; keep meme audio soft.
- **Fake top time bar** (video stage, build4.mjs): bar at the very top; first 40% fills fast, easing to the slow steady pace of the remaining 60% by the 35-40% mark, ending exactly with the video.
- **Sounds that are copyrighted (e.g. Street Fighter "Perfect")** cannot be fetched: ask Asher for the audio file.
- Reuse one character image across consecutive scenes (zoom, arrow + label, thought bubble) instead of swapping new pictures.

'''
if 'v8 (Claude Reel 2' not in s:
    s = s.replace('## Standing rules from Asher', add + '## Standing rules from Asher', 1)
    open(p, 'w', encoding='utf-8').write(s)
print('ok')
