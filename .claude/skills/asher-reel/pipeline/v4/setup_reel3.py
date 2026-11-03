"""Build the Reel 3 pipeline files from the Reel 2 ones (run from _work/c3)."""
import shutil, os
def edit(path, pairs):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (path, a[:70]); s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8').write(s)

for f in ("edl3.mjs", "bake.py", "build4.mjs", "mix2.py", "silence.mjs"): shutil.copy("../c2/" + f, f)

open("edl.mjs", "w", encoding="utf-8").write('''// Claude Reel 3 ("More courses won't get you a buyer"): IG = main take + the clean "comment PERFECT" take.
import fs from "fs";
const raw = JSON.parse(fs.readFileSync("tx.json", "utf8"));
const words = raw.map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
const FIX = { "perfect": "PERFECT", "perfect.": "PERFECT.", "Comments": "Comment" };
words.forEach((w) => { const b = w.text.replace(/[.,?!]+$/, ""), p = w.text.slice(b.length); if (FIX[b]) w.text = FIX[b] + p; });
const RANGES = [[5.0, 78.5], [102.55, 111.05]];
const segs = [], ranges = []; let t = 0;
for (const [a, b] of RANGES) { segs.push({ clip: "src", in: a, out: b, start: +t.toFixed(3), dur: +(b - a).toFixed(3), kind: "a" }); ranges.push([a, b, +t.toFixed(3)]); t += b - a; }
const v1 = []; words.forEach((w) => { ranges.forEach(([a, b, s], si) => { if (w.start >= a - 0.05 && w.start < b) v1.push({ w: w.text, s: +(s + w.start - a).toFixed(3), e: +(s + w.end - a).toFixed(3), seg: si }); }); });
fs.writeFileSync("edl_v1.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words_v1.json", JSON.stringify(v1));
fs.writeFileSync("words_clip.json", JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync("ranges.json", JSON.stringify(ranges));
fs.writeFileSync("hold.json", JSON.stringify({}));
console.log("IG length", t.toFixed(2), "s,", v1.length, "words");
''')

edit("edl3.mjs", [("const dn = WC.find((w) => /^down/i.test(w.w) && w.s > 15 && w.s < 25), HOLDAT = dn.e + 0.15;", "const dn = { e: 1e9 }, HOLDAT = 1e9;   // no meme hold in this reel")])
edit("mix2.py", [
 ("../c2-board/events", "../c3-film/events"),
 ("mus[:, :m.shape[1]] = m[:, :N]\n", '''mus[:, :m.shape[1]] = m[:, :N]
_x = np.arange(N) / SR
mus *= np.clip((44.6 - _x) / 1.6, 0, 1)                       # lofi bed fades out around 43-44.6 s
B0 = float(os.environ.get("BADBOY_AT", 43.4))                 # "A Bad Boy" (Stefan Ekstrom) comes in around the 43-44 s mark
bb = read("../../Materials/ES_A Bad Boy - Stefan Ekstrom.wav", 0, DUR - B0 + 1, ch=2)
bi = int(B0 * SR); nb = min(bb.shape[1], N - bi)
mus[:, bi:bi + nb] += bb[:, :nb] * np.clip((_x[bi:bi + nb] - B0) / 1.5, 0, 1)
'''),
])
edit("build4.mjs", [
 ('"year,wrong,guess,lie,me,label,heard,assumed,ask,perfect,real,name,months,never"', '"courses,buyer,monster,stitched,yours,more,structure,material,believe,happened,done,everyone"'),
 ('\'[["wrong",3,1.3],["picture",9,1.36],["lie",14,1.3],["stack",27,1.28],["agreed",36,1.38],["label",41,1.28],["heard",54,1.38],["ask",65,1.3],["perfect",75,1.3]]\'',
  '\'[["buyer",1.5,1.3],["stitched",6,1.36],["monster",14,1.3],["yours",28,1.38],["runs",34,1.28],["more",56,1.38],["structure",58,1.3],["believe",66,1.28]]\''),
 ('const DUR = EDL.dur;', 'const DUR = EDL.dur;\nconst FS = fs.existsSync("../c3-film/times.json") ? JSON.parse(fs.readFileSync("../c3-film/times.json", "utf8")).fs : null;   // full-screen picture window'),
 ('  <div id="tbar"><div id="tfill"></div></div>', '  <div id="tbar"><div id="tfill"></div></div>\n  <img id="fs" src="assets/demands.jpg" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover;z-index:50;opacity:0">\n  <img id="chars" src="assets/chars.png" alt="" style="position:absolute;left:60px;top:1210px;width:960px;z-index:40;opacity:0">'),
 ('    // slow push-in', '''    tl.to("#hook", { opacity: 0, duration: 0.2 }, LAST + 0.05);
    tl.fromTo("#chars", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }, LAST + 0.35);
    ${FS ? `tl.to("#fs", { opacity: 1, duration: 0.15 }, ${FS[0]}); tl.to("#fs", { opacity: 0, duration: 0.15 }, ${FS[1] - 0.15});` : ""}
    // slow push-in'''),
])
open("run4.sh", "w", encoding="utf-8").write('''#!/bin/sh
set -e
# usage: sh run4.sh   (from _work/c3). Renders "03 Claude Reel 3 - IG v1.mp4" next to the raws.
P="D:/Work/Social Media/2026/11-02 Imperfect offers"; R="$P/_work"; LIB=/c/Users/Admin/lemo-opuscar
OUT="03 Claude Reel 3 - IG v1.mp4"
export HOOK="${HOOK:-Building more won't help until you input <b>3 things</b>}"
node silence.mjs >/dev/null && node edl.mjs && node edl3.mjs
cd "$R" && node deck.mjs 3 film && cd c3
cd $LIB && node core/render/events.mjs "$R/c3-film" --out "$R/c3-film/events.json" && node core/render/video.mjs "$R/c3-film" --fps 30 --workers 6 --out "$R/c3-film/out/board.mp4"
cd "$R/c3"; mkdir -p assets renders; cp "$R/c3-film/out/board.mp4" assets/board.mp4
/d/Work/whisper-env/Scripts/python.exe bake.py 460 --person-only
cp person.mp4 assets/; cp person.mp4 assets/popP.mp4; cp person.mp4 assets/popM.mp4
cp "$R/c3-deck/stills/thumb.png" assets/thumb.png; cp "$R/cut/chars.png" assets/chars.png; cp "$P/Materials/Monster demands.jpeg" assets/demands.jpg
[ -d assets/fonts ] || cp -r ../../../10-22\\ Offer\\ regrets/_work/reel-8/assets/fonts assets/
python mix2.py && node build4.mjs && npx hyperframes render -o renders/silent.mp4 --fps 30 2>&1 | grep -E "Render complete|rror|Failure" | tail -3
ffmpeg -v error -y -i renders/silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$P/$OUT" && echo "done $OUT"
''')
print("setup ok")
