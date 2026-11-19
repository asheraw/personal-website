"""Build the Reel 4 pipeline (IG) from the Reel 3 / Reel 2 files. Run from _work/c4."""
import shutil, json
def edit(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70]); s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

for f in ("edl3.mjs", "bake.py", "build4.mjs", "silence.mjs"): shutil.copy("../c3/" + f, f)
shutil.copy("../c2/mix2.py", "mix2.py")
shutil.copy("../c3/run4.sh", "run4.sh")

open("edl.mjs", "w", encoding="utf-8").write('''// Claude Reel 4 ("Why people pay YOU when ChatGPT is free"): IG = main take + the "comment PERFECT" take.
import fs from "fs";
const raw = JSON.parse(fs.readFileSync("tx.json", "utf8"));
const words = raw.map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
const FIX = { "perfect": "PERFECT", "perfect.": "PERFECT.", "CHATGBT": "ChatGPT", "ChetGPT": "ChatGPT", "cause.": "course." };
words.forEach((w) => { const b = w.text.replace(/[.,?!]+$/, ""), p = w.text.slice(b.length); if (FIX[b]) w.text = FIX[b] + p; else if (FIX[w.text]) w.text = FIX[w.text]; });
const fixAt = (t, old, neu) => { const w = words.find((x) => Math.abs(x.start - t) < 0.25 && x.text.replace(/[.,?!]+$/, "") === old); if (w) w.text = neu + w.text.slice(old.length); };
fixAt(43.0, "left", "lived");
const WEB = process.env.WEB === "1";
const RANGES = WEB ? [[4.8, 79.8], [82.1, 89.0]] : [[4.8, 79.8], [109.2, 119.5]];
const segs = [], ranges = []; let t = 0;
for (const [a, b] of RANGES) { segs.push({ clip: "src", in: a, out: b, start: +t.toFixed(3), dur: +(b - a).toFixed(3), kind: "a" }); ranges.push([a, b, +t.toFixed(3)]); t += b - a; }
const v1 = []; words.forEach((w) => { ranges.forEach(([a, b, s], si) => { if (w.start >= a - 0.05 && w.start < b) v1.push({ w: w.text, s: +(s + w.start - a).toFixed(3), e: +(s + w.end - a).toFixed(3), seg: si }); }); });
fs.writeFileSync("edl_v1.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words_v1.json", JSON.stringify(v1));
fs.writeFileSync("words_clip.json", JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync("ranges.json", JSON.stringify(ranges));
fs.writeFileSync("hold.json", JSON.stringify({}));
console.log(WEB ? "WEB length" : "IG length", t.toFixed(2), "s,", v1.length, "words");
''')

edit("mix2.py", [("../c2-board/events", "../c4-film/events")])
edit("build4.mjs", [
 ('"courses,buyer,monster,stitched,yours,more,structure,material,believe,happened,done,everyone"', '"pay,free,zero,trust,answers,answer,belief,story,expertise,three,who,check,yours"'),
 ('\'[["buyer",1.5,1.3],["stitched",6,1.36],["monster",14,1.3],["yours",28,1.38],["runs",34,1.28],["more",56,1.38],["structure",58,1.3],["believe",66,1.28]]\'',
  '\'[["free",1.5,1.3],["zero",8,1.36],["trust",20,1.38],["answer",25,1.28],["three",31,1.3],["story",46,1.28],["who",50,1.38],["belief",53,1.3]]\''),
 ("../c3-film/times.json", "../c4-film/times.json"),
 ("  t = t.replace(/^frankenstein/i, 'Frankenstein');", "  t = t.replace(/^chatgpt/i, 'ChatGPT');"),
])
s = open("build4.mjs", encoding='utf-8').read()
import re
s = re.sub(r'\n  <img id="chars"[^\n]*', '', s, count=1)
s = re.sub(r'\n    tl\.fromTo\("#chars"[^\n]*', '', s, count=1)
open("build4.mjs", "w", encoding='utf-8').write(s)

edit("run4.sh", [
 ('03 Claude Reel 3 - Other platforms v1.mp4', '04 Claude Reel 4 - Other platforms v1.mp4'),
 ('03 Claude Reel 3 - IG v1.mp4', '04 Claude Reel 4 - IG v1.mp4'),
 ('Building more won\'t help until you input <b>3 things</b>', 'Free answers everywhere. Here\'s what <b>still sells</b>.'),
 ('node deck.mjs 3 film && cd c3', 'node deck.mjs 4 film && cd c4'),
 ('$R/c3-film', '$R/c4-film'), ('$R/c3-film', '$R/c4-film'), ('$R/c3-film', '$R/c4-film'), ('$R/c3-film', '$R/c4-film'),
 ('cd "$R/c3"', 'cd "$R/c4"'),
 ('$R/c3-deck', '$R/c4-deck'),
 ('; cp "$R/cut/chars.png" assets/chars.png; cp "$P/Materials/Monster demands.jpeg" assets/demands.jpg', ''),
 ('_work/c3', '_work/c4'),
])
# CTA scene (IG) for the film
D = json.load(open('deck.json', encoding='utf-8')) if False else None
d = json.load(open('deck.json', encoding='utf-8'))
if not any(x.get('filmOnly') for x in d['scenes']):
    d['scenes'].append({'t': 70, 'anchor': 'comment', 'filmOnly': True, 'igOnly': True, 'label': 'Comment PERFECT', 'note': '', 'type': 'cta', 'p': {'a': 'COMMENT', 'b': 'PERFECT', 'c': "AND I'LL SEND IT TO YOU"}, 'nobar': True, 'chip': 'THE WHO CHECK', 'tag': ''})
json.dump(d, open('deck.json', 'w', encoding='utf-8'), indent=1)
print("setup ok")
