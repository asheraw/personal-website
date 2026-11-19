// node edl_any.mjs <n>  (run from _work) -> cN/edl_v1.json, words_clip.json, ranges.json, hold.json
// Main take = the A..B found by gen_any (scenes.json). Ranges split after "hold" words (picture freezes there, e.g. for a music sting).
import fs from "fs";
import { C } from "./cuts.mjs";
const n = +process.argv[2], X = C[n], D = `c${n}`;
const SC = JSON.parse(fs.readFileSync(`c${n}-deck/scenes.json`, "utf8")), A = SC.A, B = SC.B;
const raw = JSON.parse(fs.readFileSync(`${D}/tx.json`, "utf8")).map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
let words = raw.filter((w) => w.start >= A - 0.02 && w.start < B);
words = words.map((w, i) => { const prev = i ? words[i - 1].text : ""; for (const [re, fn, pre] of X.fixes || []) if (re.test(w.text) && (!pre || pre.test(prev))) return { ...w, text: fn(w.text) }; return w; }).filter((w) => w.text);
const cutsAt = [];
for (const h of X.holds || []) { const w = words.find((q) => h.after.test(q.text) && !cutsAt.some((c) => c.t === q.end)); if (!w) throw new Error("hold word not found " + h.after); cutsAt.push({ t: +(w.end + 0.15).toFixed(2), dur: h.dur }); }
cutsAt.sort((a, b) => a.t - b.t);
const RANGES = []; let a = A;
for (const c of cutsAt) { RANGES.push([a, c.t, c.dur]); a = c.t; }
RANGES.push([a, B, 0]);
const ranges = []; let t = 0;
for (const [x, y, h] of RANGES) { ranges.push([x, y, +t.toFixed(3), h]); t += y - x; }
fs.writeFileSync(`${D}/edl_v1.json`, JSON.stringify({ dur: +t.toFixed(3), segs: [] }));
fs.writeFileSync(`${D}/words_clip.json`, JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync(`${D}/ranges.json`, JSON.stringify(ranges));
fs.writeFileSync(`${D}/hold.json`, "{}");
console.log(`reel ${n}: take ${A.toFixed(2)}-${B.toFixed(2)}, ${ranges.length} range(s), holds at ${cutsAt.map((c) => c.t).join(",") || "-"}, ${words.length} words`);
