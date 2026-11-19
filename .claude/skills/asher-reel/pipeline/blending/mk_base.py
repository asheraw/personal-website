"""Pull the shared CSS, arrow/circle JS and QA function out of c1/gen.mjs into base.mjs (so reels 2-12 share reel 1's chalkboard look)."""
s = open('c1/gen.mjs', encoding='utf-8').read()
def between(a, b):
    i = s.index(a) + len(a); j = s.index(b, i); return s[i:j]
css = between('const CSS = `', '`;')
js = between('const JS = `', '`;')
qa = between('const QAF = ', ';\n\nconst br')
extra = r"""
.u{font-family:'Segoe UI Emoji','Noto Color Emoji',sans-serif;line-height:1;display:inline-block}
.phone{width:520px;height:900px;border:14px solid var(--chalk);border-radius:70px;padding:60px 34px;display:flex;flex-direction:column;gap:22px;align-items:stretch;justify-content:flex-start;background:rgba(255,255,255,.03)}
.chat{font-size:60px;line-height:1.1;padding:18px 30px 22px;border-radius:34px 34px 34px 8px;background:var(--chalk);color:#1d2824;align-self:flex-start;max-width:440px}
.chat.me{align-self:flex-end;border-radius:34px 34px 8px 34px;background:var(--yel)}
.lbl{font:700 64px/1.05 'Cabin Sketch',cursive;text-align:center}
.cal{display:grid;grid-template-columns:repeat(7,180px);gap:14px}
.cal>div{height:170px;border:5px solid var(--grey);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:60px;color:var(--grey)}
.cal>div.on{border-color:var(--yel);color:var(--yel)}
.post{width:300px;height:380px;border:6px solid var(--grey);border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:var(--grey);font-size:60px}
.post.me{border-color:var(--yel);color:var(--yel);box-shadow:0 0 50px rgba(255,210,63,.5)}
.chip{font-size:64px;line-height:1;padding:14px 34px 20px;border:5px solid var(--chalk);border-radius:60px}
.chip.y{border-color:var(--yel)}
"""
open('base.mjs', 'w', encoding='utf-8').write(
    "// Shared look for the series (extracted from c1/gen.mjs by mk_base.py): café chalkboard CSS, arrows/circles JS, QA.\n"
    "export const CSS = `" + css + extra + "`;\n"
    "export const JS = `" + js + "`;\n"
    "export const QAF = " + qa + ";\n")
print('ok', len(css), len(js), len(qa))
