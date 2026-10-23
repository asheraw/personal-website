// Reel 5: edit list + corrected word list. WEB=1 -> other-platforms cut (keeps "Click the link in my bio", drops "Comment TRIM").
// writes edl_v1.json (segments in reel time, before dead-air trimming), words_v1.json (reel time), words_clip.json (clip time), ranges.json (clip->reel map)
import fs from "fs";
const WEB = process.env.WEB === "1";
const raw = JSON.parse(fs.readFileSync("../tx_w/Reel 5 combined.json", "utf8"));
// merge hyphen fragments ("step", "-by", "-step") and fix Whisper mishearings using the script
const words = [];
for (const w of raw) {
  const t = w.text.trim();
  if (/^-/.test(t) && words.length) { const p = words[words.length - 1]; p.text += t.replace(/\s/g, ""); p.end = w.end; continue; }
  words.push({ text: t, start: w.start, end: w.end });
}
const FIX = { "Commence": "Comment", "comment": "Comment", "three": "3", "organize": "organise" };
words.forEach((w) => { const b = w.text.replace(/[.,?!]+$/, ""), p = w.text.slice(b.length); if (FIX[b]) w.text = FIX[b] + p; });
// "doesn't really mean much" -> "doesn't reveal much" (what you said; Whisper misheard), "via" -> "by"
for (let i = 0; i < words.length - 1; i++) if (/^really$/i.test(words[i].text) && /^mean$/i.test(words[i + 1].text) && /^doesn/i.test(words[i - 1]?.text || "")) { words[i + 1].text = "reveal"; words[i + 1].start = words[i].start; words.splice(i, 1); break; }
words.forEach((w) => { if (/^via$/i.test(w.text)) w.text = "by"; });
// combined source = NG take (0-31 s, ends "Whoa, let me redo that... That was wrong.") + main take from 22.35 s (shifted +8.65). Fix by the audio:
words[0].start = 4.8; words[0].end = 5.3;
const iy = words.findIndex((w, i) => /^fix\.?$/i.test(w.text) && /^drafts/i.test(words[i - 1]?.text || "") && w.start > 60);
if (iy > 0) { words.splice(iy, 0, { text: "You", start: words[iy].start - 0.28, end: words[iy].start - 0.03 }); words[iy - 1].text = words[iy - 1].text.replace(/,$/, "."); words[iy - 3].text = words[iy - 3].text.replace(/,$/, "."); }
const C0 = words.findIndex((w) => /^comment/i.test(w.text) && w.start > 80); if (C0 >= 0) { words[C0].start = 85.95; words[C0].end = 86.3; words[C0].text = "Comment"; }
while (words.length && words[words.length - 1].start > 89) words.pop();
const IN = 4.7;
const RANGES = WEB ? [[IN, 84.8]] : [[IN, 81.8], [85.8, 88.95]];
const segs = [], ranges = []; let t = 0;
for (const [a, b] of RANGES) { segs.push({ clip: "src", in: a, out: b, start: +t.toFixed(3), dur: +(b - a).toFixed(3), kind: "a" }); ranges.push([a, b, +t.toFixed(3)]); t += b - a; }
const v1 = []; words.forEach((w) => { ranges.forEach(([a, b, s], si) => { if (w.start >= a - 0.05 && w.start < b) v1.push({ w: w.text, s: +(s + w.start - a).toFixed(3), e: +(s + w.end - a).toFixed(3), seg: si }); }); });
fs.writeFileSync("edl_v1.json", JSON.stringify({ dur: +t.toFixed(3), segs }, null, 1));
fs.writeFileSync("words_v1.json", JSON.stringify(v1));
fs.writeFileSync("words_clip.json", JSON.stringify(words.map((w) => ({ w: w.text, s: w.start, e: w.end }))));
fs.writeFileSync("ranges.json", JSON.stringify(ranges));
const HOLD = { B: 20.52, C: 31.1, D: 46.46, E: 52.65, F: 61.8, G: 65.57, H: 70.2 };   // clip time each camera move starts (scene changes)
fs.writeFileSync("hold.json", JSON.stringify(HOLD));
const toV1 = (t) => { for (const [a, b, st] of ranges) if (t >= a && t <= b) return st + t - a; return null; };
fs.writeFileSync("trans_v1.json", JSON.stringify(Object.values(HOLD).map(toV1).filter((x) => x != null)));
console.log(WEB ? "WEB" : "IG", "reel length", t.toFixed(2), "s,", v1.length, "words");
