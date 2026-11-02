// Claude Reel 1 ("I copied the experts. I sold nothing."): edit list + corrected words. WEB=1 -> other-platforms ending (not built yet).
// Source ranges (src.mp4 time): main 4.75-73.7, then the "I'm limited by the time..." line up to "prompts," (take 1, 74.5-80.2),
// then "comment PERFECT and I'll send it to you." from the last take (110.85-113.9). Warm-up "warm, warm, warm" (1.3-3.6) is cut.
import fs from "fs";
const WEB = process.env.WEB === "1";
const raw = JSON.parse(fs.readFileSync("tx.json", "utf8"));
const words = [];
for (const w of raw) {
  const t = w.text.trim();
  if (/^-/.test(t) && words.length) { const p = words[words.length - 1]; p.text += t.replace(/\s/g, ""); p.end = w.end; continue; }
  words.push({ text: t, start: w.start, end: w.end });
}
const FIX = { "saw": "sold", "Commence": "Comment", "comment": "Comment", "perfect": "PERFECT", "perfect.": "PERFECT.", "believed,": "believed,", "asheroll": "asheraw" };
words.forEach((w) => { const b = w.text.replace(/[.,?!]+$/, ""), p = w.text.slice(b.length); if (FIX[b] && !(b === "saw" && w.start > 10)) w.text = FIX[b] + p; });
words.forEach((w) => { if (/^15$/.test(w.text)) w.text = "15"; });
// Whisper stretches first/last words over silence: pin the first word to the real start
const F = words.findIndex((w) => w.start > 4.5 && /^I$/.test(w.text)); words[F].start = 4.84;
const IN = 4.75;
const RANGES = WEB ? [[IN, 73.7], [74.5, 82.5]] : [[IN, 73.7], [74.5, 80.2], [110.85, 113.9]];
const segs = [], ranges = []; let t = 0;
for (const [a, b] of RANGES) { segs.push({ clip: "src", in: a, out: b, start: +t.toFixed(3), dur: +(b - a).toFixed(3), kind: "a" }); ranges.push([a, b, +t.toFixed(3)]); t += b - a; }
const v1 = []; words.forEach((w) => { ranges.forEach(([a, b, s], si) => { if (w.start >= a - 0.05 && w.start < b) v1.push({ w: w.text, s: +(s + w.start - a).toFixed(3), e: +(s + w.end - a).toFixed(3), seg: si }); }); });
fs.writeFileSync("edl_v1.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words_v1.json", JSON.stringify(v1));
fs.writeFileSync("words_clip.json", JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync("ranges.json", JSON.stringify(ranges));
// clip times where the panel changes scene (inside natural pauses so the pause is kept)
const HOLD = { B: 7.7, C: 13.3, D: 17.6, E: 22.5, F: 28.5, G: 36.9, H: 46.4, I: 54.1, J: 59.3, K: 61.9, L: 67.0, M: 74.2 };
fs.writeFileSync("hold.json", JSON.stringify(HOLD));
console.log(WEB ? "WEB" : "IG", "length", t.toFixed(2), "s,", v1.length, "words");
