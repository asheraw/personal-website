import re
p = 'edl.mjs'
s = open(p, encoding='utf-8').read()
s = s.replace('"../tx_w/Reel 5.json"', '"../tx_w/Reel 5 combined.json"')
s = s.replace('const FIX = { "Commence": "Comment", "comment": "Comment", "defend": "DEFEND" };',
              'const FIX = { "Commence": "Comment", "comment": "Comment", "three": "3", "organize": "organise" };')
# replace the block of Reel 4 audio patches with Reel 5 ones
a = s.index('// Whisper stretched the first words')
b = s.index('const IN = 4.7;')
patch = '''// combined source = NG take (0-31 s, ends "Whoa, let me redo that... That was wrong.") + main take from 22.35 s (shifted +8.65). Fix by the audio:
words[0].start = 4.8; words[0].end = 5.3;
const iy = words.findIndex((w, i) => /^fix\\.?$/i.test(w.text) && /^drafts/i.test(words[i - 1]?.text || "") && w.start > 60);
if (iy > 0) { words.splice(iy, 0, { text: "You", start: words[iy].start - 0.28, end: words[iy].start - 0.03 }); words[iy - 1].text = words[iy - 1].text.replace(/,$/, "."); words[iy - 2].text = words[iy - 2].text.replace(/,$/, "."); }
const C0 = words.findIndex((w) => /^comment/i.test(w.text) && w.start > 80); if (C0 >= 0) { words[C0].start = 85.95; words[C0].end = 86.3; words[C0].text = "Comment"; }
while (words.length && words[words.length - 1].start > 89) words.pop();
'''
s = s[:a] + patch + s[b:]
s = s.replace('const RANGES = WEB ? [[IN, 77.9]] : [[IN, 75.1], [79.0, 82.5]];', 'const RANGES = WEB ? [[IN, 84.8]] : [[IN, 81.8], [85.8, 88.95]];')
s = re.sub(r'const HOLD = \{[^}]*\}', 'const HOLD = { B: 20.52, C: 31.1, D: 46.46, E: 52.65, F: 61.8, G: 65.57, H: 70.2 }', s)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
