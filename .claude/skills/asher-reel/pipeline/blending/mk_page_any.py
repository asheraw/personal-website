"""Make page_any.mjs (reels 2-12) from c1/make_page.mjs: same review page, content from reels.mjs."""
s = open('c1/make_page.mjs', encoding='utf-8').read()
def sub(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, 1)
sub('// node make_page.mjs -> "<project>/01 Everyone\'s already said it - preview.html" + preview/01/*.jpg (storyboard review page, pin comments on stills)\nimport fs from "fs";\nconst ROOT = "../..", DIR = "preview/01", D = JSON.parse(fs.readFileSync("../c1-deck/scenes.json", "utf8"));',
    '// node page_any.mjs <n> -> "<project>/NN <title> - preview.html" + preview/NN/*.jpg (made from c1/make_page.mjs by mk_page_any.py)\nimport fs from "fs";\nimport { R } from "./reels.mjs";\nconst n = +process.argv[2], X = R[n], NN = String(n).padStart(2, "0");\nconst ROOT = "..", DIR = "preview/" + NN, D = JSON.parse(fs.readFileSync(`c${n}-deck/scenes.json`, "utf8"));')
sub('for (const f of fs.readdirSync("../c1-deck/stills")) fs.copyFileSync(`../c1-deck/stills/${f}`, `${ROOT}/${DIR}/${f}`);',
    'for (const f of fs.readdirSync(`c${n}-deck/stills`)) fs.copyFileSync(`c${n}-deck/stills/${f}`, `${ROOT}/${DIR}/${f}`);')
sub('const TITLE = "Reel 1 · Everyone\'s already said it";', 'const TITLE = `Reel ${n} · ${X.title}`;')
a = s.index('const HOOKS = ['); b = s.index('];\n', a) + 3
s = s[:a] + 'const HOOKS = X.hooks;\n' + s[b:]
sub('<title>Reel 1 Storyboard Review</title>', '<title>Reel ${n} Storyboard Review</title>')
# why-style + recording notes + thumbnail description + storage id + output file
a = s.index('<div><h2>Why this style</h2>'); b = s.index('</div></div></div>', a) + len('</div></div></div>')
s = s[:a] + '<div><h2>Why this style</h2><div class="box">${X.why}</div></div></div>' + s[b:]
a = s.index('<h2>Notes from the recording</h2><div class="box"><ul class="chk">'); b = s.index('</ul></div>', a) + len('</ul></div>')
s = s[:a] + '<h2>Notes from the recording</h2><div class="box"><ul class="chk">${[...X.notes, ...D.warn.map((w) => "Auto-timing: " + w)].map((t) => "<li>" + t + "</li>").join("") || "<li>Nothing unusual.</li>"}</ul></div>' + s[b:]
a = s.index('<section class="box" data-k="thumb"><h3>Thumbnail image</h3><p class="n">'); b = s.index('</p>', a)
s = s[:a] + '<section class="box" data-k="thumb"><h3>Thumbnail image</h3><p class="n">${X.thumb.img}' + s[b:]
sub('const ID="blend-r1:"', 'const ID="blend-r${n}:"')
sub('fs.writeFileSync(`${ROOT}/01 Everyone\'s already said it - preview.html`, html);', 'fs.writeFileSync(`${ROOT}/${NN} ${X.title} - preview.html`, html);')
open('page_any.mjs', 'w', encoding='utf-8').write(s)
print('ok')
