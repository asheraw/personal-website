// Reel 6: combine version 2 (main) + NG 2 (early flub "I said that wrong") + NG 1 (inline flub "It will tell you... It won't tell you") into one source clip.
// Cuts are placed at the middle of real silences nearest to the targets. Writes src.mp4 (full quality), pieces.json, ../tx_w/Reel 6 combined.json
import fs from "fs"; import { spawnSync } from "child_process";
const RAW = (n) => `../../Raws/${n}.mp4`;
function silences(n) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", RAW(n), "-vn", "-af", "silencedetect=noise=-42dB:d=0.12", "-f", "null", "-"], { encoding: "utf8" });
  const out = []; let s = null;
  for (const ln of r.stderr.split("\n")) { const a = ln.match(/silence_start: ([\d.]+)/), b = ln.match(/silence_end: ([\d.]+)/); if (a) s = +a[1]; if (b && s != null) { out.push([s, +b[1]]); s = null; } }
  return out;
}
const SIL = { "Reel 6 version 2": silences("Reel 6 version 2"), "Reel 6 NG 1": silences("Reel 6 NG 1"), "Reel 6 NG 2": silences("Reel 6 NG 2") };
const mid = (n, target) => { let best = null; for (const [a, b] of SIL[n]) { const m = (a + b) / 2; if (b - a >= 0.12 && (!best || Math.abs(m - target) < Math.abs(best - target))) best = m; } return +best.toFixed(3); };
const V2 = "Reel 6 version 2", N1 = "Reel 6 NG 1", N2 = "Reel 6 NG 2";
const c1 = mid(V2, 33.7), c2 = mid(V2, 50.1), c3 = mid(V2, 64.7);
const b1s = mid(N2, 35.3), b1e = mid(N2, 41.8), b2s = mid(N2, 44.1), b2e = mid(N2, 46.6);
const d1 = mid(N1, 60.8), d2 = 77.95;
const PIECES = [[V2, 3.6, c1], [N2, b1s, b1e], [N2, b2s, b2e], [V2, c1, c2], [N1, d1, d2], [V2, c3, 102.0]];
let off = 0; const pieces = PIECES.map(([n, a, b]) => { const p = { src: n, a, b, off: +off.toFixed(3) }; off += b - a; return p; });
console.log(JSON.stringify(pieces));
// build the clip: concat filter over three inputs
const inputs = [V2, N1, N2]; const ix = (n) => inputs.indexOf(n);
const fc = pieces.map((p, i) => `[${ix(p.src)}:v]trim=${p.a}:${p.b},setpts=PTS-STARTPTS[v${i}];[${ix(p.src)}:a]atrim=${p.a}:${p.b},asetpts=PTS-STARTPTS[a${i}]`).join(";") + ";" + pieces.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${pieces.length}:v=1:a=1[v][a]`;
fs.writeFileSync("combine.filter", fc);
const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs.flatMap((n) => ["-i", RAW(n)]), "-/filter_complex", "combine.filter", "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "src.mp4"], { encoding: "utf8" });
if (r.status) { console.log(r.stderr); process.exit(1); }
// merged transcript
const all = [];
for (const p of pieces) { const w = JSON.parse(fs.readFileSync(`../tx_w/${p.src}.json`, "utf8")); for (const x of w) if (x.start >= p.a - 0.05 && x.start < p.b) all.push({ text: x.text, start: +(x.start - p.a + p.off).toFixed(2), end: +(Math.min(x.end, p.b) - p.a + p.off).toFixed(2), piece: pieces.indexOf(p) }); }
fs.writeFileSync("../tx_w/Reel 6 combined.json", JSON.stringify(all)); fs.writeFileSync("pieces.json", JSON.stringify(pieces));
console.log("words", all.length, "dur", off.toFixed(2));
