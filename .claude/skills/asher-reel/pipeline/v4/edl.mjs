// Claude Reel 2 ("Spending a year on one offer?"): IG = main take + the "comment PERFECT" take; WEB = main + "...at asheraw.com/link" take.
import fs from "fs";
const WEB = process.env.WEB === "1";
const raw = JSON.parse(fs.readFileSync("tx.json", "utf8"));
const words = raw.map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
const FIX = { "asherow": "asheraw.com/link.", "perfect": "PERFECT", "perfect.": "PERFECT.", "Assumed": "ASSUMED", "Heard": "HEARD" };
words.forEach((w) => { const b = w.text.replace(/[.,?!]+$/, ""), p = w.text.slice(b.length); if (FIX[b]) w.text = FIX[b] + p; });
const J = words.findIndex((w) => /^asheraw/i.test(w.text)); if (J >= 0 && /^\.?com/i.test(words[J + 1]?.text || "")) { words[J].end = words[J + 1].end; words.splice(J + 1, 1); }
const F = words.findIndex((w) => w.start > 4.5 && /^Spending/.test(w.text)); words[F].start = 4.95;
const IN = 4.85;
const RANGES = WEB ? [[IN, 76.4], [78.0, 88.9]] : [[IN, 76.4], [92.9, 101.8]];
const segs = [], ranges = []; let t = 0;
for (const [a, b] of RANGES) { segs.push({ clip: "src", in: a, out: b, start: +t.toFixed(3), dur: +(b - a).toFixed(3), kind: "a" }); ranges.push([a, b, +t.toFixed(3)]); t += b - a; }
const v1 = []; words.forEach((w) => { ranges.forEach(([a, b, s], si) => { if (w.start >= a - 0.05 && w.start < b) v1.push({ w: w.text, s: +(s + w.start - a).toFixed(3), e: +(s + w.end - a).toFixed(3), seg: si }); }); });
fs.writeFileSync("edl_v1.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words_v1.json", JSON.stringify(v1));
fs.writeFileSync("words_clip.json", JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync("ranges.json", JSON.stringify(ranges));
fs.writeFileSync("hold.json", JSON.stringify({ B: 9.0, C: 13.3, D: 22.5, E: 23.8, F: 28.7, G: 38.2, H: 42.3, I: 46.6, J: 54.5, K: 57.8, L: 61.7, M: 66.7, N: 75.5 }));
console.log(WEB ? "WEB" : "IG", "length", t.toFixed(2), "s,", v1.length, "words");
