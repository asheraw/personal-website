"""Reel 3 v2 setup (2026-11-17 feedback): proper nouns in captions, Billie Jean under the voice (no freeze), version 2 output."""
s = open('c1/build4.mjs', encoding='utf-8').read()
s = s.replace('const FS = fs.existsSync("../c1-film/times.json") ? JSON.parse(fs.readFileSync("../c1-film/times.json", "utf8")).fs : null;', 'const FS = null;')
s = s.replace('const ws = WORDS.map((w, i) => {', 'const PROPER = new Set((process.env.PROPER || "").split(",").filter(Boolean));\nconst ws = WORDS.map((w, i) => {', 1)
s = s.replace('  let t = key ? bare.toUpperCase() :', '  let t = PROPER.has(bare) ? bare : key ? bare.toUpperCase() :', 1)
assert 'PROPER.has(bare)' in s and 'const FS = null;' in s
open('build4_any.mjs', 'w', encoding='utf-8').write(s)

c = open('cuts.mjs', encoding='utf-8').read()
c = c.replace('music: "ES_Break the Fast - Vision Heat.wav", musicAtScene: 2,', '''music: "ES_Break the Fast - Vision Heat.wav", musicAtScene: 2, ver: 2,
    sting: { at: ["just", "beat"], file: "D:/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials/Billie Jean - Michael Jackson.mp3", gain: 0.55 },
    proper: "Billie,Jean,Michael,Jackson,Jackson's,Merriam-Webster",''')
i = c.index('holds: [{ after: /^drums'); j = c.index('\n', i)
c = c[:i] + c[j + 1:].lstrip(' ') if False else c[:c.rindex('\n', 0, i) + 1] + c[j + 1:]
assert 'billie: true' not in c and 'ver: 2' in c
open('cuts.mjs', 'w', encoding='utf-8').write(c)

h = open('hooks_any.mjs', encoding='utf-8').read()
h = h.replace('X.billie ? "export BILLIE=1" : "unset BILLIE",', 'X.sting ? `export STING_AT=${q(JSON.stringify(X.sting.at))} STING_FILE=${q(X.sting.file)} STING_GAIN=${X.sting.gain}` : "unset STING_AT", `export PROPER=${q(X.proper || "")}`,')
h = h.replace('`${NN} ${R[n].title} - v1.mp4`', '`${NN} ${R[n].title} - v${X.ver || 1}.mp4`')
assert 'STING_AT' in h and 'X.ver' in h
open('hooks_any.mjs', 'w', encoding='utf-8').write(h)

r = open('run_any.sh', encoding='utf-8').read()
r = r.replace('sed "s#../c1-film#../c$n-film#g" c1/build4.mjs > c$n/build4.mjs', 'cp build4_any.mjs c$n/build4.mjs')
r = r.replace('node film_any.mjs $n', 'python mk_film_any.py >/dev/null && python mk_anim2.py >/dev/null && node film_any.mjs $n')
assert 'build4_any' in r and 'mk_anim2' in r
open('run_any.sh', 'w', encoding='utf-8').write(r)
print('ok')
